/**
 * Margin Queries
 * Server-side data fetching for margin analysis views
 */

import { prisma } from "@spotlight/db";

/** Get margin overview metrics */
export async function getMarginMetrics(organizationId?: string) {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const orgFilter = organizationId ? { outlet: { organizationId } } : {};

  const [revenueAgg, costAgg, prevRevenueAgg, prevCostAgg] = await Promise.all([
    prisma.salesData.aggregate({
      _sum: { revenue: true },
      where: { saleDate: { gte: threeMonthsAgo }, ...orgFilter },
    }),
    prisma.orderHistory.aggregate({
      _sum: { totalCost: true },
      where: { orderDate: { gte: threeMonthsAgo }, ...orgFilter },
    }),
    prisma.salesData.aggregate({
      _sum: { revenue: true },
      where: { saleDate: { gte: sixMonthsAgo, lt: threeMonthsAgo }, ...orgFilter },
    }),
    prisma.orderHistory.aggregate({
      _sum: { totalCost: true },
      where: { orderDate: { gte: sixMonthsAgo, lt: threeMonthsAgo }, ...orgFilter },
    }),
  ]);

  const revenue = revenueAgg._sum.revenue ?? 0;
  const cost = costAgg._sum.totalCost ?? 0;
  const prevRevenue = prevRevenueAgg._sum.revenue ?? 0;
  const prevCost = prevCostAgg._sum.totalCost ?? 0;

  const marginPct = revenue > 0 ? Math.round(((revenue - cost) / revenue) * 100 * 10) / 10 : 0;
  const costPct = revenue > 0 ? Math.round((cost / revenue) * 100 * 10) / 10 : 0;

  const prevMarginPct = prevRevenue > 0 ? Math.round(((prevRevenue - prevCost) / prevRevenue) * 100 * 10) / 10 : 0;

  const revenueChange = prevRevenue > 0
    ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100 * 10) / 10
    : 0;
  const costChange = prevCost > 0
    ? Math.round(((cost - prevCost) / prevCost) * 100 * 10) / 10
    : 0;

  return {
    revenue: Math.round(revenue),
    cost: Math.round(cost),
    marginPct,
    costPct,
    revenueChange,
    costChange,
    marginChange: Math.round((marginPct - prevMarginPct) * 10) / 10,
  };
}

/** Get monthly revenue vs cost trend */
export async function getMonthlyMarginTrend(organizationId?: string) {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

  const orgFilter = organizationId ? { outlet: { organizationId } } : {};

  const [salesData, costData] = await Promise.all([
    prisma.salesData.findMany({
      where: { saleDate: { gte: twelveMonthsAgo }, ...orgFilter },
      select: { revenue: true, saleDate: true },
    }),
    prisma.orderHistory.findMany({
      where: { orderDate: { gte: twelveMonthsAgo }, ...orgFilter },
      select: { totalCost: true, orderDate: true },
    }),
  ]);

  const revenueByMonth: Record<string, number> = {};
  const costByMonth: Record<string, number> = {};

  for (const sale of salesData) {
    const key = `${sale.saleDate.getFullYear()}-${String(sale.saleDate.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonth[key] = (revenueByMonth[key] ?? 0) + sale.revenue;
  }

  for (const order of costData) {
    const key = `${order.orderDate.getFullYear()}-${String(order.orderDate.getMonth() + 1).padStart(2, "0")}`;
    costByMonth[key] = (costByMonth[key] ?? 0) + order.totalCost;
  }

  const allMonths = new Set([...Object.keys(revenueByMonth), ...Object.keys(costByMonth)]);

  return Array.from(allMonths)
    .sort()
    .map((month) => {
      const rev = Math.round(revenueByMonth[month] ?? 0);
      const cost = Math.round(costByMonth[month] ?? 0);
      return {
        month,
        label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        revenue: rev,
        cost,
        costPct: rev > 0 ? Math.round((cost / rev) * 100) : 0,
      };
    });
}

/** Get category margin breakdown */
export async function getCategoryMargins(organizationId?: string) {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const orgFilter = organizationId ? { outlet: { organizationId } } : {};

  const [salesByCategory, costByCategory] = await Promise.all([
    prisma.salesData.findMany({
      where: { saleDate: { gte: threeMonthsAgo }, ...orgFilter },
      select: { revenue: true, product: { select: { category: true } } },
    }),
    prisma.orderHistory.findMany({
      where: { orderDate: { gte: threeMonthsAgo }, ...orgFilter },
      select: { totalCost: true, product: { select: { category: true } } },
    }),
  ]);

  const revByCat: Record<string, number> = {};
  const costByCat: Record<string, number> = {};

  for (const sale of salesByCategory) {
    const cat = sale.product?.category ?? "SPIRITS";
    revByCat[cat] = (revByCat[cat] ?? 0) + sale.revenue;
  }

  for (const order of costByCategory) {
    const cat = order.product?.category ?? "SPIRITS";
    costByCat[cat] = (costByCat[cat] ?? 0) + order.totalCost;
  }

  const categories = new Set([...Object.keys(revByCat), ...Object.keys(costByCat)]);

  return Array.from(categories)
    .map((category) => {
      const revenue = Math.round(revByCat[category] ?? 0);
      const cost = Math.round(costByCat[category] ?? 0);
      const marginPct = revenue > 0 ? Math.round(((revenue - cost) / revenue) * 100 * 10) / 10 : 0;
      const costPct = revenue > 0 ? Math.round((cost / revenue) * 100 * 10) / 10 : 0;
      return { category, revenue, cost, marginPct, costPct };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

/** Get margin by outlet */
export async function getMarginByOutlet(organizationId?: string) {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const outlets = await prisma.outlet.findMany({
    where: { isActive: true, ...(organizationId ? { organizationId } : {}) },
    select: {
      id: true,
      name: true,
      slug: true,
      costGoals: {
        orderBy: { effectiveDate: "desc" as const },
        take: 1,
        select: { targetCostPercentage: true },
      },
    },
  });

  const orgFilter = organizationId ? { outlet: { organizationId } } : {};

  const [salesByOutlet, costsByOutlet] = await Promise.all([
    prisma.salesData.groupBy({
      by: ["outletId"],
      _sum: { revenue: true },
      where: { saleDate: { gte: threeMonthsAgo }, ...orgFilter },
    }),
    prisma.orderHistory.groupBy({
      by: ["outletId"],
      _sum: { totalCost: true },
      where: { orderDate: { gte: threeMonthsAgo }, ...orgFilter },
    }),
  ]);

  const salesMap = new Map(salesByOutlet.map((s) => [s.outletId, s._sum.revenue ?? 0]));
  const costsMap = new Map(costsByOutlet.map((c) => [c.outletId, c._sum.totalCost ?? 0]));

  return outlets.map((outlet) => {
    const revenue = Math.round(salesMap.get(outlet.id) ?? 0);
    const cost = Math.round(costsMap.get(outlet.id) ?? 0);
    const costPct = revenue > 0 ? Math.round((cost / revenue) * 100 * 10) / 10 : 0;
    const goalPct = outlet.costGoals[0]?.targetCostPercentage ?? 25;

    return {
      id: outlet.id,
      name: outlet.name,
      slug: outlet.slug,
      revenue,
      cost,
      costPct,
      goalPct,
      isOverGoal: costPct > goalPct,
    };
  }).sort((a, b) => b.revenue - a.revenue);
}
