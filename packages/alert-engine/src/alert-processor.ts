import { prisma, AlertType, AlertSeverity } from "@spotlight/db";

/**
 * The result of an alert check. Contains all information needed to
 * create an alert record and notify the appropriate users.
 */
export interface AlertResult {
  type: AlertType;
  severity: AlertSeverity;
  outletId?: string;
  productId?: string;
  distributorId?: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Default thresholds for alert rules. These can be overridden per
 * organization or per outlet in the admin settings.
 */
const DEFAULT_THRESHOLDS = {
  pullThroughHighPercent: 120,
  pullThroughLowPercent: 80,
  daysOfInventoryMin: 5,
  mandateComplianceDays: 7,
  rollingAverageDays: 90,
};

/**
 * AlertProcessor evaluates alert rules against current data and returns
 * alert results for conditions that are triggered.
 */
export class AlertProcessor {
  /**
   * Check mandate compliance for an outlet.
   * Verifies that all mandated items have been ordered within the required timeframe.
   */
  async checkMandateCompliance(
    outletId: string,
    mandateId: string
  ): Promise<AlertResult[]> {
    const alerts: AlertResult[] = [];

    const mandate = await prisma.mandate.findUnique({
      where: { id: mandateId },
      include: {
        mandateItems: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            mandateCompliance: {
              where: { outletId },
            },
          },
        },
      },
    });

    if (!mandate || !mandate.isActive) return alerts;

    const gracePeriodMs = DEFAULT_THRESHOLDS.mandateComplianceDays * 24 * 60 * 60 * 1000;
    const now = new Date();
    const mandateAge = now.getTime() - mandate.startDate.getTime();
    const isOverdue = mandateAge > gracePeriodMs;

    for (const item of mandate.mandateItems) {
      const compliance = item.mandateCompliance[0];

      // If compliant, skip
      if (compliance?.isCompliant) continue;

      // Check if ordered via direct orders or warehouse transfers
      const [directOrder, warehouseTransfer] = await Promise.all([
        prisma.directOrder.findFirst({
          where: { outletId, productId: item.productId },
          orderBy: { orderDate: "desc" },
          select: { orderDate: true, quantity: true },
        }),
        prisma.warehouseTransfer.findFirst({
          where: { outletId, productId: item.productId },
          orderBy: { transferDate: "desc" },
          select: { transferDate: true, quantity: true },
        }),
      ]);

      const hasBeenOrdered = directOrder || warehouseTransfer;
      if (hasBeenOrdered) continue;

      const daysOverdue = Math.floor(mandateAge / (24 * 60 * 60 * 1000));

      alerts.push({
        type: AlertType.MANDATE_COMPLIANCE,
        severity: isOverdue ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        outletId,
        productId: item.productId,
        title: `Mandate item not ordered: ${item.product.name}`,
        message: `${item.product.name} (${item.product.sku}) from mandate "${mandate.name}" has not been ordered. ${daysOverdue} days since mandate start.`,
        metadata: {
          mandateId: mandate.id,
          mandateName: mandate.name,
          productName: item.product.name,
          productSku: item.product.sku,
          daysOverdue,
          mandateStartDate: mandate.startDate.toISOString(),
        },
      });
    }

    return alerts;
  }

  /**
   * Check if pull-through for a product at an outlet is above historic average.
   */
  async checkPullThroughHigh(
    outletId: string,
    productId: string,
    threshold: number = DEFAULT_THRESHOLDS.pullThroughHighPercent
  ): Promise<AlertResult | null> {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - DEFAULT_THRESHOLDS.rollingAverageDays * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get 90-day total transfers for rolling average
    const historicAgg = await prisma.warehouseTransfer.aggregate({
      _sum: { quantity: true },
      where: {
        outletId,
        productId,
        transferDate: { gte: ninetyDaysAgo },
      },
    });

    // Get last 30 days as "current period"
    const currentAgg = await prisma.warehouseTransfer.aggregate({
      _sum: { quantity: true },
      where: {
        outletId,
        productId,
        transferDate: { gte: thirtyDaysAgo },
      },
    });

    const historicTotal = historicAgg._sum.quantity ?? 0;
    const currentTotal = currentAgg._sum.quantity ?? 0;

    if (historicTotal === 0) return null;

    // Normalize to 30-day equivalent
    const avgMonthly = historicTotal / 3;
    const percentOfAvg = avgMonthly > 0 ? Math.round((currentTotal / avgMonthly) * 100) : 0;

    if (percentOfAvg <= threshold) return null;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, sku: true },
    });

    return {
      type: AlertType.PULL_THROUGH_HIGH,
      severity: AlertSeverity.WARNING,
      outletId,
      productId,
      title: `High pull-through: ${product?.name ?? "Unknown"}`,
      message: `Pull-through for ${product?.name ?? productId} is at ${percentOfAvg}% of the 90-day average (threshold: ${threshold}%).`,
      metadata: {
        currentMonthly: currentTotal,
        avgMonthly: Math.round(avgMonthly),
        percentOfAvg,
        threshold,
      },
    };
  }

  /**
   * Check if pull-through for a product at an outlet is below historic average.
   */
  async checkPullThroughLow(
    outletId: string,
    productId: string,
    threshold: number = DEFAULT_THRESHOLDS.pullThroughLowPercent
  ): Promise<AlertResult | null> {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - DEFAULT_THRESHOLDS.rollingAverageDays * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const historicAgg = await prisma.warehouseTransfer.aggregate({
      _sum: { quantity: true },
      where: {
        outletId,
        productId,
        transferDate: { gte: ninetyDaysAgo },
      },
    });

    const currentAgg = await prisma.warehouseTransfer.aggregate({
      _sum: { quantity: true },
      where: {
        outletId,
        productId,
        transferDate: { gte: thirtyDaysAgo },
      },
    });

    const historicTotal = historicAgg._sum.quantity ?? 0;
    const currentTotal = currentAgg._sum.quantity ?? 0;

    if (historicTotal === 0) return null;
    // Skip zero current period — product may have been removed from menu
    if (currentTotal === 0) return null;

    const avgMonthly = historicTotal / 3;
    const percentOfAvg = avgMonthly > 0 ? Math.round((currentTotal / avgMonthly) * 100) : 0;

    if (percentOfAvg >= threshold) return null;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, sku: true },
    });

    return {
      type: AlertType.PULL_THROUGH_LOW,
      severity: AlertSeverity.WARNING,
      outletId,
      productId,
      title: `Low pull-through: ${product?.name ?? "Unknown"}`,
      message: `Pull-through for ${product?.name ?? productId} is at ${percentOfAvg}% of the 90-day average (threshold: ${threshold}%).`,
      metadata: {
        currentMonthly: currentTotal,
        avgMonthly: Math.round(avgMonthly),
        percentOfAvg,
        threshold,
      },
    };
  }

  /**
   * Check if days of inventory for a product at an outlet is below threshold.
   */
  async checkDaysOfInventory(
    outletId: string,
    productId: string,
    threshold: number = DEFAULT_THRESHOLDS.daysOfInventoryMin
  ): Promise<AlertResult | null> {
    // Get latest inventory snapshot
    const snapshot = await prisma.inventorySnapshot.findFirst({
      where: { outletId, productId },
      orderBy: { snapshotDate: "desc" },
      select: { quantityOnHand: true, snapshotDate: true },
    });

    if (!snapshot || snapshot.quantityOnHand <= 0) return null;

    // Calculate average daily usage from transfers over last 90 days
    const ninetyDaysAgo = new Date(Date.now() - DEFAULT_THRESHOLDS.rollingAverageDays * 24 * 60 * 60 * 1000);
    const transferAgg = await prisma.warehouseTransfer.aggregate({
      _sum: { quantity: true },
      where: {
        outletId,
        productId,
        transferDate: { gte: ninetyDaysAgo },
      },
    });

    const totalUsage = transferAgg._sum.quantity ?? 0;
    if (totalUsage === 0) return null; // No usage = product inactive, don't alert

    const avgDailyUsage = totalUsage / DEFAULT_THRESHOLDS.rollingAverageDays;
    const daysRemaining = Math.round(snapshot.quantityOnHand / avgDailyUsage);

    if (daysRemaining >= threshold) return null;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, sku: true },
    });

    return {
      type: AlertType.DAYS_OF_INVENTORY,
      severity: daysRemaining <= 2 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
      outletId,
      productId,
      title: `Low inventory: ${product?.name ?? "Unknown"} (${daysRemaining} days)`,
      message: `${product?.name ?? productId} has approximately ${daysRemaining} days of inventory remaining (threshold: ${threshold} days). Current qty: ${snapshot.quantityOnHand}, avg daily usage: ${avgDailyUsage.toFixed(1)}.`,
      metadata: {
        currentQty: snapshot.quantityOnHand,
        avgDailyUsage: Number(avgDailyUsage.toFixed(2)),
        daysRemaining,
        threshold,
      },
    };
  }

  /**
   * Check if a product is new to a specific outlet (first-time direct order).
   */
  async checkNewDirectItem(
    outletId: string,
    productId: string
  ): Promise<AlertResult | null> {
    // Check if the product has any prior orders at this outlet
    const [priorDirect, priorTransfer] = await Promise.all([
      prisma.directOrder.findFirst({
        where: { outletId, productId },
        orderBy: { orderDate: "asc" },
        select: { id: true, orderDate: true, quantity: true },
      }),
      prisma.warehouseTransfer.findFirst({
        where: { outletId, productId },
        select: { id: true },
      }),
    ]);

    // If there's a prior warehouse transfer, product isn't new to outlet
    if (priorTransfer) return null;

    // Count direct orders — if more than 1, this isn't the first time
    const directCount = await prisma.directOrder.count({
      where: { outletId, productId },
    });
    if (directCount !== 1) return null;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, sku: true, category: true },
    });

    const outlet = await prisma.outlet.findUnique({
      where: { id: outletId },
      select: { name: true },
    });

    return {
      type: AlertType.NEW_DIRECT_ITEM,
      severity: AlertSeverity.INFO,
      outletId,
      productId,
      title: `New item at ${outlet?.name ?? "outlet"}: ${product?.name ?? "Unknown"}`,
      message: `${product?.name ?? productId} (${product?.sku ?? ""}) was ordered for the first time at ${outlet?.name ?? outletId}.`,
      metadata: {
        productName: product?.name,
        productSku: product?.sku,
        productCategory: product?.category,
        outletName: outlet?.name,
        firstOrderDate: priorDirect?.orderDate?.toISOString(),
        firstOrderQty: priorDirect?.quantity,
      },
    };
  }

  /**
   * Check if the same product is priced differently across outlets.
   */
  async checkPriceDiscrepancy(
    productId: string,
    outletIds: string[]
  ): Promise<AlertResult | null> {
    if (outletIds.length < 2) return null;

    const pricesByOutlet: Array<{ outletId: string; outletName: string; cost: number }> = [];

    for (const outletId of outletIds) {
      const latestOrder = await prisma.orderHistory.findFirst({
        where: { outletId, productId },
        orderBy: { orderDate: "desc" },
        select: { costPerUnit: true },
      });

      const latestDirect = await prisma.directOrder.findFirst({
        where: { outletId, productId },
        orderBy: { orderDate: "desc" },
        select: { costPerUnit: true },
      });

      const cost = latestDirect?.costPerUnit ?? latestOrder?.costPerUnit;
      if (cost == null) continue;

      const outlet = await prisma.outlet.findUnique({
        where: { id: outletId },
        select: { name: true },
      });

      pricesByOutlet.push({
        outletId,
        outletName: outlet?.name ?? outletId,
        cost,
      });
    }

    if (pricesByOutlet.length < 2) return null;

    const prices = pricesByOutlet.map((p) => p.cost);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) return null;

    const variance = maxPrice > 0 ? Math.round(((maxPrice - minPrice) / minPrice) * 100) : 0;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, sku: true },
    });

    return {
      type: AlertType.PRICE_DISCREPANCY,
      severity: variance >= 10 ? AlertSeverity.WARNING : AlertSeverity.INFO,
      productId,
      title: `Price discrepancy: ${product?.name ?? "Unknown"} (${variance}% variance)`,
      message: `${product?.name ?? productId} has different prices across outlets. Range: $${minPrice.toFixed(2)} — $${maxPrice.toFixed(2)} (${variance}% variance).`,
      metadata: {
        productName: product?.name,
        minPrice,
        maxPrice,
        variance,
        outlets: pricesByOutlet,
      },
    };
  }

  /**
   * Check if the price of a product changed from the previous order at an outlet.
   */
  async checkPriceChange(
    productId: string,
    outletId: string
  ): Promise<AlertResult | null> {
    const recentOrders = await prisma.orderHistory.findMany({
      where: { outletId, productId },
      orderBy: { orderDate: "desc" },
      take: 2,
      select: { costPerUnit: true, orderDate: true },
    });

    if (recentOrders.length < 2) return null;

    const [current, previous] = recentOrders;
    if (current.costPerUnit === previous.costPerUnit) return null;

    const change = current.costPerUnit - previous.costPerUnit;
    const pctChange = previous.costPerUnit > 0
      ? Math.round((change / previous.costPerUnit) * 100)
      : 0;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, sku: true },
    });

    return {
      type: AlertType.PRICE_CHANGE,
      severity: Math.abs(pctChange) >= 5 ? AlertSeverity.WARNING : AlertSeverity.INFO,
      outletId,
      productId,
      title: `Price ${change > 0 ? "increase" : "decrease"}: ${product?.name ?? "Unknown"} (${pctChange > 0 ? "+" : ""}${pctChange}%)`,
      message: `${product?.name ?? productId} price changed from $${previous.costPerUnit.toFixed(2)} to $${current.costPerUnit.toFixed(2)} (${pctChange > 0 ? "+" : ""}${pctChange}%).`,
      metadata: {
        oldPrice: previous.costPerUnit,
        newPrice: current.costPerUnit,
        change: Number(change.toFixed(2)),
        pctChange,
        previousOrderDate: previous.orderDate.toISOString(),
        currentOrderDate: current.orderDate.toISOString(),
      },
    };
  }

  /**
   * Check if an outlet's cost percentage exceeds its configured goal.
   */
  async checkCostGoal(
    outletId: string,
    category?: string
  ): Promise<AlertResult | null> {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const costGoal = await prisma.costGoal.findFirst({
      where: {
        outletId,
        ...(category ? { category: category as never } : {}),
      },
      orderBy: { effectiveDate: "desc" },
      select: { targetCostPercentage: true },
    });

    if (!costGoal) return null;

    const [salesAgg, costAgg] = await Promise.all([
      prisma.salesData.aggregate({
        _sum: { revenue: true },
        where: { outletId, saleDate: { gte: threeMonthsAgo } },
      }),
      prisma.orderHistory.aggregate({
        _sum: { totalCost: true },
        where: { outletId, orderDate: { gte: threeMonthsAgo } },
      }),
    ]);

    const revenue = salesAgg._sum.revenue ?? 0;
    const cost = costAgg._sum.totalCost ?? 0;

    if (revenue === 0) return null;

    const actualPct = Math.round((cost / revenue) * 100);

    if (actualPct <= costGoal.targetCostPercentage) return null;

    const outlet = await prisma.outlet.findUnique({
      where: { id: outletId },
      select: { name: true },
    });

    return {
      type: AlertType.COST_GOAL_EXCEEDED,
      severity: (actualPct - costGoal.targetCostPercentage) >= 5
        ? AlertSeverity.CRITICAL
        : AlertSeverity.WARNING,
      outletId,
      title: `Cost goal exceeded: ${outlet?.name ?? "Outlet"} (${actualPct}% vs ${costGoal.targetCostPercentage}% goal)`,
      message: `${outlet?.name ?? outletId} has a cost percentage of ${actualPct}%, exceeding the goal of ${costGoal.targetCostPercentage}%.${category ? ` Category: ${category}.` : ""}`,
      metadata: {
        actualPct,
        goalPct: costGoal.targetCostPercentage,
        variance: actualPct - costGoal.targetCostPercentage,
        category: category ?? "all",
        revenue,
        cost,
        period: "90 days",
      },
    };
  }

  /**
   * Run all alert checks for an entire organization.
   * Main entry point called after data ingestion or on a schedule.
   */
  async processAllAlerts(organizationId: string): Promise<AlertResult[]> {
    const startTime = Date.now();
    const allAlerts: AlertResult[] = [];

    // Fetch all outlets for the organization
    const outlets = await prisma.outlet.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, name: true },
    });

    // Fetch all active mandates
    const mandates = await prisma.mandate.findMany({
      where: { organizationId, isActive: true },
      select: { id: true },
    });

    // Fetch products with recent activity (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const recentTransfers = await prisma.warehouseTransfer.findMany({
      where: { organizationId, transferDate: { gte: ninetyDaysAgo } },
      select: { outletId: true, productId: true },
      distinct: ["outletId", "productId"],
    });

    const recentDirectOrders = await prisma.directOrder.findMany({
      where: { organizationId, orderDate: { gte: ninetyDaysAgo } },
      select: { outletId: true, productId: true },
      distinct: ["outletId", "productId"],
    });

    // Build set of outlet+product pairs with recent activity
    const activeOutletProducts = new Set<string>();
    const allProductIds = new Set<string>();

    for (const t of recentTransfers) {
      activeOutletProducts.add(`${t.outletId}:${t.productId}`);
      allProductIds.add(t.productId);
    }
    for (const d of recentDirectOrders) {
      activeOutletProducts.add(`${d.outletId}:${d.productId}`);
      allProductIds.add(d.productId);
    }

    // 1. Mandate compliance checks
    for (const mandate of mandates) {
      for (const outlet of outlets) {
        const mandateAlerts = await this.checkMandateCompliance(outlet.id, mandate.id);
        allAlerts.push(...mandateAlerts);
      }
    }

    // 2. Pull-through checks (high and low) for active outlet/product pairs
    for (const key of activeOutletProducts) {
      const [outletId, productId] = key.split(":");

      const high = await this.checkPullThroughHigh(outletId, productId);
      if (high) allAlerts.push(high);

      const low = await this.checkPullThroughLow(outletId, productId);
      if (low) allAlerts.push(low);
    }

    // 3. Days of inventory checks
    for (const key of activeOutletProducts) {
      const [outletId, productId] = key.split(":");
      const doi = await this.checkDaysOfInventory(outletId, productId);
      if (doi) allAlerts.push(doi);
    }

    // 4. New direct item checks
    for (const d of recentDirectOrders) {
      const newItem = await this.checkNewDirectItem(d.outletId, d.productId);
      if (newItem) allAlerts.push(newItem);
    }

    // 5. Price discrepancy checks across outlets per product
    for (const productId of allProductIds) {
      const outletsForProduct = outlets.map((o) => o.id);
      const discrepancy = await this.checkPriceDiscrepancy(productId, outletsForProduct);
      if (discrepancy) allAlerts.push(discrepancy);
    }

    // 6. Price change checks for recent orders
    const recentOrderHistory = await prisma.orderHistory.findMany({
      where: { organizationId, orderDate: { gte: ninetyDaysAgo } },
      select: { outletId: true, productId: true },
      distinct: ["outletId", "productId"],
    });

    for (const oh of recentOrderHistory) {
      const priceChange = await this.checkPriceChange(oh.productId, oh.outletId);
      if (priceChange) allAlerts.push(priceChange);
    }

    // 7. Cost goal checks for each outlet
    for (const outlet of outlets) {
      const costGoal = await this.checkCostGoal(outlet.id);
      if (costGoal) allAlerts.push(costGoal);
    }

    // 8. Deduplicate against existing unread alerts
    const dedupedAlerts: AlertResult[] = [];
    for (const alert of allAlerts) {
      const existing = await prisma.alert.findFirst({
        where: {
          organizationId,
          alertType: alert.type,
          outletId: alert.outletId ?? null,
          productId: alert.productId ?? null,
          isDismissed: false,
          isRead: false,
        },
        select: { id: true },
      });

      if (!existing) {
        dedupedAlerts.push(alert);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[AlertProcessor] Processed ${outlets.length} outlets, ${allProductIds.size} products. ` +
      `Generated ${dedupedAlerts.length} new alerts (${allAlerts.length} total, ${allAlerts.length - dedupedAlerts.length} deduped). ` +
      `Took ${elapsed}ms.`
    );

    return dedupedAlerts;
  }
}
