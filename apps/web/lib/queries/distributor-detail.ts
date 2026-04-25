/**
 * Distributor Detail Queries
 * Server-side data fetching for the distributor detail page.
 * Returns metrics, volume trends, outlet performance, product performance,
 * and wine portfolio data for a single distributor.
 */

import { prisma } from "@spotlight/db";

export async function getDistributorById(distributorId: string) {
  return prisma.distributor.findUnique({
    where: { id: distributorId },
    select: { id: true, name: true, contactName: true, contactEmail: true, contactPhone: true },
  });
}

export async function getDistributorDetail(distributorId: string, organizationId?: string) {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const orgFilter = organizationId ? { outlet: { organizationId } } : {};

  // Parallel fetch all data
  const [
    distributor,
    totalProducts,
    wineProducts,
    distinctOutlets,
    currentVolume,
    recentVolume,
    priorVolume,
    allDistributorVolume,
    rawOrders,
    allProducts,
    allOutlets,
  ] = await Promise.all([
    // Distributor info
    prisma.distributor.findUnique({
      where: { id: distributorId },
      select: { id: true, name: true, contactName: true, contactEmail: true, contactPhone: true },
    }),

    // Total active products
    prisma.distributorProduct.count({
      where: { distributorId, isActive: true },
    }),

    // Wine products count
    prisma.distributorProduct.count({
      where: {
        distributorId,
        isActive: true,
        product: { category: "WINE" },
      },
    }),

    // Distinct outlets served (12 months)
    prisma.orderHistory.findMany({
      where: { distributorId, orderDate: { gte: twelveMonthsAgo }, ...orgFilter },
      select: { outletId: true },
      distinct: ["outletId"],
    }),

    // 12-month volume
    prisma.orderHistory.aggregate({
      _sum: { totalCost: true, quantity: true },
      where: { distributorId, orderDate: { gte: twelveMonthsAgo }, ...orgFilter },
    }),

    // Recent 6-month volume (for YoY)
    prisma.orderHistory.aggregate({
      _sum: { totalCost: true },
      where: { distributorId, orderDate: { gte: sixMonthsAgo }, ...orgFilter },
    }),

    // Prior 6-month volume (for YoY)
    prisma.orderHistory.aggregate({
      _sum: { totalCost: true },
      where: {
        distributorId,
        orderDate: { gte: twelveMonthsAgo, lt: sixMonthsAgo },
        ...orgFilter,
      },
    }),

    // All distributors' 12-month volume (for revenue share)
    prisma.orderHistory.aggregate({
      _sum: { totalCost: true },
      where: { orderDate: { gte: twelveMonthsAgo }, ...orgFilter },
    }),

    // All orders for this distributor (12 months) — for trends, outlet perf, product perf
    prisma.orderHistory.findMany({
      where: { distributorId, orderDate: { gte: twelveMonthsAgo }, ...orgFilter },
      select: {
        productId: true,
        outletId: true,
        quantity: true,
        totalCost: true,
        costPerUnit: true,
        orderDate: true,
      },
    }),

    // All products for this distributor
    prisma.distributorProduct.findMany({
      where: { distributorId, isActive: true },
      include: {
        product: {
          select: { id: true, name: true, sku: true, category: true, subcategory: true, size: true, unit: true },
        },
        supplier: { select: { name: true } },
      },
    }),

    // All outlets
    prisma.outlet.findMany({
      where: { isActive: true, ...(organizationId ? { organizationId } : {}) },
      select: { id: true, name: true, slug: true, type: true },
    }),
  ]);

  if (!distributor) return null;

  // Build lookup maps
  const productMap = new Map(allProducts.map((dp) => [dp.product.id, dp]));
  const outletMap = new Map(allOutlets.map((o) => [o.id, o]));

  // === METRICS ===
  const volume12mo = currentVolume._sum.totalCost ?? 0;
  const totalUnits12mo = currentVolume._sum.quantity ?? 0;
  const recent = recentVolume._sum.totalCost ?? 0;
  const prior = priorVolume._sum.totalCost ?? 0;
  const yoyChange = prior > 0
    ? Math.round(((recent - prior) / prior) * 100 * 10) / 10
    : 0;
  const totalAllDistributors = allDistributorVolume._sum.totalCost ?? 0;
  const revenueShare = totalAllDistributors > 0
    ? Math.round((volume12mo / totalAllDistributors) * 1000) / 10
    : 0;

  // === VOLUME TREND (by month × category) ===
  const monthlyByCat: Record<string, Record<string, number>> = {};
  for (const order of rawOrders) {
    const key = `${order.orderDate.getFullYear()}-${String(order.orderDate.getMonth() + 1).padStart(2, "0")}`;
    const dp = productMap.get(order.productId);
    const cat = dp?.product.category ?? "SPIRITS";
    if (!monthlyByCat[key]) monthlyByCat[key] = {};
    monthlyByCat[key][cat] = (monthlyByCat[key][cat] ?? 0) + order.quantity;
  }
  const volumeTrend = Object.entries(monthlyByCat)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, cats]) => ({
      month,
      label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short" }),
      BEER: Math.round(cats.BEER ?? 0),
      WINE: Math.round(cats.WINE ?? 0),
      SPIRITS: Math.round(cats.SPIRITS ?? 0),
      SAKE: Math.round(cats.SAKE ?? 0),
      NON_ALCOHOLIC: Math.round(cats.NON_ALCOHOLIC ?? 0),
    }));

  // === CATEGORY BREAKDOWN (for pie chart) ===
  const catTotals: Record<string, number> = {};
  for (const order of rawOrders) {
    const dp = productMap.get(order.productId);
    const cat = dp?.product.category ?? "SPIRITS";
    catTotals[cat] = (catTotals[cat] ?? 0) + order.quantity;
  }
  const categoryBreakdown = Object.entries(catTotals)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  // === OUTLET PERFORMANCE ===
  const outletAgg: Record<string, { volume: number; spend: number; products: Set<string>; lastOrder: Date | null; productSpend: Record<string, number> }> = {};
  for (const order of rawOrders) {
    if (!outletAgg[order.outletId]) {
      outletAgg[order.outletId] = { volume: 0, spend: 0, products: new Set(), lastOrder: null, productSpend: {} };
    }
    const agg = outletAgg[order.outletId];
    agg.volume += order.quantity;
    agg.spend += order.totalCost;
    agg.products.add(order.productId);
    if (!agg.lastOrder || order.orderDate > agg.lastOrder) agg.lastOrder = order.orderDate;
    agg.productSpend[order.productId] = (agg.productSpend[order.productId] ?? 0) + order.totalCost;
  }

  const outletPerformance = Object.entries(outletAgg)
    .map(([outletId, agg]) => {
      const outlet = outletMap.get(outletId);
      // Find top product by spend
      const topProductId = Object.entries(agg.productSpend).sort((a, b) => b[1] - a[1])[0]?.[0];
      const topProduct = topProductId ? productMap.get(topProductId)?.product.name ?? "—" : "—";
      return {
        outletId,
        name: outlet?.name ?? "Unknown",
        slug: outlet?.slug ?? "",
        type: outlet?.type ?? "",
        volume: Math.round(agg.volume),
        spend: Math.round(agg.spend * 100) / 100,
        productCount: agg.products.size,
        lastOrder: agg.lastOrder,
        topProduct,
      };
    })
    .sort((a, b) => b.spend - a.spend);

  // === PRODUCT PERFORMANCE ===
  const prodAgg: Record<string, { units: number; spend: number; outlets: Set<string>; lastOrder: Date | null; latestCost: number }> = {};
  for (const order of rawOrders) {
    if (!prodAgg[order.productId]) {
      prodAgg[order.productId] = { units: 0, spend: 0, outlets: new Set(), lastOrder: null, latestCost: 0 };
    }
    const agg = prodAgg[order.productId];
    agg.units += order.quantity;
    agg.spend += order.totalCost;
    agg.outlets.add(order.outletId);
    if (!agg.lastOrder || order.orderDate > agg.lastOrder) {
      agg.lastOrder = order.orderDate;
      agg.latestCost = order.costPerUnit;
    }
  }

  const productPerformance = allProducts
    .map((dp) => {
      const agg = prodAgg[dp.product.id];
      return {
        id: dp.product.id,
        name: dp.product.name,
        sku: dp.product.sku,
        category: dp.product.category,
        subcategory: dp.product.subcategory,
        size: dp.product.size,
        cost: dp.cost,
        supplierName: dp.supplier.name,
        units: agg ? Math.round(agg.units) : 0,
        spend: agg ? Math.round(agg.spend * 100) / 100 : 0,
        outletCount: agg ? agg.outlets.size : 0,
        lastOrder: agg?.lastOrder ?? null,
      };
    })
    .sort((a, b) => b.spend - a.spend);

  // === WINE PORTFOLIO ===
  const winePortfolio = allProducts
    .filter((dp) => dp.product.category === "WINE")
    .map((dp) => {
      const agg = prodAgg[dp.product.id];
      // Which outlets carry this wine?
      const outletNames = agg
        ? [...agg.outlets].map((oid) => outletMap.get(oid)?.name ?? "Unknown")
        : [];
      return {
        id: dp.product.id,
        name: dp.product.name,
        sku: dp.product.sku,
        subcategory: dp.product.subcategory ?? "Wine",
        size: dp.product.size,
        cost: dp.cost,
        supplierName: dp.supplier.name,
        units: agg ? Math.round(agg.units) : 0,
        spend: agg ? Math.round(agg.spend * 100) / 100 : 0,
        outlets: outletNames.sort(),
      };
    })
    .sort((a, b) => b.spend - a.spend);

  return {
    distributor,
    metrics: {
      totalProducts,
      wineProducts,
      outletsServed: distinctOutlets.length,
      volume12mo,
      totalUnits12mo: Math.round(totalUnits12mo),
      yoyChange,
      revenueShare,
    },
    volumeTrend,
    categoryBreakdown,
    outletPerformance,
    productPerformance,
    winePortfolio,
  };
}
