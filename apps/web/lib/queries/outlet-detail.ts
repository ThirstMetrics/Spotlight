/**
 * Outlet Detail Queries (Enhanced)
 * Server-side data fetching for the rich outlet/venue detail page.
 * Returns metrics, volume trends by category, distributor breakdown,
 * product performance, wine program, inventory status, compliance,
 * and recipe summary for a single outlet.
 *
 * Serves managers, sommeliers, and bar managers — all sections visible.
 */

import { prisma } from "@spotlight/db";

export async function getOutletDetailEnhanced(outletId: string) {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  // Parallel fetch all data
  const [
    outlet,
    recentVolume,
    priorVolume,
    revenue90d,
    rawOrders,
    inventorySnapshots,
    warehouseTransfers,
    complianceData,
    recipes,
  ] = await Promise.all([
    // Outlet info
    prisma.outlet.findUnique({
      where: { id: outletId },
      include: {
        outletGroup: { select: { name: true } },
        costGoals: { orderBy: { effectiveDate: "desc" }, take: 1 },
      },
    }),

    // Recent 6-month volume (for YoY)
    prisma.orderHistory.aggregate({
      _sum: { totalCost: true },
      where: { outletId, orderDate: { gte: sixMonthsAgo } },
    }),

    // Prior 6-month volume (for YoY)
    prisma.orderHistory.aggregate({
      _sum: { totalCost: true },
      where: {
        outletId,
        orderDate: { gte: twelveMonthsAgo, lt: sixMonthsAgo },
      },
    }),

    // 90-day revenue from sales data
    prisma.salesData.aggregate({
      _sum: { revenue: true },
      where: { outletId, saleDate: { gte: ninetyDaysAgo } },
    }),

    // All orders for this outlet (12 months)
    prisma.orderHistory.findMany({
      where: { outletId, orderDate: { gte: twelveMonthsAgo } },
      select: {
        productId: true,
        distributorId: true,
        supplierId: true,
        quantity: true,
        totalCost: true,
        costPerUnit: true,
        orderDate: true,
      },
    }),

    // Latest inventory snapshots for this outlet
    prisma.inventorySnapshot.findMany({
      where: { outletId },
      orderBy: { snapshotDate: "desc" },
      distinct: ["productId"],
      select: {
        productId: true,
        quantityOnHand: true,
        snapshotDate: true,
      },
    }),

    // Warehouse transfers (90 days) for daily usage calc
    prisma.warehouseTransfer.findMany({
      where: { outletId, transferDate: { gte: ninetyDaysAgo } },
      select: {
        productId: true,
        quantity: true,
      },
    }),

    // Compliance data
    prisma.mandateCompliance.findMany({
      where: { outletId },
      include: {
        mandateItem: { include: { product: { select: { name: true, sku: true } } } },
      },
    }),

    // Recipes for this outlet (or shared recipes)
    prisma.recipe.findMany({
      where: {
        isActive: true,
        OR: [{ outletId }, { outletId: null }],
      },
      include: {
        ingredients: {
          include: {
            product: {
              select: {
                name: true,
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
    }),
  ]);

  if (!outlet) return null;

  // Fetch product and distributor details for enrichment
  const productIds = [...new Set(rawOrders.map((o) => o.productId))];
  const distributorIds = [...new Set(rawOrders.map((o) => o.distributorId))];

  const [productDetails, distributorDetails] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        distributorProducts: {
          where: { isActive: true },
          include: {
            supplier: { select: { name: true } },
            distributor: { select: { name: true } },
          },
        },
      },
    }),
    prisma.distributor.findMany({
      where: { id: { in: distributorIds } },
      select: { id: true, name: true },
    }),
  ]);

  // Build lookup maps
  const productMap = new Map(productDetails.map((p) => [p.id, p]));
  const distributorMap = new Map(distributorDetails.map((d) => [d.id, d]));

  // === METRICS ===
  const costGoal = outlet.costGoals[0]?.targetCostPercentage ?? 25;
  const recent = recentVolume._sum.totalCost ?? 0;
  const prior = priorVolume._sum.totalCost ?? 0;
  const yoyChange = prior > 0
    ? Math.round(((recent - prior) / prior) * 100 * 10) / 10
    : 0;

  // 90-day spend from orders
  const totalSpend90d = rawOrders
    .filter((o) => o.orderDate >= ninetyDaysAgo)
    .reduce((sum, o) => sum + o.totalCost, 0);

  const rev90d = revenue90d._sum.revenue ?? 0;
  const costPct = rev90d > 0
    ? Math.round((totalSpend90d / rev90d) * 1000) / 10
    : 0;

  // Product category counts (from 90-day orders)
  const recentProductIds = new Set(
    rawOrders.filter((o) => o.orderDate >= ninetyDaysAgo).map((o) => o.productId)
  );
  let wineProducts = 0;
  let spiritsProducts = 0;
  for (const pid of recentProductIds) {
    const p = productMap.get(pid);
    if (p?.category === "WINE") wineProducts++;
    if (p?.category === "SPIRITS") spiritsProducts++;
  }

  // Compliance
  const compliantCount = complianceData.filter((c) => c.isCompliant).length;
  const compliancePct = complianceData.length > 0
    ? Math.round((compliantCount / complianceData.length) * 100)
    : 100;

  // === VOLUME TREND (by month × category) ===
  const monthlyByCat: Record<string, Record<string, number>> = {};
  for (const order of rawOrders) {
    const key = `${order.orderDate.getFullYear()}-${String(order.orderDate.getMonth() + 1).padStart(2, "0")}`;
    const p = productMap.get(order.productId);
    const cat = p?.category ?? "SPIRITS";
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
    const p = productMap.get(order.productId);
    const cat = p?.category ?? "SPIRITS";
    catTotals[cat] = (catTotals[cat] ?? 0) + order.quantity;
  }
  const categoryBreakdown = Object.entries(catTotals)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  // === DISTRIBUTOR BREAKDOWN ===
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

  const distributorBreakdown = Object.entries(distAgg)
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

  // === PRODUCT PERFORMANCE ===
  const prodAgg: Record<string, { units: number; spend: number; lastOrder: Date | null; latestCost: number; distributorId: string }> = {};
  for (const order of rawOrders) {
    if (!prodAgg[order.productId]) {
      prodAgg[order.productId] = { units: 0, spend: 0, lastOrder: null, latestCost: 0, distributorId: order.distributorId };
    }
    const agg = prodAgg[order.productId];
    agg.units += order.quantity;
    agg.spend += order.totalCost;
    if (!agg.lastOrder || order.orderDate > agg.lastOrder) {
      agg.lastOrder = order.orderDate;
      agg.latestCost = order.costPerUnit;
      agg.distributorId = order.distributorId;
    }
  }

  interface ProductPerformanceItem {
    id: string;
    name: string;
    sku: string;
    category: string;
    subcategory: string | null;
    size: string | null;
    cost: number;
    distributorName: string;
    supplierName: string;
    units: number;
    spend: number;
    lastOrder: Date | null;
  }

  const productPerformance = (
    productIds
      .map((pid) => {
        const detail = productMap.get(pid);
        const agg = prodAgg[pid];
        if (!detail || !agg) return null;
        const dp = detail.distributorProducts.find((d) => d.distributor);
        const supplierName = dp?.supplier?.name ?? "Unknown";
        const distributorName = distributorMap.get(agg.distributorId)?.name ?? "Unknown";
        return {
          id: detail.id,
          name: detail.name,
          sku: detail.sku,
          category: detail.category,
          subcategory: detail.subcategory,
          size: detail.size,
          cost: agg.latestCost,
          distributorName,
          supplierName,
          units: Math.round(agg.units),
          spend: Math.round(agg.spend * 100) / 100,
          lastOrder: agg.lastOrder,
        };
      })
      .filter(Boolean) as ProductPerformanceItem[]
  ).sort((a, b) => b.spend - a.spend);

  // === WINE PROGRAM ===
  const wineProgram = productPerformance
    .filter((p) => p.category === "WINE")
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      subcategory: p.subcategory ?? "Wine",
      size: p.size,
      cost: p.cost,
      distributorName: p.distributorName,
      supplierName: p.supplierName,
      units: p.units,
      spend: p.spend,
    }));

  // === INVENTORY STATUS ===
  // Build daily usage map from warehouse transfers
  const usageMap: Record<string, number> = {};
  for (const t of warehouseTransfers) {
    usageMap[t.productId] = (usageMap[t.productId] ?? 0) + t.quantity;
  }

  interface InventoryStatusItem {
    productId: string;
    productName: string;
    productSku: string;
    category: string;
    quantityOnHand: number;
    avgDailyUsage: number;
    daysOnHand: number;
    lastUpdated: Date;
  }

  const inventoryStatus = (
    inventorySnapshots
      .map((snap) => {
        const detail = productMap.get(snap.productId);
        if (!detail) return null;
        const totalUsage = usageMap[snap.productId] ?? 0;
        const avgDailyUsage = totalUsage / 90;
        const daysOnHand = avgDailyUsage > 0
          ? Math.round(snap.quantityOnHand / avgDailyUsage)
          : snap.quantityOnHand > 0
            ? 999
            : 0;
        return {
          productId: snap.productId,
          productName: detail.name,
          productSku: detail.sku,
          category: detail.category,
          quantityOnHand: snap.quantityOnHand,
          avgDailyUsage: Number(avgDailyUsage.toFixed(2)),
          daysOnHand,
          lastUpdated: snap.snapshotDate,
        };
      })
      .filter(Boolean) as InventoryStatusItem[]
  ).sort((a, b) => a.daysOnHand - b.daysOnHand);

  // === COMPLIANCE ===
  const compliance = complianceData.map((c) => ({
    productName: c.mandateItem.product.name,
    productSku: c.mandateItem.product.sku,
    isCompliant: c.isCompliant,
    lastOrderDate: c.lastOrderDate,
    lastOrderQuantity: c.lastOrderQuantity,
  }));

  // === RECIPES ===
  const recipeSummary = recipes.map((recipe) => {
    let totalCost = 0;
    for (const ing of recipe.ingredients) {
      const unitCost = ing.product.distributorProducts[0]?.cost ?? 0;
      totalCost += unitCost * ing.quantity;
    }
    const costPerServing = recipe.yieldServings > 0
      ? Math.round((totalCost / recipe.yieldServings) * 100) / 100
      : 0;
    const marginPct = recipe.sellingPrice && recipe.sellingPrice > 0 && costPerServing > 0
      ? Math.round(((recipe.sellingPrice - costPerServing) / recipe.sellingPrice) * 100)
      : null;

    return {
      id: recipe.id,
      name: recipe.name,
      ingredientCount: recipe.ingredients.length,
      totalCost: Math.round(totalCost * 100) / 100,
      costPerServing,
      sellingPrice: recipe.sellingPrice,
      marginPct,
    };
  });

  return {
    outlet: {
      id: outlet.id,
      name: outlet.name,
      type: outlet.type,
      managerName: outlet.managerName,
      groupName: outlet.outletGroup?.name,
      costGoal,
    },
    metrics: {
      totalProducts: recentProductIds.size,
      wineProducts,
      spiritsProducts,
      totalSpend90d: Math.round(totalSpend90d * 100) / 100,
      revenue90d: Math.round(rev90d * 100) / 100,
      costPct,
      compliancePct,
      yoyChange,
    },
    volumeTrend,
    categoryBreakdown,
    distributorBreakdown,
    productPerformance,
    wineProgram,
    inventorySnapshot: inventoryStatus,
    compliance,
    recipes: recipeSummary,
  };
}
