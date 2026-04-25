/**
 * Supplier Detail Queries
 * Server-side data fetching for the supplier detail page.
 * Returns metrics, volume trends, distributor partners, outlet performance,
 * product performance, and wine portfolio data for a single supplier.
 *
 * Key difference from distributor-detail: a supplier's products route through
 * multiple distributors, so we include a "Distributor Partners" aggregation
 * showing which distributors carry this supplier and how much flows through each.
 */

import { prisma } from "@spotlight/db";

export async function getSupplierDetail(supplierId: string, scopeDistributorId?: string, organizationId?: string) {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const orgFilter = organizationId ? { outlet: { organizationId } } : {};

  // When a distributor is viewing, scope all queries to their products/orders only
  const dpWhere = scopeDistributorId
    ? { supplierId, distributorId: scopeDistributorId, isActive: true as const }
    : { supplierId, isActive: true as const };
  const orderWhere = scopeDistributorId
    ? { supplierId, distributorId: scopeDistributorId, ...orgFilter }
    : { supplierId, ...orgFilter };

  // Parallel fetch all data
  const [
    supplier,
    totalProducts,
    wineProducts,
    distinctDistributors,
    distinctOutlets,
    currentVolume,
    recentVolume,
    priorVolume,
    allSupplierVolume,
    rawOrders,
    allProducts,
    allOutlets,
    allDistributors,
  ] = await Promise.all([
    // Supplier info
    prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, name: true, contactName: true, contactEmail: true, contactPhone: true, website: true },
    }),

    // Total active products for this supplier (scoped if distributor)
    prisma.distributorProduct.count({ where: dpWhere }),

    // Wine products count
    prisma.distributorProduct.count({
      where: { ...dpWhere, product: { category: "WINE" } },
    }),

    // Distinct distributors carrying this supplier's products
    prisma.distributorProduct.findMany({
      where: dpWhere,
      select: { distributorId: true },
      distinct: ["distributorId"],
    }),

    // Distinct outlets served (12 months)
    prisma.orderHistory.findMany({
      where: { ...orderWhere, orderDate: { gte: twelveMonthsAgo } },
      select: { outletId: true },
      distinct: ["outletId"],
    }),

    // 12-month volume
    prisma.orderHistory.aggregate({
      _sum: { totalCost: true, quantity: true },
      where: { ...orderWhere, orderDate: { gte: twelveMonthsAgo } },
    }),

    // Recent 6-month volume (for YoY)
    prisma.orderHistory.aggregate({
      _sum: { totalCost: true },
      where: { ...orderWhere, orderDate: { gte: sixMonthsAgo } },
    }),

    // Prior 6-month volume (for YoY)
    prisma.orderHistory.aggregate({
      _sum: { totalCost: true },
      where: {
        ...orderWhere,
        orderDate: { gte: twelveMonthsAgo, lt: sixMonthsAgo },
      },
    }),

    // All suppliers' 12-month volume (for revenue share — scoped to org)
    prisma.orderHistory.aggregate({
      _sum: { totalCost: true },
      where: { orderDate: { gte: twelveMonthsAgo }, ...orgFilter },
    }),

    // All orders for this supplier (12 months) — scoped if distributor
    prisma.orderHistory.findMany({
      where: { ...orderWhere, orderDate: { gte: twelveMonthsAgo } },
      select: {
        productId: true,
        outletId: true,
        distributorId: true,
        quantity: true,
        totalCost: true,
        costPerUnit: true,
        orderDate: true,
      },
    }),

    // All products for this supplier (scoped if distributor)
    prisma.distributorProduct.findMany({
      where: dpWhere,
      include: {
        product: {
          select: { id: true, name: true, sku: true, category: true, subcategory: true, size: true, unit: true },
        },
        distributor: { select: { id: true, name: true } },
      },
    }),

    // All outlets
    prisma.outlet.findMany({
      where: { isActive: true, ...(organizationId ? { organizationId } : {}) },
      select: { id: true, name: true, slug: true, type: true },
    }),

    // All distributors (for partner table)
    prisma.distributor.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  if (!supplier) return null;

  // Build lookup maps
  const productMap = new Map(allProducts.map((dp) => [dp.product.id, dp]));
  const outletMap = new Map(allOutlets.map((o) => [o.id, o]));
  const distributorMap = new Map(allDistributors.map((d) => [d.id, d]));

  // === METRICS ===
  const volume12mo = currentVolume._sum.totalCost ?? 0;
  const totalUnits12mo = currentVolume._sum.quantity ?? 0;
  const recent = recentVolume._sum.totalCost ?? 0;
  const prior = priorVolume._sum.totalCost ?? 0;
  const yoyChange = prior > 0
    ? Math.round(((recent - prior) / prior) * 100 * 10) / 10
    : 0;
  const totalAllVolume = allSupplierVolume._sum.totalCost ?? 0;
  const revenueShare = totalAllVolume > 0
    ? Math.round((volume12mo / totalAllVolume) * 1000) / 10
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

  // === DISTRIBUTOR PARTNERS (NEW — unique to supplier view) ===
  const distAgg: Record<string, { volume: number; spend: number; products: Set<string>; lastOrder: Date | null }> = {};
  for (const order of rawOrders) {
    if (!distAgg[order.distributorId]) {
      distAgg[order.distributorId] = { volume: 0, spend: 0, products: new Set(), lastOrder: null };
    }
    const agg = distAgg[order.distributorId];
    agg.volume += order.quantity;
    agg.spend += order.totalCost;
    agg.products.add(order.productId);
    if (!agg.lastOrder || order.orderDate > agg.lastOrder) agg.lastOrder = order.orderDate;
  }

  const distributorPartners = Object.entries(distAgg)
    .map(([distributorId, agg]) => {
      const dist = distributorMap.get(distributorId);
      return {
        distributorId,
        name: dist?.name ?? "Unknown",
        productCount: agg.products.size,
        volume: Math.round(agg.volume),
        spend: Math.round(agg.spend * 100) / 100,
        lastOrder: agg.lastOrder,
      };
    })
    .sort((a, b) => b.spend - a.spend);

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
        distributorName: dp.distributor.name,
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
        distributorName: dp.distributor.name,
        units: agg ? Math.round(agg.units) : 0,
        spend: agg ? Math.round(agg.spend * 100) / 100 : 0,
        outlets: outletNames.sort(),
      };
    })
    .sort((a, b) => b.spend - a.spend);

  return {
    supplier,
    metrics: {
      totalProducts,
      wineProducts,
      distributorCount: distinctDistributors.length,
      outletsServed: distinctOutlets.length,
      volume12mo,
      totalUnits12mo: Math.round(totalUnits12mo),
      yoyChange,
      revenueShare,
    },
    volumeTrend,
    categoryBreakdown,
    distributorPartners,
    outletPerformance,
    productPerformance,
    winePortfolio,
  };
}
