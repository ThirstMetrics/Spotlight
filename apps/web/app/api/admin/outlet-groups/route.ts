// =============================================================================
// /api/admin/outlet-groups — Outlet group management endpoints
// =============================================================================

import { NextResponse } from "next/server";
import type { ApiResponse } from "@spotlight/shared";
import { prisma } from "@spotlight/db";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";

// -----------------------------------------------------------------------------
// GET /api/admin/outlet-groups — List all outlet groups with their outlets
// -----------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
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

  const groups = await prisma.outletGroup.findMany({
    include: {
      outlets: { select: { id: true, name: true, isActive: true } },
    },
    orderBy: { name: "asc" },
  });

  const formatted = groups.map((g) => ({
    id: g.id,
    name: g.name,
    outlets: g.outlets,
    outletCount: g.outlets.length,
    createdAt: g.createdAt,
  }));

  return NextResponse.json(
    { success: true, data: formatted },
    { status: 200 },
  );
}

// -----------------------------------------------------------------------------
// POST /api/admin/outlet-groups — Create a new outlet group
// -----------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "outlets", "create")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as { name: string };

    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: "name is required" },
        { status: 400 },
      );
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { success: false, error: "User has no organization assigned" },
        { status: 400 },
      );
    }

    const group = await prisma.outletGroup.create({
      data: {
        name: body.name.trim(),
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(
      { success: true, data: { id: group.id, name: group.name } },
      { status: 201 },
    );
  } catch (err) {
    console.error("Error creating outlet group:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create outlet group" },
      { status: 500 },
    );
  }
}

// -----------------------------------------------------------------------------
// PATCH /api/admin/outlet-groups — Update an existing outlet group
// -----------------------------------------------------------------------------

export async function PATCH(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "outlets", "update")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as { id: string; name: string };

    if (!body.id || !body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: "id and name are required" },
        { status: 400 },
      );
    }

    const updated = await prisma.outletGroup.update({
      where: { id: body.id },
      data: { name: body.name.trim() },
    });

    return NextResponse.json(
      { success: true, data: { id: updated.id, name: updated.name } },
      { status: 200 },
    );
  } catch (err) {
    console.error("Error updating outlet group:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update outlet group" },
      { status: 500 },
    );
  }
}

// -----------------------------------------------------------------------------
// DELETE /api/admin/outlet-groups — Delete an outlet group (only if empty)
// -----------------------------------------------------------------------------

export async function DELETE(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "outlets", "delete")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id query parameter is required" },
        { status: 400 },
      );
    }

    // Check if any outlets are assigned to this group
    const outletCount = await prisma.outlet.count({
      where: { outletGroupId: id },
    });

    if (outletCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete group — ${outletCount} outlet(s) are still assigned to it`,
        },
        { status: 409 },
      );
    }

    await prisma.outletGroup.delete({ where: { id } });

    return NextResponse.json(
      { success: true, data: { id } },
      { status: 200 },
    );
  } catch (err) {
    console.error("Error deleting outlet group:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete outlet group" },
      { status: 500 },
    );
  }
}
