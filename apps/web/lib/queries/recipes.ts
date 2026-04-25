/**
 * Recipe Queries
 * Server-side data fetching for recipe builder and management
 */

import { prisma } from "@spotlight/db";

/** Get recipe overview stats */
export async function getRecipeOverview(options?: { organizationId?: string }) {
  const { organizationId } = options ?? {};
  const recipes = await prisma.recipe.findMany({
    where: { isActive: true, ...(organizationId ? { organizationId } : {}) },
    include: {
      ingredients: {
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
      },
    },
  });

  let totalCost = 0;
  let recipesWithCost = 0;
  let totalMargin = 0;
  let recipesWithMargin = 0;

  for (const recipe of recipes) {
    let recipeCost = 0;
    for (const ing of recipe.ingredients) {
      const unitCost = ing.product.distributorProducts[0]?.cost ?? 0;
      recipeCost += unitCost * ing.quantity;
    }

    if (recipeCost > 0) {
      totalCost += recipeCost;
      recipesWithCost++;
    }

    if (recipe.sellingPrice && recipe.sellingPrice > 0 && recipeCost > 0) {
      const margin = ((recipe.sellingPrice - recipeCost / recipe.yieldServings) / recipe.sellingPrice) * 100;
      totalMargin += margin;
      recipesWithMargin++;
    }
  }

  const avgCost = recipesWithCost > 0 ? Math.round((totalCost / recipesWithCost) * 100) / 100 : 0;
  const avgMargin = recipesWithMargin > 0 ? Math.round(totalMargin / recipesWithMargin) : 0;

  return {
    totalRecipes: recipes.length,
    avgCost,
    avgMargin,
  };
}

/** Get all recipes with calculated costs and margins */
export async function getRecipeList(options?: { organizationId?: string }) {
  const { organizationId } = options ?? {};
  const recipes = await prisma.recipe.findMany({
    where: { isActive: true, ...(organizationId ? { organizationId } : {}) },
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

  return recipes.map((recipe) => {
    let totalCost = 0;
    const ingredientDetails = recipe.ingredients.map((ing) => {
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

    const costPerServing = recipe.yieldServings > 0
      ? Math.round((totalCost / recipe.yieldServings) * 100) / 100
      : 0;

    const marginPct = recipe.sellingPrice && recipe.sellingPrice > 0 && costPerServing > 0
      ? Math.round(((recipe.sellingPrice - costPerServing) / recipe.sellingPrice) * 100)
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
      ingredients: ingredientDetails,
    };
  });
}
