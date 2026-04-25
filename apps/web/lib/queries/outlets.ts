/**
 * Outlet Queries
 * Server-side data fetching for outlet list and detail views
 */

import { prisma } from "@spotlight/db";

/** Get all outlets with summary stats */
export async function getOutlets(organizationId?: string) {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const outlets = await prisma.outlet.findMany({
    where: {
      isActive: true,
      ...(organizationId ? { organizationId } : {}),
    },
    include: {
      outletGroup: { select: { name: true } },
      costGoals: {
        orderBy: { effectiveDate: "desc" },
        take: 1,
        select: { targetCostPercentage: true },
      },
      _count: {
        select: {
          orderHistory: true,
          mandateCompliance: { where: { isCompliant: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Get product counts and cost data per outlet
  const [productCounts, salesByOutlet, costsByOutlet, totalCompliance] = await Promise.all([
    prisma.orderHistory.groupBy({
      by: ["outletId"],
      _count: { productId: true },
      where: {
        orderDate: { gte: threeMonthsAgo },
        ...(organizationId ? { outlet: { organizationId } } : {}),
      },
    }),
    prisma.salesData.groupBy({
      by: ["outletId"],
      _sum: { revenue: true },
      where: {
        saleDate: { gte: threeMonthsAgo },
        ...(organizationId ? { outlet: { organizationId } } : {}),
      },
    }),
    prisma.orderHistory.groupBy({
      by: ["outletId"],
      _sum: { totalCost: true },
      where: {
        orderDate: { gte: threeMonthsAgo },
        ...(organizationId ? { outlet: { organizationId } } : {}),
      },
    }),
    prisma.mandateCompliance.groupBy({
      by: ["outletId"],
      _count: { id: true },
      where: {
        ...(organizationId ? { outlet: { organizationId } } : {}),
      },
    }),
  ]);

  const productMap = new Map(productCounts.map((p) => [p.outletId, p._count.productId]));
  const salesMap = new Map(salesByOutlet.map((s) => [s.outletId, s._sum.revenue ?? 0]));
  const costsMap = new Map(costsByOutlet.map((c) => [c.outletId, c._sum.totalCost ?? 0]));
  const totalCompMap = new Map(totalCompliance.map((t) => [t.outletId, t._count.id]));

  return outlets.map((outlet) => {
    const revenue = salesMap.get(outlet.id) ?? 0;
    const cost = costsMap.get(outlet.id) ?? 0;
    const costPct = revenue > 0 ? Math.round((cost / revenue) * 100) : 0;
    const goalPct = outlet.costGoals[0]?.targetCostPercentage ?? 25;
    const compliantCount = outlet._count.mandateCompliance;
    const totalComp = totalCompMap.get(outlet.id) ?? 0;
    const compliancePct = totalComp > 0 ? Math.round((compliantCount / totalComp) * 100) : 100;

    return {
      id: outlet.id,
      name: outlet.name,
      slug: outlet.slug,
      type: outlet.type,
      managerName: outlet.managerName,
      groupName: outlet.outletGroup?.name ?? "Ungrouped",
      productCount: productMap.get(outlet.id) ?? 0,
      costPct,
      goalPct,
      compliancePct,
      isOverGoal: costPct > goalPct,
    };
  });
}

/** Resolve outlet slug to ID */
export async function getOutletBySlug(slug: string, organizationId?: string) {
  return prisma.outlet.findFirst({
    where: {
      slug,
      isActive: true,
      ...(organizationId ? { organizationId } : {}),
    },
    select: { id: true, name: true, slug: true },
  });
}

/** Get detailed data for a single outlet */
export async function getOutletDetail(outletId: string, organizationId?: string) {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

  const [outlet, products, monthlySales, categoryBreakdown, complianceData] = await Promise.all([
    // Outlet info
    prisma.outlet.findFirst({
      where: {
        id: outletId,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        outletGroup: { select: { name: true } },
        costGoals: { orderBy: { effectiveDate: "desc" }, take: 1 },
      },
    }),

    // Products ordered by this outlet (last 90 days)
    prisma.orderHistory.groupBy({
      by: ["productId", "distributorId"],
      _sum: { quantity: true, totalCost: true },
      _max: { orderDate: true },
      _avg: { costPerUnit: true },
      where: { outletId, orderDate: { gte: threeMonthsAgo } },
      orderBy: { _sum: { quantity: "desc" } },
    }),

    // Monthly volume trend (last 12 months)
    prisma.orderHistory.findMany({
      where: { outletId, orderDate: { gte: twelveMonthsAgo } },
      select: { quantity: true, orderDate: true, product: { select: { category: true } } },
    }),

    // Category breakdown
    prisma.orderHistory.groupBy({
      by: ["productId"],
      _sum: { quantity: true, totalCost: true },
      where: { outletId, orderDate: { gte: threeMonthsAgo } },
    }),

    // Compliance
    prisma.mandateCompliance.findMany({
      where: { outletId },
      include: {
        mandateItem: { include: { product: { select: { name: true, sku: true } } } },
      },
    }),
  ]);

  if (!outlet) return null;

  // Enrich products with names
  const productIds = products.map((p) => p.productId);
  const distributorIds = products.map((p) => p.distributorId);

  const [productDetails, distributorDetails] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { distributorProducts: { include: { supplier: { select: { name: true } } } } },
    }),
    prisma.distributor.findMany({
      where: { id: { in: distributorIds } },
      select: { id: true, name: true },
    }),
  ]);

  const productMap = new Map(productDetails.map((p) => [p.id, p]));
  const distributorMap = new Map(distributorDetails.map((d) => [d.id, d.name]));

  const enrichedProducts = products.map((p) => {
    const detail = productMap.get(p.productId);
    const supplierName = detail?.distributorProducts[0]?.supplier?.name ?? "Unknown";
    return {
      id: p.productId,
      name: detail?.name ?? "Unknown",
      sku: detail?.sku ?? "",
      category: detail?.category ?? "SPIRITS",
      distributor: distributorMap.get(p.distributorId) ?? "Unknown",
      supplier: supplierName,
      lastOrderDate: p._max.orderDate,
      avgMonthlyVolume: Math.round((p._sum.quantity ?? 0) / 3),
      currentCost: Math.round((p._avg.costPerUnit ?? 0) * 100) / 100,
      totalSpend: Math.round((p._sum.totalCost ?? 0) * 100) / 100,
    };
  });

  // Build monthly trend
  const monthlyTrend: Record<string, number> = {};
  for (const order of monthlySales) {
    const key = `${order.orderDate.getFullYear()}-${String(order.orderDate.getMonth() + 1).padStart(2, "0")}`;
    monthlyTrend[key] = (monthlyTrend[key] ?? 0) + order.quantity;
  }
  const trendData = Object.entries(monthlyTrend)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, volume]) => ({
      month,
      label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short" }),
      volume: Math.round(volume),
    }));

  // Category counts
  const catCounts: Record<string, number> = {};
  for (const row of categoryBreakdown) {
    const detail = productMap.get(row.productId);
    const cat = detail?.category ?? "SPIRITS";
    catCounts[cat] = (catCounts[cat] ?? 0) + (row._sum.quantity ?? 0);
  }
  const categoryData = Object.entries(catCounts).map(([name, value]) => ({ name, value: Math.round(value) }));

  const costGoal = outlet.costGoals[0]?.targetCostPercentage ?? 25;

  return {
    outlet: {
      id: outlet.id,
      name: outlet.name,
      type: outlet.type,
      managerName: outlet.managerName,
      groupName: outlet.outletGroup?.name,
      costGoal,
    },
    products: enrichedProducts,
    trendData,
    categoryData,
    compliance: complianceData.map((c) => ({
      productName: c.mandateItem.product.name,
      productSku: c.mandateItem.product.sku,
      isCompliant: c.isCompliant,
      lastOrderDate: c.lastOrderDate,
      lastOrderQuantity: c.lastOrderQuantity,
    })),
  };
}
