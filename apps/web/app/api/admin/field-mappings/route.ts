// =============================================================================
// /api/admin/field-mappings — Field mapping profile endpoints
// =============================================================================

import { NextResponse } from "next/server";
import type { ApiResponse } from "@spotlight/shared";
import { prisma } from "@spotlight/db";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";

// -----------------------------------------------------------------------------
// GET /api/admin/field-mappings — List all field mapping profiles
// -----------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "uploads", "read")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const profiles = await prisma.fieldMappingProfile.findMany({
    include: {
      creator: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = profiles.map((p) => ({
    id: p.id,
    name: p.name,
    source: p.source,
    uploadType: p.uploadType,
    columnCount: Array.isArray(p.mapping)
      ? (p.mapping as unknown[]).length
      : Object.keys(p.mapping as object).length,
    createdBy: p.creator.name,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return NextResponse.json(
    { success: true, data: formatted },
    { status: 200 },
  );
}

// -----------------------------------------------------------------------------
// POST /api/admin/field-mappings — Create a new field mapping profile
// -----------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "uploads", "create")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      name: string;
      source: string;
      uploadType: string;
      mappings: Record<string, string>;
    };

    const { name, source, uploadType, mappings } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Profile name is required" },
        { status: 400 },
      );
    }
    if (!source) {
      return NextResponse.json(
        { success: false, error: "Source system is required" },
        { status: 400 },
      );
    }
    if (!uploadType) {
      return NextResponse.json(
        { success: false, error: "Upload type is required" },
        { status: 400 },
      );
    }
    if (!mappings || Object.keys(mappings).length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one column mapping is required" },
        { status: 400 },
      );
    }

    const organizationId = user.organizationId ?? "";
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "User is not associated with an organization" },
        { status: 400 },
      );
    }

    const profile = await prisma.fieldMappingProfile.create({
      data: {
        organizationId,
        name: name.trim(),
        source: source as never,
        uploadType: uploadType as never,
        mapping: mappings,
        createdBy: user.id,
      },
      include: {
        creator: { select: { name: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: profile.id,
          name: profile.name,
          source: profile.source,
          uploadType: profile.uploadType,
          columnCount: Object.keys(mappings).length,
          createdBy: profile.creator.name,
          createdAt: profile.createdAt.toISOString(),
          updatedAt: profile.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create mapping profile";
    // Unique constraint violation — duplicate name for same source+type
    if (message.includes("Unique constraint")) {
      return NextResponse.json(
        { success: false, error: "A profile with this name already exists for this source and upload type" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

// -----------------------------------------------------------------------------
// PATCH /api/admin/field-mappings — Update an existing field mapping profile
// -----------------------------------------------------------------------------

export async function PATCH(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "uploads", "update")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      id: string;
      name?: string;
      mappings?: Record<string, string>;
    };

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Profile ID is required" },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }
    if (body.mappings !== undefined) {
      updateData.mapping = body.mappings;
    }

    const profile = await prisma.fieldMappingProfile.update({
      where: { id: body.id },
      data: updateData,
      include: {
        creator: { select: { name: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: profile.id,
          name: profile.name,
          source: profile.source,
          uploadType: profile.uploadType,
          columnCount: Object.keys(profile.mapping as object).length,
          createdBy: profile.creator.name,
          createdAt: profile.createdAt.toISOString(),
          updatedAt: profile.updatedAt.toISOString(),
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update mapping profile" },
      { status: 400 },
    );
  }
}

// -----------------------------------------------------------------------------
// DELETE /api/admin/field-mappings — Delete a field mapping profile by id
// -----------------------------------------------------------------------------

export async function DELETE(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "uploads", "delete")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, error: "id query parameter is required" },
      { status: 400 },
    );
  }

  try {
    await prisma.fieldMappingProfile.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, data: { id } },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Field mapping profile not found" },
      { status: 404 },
    );
  }
}
