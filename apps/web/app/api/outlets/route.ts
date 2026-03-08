// =============================================================================
// /api/outlets — Outlet management endpoints
// =============================================================================

import { NextResponse } from "next/server";
import { UserRoleType } from "@spotlight/shared";
import type { ApiResponse, PaginatedResponse, Outlet } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";
import { prisma } from "@spotlight/db";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Generate a URL-safe slug from a name string.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Build a Prisma `where` clause that scopes outlet visibility
 * based on the authenticated user's role.
 */
function buildScopeFilter(user: {
  role: UserRoleType;
  organizationId?: string;
  outletIds?: string[];
  distributorId?: string;
  supplierId?: string;
}): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  switch (user.role) {
    case UserRoleType.VP:
    case UserRoleType.DIRECTOR:
      // Full visibility — no org filter
      break;

    case UserRoleType.ADMIN:
      if (user.organizationId) {
        where.organizationId = user.organizationId;
      }
      break;

    case UserRoleType.ROOM_MANAGER:
      if (user.outletIds && user.outletIds.length > 0) {
        where.id = { in: user.outletIds };
      }
      break;

    case UserRoleType.DISTRIBUTOR:
      if (user.distributorId) {
        where.orderHistory = {
          some: { distributorId: user.distributorId },
        };
      }
      break;

    case UserRoleType.SUPPLIER:
      if (user.supplierId) {
        where.orderHistory = {
          some: {
            product: {
              distributorProducts: {
                some: { supplierId: user.supplierId },
              },
            },
          },
        };
      }
      break;
  }

  return where;
}

/**
 * Map a Prisma outlet row to the shared Outlet type.
 */
function toOutlet(row: {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  outletGroup?: { name: string } | null;
}): Outlet & { outletGroupName?: string } {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    type: row.type,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...(row.outletGroup ? { outletGroupName: row.outletGroup.name } : {}),
  };
}

// -----------------------------------------------------------------------------
// GET /api/outlets
// -----------------------------------------------------------------------------

/**
 * GET /api/outlets
 *
 * List outlets accessible to the current user based on their role scope.
 *
 * Query parameters:
 *   - type       (string)  Filter by outlet type
 *   - search     (string)  Case-insensitive name search
 *   - isActive   (boolean) Filter by active status
 *   - page       (number)  Page number (default: 1)
 *   - pageSize   (number)  Items per page (default: 20, max: 100)
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

  const { searchParams } = new URL(request.url);

  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const isActiveParam = searchParams.get("isActive");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

  // Start with role-based scope filter
  const where = buildScopeFilter(user);

  // Optional filters
  if (type) {
    where.type = type;
  }

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  if (isActiveParam !== null) {
    where.isActive = isActiveParam === "true";
  }

  const [outlets, total] = await Promise.all([
    prisma.outlet.findMany({
      where: where as never,
      include: {
        outletGroup: { select: { name: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.outlet.count({ where: where as never }),
  ]);

  return NextResponse.json(
    {
      success: true,
      data: {
        data: outlets.map(toOutlet),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    },
    { status: 200 },
  );
}

// -----------------------------------------------------------------------------
// POST /api/outlets
// -----------------------------------------------------------------------------

/**
 * POST /api/outlets
 *
 * Create a new outlet. Restricted to Admin+ roles.
 *
 * Request body:
 *   - name  (string, required)
 *   - type  (string, required)
 *   - description (string, optional — stored as-is for API consumers)
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

    const organizationId = user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "User must belong to an organization to create an outlet" },
        { status: 400 },
      );
    }

    const slug = slugify(body.name);

    const created = await prisma.outlet.create({
      data: {
        name: body.name,
        slug,
        type: body.type,
        organizationId,
        isActive: true,
      },
      include: {
        outletGroup: { select: { name: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: toOutlet(created) },
      { status: 201 },
    );
  } catch (error) {
    // Handle unique constraint violation on (organizationId, slug)
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        { success: false, error: "An outlet with that name already exists in this organization" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }
}
