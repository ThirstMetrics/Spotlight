// =============================================================================
// /api/admin/users — User management endpoints
// =============================================================================

import { NextResponse } from "next/server";
import { hashSync } from "bcryptjs";
import type { ApiResponse } from "@spotlight/shared";
import { prisma } from "@spotlight/db";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";

// -----------------------------------------------------------------------------
// GET /api/admin/users — List all users with role assignments
// -----------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "users", "read")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const users = await prisma.user.findMany({
    include: {
      userRoles: {
        include: {
          role: { select: { name: true } },
          organization: { select: { name: true } },
          outlet: { select: { name: true } },
          distributor: { select: { name: true } },
          supplier: { select: { name: true } },
        },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  const formatted = users.map((u) => {
    const assignment = u.userRoles[0];
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      role: assignment?.role?.name ?? "ADMIN",
      scope:
        assignment?.outlet?.name ??
        assignment?.distributor?.name ??
        assignment?.supplier?.name ??
        assignment?.organization?.name ??
        "\u2014",
      createdAt: u.createdAt,
    };
  });

  return NextResponse.json(
    { success: true, data: formatted },
    { status: 200 },
  );
}

// -----------------------------------------------------------------------------
// POST /api/admin/users — Create a new user
// -----------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "users", "create")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      name: string;
      email: string;
      role: string;
      organizationId?: string;
      outletId?: string;
      distributorId?: string;
      supplierId?: string;
    };

    if (!body.name || !body.email || !body.role) {
      return NextResponse.json(
        { success: false, error: "name, email, and role are required" },
        { status: 400 },
      );
    }

    // Check for existing user with same email
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    // Find the role record
    const role = await prisma.role.findUnique({
      where: { name: body.role as "VP" | "DIRECTOR" | "ADMIN" | "ROOM_MANAGER" | "DISTRIBUTOR" | "SUPPLIER" },
    });
    if (!role) {
      return NextResponse.json(
        { success: false, error: `Invalid role: ${body.role}` },
        { status: 400 },
      );
    }

    // Default password
    const passwordHash = hashSync("spotlight123", 10);

    // Create user + role assignment in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: body.name,
          email: body.email,
          passwordHash,
        },
      });

      await tx.userRoleAssignment.create({
        data: {
          userId: created.id,
          roleId: role.id,
          organizationId: body.organizationId ?? user.organizationId,
          outletId: body.outletId,
          distributorId: body.distributorId,
          supplierId: body.supplierId,
        },
      });

      return created;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: body.role,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Error creating user:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 },
    );
  }
}

// -----------------------------------------------------------------------------
// PATCH /api/admin/users — Update an existing user
// -----------------------------------------------------------------------------

export async function PATCH(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "users", "update")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      id: string;
      name?: string;
      email?: string;
      isActive?: boolean;
    };

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "id is required" },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updated = await prisma.user.update({
      where: { id: body.id },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          isActive: updated.isActive,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Error updating user:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 },
    );
  }
}
