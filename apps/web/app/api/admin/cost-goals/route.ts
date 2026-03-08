// =============================================================================
// /api/admin/cost-goals — Cost goal management endpoints
// =============================================================================

import { NextResponse } from "next/server";
import type { ApiResponse } from "@spotlight/shared";
import { prisma } from "@spotlight/db";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";

// -----------------------------------------------------------------------------
// GET /api/admin/cost-goals — List all cost goals with outlet names
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

  const goals = await prisma.costGoal.findMany({
    include: {
      outlet: { select: { name: true } },
      creator: { select: { name: true } },
    },
    orderBy: [{ outlet: { name: "asc" } }, { category: "asc" }],
  });

  const formatted = goals.map((g) => ({
    id: g.id,
    outletId: g.outletId,
    outletName: g.outlet.name,
    category: g.category,
    targetCostPercentage: g.targetCostPercentage,
    effectiveDate: g.effectiveDate,
    createdBy: g.creator.name,
    createdAt: g.createdAt,
  }));

  return NextResponse.json(
    { success: true, data: formatted },
    { status: 200 },
  );
}

// -----------------------------------------------------------------------------
// POST /api/admin/cost-goals — Create a new cost goal
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
    const body = (await request.json()) as {
      outletId: string;
      category?: string | null;
      targetCostPercentage: number;
      effectiveDate: string;
    };

    if (!body.outletId || body.targetCostPercentage == null || !body.effectiveDate) {
      return NextResponse.json(
        { success: false, error: "outletId, targetCostPercentage, and effectiveDate are required" },
        { status: 400 },
      );
    }

    if (body.targetCostPercentage < 0 || body.targetCostPercentage > 100) {
      return NextResponse.json(
        { success: false, error: "targetCostPercentage must be between 0 and 100" },
        { status: 400 },
      );
    }

    const goal = await prisma.costGoal.create({
      data: {
        outletId: body.outletId,
        category: body.category && body.category !== "" ? (body.category as "BEER" | "WINE" | "SPIRITS" | "SAKE" | "NON_ALCOHOLIC") : null,
        targetCostPercentage: body.targetCostPercentage,
        effectiveDate: new Date(body.effectiveDate),
        createdBy: user.id,
      },
      include: {
        outlet: { select: { name: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: goal.id,
          outletName: goal.outlet.name,
          category: goal.category,
          targetCostPercentage: goal.targetCostPercentage,
          effectiveDate: goal.effectiveDate,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Error creating cost goal:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create cost goal" },
      { status: 500 },
    );
  }
}

// -----------------------------------------------------------------------------
// PATCH /api/admin/cost-goals — Update an existing cost goal
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
    const body = (await request.json()) as {
      id: string;
      targetCostPercentage?: number;
      effectiveDate?: string;
    };

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "id is required" },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.targetCostPercentage !== undefined) {
      if (body.targetCostPercentage < 0 || body.targetCostPercentage > 100) {
        return NextResponse.json(
          { success: false, error: "targetCostPercentage must be between 0 and 100" },
          { status: 400 },
        );
      }
      updateData.targetCostPercentage = body.targetCostPercentage;
    }

    if (body.effectiveDate !== undefined) {
      updateData.effectiveDate = new Date(body.effectiveDate);
    }

    const updated = await prisma.costGoal.update({
      where: { id: body.id },
      data: updateData,
      include: {
        outlet: { select: { name: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updated.id,
          outletName: updated.outlet.name,
          category: updated.category,
          targetCostPercentage: updated.targetCostPercentage,
          effectiveDate: updated.effectiveDate,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Error updating cost goal:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update cost goal" },
      { status: 500 },
    );
  }
}

// -----------------------------------------------------------------------------
// DELETE /api/admin/cost-goals — Delete a cost goal
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

    await prisma.costGoal.delete({ where: { id } });

    return NextResponse.json(
      { success: true, data: { id } },
      { status: 200 },
    );
  } catch (err) {
    console.error("Error deleting cost goal:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete cost goal" },
      { status: 500 },
    );
  }
}
