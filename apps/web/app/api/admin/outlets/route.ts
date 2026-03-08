// =============================================================================
// /api/admin/outlets — Outlet management endpoints
// =============================================================================

import { NextResponse } from "next/server";
import type { ApiResponse } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";
import { prisma } from "@spotlight/db";

/**
 * GET /api/admin/outlets
 *
 * List all outlets for the current user's organization.
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

  const where: Record<string, unknown> = {};

  if (user.organizationId) {
    where.organizationId = user.organizationId;
  }

  const outlets = await prisma.outlet.findMany({
    where: where as never,
    include: {
      outletGroup: { select: { id: true, name: true } },
      _count: { select: { orderHistory: true } },
    },
    orderBy: { name: "asc" },
  });

  const data = outlets.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    type: o.type,
    managerName: o.managerName,
    phone: o.phone,
    isActive: o.isActive,
    groupId: o.outletGroup?.id ?? null,
    groupName: o.outletGroup?.name ?? null,
    orderCount: o._count.orderHistory,
    createdAt: o.createdAt,
  }));

  return NextResponse.json(
    { success: true, data },
    { status: 200 }
  );
}

/**
 * POST /api/admin/outlets
 *
 * Create a new outlet.
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
    const body = (await request.json()) as {
      name: string;
      type: string;
      outletGroupId?: string;
      managerName?: string;
      phone?: string;
    };

    if (!body.name || !body.type) {
      return NextResponse.json(
        { success: false, error: "Name and type are required" },
        { status: 400 }
      );
    }

    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const organizationId = user.organizationId ?? "";

    // Check for duplicate slug within the organization
    const existing = await prisma.outlet.findFirst({
      where: { organizationId, slug },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An outlet with a similar name already exists" },
        { status: 409 }
      );
    }

    const outlet = await prisma.outlet.create({
      data: {
        name: body.name.trim(),
        slug,
        type: body.type,
        organizationId,
        outletGroupId: body.outletGroupId || null,
        managerName: body.managerName?.trim() || null,
        phone: body.phone?.trim() || null,
      },
      include: {
        outletGroup: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: outlet },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}

/**
 * PATCH /api/admin/outlets
 *
 * Update an existing outlet (name, type, group, manager, phone, active status).
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
      name?: string;
      type?: string;
      outletGroupId?: string | null;
      managerName?: string | null;
      phone?: string | null;
      isActive?: boolean;
    };

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Outlet ID is required" },
        { status: 400 }
      );
    }

    // Build the update payload with only provided fields
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updateData.name = body.name.trim();
      updateData.slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    if (body.type !== undefined) {
      updateData.type = body.type;
    }

    if (body.outletGroupId !== undefined) {
      updateData.outletGroupId = body.outletGroupId || null;
    }

    if (body.managerName !== undefined) {
      updateData.managerName = body.managerName?.trim() || null;
    }

    if (body.phone !== undefined) {
      updateData.phone = body.phone?.trim() || null;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    const outlet = await prisma.outlet.update({
      where: { id: body.id },
      data: updateData,
      include: {
        outletGroup: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: outlet },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update outlet" },
      { status: 400 }
    );
  }
}
