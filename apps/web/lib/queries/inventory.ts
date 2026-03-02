import { prisma } from "@spotlight/db";

/**
 * Get inventory overview metrics for the dashboard.
 */
export async function getInventoryOverview() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // Get latest snapshots per outlet/product
  const snapshots = await prisma.inventorySnapshot.findMany({
    orderBy: { snapshotDate: "desc" },
    distinct: ["outletId", "productId"],
    select: {
      outletId: true,
      productId: true,
      quantityOnHand: true,
      snapshotDate: true,
    },
  });

  const totalItems = snapshots.length;
  const lowStockCount = snapshots.filter((s) => s.quantityOnHand < 5).length;
  const outOfStockCount = snapshots.filter((s) => s.quantityOnHand <= 0).length;

  // Total warehouse transfers in period
  const transferAgg = await prisma.warehouseTransfer.aggregate({
    _sum: { quantity: true, totalCost: true },
    _count: true,
    where: { transferDate: { gte: ninetyDaysAgo } },
  });

  return {
    totalItems,
    lowStockCount,
    outOfStockCount,
    totalTransfers: transferAgg._count,
    transferVolume: transferAgg._sum.quantity ?? 0,
    transferCost: transferAgg._sum.totalCost ?? 0,
  };
}

/**
 * Get inventory items with days-of-hand calculations.
 */
export async function getInventoryItems() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // Get latest snapshot per outlet/product
  const snapshots = await prisma.inventorySnapshot.findMany({
    orderBy: { snapshotDate: "desc" },
    distinct: ["outletId", "productId"],
    include: {
      product: { select: { id: true, name: true, sku: true, category: true } },
      outlet: { select: { id: true, name: true, slug: true } },
    },
  });

  const items = await Promise.all(
    snapshots.slice(0, 100).map(async (snap) => {
      // Calculate avg daily usage from transfers
      const transferAgg = await prisma.warehouseTransfer.aggregate({
        _sum: { quantity: true },
        where: {
          outletId: snap.outletId,
          productId: snap.productId,
          transferDate: { gte: ninetyDaysAgo },
        },
      });

      const totalUsage = transferAgg._sum.quantity ?? 0;
      const avgDailyUsage = totalUsage / 90;
      const daysOnHand =
        avgDailyUsage > 0
          ? Math.round(snap.quantityOnHand / avgDailyUsage)
          : snap.quantityOnHand > 0
            ? 999
            : 0;

      return {
        outletId: snap.outlet.id,
        outletName: snap.outlet.name,
        outletSlug: snap.outlet.slug,
        productId: snap.product.id,
        productName: snap.product.name,
        productSku: snap.product.sku,
        category: snap.product.category,
        quantityOnHand: snap.quantityOnHand,
        avgDailyUsage: Number(avgDailyUsage.toFixed(2)),
        daysOnHand,
        lastUpdated: snap.snapshotDate,
      };
    })
  );

  return items.sort((a, b) => a.daysOnHand - b.daysOnHand);
}

/**
 * Get recent alerts related to inventory.
 */
export async function getInventoryAlerts() {
  return prisma.alert.findMany({
    where: {
      alertType: {
        in: [
          "PULL_THROUGH_HIGH",
          "PULL_THROUGH_LOW",
          "DAYS_OF_INVENTORY",
          "NEW_DIRECT_ITEM",
        ],
      },
      isDismissed: false,
    },
    include: {
      outlet: { select: { name: true, slug: true } },
      product: { select: { name: true, sku: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
