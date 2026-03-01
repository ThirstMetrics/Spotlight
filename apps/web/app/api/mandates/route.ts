// =============================================================================
// /api/mandates — RFP / National program mandate endpoints
// =============================================================================

import { NextResponse } from "next/server";
import { UserRoleType } from "@spotlight/shared";
import type { ApiResponse, PaginatedResponse, Mandate } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission, filterByScope } from "@/lib/rbac";

/**
 * GET /api/mandates
 *
 * List mandates (RFP/national program required items) accessible to the current user.
 *
 * Full implementation will:
 * - Query mandates table with compliance status joined from mandate_compliance
 * - VP/Director: all mandates across all organizations
 * - Admin: mandates in their organization
 * - Room Manager: mandates that apply to their outlet(s)
 * - Support filtering by: isActive, effectiveDate range, search term
 * - Include compliance summary per mandate (total items, compliant count, non-compliant count)
 * - Support pagination and sorting
 */
export async function GET(request: Request): Promise<NextResponse<ApiResponse<PaginatedResponse<Mandate>>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "mandates", "read")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  // TODO: Replace with real database query.
  const placeholderMandates: Mandate[] = [
    {
      id: "mnd_001",
      organizationId: "org_placeholder_001",
      name: "Q1 2026 Wine Program",
      description: "National wine program required selections for Q1 2026",
      effectiveDate: new Date("2026-01-01T00:00:00Z"),
      expirationDate: new Date("2026-03-31T23:59:59Z"),
      isActive: true,
      createdAt: new Date("2025-12-01T00:00:00Z"),
      updatedAt: new Date("2025-12-01T00:00:00Z"),
    },
    {
      id: "mnd_002",
      organizationId: "org_placeholder_001",
      name: "Spirits Portfolio 2026",
      description: "Annual spirits portfolio mandate for all outlets",
      effectiveDate: new Date("2026-01-01T00:00:00Z"),
      expirationDate: new Date("2026-12-31T23:59:59Z"),
      isActive: true,
      createdAt: new Date("2025-11-15T00:00:00Z"),
      updatedAt: new Date("2025-11-15T00:00:00Z"),
    },
  ];

  const filtered = filterByScope(user, placeholderMandates as unknown as Record<string, unknown>[]) as unknown as Mandate[];

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
 * POST /api/mandates
 *
 * Create a new mandate. Restricted to VP/Director roles.
 *
 * Full implementation will:
 * - Validate required fields (name, organizationId, effectiveDate)
 * - Accept an array of mandate items (product IDs + target outlet IDs)
 * - Create mandate record and mandate_items records in a transaction
 * - Initialize mandate_compliance records as PENDING for each outlet/item pair
 * - Trigger compliance check alert rules
 * - Return the created mandate with its items
 */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<Mandate>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "mandates", "create")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions — VP/Director or Admin required" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as Partial<Mandate> & {
      items?: { productId: string; outletIds: string[] }[];
    };

    if (!body.name || !body.effectiveDate) {
      return NextResponse.json(
        { success: false, error: "Name and effectiveDate are required" },
        { status: 400 },
      );
    }

    // TODO: Replace with real database insert in a transaction.
    const newMandate: Mandate = {
      id: `mnd_${Date.now()}`,
      organizationId: user.organizationId ?? "org_placeholder_001",
      name: body.name,
      description: body.description,
      effectiveDate: new Date(body.effectiveDate),
      expirationDate: body.expirationDate ? new Date(body.expirationDate) : undefined,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(
      { success: true, data: newMandate },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }
}
