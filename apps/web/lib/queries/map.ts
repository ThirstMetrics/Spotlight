/**
 * Map Page Queries
 * Server-side data fetching for the geographic outlet map view
 */

import { prisma } from "@spotlight/db";

/** Get all outlets with order/sales stats and positions for the map */
export async function getMapData() {
  // Get all active outlets with order and sales counts
  const outlets = await prisma.outlet.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      _count: {
        select: {
          orderHistory: true,
          salesData: true,
        },
      },
    },
  });

  // Get distinct product count per outlet (unique products ordered)
  const productsByOutlet = await prisma.orderHistory.groupBy({
    by: ["outletId"],
    _count: { productId: true },
  });
  const productCountMap = new Map(
    productsByOutlet.map((p) => [p.outletId, p._count.productId])
  );

  // Get total distinct products across all outlets
  const totalDistinctProducts = await prisma.product.count({
    where: { isActive: true },
  });

  // Get distributor count
  const distributorCount = await prisma.distributor.count({
    where: { isActive: true },
  });

  // Approximate positions within Resorts World Las Vegas complex
  // Center: 36.1372, -115.1689
  // Small offsets to spread outlets around the property footprint
  const outletPositions: Record<string, [number, number]> = {
    "carversteak": [36.1378, -115.1695],
    "crossroads-kitchen": [36.1375, -115.1685],
    "wallys-wine-spirits": [36.1370, -115.1680],
    "bar-zazu": [36.1368, -115.1692],
    "redtail": [36.1382, -115.1688],
    "famous-foods-street-eats": [36.1365, -115.1690],
    "dawg-house-saloon": [36.1372, -115.1698],
    "alle-lounge-on-66": [36.1380, -115.1682],
    "gatsbys-cocktail-lounge": [36.1374, -115.1694],
    "pool-bar-grill": [36.1366, -115.1686],
  };

  const defaultPosition: [number, number] = [36.1372, -115.1689];

  return {
    outlets: outlets.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      type: o.type,
      orderCount: o._count.orderHistory,
      salesCount: o._count.salesData,
      productCount: productCountMap.get(o.id) ?? 0,
      position: outletPositions[o.slug] ?? defaultPosition,
    })),
    summary: {
      totalOutlets: outlets.length,
      totalProducts: totalDistinctProducts,
      totalDistributors: distributorCount,
    },
  };
}
