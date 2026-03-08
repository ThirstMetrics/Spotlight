// =============================================================================
// /api/margins — Margin calculation endpoints
// =============================================================================

import { NextResponse } from "next/server";
import { Category, UserRoleType } from "@spotlight/shared";
import type { ApiResponse } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";
import { prisma } from "@spotlight/db";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface MarginSummary {
  outletId: string;
  outletName: string;
  category: Category;
  totalRevenue: number;
  totalCost: number;
  marginPercent: number;
  costPercent: number;
  targetCostPercent: number;
  variance: number;
  period: { from: string; to: string };
}

interface MarginResponse {
  summaries: MarginSummary[];
  overall: {
    totalRevenue: number;
    totalCost: number;
    marginPercent: number;
    costPercent: number;
  };
}

/**
 * GET /api/margins
 *
 * Calculate and return margin data with optional filters.
 *
 * Full implementation will:
 * - Aggregate sales_data (revenue) and order_history (cost) for the requested period
 * - Support query params:
 *   - from, to (date range — defaults to current month)
 *   - outletId / outletGroupId
 *   - category (BEER, WINE, SPIRITS, SAKE)
 *   - productId (drill into a specific product)
 * - Join cost_goals to compare actual vs target cost percentages
 * - Calculate: Margin = (Revenue - Cost) / Revenue * 100
 * - Include recipe-based cost calculations for cocktails
 * - Support grouping by outlet, category, or product
 * - VP/Director: all outlets; Admin: their org; Room Manager: their outlets only
 * - Distributors and Suppliers do not have margin access
 */
export async function GET(request: Request): Promise<NextResponse<ApiResponse<MarginResponse>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "margins", "read")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  // ---------------------------------------------------------------------------
  // Parse query params with sensible defaults
  // ---------------------------------------------------------------------------

  const { searchParams } = new URL(request.url);

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const from = searchParams.get("from") ?? defaultFrom;
  const to = searchParams.get("to") ?? defaultTo;
  const outletId = searchParams.get("outletId");
  const category = searchParams.get("category") as Category | null;

  const fromDate = new Date(from);
  const toDate = new Date(`${to}T23:59:59.999Z`);

  // ---------------------------------------------------------------------------
  // RBAC scope — determine which outlet IDs this user may see
  // ---------------------------------------------------------------------------

  let scopedOutletIds: string[] | undefined;

  if (
    user.role === UserRoleType.ADMIN &&
    user.organizationId
  ) {
    // ADMIN sees all outlets within their organization
    const orgOutlets = await prisma.outlet.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true },
    });
    scopedOutletIds = orgOutlets.map((o) => o.id);
  } else if (
    user.role === UserRoleType.ROOM_MANAGER &&
    user.outletIds?.length
  ) {
    // ROOM_MANAGER sees only their assigned outlets
    scopedOutletIds = user.outletIds;
  }
  // VP and DIRECTOR: scopedOutletIds remains undefined → no filter (see all)

  // If the caller also passes an explicit outletId param, intersect with scope
  if (outletId) {
    if (scopedOutletIds) {
      // Only allow if the requested outlet is within scope
      scopedOutletIds = scopedOutletIds.includes(outletId) ? [outletId] : [];
    } else {
      scopedOutletIds = [outletId];
    }
  }

  // ---------------------------------------------------------------------------
  // Build shared where-clause fragments
  // ---------------------------------------------------------------------------

  const outletWhere = scopedOutletIds
    ? { outletId: { in: scopedOutletIds } }
    : {};

  // Prisma groupBy does not support relation-level where clauses, so when a
  // category filter is requested we first resolve it to a set of product IDs.
  let categoryProductIds: string[] | undefined;
  if (category) {
    const categoryProducts = await prisma.product.findMany({
      where: { category },
      select: { id: true },
    });
    categoryProductIds = categoryProducts.map((p) => p.id);
  }

  const productWhere = categoryProductIds
    ? { productId: { in: categoryProductIds } }
    : {};

  // ---------------------------------------------------------------------------
  // Aggregate revenue from salesData
  // ---------------------------------------------------------------------------

  const revenueRows = await prisma.salesData.groupBy({
    by: ["outletId", "productId"],
    where: {
      saleDate: { gte: fromDate, lte: toDate },
      productId: { not: null },
      ...outletWhere,
      ...productWhere,
    },
    _sum: { revenue: true },
  });

  // ---------------------------------------------------------------------------
  // Aggregate cost from orderHistory
  // ---------------------------------------------------------------------------

  const costRows = await prisma.orderHistory.groupBy({
    by: ["outletId", "productId"],
    where: {
      orderDate: { gte: fromDate, lte: toDate },
      ...outletWhere,
      ...productWhere,
    },
    _sum: { totalCost: true },
  });

  // ---------------------------------------------------------------------------
  // Fetch products (for category mapping) and outlets (for names)
  // ---------------------------------------------------------------------------

  // Collect all product IDs we need categories for
  const productIds = new Set<string>();
  for (const r of revenueRows) {
    if (r.productId) productIds.add(r.productId);
  }
  for (const r of costRows) {
    productIds.add(r.productId);
  }

  const products = await prisma.product.findMany({
    where: { id: { in: Array.from(productIds) } },
    select: { id: true, category: true },
  });
  const productCategoryMap = new Map(
    products.map((p) => [p.id, p.category as Category]),
  );

  // Collect all outlet IDs across both result sets
  const outletIdsSet = new Set<string>();
  for (const r of revenueRows) outletIdsSet.add(r.outletId);
  for (const r of costRows) outletIdsSet.add(r.outletId);

  const outlets = await prisma.outlet.findMany({
    where: { id: { in: Array.from(outletIdsSet) } },
    select: { id: true, name: true },
  });
  const outletNameMap = new Map(outlets.map((o) => [o.id, o.name]));

  // ---------------------------------------------------------------------------
  // Build revenue & cost maps keyed by "outletId|category"
  // ---------------------------------------------------------------------------

  const revenueMap = new Map<string, number>();
  for (const r of revenueRows) {
    const cat = r.productId ? productCategoryMap.get(r.productId) : undefined;
    if (!cat) continue;
    const key = `${r.outletId}|${cat}`;
    revenueMap.set(key, (revenueMap.get(key) ?? 0) + (r._sum.revenue ?? 0));
  }

  const costMap = new Map<string, number>();
  for (const r of costRows) {
    const cat = productCategoryMap.get(r.productId);
    if (!cat) continue;
    const key = `${r.outletId}|${cat}`;
    costMap.set(key, (costMap.get(key) ?? 0) + (r._sum.totalCost ?? 0));
  }

  // Merge keys from both maps
  const allKeys = new Set([...revenueMap.keys(), ...costMap.keys()]);

  // ---------------------------------------------------------------------------
  // Fetch cost goals for matching outlets
  // ---------------------------------------------------------------------------

  const costGoals = await prisma.costGoal.findMany({
    where: {
      outletId: { in: Array.from(outletIdsSet) },
      effectiveDate: { lte: toDate },
    },
    orderBy: { effectiveDate: "desc" },
  });

  // Build a lookup: outletId|category → targetCostPercentage
  // Use the most recent effective goal. A goal with category=null applies
  // as a fallback for that outlet.
  const goalMap = new Map<string, number>();
  const outletFallbackGoalMap = new Map<string, number>();

  for (const g of costGoals) {
    if (g.category) {
      const key = `${g.outletId}|${g.category}`;
      if (!goalMap.has(key)) {
        goalMap.set(key, g.targetCostPercentage);
      }
    } else {
      // Fallback goal (no category specified) — applies to all categories
      if (!outletFallbackGoalMap.has(g.outletId)) {
        outletFallbackGoalMap.set(g.outletId, g.targetCostPercentage);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Assemble MarginSummary[]
  // ---------------------------------------------------------------------------

  const summaries: MarginSummary[] = [];

  for (const key of allKeys) {
    const [oId, cat] = key.split("|") as [string, Category];
    const totalRevenue = revenueMap.get(key) ?? 0;
    const totalCost = costMap.get(key) ?? 0;

    const marginPercent =
      totalRevenue > 0
        ? ((totalRevenue - totalCost) / totalRevenue) * 100
        : 0;
    const costPercent =
      totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;

    const targetCostPercent =
      goalMap.get(key) ?? outletFallbackGoalMap.get(oId) ?? 0;

    const variance = costPercent - targetCostPercent;

    summaries.push({
      outletId: oId,
      outletName: outletNameMap.get(oId) ?? "Unknown Outlet",
      category: cat,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      marginPercent: Math.round(marginPercent * 100) / 100,
      costPercent: Math.round(costPercent * 100) / 100,
      targetCostPercent: Math.round(targetCostPercent * 100) / 100,
      variance: Math.round(variance * 100) / 100,
      period: { from, to },
    });
  }

  // Sort by outlet name, then category for consistent ordering
  summaries.sort((a, b) =>
    a.outletName.localeCompare(b.outletName) ||
    a.category.localeCompare(b.category),
  );

  // ---------------------------------------------------------------------------
  // Calculate overall totals
  // ---------------------------------------------------------------------------

  const overallRevenue = summaries.reduce((sum, s) => sum + s.totalRevenue, 0);
  const overallCost = summaries.reduce((sum, s) => sum + s.totalCost, 0);

  const response: MarginResponse = {
    summaries,
    overall: {
      totalRevenue: Math.round(overallRevenue * 100) / 100,
      totalCost: Math.round(overallCost * 100) / 100,
      marginPercent:
        overallRevenue > 0
          ? Math.round(((overallRevenue - overallCost) / overallRevenue) * 100 * 100) / 100
          : 0,
      costPercent:
        overallRevenue > 0
          ? Math.round((overallCost / overallRevenue) * 100 * 100) / 100
          : 0,
    },
  };

  return NextResponse.json(
    { success: true, data: response },
    { status: 200 },
  );
}
