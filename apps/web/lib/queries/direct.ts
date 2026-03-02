/**
 * Direct Order Queries
 * Server-side data fetching for direct-to-outlet tracking
 */

import { prisma } from "@spotlight/db";

/** Get direct order overview stats */
export async function getDirectOverview() {
  const [totalDirectItems, supplierCount, outletsReceiving] = await Promise.all([
    prisma.directOrder.groupBy({
      by: ["productId"],
      _count: { id: true },
    }),
    prisma.directOrder.groupBy({
      by: ["supplierId"],
      _count: { id: true },
    }),
    prisma.directOrder.groupBy({
      by: ["outletId"],
      _count: { id: true },
    }),
  ]);

  const totalOutlets = await prisma.outlet.count({ where: { isActive: true } });

  return {
    directItems: totalDirectItems.length,
    directVendors: supplierCount.length,
    outletsReceiving: outletsReceiving.length,
    totalOutlets,
  };
}

/** Get direct order tracking board — all direct items with outlets and frequency */
export async function getDirectTrackingBoard() {
  const orders = await prisma.directOrder.findMany({
    include: {
      product: { select: { name: true, sku: true, category: true } },
      outlet: { select: { name: true, slug: true } },
      supplier: { select: { name: true } },
      distributor: { select: { name: true } },
    },
    orderBy: { orderDate: "desc" },
  });

  // Group by product + supplier
  const grouped = new Map<
    string,
    {
      productName: string;
      productSku: string;
      category: string;
      vendorName: string;
      outlets: Set<string>;
      orderDates: Date[];
      firstOrder: Date;
      lastOrder: Date;
      totalQuantity: number;
    }
  >();

  for (const order of orders) {
    const vendorName = order.supplier?.name ?? order.distributor?.name ?? "Direct";
    const key = `${order.productId}__${vendorName}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.outlets.add(order.outlet.name);
      existing.orderDates.push(order.orderDate);
      if (order.orderDate < existing.firstOrder) existing.firstOrder = order.orderDate;
      if (order.orderDate > existing.lastOrder) existing.lastOrder = order.orderDate;
      existing.totalQuantity += order.quantity;
    } else {
      grouped.set(key, {
        productName: order.product.name,
        productSku: order.product.sku,
        category: order.product.category,
        vendorName,
        outlets: new Set([order.outlet.name]),
        orderDates: [order.orderDate],
        firstOrder: order.orderDate,
        lastOrder: order.orderDate,
        totalQuantity: order.quantity,
      });
    }
  }

  return Array.from(grouped.values()).map((item) => {
    // Estimate frequency based on order dates
    const daySpan =
      (item.lastOrder.getTime() - item.firstOrder.getTime()) / (1000 * 60 * 60 * 24);
    const orderCount = item.orderDates.length;
    let frequency = "One-time";
    if (orderCount > 1 && daySpan > 0) {
      const avgDaysBetween = daySpan / (orderCount - 1);
      if (avgDaysBetween <= 10) frequency = "Weekly";
      else if (avgDaysBetween <= 20) frequency = "Bi-weekly";
      else if (avgDaysBetween <= 45) frequency = "Monthly";
      else if (avgDaysBetween <= 75) frequency = "Bi-monthly";
      else frequency = "Quarterly";
    }

    return {
      productName: item.productName,
      productSku: item.productSku,
      category: item.category,
      vendorName: item.vendorName,
      outlets: Array.from(item.outlets).sort(),
      frequency,
      orderCount,
      totalQuantity: item.totalQuantity,
      firstOrder: item.firstOrder,
      lastOrder: item.lastOrder,
    };
  }).sort((a, b) => b.lastOrder.getTime() - a.lastOrder.getTime());
}
