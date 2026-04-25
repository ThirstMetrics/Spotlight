/**
 * Overview Dashboard Queries
 * Server-side data fetching for the main dashboard
 */

import { prisma } from "@spotlight/db";

/** Get key metric cards for the overview dashboard */
export async function getOverviewMetrics(organizationId?: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  const [
    totalProducts,
    activeOutlets,
    complianceStats,
    openAlerts,
    totalRevenue,
    totalCost,
  ] = await Promise.all([
    // Total SKUs (global catalog, no org filter)
    prisma.product.count({ where: { isActive: true } }),

    // Active outlets (those with orders in last 30 days)
    prisma.outlet.count({
      where: {
        isActive: true,
        orderHistory: { some: { orderDate: { gte: thirtyDaysAgo } } },
        ...(organizationId ? { organizationId } : {}),
      },
    }),

    // Compliance stats
    Promise.all([
      prisma.mandateCompliance.count({
        where: {
          isCompliant: true,
          ...(organizationId ? { outlet: { organizationId } } : {}),
        },
      }),
      prisma.mandateCompliance.count({
        where: {
          ...(organizationId ? { outlet: { organizationId } } : {}),
        },
      }),
    ]),

    // Open alerts (unread, not dismissed)
    prisma.alert.count({
      where: {
        isDismissed: false,
        isRead: false,
        ...(organizationId ? { outlet: { organizationId } } : {}),
      },
    }),

    // Total revenue (last 12 months)
    prisma.salesData.aggregate({
      _sum: { revenue: true },
      where: {
        saleDate: { gte: oneYearAgo },
        ...(organizationId ? { outlet: { organizationId } } : {}),
      },
    }),

    // Total cost (last 12 months)
    prisma.orderHistory.aggregate({
      _sum: { totalCost: true },
      where: {
        orderDate: { gte: oneYearAgo },
        ...(organizationId ? { outlet: { organizationId } } : {}),
      },
    }),
  ]);

  const compliant = complianceStats[0];
  const totalCompliance = complianceStats[1];
  const compliancePct = totalCompliance > 0
    ? Math.round((compliant / totalCompliance) * 100)
    : 0;

  const revenue = totalRevenue._sum.revenue ?? 0;
  const cost = totalCost._sum.totalCost ?? 0;
  const costPct = revenue > 0 ? Math.round((cost / revenue) * 100) : 0;

  return {
    totalProducts,
    activeOutlets,
    compliancePct,
    openAlerts,
    revenue,
    cost,
    costPct,
  };
}

/** Get monthly volume data for the last 12 months, grouped by category */
export async function getVolumeByMonth(organizationId?: string) {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

  const orders = await prisma.orderHistory.findMany({
    where: {
      orderDate: { gte: twelveMonthsAgo },
      ...(organizationId ? { outlet: { organizationId } } : {}),
    },
    select: {
      quantity: true,
      orderDate: true,
      product: { select: { category: true } },
    },
  });

  // Group by month and category
  const monthlyData: Record<string, Record<string, number>> = {};

  for (const order of orders) {
    const monthKey = `${order.orderDate.getFullYear()}-${String(order.orderDate.getMonth() + 1).padStart(2, "0")}`;
    const category = order.product.category;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { BEER: 0, WINE: 0, SPIRITS: 0, SAKE: 0, NON_ALCOHOLIC: 0 };
    }
    monthlyData[monthKey][category] += order.quantity;
  }

  // Convert to sorted array with explicit types
  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, categories]) => ({
      month,
      label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      BEER: categories.BEER ?? 0,
      WINE: categories.WINE ?? 0,
      SPIRITS: categories.SPIRITS ?? 0,
      SAKE: categories.SAKE ?? 0,
      NON_ALCOHOLIC: categories.NON_ALCOHOLIC ?? 0,
    }));
}

/** Get top products by volume */
export async function getTopProducts(limit = 10, organizationId?: string) {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const products = await prisma.orderHistory.groupBy({
    by: ["productId"],
    _sum: { quantity: true, totalCost: true },
    where: {
      orderDate: { gte: threeMonthsAgo },
      ...(organizationId ? { outlet: { organizationId } } : {}),
    },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const productDetails = await prisma.product.findMany({
    where: { id: { in: products.map((p) => p.productId) } },
    select: { id: true, name: true, category: true, sku: true },
  });

  const detailMap = new Map(productDetails.map((p) => [p.id, p]));

  return products.map((p) => {
    const detail = detailMap.get(p.productId);
    return {
      id: p.productId,
      name: detail?.name ?? "Unknown",
      sku: detail?.sku ?? "",
      category: detail?.category ?? "SPIRITS",
      volume: Math.round(p._sum.quantity ?? 0),
      totalCost: Math.round((p._sum.totalCost ?? 0) * 100) / 100,
    };
  });
}

/** Get recent alerts */
export async function getRecentAlerts(limit = 5, organizationId?: string) {
  return prisma.alert.findMany({
    where: {
      isDismissed: false,
      ...(organizationId ? { outlet: { organizationId } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      outlet: { select: { name: true } },
      product: { select: { name: true } },
    },
  });
}

/** Get cost % vs goal by outlet */
export async function getCostVsGoalByOutlet(organizationId?: string) {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const outlets = await prisma.outlet.findMany({
    where: {
      isActive: true,
      ...(organizationId ? { organizationId } : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      costGoals: {
        orderBy: { effectiveDate: "desc" },
        take: 1,
        select: { targetCostPercentage: true },
      },
    },
  });

  const [salesByOutlet, costsByOutlet] = await Promise.all([
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
  ]);

  const salesMap = new Map(salesByOutlet.map((s) => [s.outletId, s._sum.revenue ?? 0]));
  const costsMap = new Map(costsByOutlet.map((c) => [c.outletId, c._sum.totalCost ?? 0]));

  return outlets.map((outlet) => {
    const revenue = salesMap.get(outlet.id) ?? 0;
    const cost = costsMap.get(outlet.id) ?? 0;
    const actualCostPct = revenue > 0 ? Math.round((cost / revenue) * 100) : 0;
    const goalCostPct = outlet.costGoals[0]?.targetCostPercentage ?? 25;

    return {
      id: outlet.id,
      name: outlet.name,
      slug: outlet.slug,
      type: outlet.type,
      actualCostPct,
      goalCostPct,
      revenue: Math.round(revenue),
      cost: Math.round(cost),
    };
  });
}

/** Get YoY comparison data */
export async function getYoYComparison(organizationId?: string) {
  const now = new Date();
  const thisYearStart = new Date(now.getFullYear(), 0, 1);
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const lastYearEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  const [thisYearVolume, lastYearVolume, thisYearCost, lastYearCost] = await Promise.all([
    prisma.orderHistory.aggregate({
      _sum: { quantity: true },
      where: {
        orderDate: { gte: thisYearStart },
        ...(organizationId ? { outlet: { organizationId } } : {}),
      },
    }),
    prisma.orderHistory.aggregate({
      _sum: { quantity: true },
      where: {
        orderDate: { gte: lastYearStart, lte: lastYearEnd },
        ...(organizationId ? { outlet: { organizationId } } : {}),
      },
    }),
    prisma.orderHistory.aggregate({
      _sum: { totalCost: true },
      where: {
        orderDate: { gte: thisYearStart },
        ...(organizationId ? { outlet: { organizationId } } : {}),
      },
    }),
    prisma.orderHistory.aggregate({
      _sum: { totalCost: true },
      where: {
        orderDate: { gte: lastYearStart, lte: lastYearEnd },
        ...(organizationId ? { outlet: { organizationId } } : {}),
      },
    }),
  ]);

  const currentVolume = thisYearVolume._sum.quantity ?? 0;
  const previousVolume = lastYearVolume._sum.quantity ?? 0;
  const volumeChange = previousVolume > 0
    ? Math.round(((currentVolume - previousVolume) / previousVolume) * 100)
    : 0;

  const currentCost = thisYearCost._sum.totalCost ?? 0;
  const previousCost = lastYearCost._sum.totalCost ?? 0;
  const costChange = previousCost > 0
    ? Math.round(((currentCost - previousCost) / previousCost) * 100)
    : 0;

  return {
    volume: { current: Math.round(currentVolume), previous: Math.round(previousVolume), changePct: volumeChange },
    cost: { current: Math.round(currentCost), previous: Math.round(previousCost), changePct: costChange },
  };
}
