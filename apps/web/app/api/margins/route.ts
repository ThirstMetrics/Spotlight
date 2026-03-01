// =============================================================================
// /api/margins — Margin calculation endpoints
// =============================================================================

import { NextResponse } from "next/server";
import { Category, UserRoleType } from "@spotlight/shared";
import type { ApiResponse } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";

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

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? "2026-02-01";
  const to = searchParams.get("to") ?? "2026-02-28";
  const outletId = searchParams.get("outletId");
  const category = searchParams.get("category") as Category | null;

  // TODO: Replace with real aggregation query across sales_data + order_history + cost_goals.
  const placeholderSummaries: MarginSummary[] = [
    {
      outletId: "out_001",
      outletName: "Steakhouse",
      category: Category.WINE,
      totalRevenue: 45200.00,
      totalCost: 12560.00,
      marginPercent: 72.2,
      costPercent: 27.8,
      targetCostPercent: 25.0,
      variance: 2.8,
      period: { from, to },
    },
    {
      outletId: "out_002",
      outletName: "Pool Bar",
      category: Category.SPIRITS,
      totalRevenue: 28400.00,
      totalCost: 7100.00,
      marginPercent: 75.0,
      costPercent: 25.0,
      targetCostPercent: 28.0,
      variance: -3.0,
      period: { from, to },
    },
    {
      outletId: "out_003",
      outletName: "Lobby Lounge",
      category: Category.BEER,
      totalRevenue: 12800.00,
      totalCost: 4480.00,
      marginPercent: 65.0,
      costPercent: 35.0,
      targetCostPercent: 30.0,
      variance: 5.0,
      period: { from, to },
    },
  ];

  // Apply client-side filters on placeholder data
  let filtered = placeholderSummaries;
  if (outletId) {
    filtered = filtered.filter((s) => s.outletId === outletId);
  }
  if (category) {
    filtered = filtered.filter((s) => s.category === category);
  }

  const totalRevenue = filtered.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalCost = filtered.reduce((sum, s) => sum + s.totalCost, 0);

  const response: MarginResponse = {
    summaries: filtered,
    overall: {
      totalRevenue,
      totalCost,
      marginPercent: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
      costPercent: totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0,
    },
  };

  return NextResponse.json(
    { success: true, data: response },
    { status: 200 },
  );
}
