// =============================================================================
// /api/recipes — Recipe CRUD endpoints (list + create)
// =============================================================================

import { NextResponse } from "next/server";
import type { ApiResponse } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";
import { prisma } from "@spotlight/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IngredientInput {
  productId: string;
  quantity: number;
  unit: string;
  notes?: string;
}

interface CreateRecipeBody {
  name: string;
  description?: string;
  category?: string;
  yieldServings: number;
  sellingPrice?: number;
  outletId?: string;
  ingredients: IngredientInput[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute cost-per-serving and margin for a recipe from its ingredients. */
async function computeRecipeCosts(
  recipeId: string,
  yieldServings: number,
  sellingPrice: number | null,
) {
  const ingredients = await prisma.recipeIngredient.findMany({
    where: { recipeId },
    include: {
      product: {
        include: {
          distributorProducts: {
            orderBy: { createdAt: "desc" as const },
            take: 1,
            select: { cost: true },
          },
        },
      },
    },
  });

  let totalCost = 0;
  for (const ing of ingredients) {
    const unitCost = ing.product.distributorProducts[0]?.cost ?? 0;
    totalCost += unitCost * ing.quantity;
  }

  const costPerServing = yieldServings > 0 ? totalCost / yieldServings : 0;
  const marginPct =
    sellingPrice && sellingPrice > 0 && costPerServing > 0
      ? Math.round(((sellingPrice - costPerServing) / sellingPrice) * 100)
      : null;

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    costPerServing: Math.round(costPerServing * 100) / 100,
    marginPct,
    ingredientCount: ingredients.length,
  };
}

// ---------------------------------------------------------------------------
// GET /api/recipes
// ---------------------------------------------------------------------------

/**
 * List all active recipes with ingredient details and computed costs.
 *
 * Query params:
 * - `outletId` — filter by outlet (optional)
 * - `category` — filter by recipe category (optional)
 */
export async function GET(
  request: Request,
): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "recipes", "read")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const outletId = searchParams.get("outletId");
  const category = searchParams.get("category");

  const where: Record<string, unknown> = { isActive: true };
  if (outletId) where.outletId = outletId;
  if (category) where.category = category;

  const recipes = await prisma.recipe.findMany({
    where,
    include: {
      outlet: { select: { name: true } },
      ingredients: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              distributorProducts: {
                orderBy: { createdAt: "desc" as const },
                take: 1,
                select: { cost: true },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const data = recipes.map((recipe) => {
    let totalCost = 0;
    const ingredients = recipe.ingredients.map((ing) => {
      const unitCost = ing.product.distributorProducts[0]?.cost ?? 0;
      const ingCost = unitCost * ing.quantity;
      totalCost += ingCost;
      return {
        id: ing.id,
        productId: ing.product.id,
        productName: ing.product.name,
        productSku: ing.product.sku,
        quantity: ing.quantity,
        unit: ing.unit,
        unitCost,
        cost: Math.round(ingCost * 100) / 100,
        notes: ing.notes ?? null,
      };
    });

    const costPerServing =
      recipe.yieldServings > 0
        ? Math.round((totalCost / recipe.yieldServings) * 100) / 100
        : 0;

    const marginPct =
      recipe.sellingPrice && recipe.sellingPrice > 0 && costPerServing > 0
        ? Math.round(
            ((recipe.sellingPrice - costPerServing) / recipe.sellingPrice) *
              100,
          )
        : null;

    return {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description ?? null,
      category: recipe.category ?? null,
      outletId: recipe.outletId ?? null,
      outletName: recipe.outlet?.name ?? null,
      yieldServings: recipe.yieldServings,
      sellingPrice: recipe.sellingPrice ?? null,
      totalCost: Math.round(totalCost * 100) / 100,
      costPerServing,
      marginPct,
      ingredientCount: recipe.ingredients.length,
      ingredients,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };
  });

  return NextResponse.json({ success: true, data }, { status: 200 });
}

// ---------------------------------------------------------------------------
// POST /api/recipes
// ---------------------------------------------------------------------------

/**
 * Create a new recipe with ingredients.
 *
 * Body: { name, description?, category?, yieldServings, sellingPrice?,
 *         outletId?, ingredients: [{ productId, quantity, unit, notes? }] }
 */
export async function POST(
  request: Request,
): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "recipes", "create")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  // Users without an organization can't create recipes
  if (!user.organizationId) {
    return NextResponse.json(
      { success: false, error: "No organization associated with this user" },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json()) as CreateRecipeBody;

    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Recipe name is required" },
        { status: 400 },
      );
    }

    if (!body.yieldServings || body.yieldServings < 1) {
      return NextResponse.json(
        { success: false, error: "Yield servings must be at least 1" },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.ingredients) || body.ingredients.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one ingredient is required" },
        { status: 400 },
      );
    }

    // Validate all ingredient productIds exist
    const productIds = body.ingredients.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true },
    });
    if (products.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: "One or more ingredient products not found" },
        { status: 400 },
      );
    }

    const recipe = await prisma.recipe.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() ?? null,
        category: body.category ?? null,
        yieldServings: body.yieldServings,
        sellingPrice: body.sellingPrice ?? null,
        organizationId: user.organizationId,
        outletId: body.outletId ?? null,
        createdBy: user.id,
        isActive: true,
        ingredients: {
          create: body.ingredients.map((ing) => ({
            productId: ing.productId,
            quantity: ing.quantity,
            unit: ing.unit.trim(),
            notes: ing.notes?.trim() ?? null,
          })),
        },
      },
      include: {
        outlet: { select: { name: true } },
        ingredients: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
      },
    });

    const costs = await computeRecipeCosts(
      recipe.id,
      recipe.yieldServings,
      recipe.sellingPrice,
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: recipe.id,
          name: recipe.name,
          description: recipe.description,
          category: recipe.category,
          outletId: recipe.outletId,
          outletName: recipe.outlet?.name ?? null,
          yieldServings: recipe.yieldServings,
          sellingPrice: recipe.sellingPrice,
          ...costs,
          createdAt: recipe.createdAt,
          updatedAt: recipe.updatedAt,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }
}
