// =============================================================================
// /api/recipes/[id] — Recipe detail, update, and delete
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

interface UpdateRecipeBody {
  name?: string;
  description?: string;
  category?: string;
  yieldServings?: number;
  sellingPrice?: number | null;
  outletId?: string | null;
  ingredients?: IngredientInput[];
}

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/recipes/[id]
// ---------------------------------------------------------------------------

/**
 * Fetch a single recipe with all ingredients and computed costs.
 */
export async function GET(
  request: Request,
  context: RouteContext,
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

  const { id } = await context.params;

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      outlet: { select: { id: true, name: true } },
      ingredients: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              size: true,
              unit: true,
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
  });

  if (!recipe || !recipe.isActive) {
    return NextResponse.json(
      { success: false, error: "Recipe not found" },
      { status: 404 },
    );
  }

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
      productCategory: ing.product.category,
      productSize: ing.product.size,
      productUnit: ing.product.unit,
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
          ((recipe.sellingPrice - costPerServing) / recipe.sellingPrice) * 100,
        )
      : null;

  return NextResponse.json(
    {
      success: true,
      data: {
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
        ingredientCount: ingredients.length,
        ingredients,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
      },
    },
    { status: 200 },
  );
}

// ---------------------------------------------------------------------------
// PUT /api/recipes/[id]
// ---------------------------------------------------------------------------

/**
 * Update a recipe and replace its ingredient list in a single transaction.
 *
 * Body: { name?, description?, category?, yieldServings?, sellingPrice?,
 *         outletId?, ingredients?: [{ productId, quantity, unit, notes? }] }
 */
export async function PUT(
  request: Request,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "recipes", "update")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  const existing = await prisma.recipe.findUnique({
    where: { id },
    select: { id: true, isActive: true },
  });

  if (!existing || !existing.isActive) {
    return NextResponse.json(
      { success: false, error: "Recipe not found" },
      { status: 404 },
    );
  }

  try {
    const body = (await request.json()) as UpdateRecipeBody;

    // Validate fields if provided
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: "Recipe name cannot be empty" },
        { status: 400 },
      );
    }

    if (body.yieldServings !== undefined && body.yieldServings < 1) {
      return NextResponse.json(
        { success: false, error: "Yield servings must be at least 1" },
        { status: 400 },
      );
    }

    if (body.ingredients !== undefined) {
      if (!Array.isArray(body.ingredients) || body.ingredients.length === 0) {
        return NextResponse.json(
          { success: false, error: "At least one ingredient is required" },
          { status: 400 },
        );
      }

      // Validate all productIds exist
      const productIds = body.ingredients.map((i) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        select: { id: true },
      });
      if (products.length !== productIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: "One or more ingredient products not found",
          },
          { status: 400 },
        );
      }
    }

    // Build recipe update data
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined)
      updateData.description = body.description?.trim() ?? null;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.yieldServings !== undefined)
      updateData.yieldServings = body.yieldServings;
    if ("sellingPrice" in body) updateData.sellingPrice = body.sellingPrice;
    if ("outletId" in body) updateData.outletId = body.outletId;

    // Execute recipe update (and optionally replace ingredients) in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update the recipe
      const recipe = await tx.recipe.update({
        where: { id },
        data: updateData,
      });

      // Replace ingredients if provided
      if (body.ingredients !== undefined) {
        await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
        await tx.recipeIngredient.createMany({
          data: body.ingredients.map((ing) => ({
            recipeId: id,
            productId: ing.productId,
            quantity: ing.quantity,
            unit: ing.unit.trim(),
            notes: ing.notes?.trim() ?? null,
          })),
        });
      }

      return recipe;
    });

    // Fetch updated recipe with includes for response
    const recipe = await prisma.recipe.findUnique({
      where: { id: updated.id },
      include: {
        outlet: { select: { name: true } },
        ingredients: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
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
    });

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch updated recipe" },
        { status: 500 },
      );
    }

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

    return NextResponse.json(
      {
        success: true,
        data: {
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
          ingredientCount: ingredients.length,
          ingredients,
          createdAt: recipe.createdAt,
          updatedAt: recipe.updatedAt,
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/recipes/[id]
// ---------------------------------------------------------------------------

/**
 * Soft-delete a recipe (sets isActive = false).
 * Ingredients are cascade-deleted via Prisma schema on hard delete; here we
 * keep them for audit trails and just deactivate the recipe.
 */
export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "recipes", "delete")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  const existing = await prisma.recipe.findUnique({
    where: { id },
    select: { id: true, isActive: true },
  });

  if (!existing || !existing.isActive) {
    return NextResponse.json(
      { success: false, error: "Recipe not found" },
      { status: 404 },
    );
  }

  await prisma.recipe.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json(
    { success: true, data: { deleted: true, id } },
    { status: 200 },
  );
}
