import { prisma } from "@spotlight/db";

/**
 * Get distributor metrics and details for the partner dashboard.
 */
export async function getDistributors() {
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

  const distributors = await prisma.distributor.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      contactName: true,
      contactEmail: true,
    },
    orderBy: { name: "asc" },
  });

  const results = await Promise.all(
    distributors.map(async (dist) => {
      // Count products carried
      const productCount = await prisma.distributorProduct.count({
        where: { distributorId: dist.id, isActive: true },
      });

      // Current period volume (3 months)
      const currentVolume = await prisma.orderHistory.aggregate({
        _sum: { totalCost: true },
        where: {
          distributorId: dist.id,
          orderDate: { gte: threeMonthsAgo },
        },
      });

      // Previous period volume (3-6 months ago)
      const previousVolume = await prisma.orderHistory.aggregate({
        _sum: { totalCost: true },
        where: {
          distributorId: dist.id,
          orderDate: { gte: sixMonthsAgo, lt: threeMonthsAgo },
        },
      });

      const current = currentVolume._sum.totalCost ?? 0;
      const previous = previousVolume._sum.totalCost ?? 0;
      const yoyChange = previous > 0
        ? Math.round(((current - previous) / previous) * 100 * 10) / 10
        : 0;

      // Count outlets served
      const outletCount = await prisma.orderHistory.findMany({
        where: { distributorId: dist.id, orderDate: { gte: threeMonthsAgo } },
        select: { outletId: true },
        distinct: ["outletId"],
      });

      return {
        id: dist.id,
        name: dist.name,
        contactName: dist.contactName,
        contactEmail: dist.contactEmail,
        productCount,
        volume: current,
        yoyChange,
        outletCount: outletCount.length,
      };
    })
  );

  return results;
}

/**
 * Get supplier metrics and details for the partner dashboard.
 */
export async function getSuppliers() {
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      contactName: true,
      website: true,
    },
    orderBy: { name: "asc" },
  });

  const results = await Promise.all(
    suppliers.map(async (sup) => {
      // Products across all distributors
      const products = await prisma.distributorProduct.findMany({
        where: { supplierId: sup.id, isActive: true },
        select: {
          product: { select: { name: true, category: true } },
          distributorId: true,
        },
      });

      const productNames = [...new Set(products.map((p) => p.product.name))];
      const distributorCount = new Set(products.map((p) => p.distributorId)).size;

      // Volume from order history (supplier attributed)
      const volumeAgg = await prisma.orderHistory.aggregate({
        _sum: { totalCost: true },
        where: {
          supplierId: sup.id,
          orderDate: { gte: threeMonthsAgo },
        },
      });

      // Count outlets this supplier reaches
      const outlets = await prisma.orderHistory.findMany({
        where: { supplierId: sup.id, orderDate: { gte: threeMonthsAgo } },
        select: { outletId: true },
        distinct: ["outletId"],
      });

      return {
        id: sup.id,
        name: sup.name,
        contactName: sup.contactName,
        website: sup.website,
        productCount: productNames.length,
        topProducts: productNames.slice(0, 3),
        distributorCount,
        volume: volumeAgg._sum.totalCost ?? 0,
        outletCount: outlets.length,
      };
    })
  );

  return results;
}

/**
 * Get supplier metrics scoped to a single distributor.
 * A distributor only sees suppliers whose products flow through their distribution.
 */
export async function getSuppliersForDistributor(distributorId: string) {
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // Only suppliers that this distributor carries
  const supplierProducts = await prisma.distributorProduct.findMany({
    where: { distributorId, isActive: true },
    select: {
      supplierId: true,
      product: { select: { id: true, name: true, category: true } },
      supplier: { select: { id: true, name: true, contactName: true, website: true } },
    },
  });

  // Group by supplier
  const supplierMap = new Map<string, {
    supplier: { id: string; name: string; contactName: string | null; website: string | null };
    productNames: string[];
    productIds: string[];
  }>();
  for (const sp of supplierProducts) {
    if (!supplierMap.has(sp.supplierId)) {
      supplierMap.set(sp.supplierId, {
        supplier: sp.supplier,
        productNames: [],
        productIds: [],
      });
    }
    const entry = supplierMap.get(sp.supplierId)!;
    entry.productNames.push(sp.product.name);
    entry.productIds.push(sp.product.id);
  }

  const results = await Promise.all(
    [...supplierMap.entries()].map(async ([supplierId, { supplier, productNames, productIds }]) => {
      // Volume for this supplier through THIS distributor only
      const volumeAgg = await prisma.orderHistory.aggregate({
        _sum: { totalCost: true },
        where: {
          distributorId,
          supplierId,
          orderDate: { gte: threeMonthsAgo },
        },
      });

      // Outlets reached through this distributor for this supplier
      const outlets = await prisma.orderHistory.findMany({
        where: {
          distributorId,
          supplierId,
          orderDate: { gte: threeMonthsAgo },
        },
        select: { outletId: true },
        distinct: ["outletId"],
      });

      return {
        id: supplier.id,
        name: supplier.name,
        contactName: supplier.contactName,
        website: supplier.website,
        productCount: productNames.length,
        topProducts: productNames.slice(0, 3),
        distributorCount: 1, // Scoped to this distributor
        volume: volumeAgg._sum.totalCost ?? 0,
        outletCount: outlets.length,
      };
    })
  );

  return results.sort((a, b) => b.volume - a.volume);
}

/**
 * Get high-level partner metrics for the dashboard metric cards.
 */
export async function getPartnerOverview() {
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

  const [distributorCount, supplierCount, currentVolume, previousVolume, totalProducts] =
    await Promise.all([
      prisma.distributor.count({ where: { isActive: true } }),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.orderHistory.aggregate({
        _sum: { totalCost: true },
        where: { orderDate: { gte: threeMonthsAgo } },
      }),
      prisma.orderHistory.aggregate({
        _sum: { totalCost: true },
        where: { orderDate: { gte: sixMonthsAgo, lt: threeMonthsAgo } },
      }),
      prisma.distributorProduct.count({ where: { isActive: true } }),
    ]);

  const current = currentVolume._sum.totalCost ?? 0;
  const previous = previousVolume._sum.totalCost ?? 0;
  const yoyGrowth = previous > 0
    ? Math.round(((current - previous) / previous) * 100 * 10) / 10
    : 0;

  // Suppliers with 2+ distributors
  const multiDist = await prisma.distributorProduct.groupBy({
    by: ["supplierId"],
    _count: { distributorId: true },
    having: { distributorId: { _count: { gt: 1 } } },
  });

  return {
    distributorCount,
    supplierCount,
    totalVolume: current,
    yoyGrowth,
    totalProducts,
    multiDistributorSuppliers: multiDist.length,
  };
}
