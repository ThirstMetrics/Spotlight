// =============================================================================
// /api/outlets — Outlet management endpoints
// =============================================================================

import { NextResponse } from "next/server";
import { UserRoleType } from "@spotlight/shared";
import type { ApiResponse, PaginatedResponse, Outlet } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission, filterByScope } from "@/lib/rbac";

/**
 * GET /api/outlets
 *
 * List outlets accessible to the current user based on their role scope.
 *
 * Full implementation will:
 * - Query outlets table filtered by user's organization and outlet scope
 * - VP/Director sees all outlets across all organizations
 * - Admin sees all outlets in their organization
 * - Room Manager sees only their assigned outlets
 * - Distributor/Supplier sees outlets where their products are stocked
 * - Support filtering by type, isActive, search term
 * - Support pagination and sorting
 */
export async function GET(request: Request): Promise<NextResponse<ApiResponse<PaginatedResponse<Outlet>>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "outlets", "read")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  // TODO: Replace with real database query.
  const placeholderOutlets: Outlet[] = [
    {
      id: "out_001",
      organizationId: "org_placeholder_001",
      name: "Steakhouse",
      type: "fine_dining",
      description: "Premium steakhouse restaurant",
      isActive: true,
      createdAt: new Date("2025-06-01T00:00:00Z"),
      updatedAt: new Date("2025-06-01T00:00:00Z"),
    },
    {
      id: "out_002",
      organizationId: "org_placeholder_001",
      name: "Pool Bar",
      type: "bar",
      description: "Poolside cocktail bar",
      isActive: true,
      createdAt: new Date("2025-06-01T00:00:00Z"),
      updatedAt: new Date("2025-06-01T00:00:00Z"),
    },
    {
      id: "out_003",
      organizationId: "org_placeholder_001",
      name: "Lobby Lounge",
      type: "lounge",
      description: "Main lobby lounge and bar",
      isActive: true,
      createdAt: new Date("2025-06-01T00:00:00Z"),
      updatedAt: new Date("2025-06-01T00:00:00Z"),
    },
  ];

  const filtered = filterByScope(user, placeholderOutlets as unknown as Record<string, unknown>[]) as unknown as Outlet[];

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
 * POST /api/outlets
 *
 * Create a new outlet. Restricted to Admin+ roles.
 *
 * Full implementation will:
 * - Validate the request body (name, type, organizationId required)
 * - Check that the user has create permission on outlets
 * - Admin can only create within their own organization
 * - VP/Director can create in any organization
 * - Create the outlet record in the database
 * - Return the created outlet
 */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<Outlet>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "outlets", "create")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions — Admin or above required" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as Partial<Outlet>;

    if (!body.name || !body.type) {
      return NextResponse.json(
        { success: false, error: "Name and type are required" },
        { status: 400 },
      );
    }

    // TODO: Replace with real database insert.
    const newOutlet: Outlet = {
      id: `out_${Date.now()}`,
      organizationId: user.organizationId ?? "org_placeholder_001",
      name: body.name,
      type: body.type,
      description: body.description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(
      { success: true, data: newOutlet },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }
}
