// =============================================================================
// /api/admin/internal-accounts — Outlet tracking number management
// =============================================================================

import { NextResponse } from "next/server";
import type { ApiResponse } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";
import { prisma } from "@spotlight/db";
import type { TrackingNumberType } from "@spotlight/db";

/**
 * GET /api/admin/internal-accounts
 *
 * List all outlet tracking numbers.
 */
export async function GET(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (!checkPermission(user, "outlets", "read")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  const records = await prisma.outletTrackingNumber.findMany({
    include: {
      outlet: { select: { name: true, type: true, isActive: true } },
    },
    orderBy: [{ outlet: { name: "asc" } }, { type: "asc" }],
  });

  const data = records.map((r) => ({
    id: r.id,
    outletId: r.outletId,
    outletName: r.outlet.name,
    outletType: r.outlet.type,
    outletActive: r.outlet.isActive,
    type: r.type,
    value: r.value,
    notes: r.notes,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  return NextResponse.json({ success: true, data }, { status: 200 });
}

/**
 * POST /api/admin/internal-accounts
 *
 * Create a single tracking number or bulk upsert many.
 * - Single: { outletId, type, value, notes? }
 * - Bulk:   { items: [{ outletId, type, value, notes? }, ...] }
 */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (!checkPermission(user, "outlets", "create")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // Bulk upsert mode
    if (body.items && Array.isArray(body.items)) {
      const items = body.items as {
        outletId: string;
        type: TrackingNumberType;
        value: string;
        notes?: string;
      }[];

      let created = 0;
      let updated = 0;

      for (const item of items) {
        if (!item.outletId || !item.type || !item.value) continue;

        const result = await prisma.outletTrackingNumber.upsert({
          where: {
            outletId_type: {
              outletId: item.outletId,
              type: item.type,
            },
          },
          create: {
            outletId: item.outletId,
            type: item.type,
            value: item.value.trim(),
            notes: item.notes?.trim() || null,
          },
          update: {
            value: item.value.trim(),
            notes: item.notes?.trim() || null,
          },
        });

        // Check if it was just created (createdAt close to updatedAt)
        const diff = Math.abs(result.updatedAt.getTime() - result.createdAt.getTime());
        if (diff < 1000) {
          created++;
        } else {
          updated++;
        }
      }

      return NextResponse.json(
        { success: true, data: { created, updated, total: items.length } },
        { status: 200 }
      );
    }

    // Single create mode
    const { outletId, type, value, notes } = body as {
      outletId: string;
      type: TrackingNumberType;
      value: string;
      notes?: string;
    };

    if (!outletId || !type || !value) {
      return NextResponse.json(
        { success: false, error: "Outlet, type, and tracking number are required" },
        { status: 400 }
      );
    }

    // Check if a tracking number of this type already exists for the outlet
    const existing = await prisma.outletTrackingNumber.findUnique({
      where: { outletId_type: { outletId, type } },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A tracking number of this type already exists for this outlet" },
        { status: 409 }
      );
    }

    const record = await prisma.outletTrackingNumber.create({
      data: {
        outletId,
        type,
        value: value.trim(),
        notes: notes?.trim() || null,
      },
      include: {
        outlet: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}

/**
 * PATCH /api/admin/internal-accounts
 *
 * Update an existing tracking number.
 */
export async function PATCH(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (!checkPermission(user, "outlets", "update")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as {
      id: string;
      value?: string;
      notes?: string;
    };

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Tracking number ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.value !== undefined) {
      updateData.value = body.value.trim();
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes?.trim() || null;
    }

    const record = await prisma.outletTrackingNumber.update({
      where: { id: body.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: record }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update tracking number" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/admin/internal-accounts?id=xxx
 *
 * Delete a tracking number.
 */
export async function DELETE(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (!checkPermission(user, "outlets", "delete")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Tracking number ID is required" },
      { status: 400 }
    );
  }

  try {
    await prisma.outletTrackingNumber.delete({ where: { id } });

    return NextResponse.json(
      { success: true, data: { deleted: true } },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Tracking number not found" },
      { status: 404 }
    );
  }
}
