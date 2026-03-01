// =============================================================================
// /api/orders — Order history endpoints
// =============================================================================

import { NextResponse } from "next/server";
import { Category, UserRoleType } from "@spotlight/shared";
import type { ApiResponse, PaginatedResponse, OrderHistory } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission, filterByScope } from "@/lib/rbac";

/**
 * GET /api/orders
 *
 * Retrieve order history with filtering by date range, outlet, product, and distributor.
 *
 * Full implementation will:
 * - Query order_history table with user's scope filter applied
 * - Support query params:
 *   - from, to (date range)
 *   - outletId / outletIds (comma-separated)
 *   - productId
 *   - distributorId
 *   - category (BEER, WINE, SPIRITS, SAKE)
 *   - search (product name or SKU)
 * - VP/Director: all orders across all organizations
 * - Admin: all orders within their organization
 * - Room Manager: orders for their assigned outlets only
 * - Distributor: orders for their products only
 * - Supplier: orders for products they supply across all distributors
 * - Support pagination, sorting by orderDate, totalCost, quantity
 * - Include product and outlet names via joins
 */
export async function GET(request: Request): Promise<NextResponse<ApiResponse<PaginatedResponse<OrderHistory>>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "orders", "read")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const outletId = searchParams.get("outletId");
  const productId = searchParams.get("productId");
  const distributorId = searchParams.get("distributorId");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);

  // TODO: Replace with real database query using all filters.
  const placeholderOrders: OrderHistory[] = [
    {
      id: "ord_001",
      organizationId: "org_placeholder_001",
      outletId: "out_001",
      productId: "prod_001",
      distributorId: "dist_001",
      quantity: 24,
      unit: "bottle",
      unitCost: 42.50,
      totalCost: 1020.00,
      orderDate: new Date("2026-02-15T00:00:00Z"),
      createdAt: new Date("2026-02-15T10:00:00Z"),
      updatedAt: new Date("2026-02-15T10:00:00Z"),
    },
    {
      id: "ord_002",
      organizationId: "org_placeholder_001",
      outletId: "out_002",
      productId: "prod_002",
      distributorId: "dist_001",
      quantity: 12,
      unit: "bottle",
      unitCost: 28.00,
      totalCost: 336.00,
      orderDate: new Date("2026-02-18T00:00:00Z"),
      createdAt: new Date("2026-02-18T14:00:00Z"),
      updatedAt: new Date("2026-02-18T14:00:00Z"),
    },
    {
      id: "ord_003",
      organizationId: "org_placeholder_001",
      outletId: "out_003",
      productId: "prod_003",
      distributorId: "dist_002",
      quantity: 48,
      unit: "can",
      unitCost: 2.75,
      totalCost: 132.00,
      orderDate: new Date("2026-02-20T00:00:00Z"),
      createdAt: new Date("2026-02-20T09:30:00Z"),
      updatedAt: new Date("2026-02-20T09:30:00Z"),
    },
  ];

  let filtered = filterByScope(user, placeholderOrders as unknown as Record<string, unknown>[]) as unknown as OrderHistory[];

  // Apply client-side filters on placeholder data
  if (outletId) {
    filtered = filtered.filter((o) => o.outletId === outletId);
  }
  if (productId) {
    filtered = filtered.filter((o) => o.productId === productId);
  }
  if (distributorId) {
    filtered = filtered.filter((o) => o.distributorId === distributorId);
  }
  if (from) {
    const fromDate = new Date(from);
    filtered = filtered.filter((o) => new Date(o.orderDate) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    filtered = filtered.filter((o) => new Date(o.orderDate) <= toDate);
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        data: filtered,
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
      },
    },
    { status: 200 },
  );
}
