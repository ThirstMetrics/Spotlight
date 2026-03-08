// =============================================================================
// /api/admin/occupancy — Hotel occupancy data endpoints
// =============================================================================

import { NextResponse } from "next/server";
import { UserRoleType } from "@spotlight/shared";
import type { ApiResponse, PaginatedResponse, HotelOccupancy } from "@spotlight/shared";
import { prisma } from "@spotlight/db";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Map a Prisma HotelOccupancy row to the shared HotelOccupancy type.
 *
 * The Prisma model lacks `updatedAt`, so we fall back to `createdAt`.
 * `restaurantCovers` is nullable in the DB but required in the shared type,
 * so we default to 0.
 */
function toHotelOccupancy(row: {
  id: string;
  organizationId: string;
  date: Date;
  hotelGuests: number;
  restaurantCovers: number | null;
  notes: string | null;
  createdAt: Date;
}): HotelOccupancy {
  return {
    id: row.id,
    organizationId: row.organizationId,
    date: row.date,
    hotelGuests: row.hotelGuests,
    restaurantCovers: row.restaurantCovers ?? 0,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.createdAt,
  };
}

// -----------------------------------------------------------------------------
// GET /api/admin/occupancy
// -----------------------------------------------------------------------------

/**
 * GET /api/admin/occupancy
 *
 * Retrieve hotel occupancy data (guest counts, restaurant covers) with date
 * range filtering and pagination.
 *
 * Query parameters:
 *   - from           — Start of date range (ISO string, inclusive)
 *   - to             — End of date range (ISO string, inclusive)
 *   - organizationId — Filter by organization (VP/Director only)
 *   - page           — Page number (default: 1)
 *   - pageSize       — Results per page (default: 20, max: 100)
 *
 * RBAC scoping:
 *   - VP/Director:   All organizations (optionally filtered by organizationId)
 *   - Admin:         Own organization only
 *   - Room Manager:  Own organization only (read-only)
 *   - Distributor/Supplier: No access (blocked by checkPermission)
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

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const orgIdParam = searchParams.get("organizationId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20));

    // Build the Prisma where clause with RBAC scoping
    const where: Record<string, unknown> = {};

    if ([UserRoleType.VP, UserRoleType.DIRECTOR].includes(user.role)) {
      // VP/Director: see all organizations; optionally filter by query param
      if (orgIdParam) {
        where.organizationId = orgIdParam;
      }
    } else {
      // Admin / Room Manager: restricted to their own organization
      if (!user.organizationId) {
        return NextResponse.json(
          { success: false, error: "User has no associated organization" },
          { status: 403 },
        );
      }
      where.organizationId = user.organizationId;
    }

    // Date range filter
    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
      where.date = dateFilter;
    }

    // Execute count + query in parallel
    const [total, rows] = await Promise.all([
      prisma.hotelOccupancy.count({ where }),
      prisma.hotelOccupancy.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const data = rows.map(toHotelOccupancy);

    return NextResponse.json(
      {
        success: true,
        data: {
          data,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Error fetching occupancy data:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch occupancy data" },
      { status: 500 },
    );
  }
}

// -----------------------------------------------------------------------------
// POST /api/admin/occupancy
// -----------------------------------------------------------------------------

/**
 * POST /api/admin/occupancy
 *
 * Create or update a hotel occupancy entry (upsert by organizationId + date).
 * Restricted to Admin+ roles.
 *
 * Request body:
 *   - date              — The occupancy date (ISO string, required)
 *   - hotelGuests       — Number of hotel guests (non-negative integer, required)
 *   - restaurantCovers  — Number of restaurant covers (non-negative integer, required)
 *   - notes             — Optional free-text note
 *   - organizationId    — Target organization (VP/Director only; Admin uses own)
 *
 * If a record already exists for the same organization + date, it is updated.
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

    // VP/Director can specify any organization; Admin uses their own
    let organizationId: string;
    if ([UserRoleType.VP, UserRoleType.DIRECTOR].includes(user.role) && body.organizationId) {
      organizationId = body.organizationId;
    } else if (user.organizationId) {
      organizationId = user.organizationId;
    } else {
      return NextResponse.json(
        { success: false, error: "User has no associated organization" },
        { status: 403 },
      );
    }

    const occupancyDate = new Date(body.date);

    const row = await prisma.hotelOccupancy.upsert({
      where: {
        organizationId_date: {
          organizationId,
          date: occupancyDate,
        },
      },
      create: {
        organizationId,
        date: occupancyDate,
        hotelGuests: body.hotelGuests,
        restaurantCovers: body.restaurantCovers,
        notes: body.notes ?? null,
      },
      update: {
        hotelGuests: body.hotelGuests,
        restaurantCovers: body.restaurantCovers,
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json(
      { success: true, data: toHotelOccupancy(row) },
      { status: 201 },
    );
  } catch (err) {
    console.error("Error upserting occupancy record:", err);
    return NextResponse.json(
      { success: false, error: "Failed to save occupancy record" },
      { status: 500 },
    );
  }
}
