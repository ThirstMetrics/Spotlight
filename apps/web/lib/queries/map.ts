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

  // Positions within Resorts World Las Vegas (3000 S Las Vegas Blvd)
  // Building center per Google Maps: 36.1341, -115.1677
  // Las Vegas Blvd (Strip) runs N-S on the EAST side of the property
  // Podium footprint ~36.1328–36.1355 lat, ~-115.1660–-115.1695 lng
  // Towers: Hilton (south), Conrad (center), Crockfords (north)
  // The District: dining corridor along east/Strip side
  // Famous Foods: east side with Strip-facing windows
  // Pool deck: elevated, south side of podium
  const outletPositions: Record<string, [number, number]> = {
    // Fine Dining — The District & resort level
    "stubborn-seed":      [36.13500, -115.16640],  // North end of The District, near Conrad porte-cochere
    "crossroads-kitchen": [36.13470, -115.16650],  // The District, east side near Strip
    "genting-palace":     [36.13430, -115.16680],  // Central, resort level
    "fuhu":               [36.13460, -115.16700],  // Central, resort level
    "kusa-nori":          [36.13440, -115.16650],  // The District, east side
    "wallys":             [36.13410, -115.16660],  // Heart of resort, just off casino floor
    "viva":               [36.13380, -115.16690],  // South-central, resort level
    "juniors":            [36.13360, -115.16670],  // South-central, casual dining

    // Food Hall & Casual — casino level, east side
    "famous-foods":       [36.13370, -115.16620],  // East side, Strip-facing windows
    "dawg-house":         [36.13340, -115.16750],  // Entertainment area, west side

    // Bars & Lounges — casino floor
    "alle-lounge":        [36.13420, -115.16770],  // 66th floor Conrad tower (tower footprint)
    "gatsbys":            [36.13450, -115.16730],  // Just off casino floor, wraparound views
    "crystal-bar":        [36.13490, -115.16720],  // Crockfords casino floor, north-central
    "golden-monkey":      [36.13400, -115.16730],  // Casino floor, central
    "high-limit-bar":     [36.13420, -115.16740],  // High-limit gaming area, central
    "here-kitty-kitty":   [36.13375, -115.16630],  // Hidden inside Famous Foods (east side)

    // Lobby Bars — tower lobbies
    "conrad-lobby":       [36.13480, -115.16670],  // Conrad tower lobby, east side
    "crockfords-lobby":   [36.13520, -115.16710],  // Crockfords lobby, north end

    // Pool & Nightlife — south side of podium
    "pool-bar":           [36.13310, -115.16720],  // Pool deck, south side
    "zouk":               [36.13320, -115.16780],  // Nightclub, south-west entertainment area
  };

  const defaultPosition: [number, number] = [36.1341, -115.1677];

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
