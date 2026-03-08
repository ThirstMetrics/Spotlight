// =============================================================================
// /api/mandates — RFP / National program mandate endpoints
// =============================================================================

import { NextResponse } from "next/server";
import { UserRoleType } from "@spotlight/shared";
import type { ApiResponse, PaginatedResponse, Mandate } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";
import { prisma } from "@spotlight/db";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Map a Prisma mandate row to the shared Mandate interface.
 *
 * The Prisma schema uses `startDate` / `endDate` while the shared type
 * uses `effectiveDate` / `expirationDate`. This function bridges the two.
 */
function toMandate(row: Record<string, unknown>): Mandate {
  return {
    id: row.id as string,
    organizationId: row.organizationId as string,
    name: row.name as string,
    description: row.description as string | undefined,
    effectiveDate: row.startDate as Date,
    expirationDate: row.endDate as Date | undefined,
    isActive: row.isActive as boolean,
    createdAt: row.createdAt as Date,
    updatedAt: row.updatedAt as Date,
  };
}

// -----------------------------------------------------------------------------
// GET
// -----------------------------------------------------------------------------

/**
 * GET /api/mandates
 *
 * List mandates (RFP/national program required items) accessible to the
 * current user.
 *
 * Query params:
 *   isActive  — "true" | "false" filter
 *   search    — case-insensitive substring match on mandate name
 *   page      — page number (default 1)
 *   pageSize  — results per page (default 20, max 100)
 *
 * RBAC scoping:
 *   VP / DIRECTOR  — all mandates across all organizations
 *   ADMIN          — mandates in their organization
 *   ROOM_MANAGER   — mandates in their organization (mandates apply org-wide)
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

  const { searchParams } = new URL(request.url);
  const isActiveParam = searchParams.get("isActive");
  const search = searchParams.get("search");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

  // Build Prisma where clause
  const where: Record<string, unknown> = {};

  // isActive filter
  if (isActiveParam === "true") {
    where.isActive = true;
  } else if (isActiveParam === "false") {
    where.isActive = false;
  }

  // Search filter (case-insensitive on name)
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  // RBAC scoping
  switch (user.role) {
    case UserRoleType.VP:
    case UserRoleType.DIRECTOR:
      // Full access — no additional filtering
      break;

    case UserRoleType.ADMIN:
    case UserRoleType.ROOM_MANAGER:
      // Mandates apply at the org level; scope to user's organization
      if (user.organizationId) {
        where.organizationId = user.organizationId;
      }
      break;

    default:
      // Other roles (DISTRIBUTOR, SUPPLIER) have no mandate access via RBAC,
      // but return empty set as a safeguard.
      return NextResponse.json(
        {
          success: true,
          data: { data: [], total: 0, page, pageSize, totalPages: 0 },
        },
        { status: 200 },
      );
  }

  const [rows, total] = await Promise.all([
    prisma.mandate.findMany({
      where: where as never,
      include: {
        _count: {
          select: { mandateItems: true },
        },
        mandateItems: {
          include: {
            _count: {
              select: { mandateCompliance: true },
            },
            mandateCompliance: {
              select: { isCompliant: true },
            },
          },
        },
      },
      orderBy: { startDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.mandate.count({ where: where as never }),
  ]);

  // Map Prisma rows to the shared Mandate type and attach compliance summary
  const mandates: Mandate[] = rows.map((row) => {
    const mandate = toMandate(row as unknown as Record<string, unknown>);

    // Compute compliance summary across all mandate items
    const totalItems = row._count.mandateItems;
    let compliantCount = 0;
    let nonCompliantCount = 0;

    for (const item of row.mandateItems) {
      for (const comp of item.mandateCompliance) {
        if (comp.isCompliant) {
          compliantCount++;
        } else {
          nonCompliantCount++;
        }
      }
    }

    return {
      ...mandate,
      _summary: {
        totalItems,
        compliantCount,
        nonCompliantCount,
        totalComplianceRecords: compliantCount + nonCompliantCount,
      },
    } as Mandate;
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        data: mandates,
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
// POST
// -----------------------------------------------------------------------------

/**
 * POST /api/mandates
 *
 * Create a new mandate. Restricted to VP, Director, and Admin roles.
 *
 * Request body:
 *   name           — mandate name (required)
 *   effectiveDate  — start date (required)
 *   description    — optional description
 *   expirationDate — optional end date
 *   items          — optional array of { productId, outletIds[] }
 *
 * When `items` are provided, the handler creates mandateItem and
 * mandateCompliance records inside a transaction so that every
 * outlet/item pair starts with `isCompliant: false`.
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

    const organizationId = user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "User is not associated with an organization" },
        { status: 400 },
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      // Create the mandate record
      const mandate = await tx.mandate.create({
        data: {
          name: body.name!,
          description: body.description ?? null,
          organizationId,
          createdBy: user.id,
          startDate: new Date(body.effectiveDate!),
          endDate: body.expirationDate ? new Date(body.expirationDate) : null,
          isActive: true,
        },
      });

      // Create mandate items and their compliance records if provided
      if (body.items && body.items.length > 0) {
        for (const item of body.items) {
          const mandateItem = await tx.mandateItem.create({
            data: {
              mandateId: mandate.id,
              productId: item.productId,
            },
          });

          // Create a compliance record for each outlet in PENDING / non-compliant state
          if (item.outletIds && item.outletIds.length > 0) {
            await tx.mandateCompliance.createMany({
              data: item.outletIds.map((outletId) => ({
                mandateItemId: mandateItem.id,
                outletId,
                isCompliant: false,
                checkedAt: new Date(),
              })),
            });
          }
        }
      }

      // Re-fetch with relations for the response
      return tx.mandate.findUniqueOrThrow({
        where: { id: mandate.id },
        include: {
          _count: { select: { mandateItems: true } },
        },
      });
    });

    const mandate = toMandate(created as unknown as Record<string, unknown>);

    return NextResponse.json(
      { success: true, data: mandate },
      { status: 201 },
    );
  } catch (error) {
    // Distinguish Prisma constraint violations from malformed JSON
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "A mandate item with that product already exists in this mandate"
        : "Invalid request body";

    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
