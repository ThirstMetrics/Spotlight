import { prisma } from "@spotlight/db";

/**
 * Get product catalog overview metrics.
 */
export async function getCatalogOverview() {
  const [total, spirits, wine, beer, sake, nonAlc] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, category: "SPIRITS" } }),
    prisma.product.count({ where: { isActive: true, category: "WINE" } }),
    prisma.product.count({ where: { isActive: true, category: "BEER" } }),
    prisma.product.count({ where: { isActive: true, category: "SAKE" } }),
    prisma.product.count({ where: { isActive: true, category: "NON_ALCOHOLIC" } }),
  ]);

  const substitutionCount = await prisma.productCatalog.count();

  return {
    total,
    spirits,
    wine,
    beer,
    sake,
    nonAlcoholic: nonAlc,
    substitutions: substitutionCount,
  };
}

/**
 * Get full product catalog with distributor coverage and substitutions.
 */
export async function getCatalogProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      distributorProducts: {
        where: { isActive: true },
        include: {
          distributor: { select: { name: true } },
          supplier: { select: { name: true } },
        },
      },
      catalogOriginal: {
        include: {
          substituteProduct: { select: { id: true, name: true, sku: true } },
        },
      },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    take: 200,
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    subcategory: p.subcategory,
    size: p.size,
    unit: p.unit,
    distributors: p.distributorProducts.map((dp) => ({
      name: dp.distributor.name,
      supplierName: dp.supplier.name,
      cost: dp.cost,
    })),
    substitutions: p.catalogOriginal.map((sub) => ({
      id: sub.substituteProduct.id,
      name: sub.substituteProduct.name,
      sku: sub.substituteProduct.sku,
    })),
    distributorCount: p.distributorProducts.length,
    avgCost:
      p.distributorProducts.length > 0
        ? p.distributorProducts.reduce((sum, dp) => sum + dp.cost, 0) /
          p.distributorProducts.length
        : 0,
  }));
}
