// =============================================================================
// /api/admin/occupancy — Hotel occupancy data endpoints
// =============================================================================

import { NextResponse } from "next/server";
import { UserRoleType } from "@spotlight/shared";
import type { ApiResponse, PaginatedResponse, HotelOccupancy } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission, filterByScope } from "@/lib/rbac";

/**
 * GET /api/admin/occupancy
 *
 * Retrieve hotel occupancy data (guest counts, restaurant covers) with date range filtering.
 *
 * Full implementation will:
 * - Query hotel_occupancy table for the user's organization
 * - Support query params: from, to (date range), organizationId (VP/Director only)
 * - VP/Director: access across all organizations
 * - Admin: their organization only
 * - Room Manager: their organization (read-only)
 * - Distributors/Suppliers: no access
 * - Support pagination and sorting by date
 * - Used by dashboards for per-guest/per-cover revenue and cost calculations
 */
export async function GET(request: Request): Promise<NextResponse<ApiResponse<PaginatedResponse<HotelOccupancy>>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "occupancy", "read")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // TODO: Replace with real database query.
  const placeholderOccupancy: HotelOccupancy[] = [
    {
      id: "occ_001",
      organizationId: "org_placeholder_001",
      date: new Date("2026-02-28T00:00:00Z"),
      hotelGuests: 2450,
      restaurantCovers: 1820,
      notes: "Weekend peak — convention in town",
      createdAt: new Date("2026-03-01T06:00:00Z"),
      updatedAt: new Date("2026-03-01T06:00:00Z"),
    },
    {
      id: "occ_002",
      organizationId: "org_placeholder_001",
      date: new Date("2026-02-27T00:00:00Z"),
      hotelGuests: 2100,
      restaurantCovers: 1560,
      createdAt: new Date("2026-02-28T06:00:00Z"),
      updatedAt: new Date("2026-02-28T06:00:00Z"),
    },
    {
      id: "occ_003",
      organizationId: "org_placeholder_001",
      date: new Date("2026-02-26T00:00:00Z"),
      hotelGuests: 1980,
      restaurantCovers: 1420,
      createdAt: new Date("2026-02-27T06:00:00Z"),
      updatedAt: new Date("2026-02-27T06:00:00Z"),
    },
  ];

  let filtered = filterByScope(user, placeholderOccupancy as unknown as Record<string, unknown>[]) as unknown as HotelOccupancy[];

  // Apply date range filter on placeholder data
  if (from) {
    const fromDate = new Date(from);
    filtered = filtered.filter((o) => new Date(o.date) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    filtered = filtered.filter((o) => new Date(o.date) <= toDate);
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        data: filtered,
        total: filtered.length,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      },
    },
    { status: 200 },
  );
}

/**
 * POST /api/admin/occupancy
 *
 * Add a new hotel occupancy entry. Restricted to Admin+ roles.
 *
 * Full implementation will:
 * - Validate required fields (date, hotelGuests, restaurantCovers)
 * - Check for duplicate date entries for the same organization
 * - If a record already exists for that date, update it instead (upsert)
 * - Admin can only add for their own organization
 * - VP/Director can add for any organization
 * - Return the created/updated occupancy record
 */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<HotelOccupancy>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "occupancy", "create")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions — Admin or above required" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      date: string;
      hotelGuests: number;
      restaurantCovers: number;
      notes?: string;
      organizationId?: string;
    };

    if (!body.date || body.hotelGuests == null || body.restaurantCovers == null) {
      return NextResponse.json(
        { success: false, error: "date, hotelGuests, and restaurantCovers are required" },
        { status: 400 },
      );
    }

    if (body.hotelGuests < 0 || body.restaurantCovers < 0) {
      return NextResponse.json(
        { success: false, error: "hotelGuests and restaurantCovers must be non-negative" },
        { status: 400 },
      );
    }

    // VP/Director can specify any organization; Admin uses their own.
    const organizationId =
      [UserRoleType.VP, UserRoleType.DIRECTOR].includes(user.role) && body.organizationId
        ? body.organizationId
        : user.organizationId ?? "org_placeholder_001";

    // TODO: Replace with real database upsert.
    const newOccupancy: HotelOccupancy = {
      id: `occ_${Date.now()}`,
      organizationId,
      date: new Date(body.date),
      hotelGuests: body.hotelGuests,
      restaurantCovers: body.restaurantCovers,
      notes: body.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(
      { success: true, data: newOccupancy },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }
}
