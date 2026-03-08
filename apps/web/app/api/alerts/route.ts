// =============================================================================
// /api/alerts — Alert listing and acknowledgement endpoints
// =============================================================================

import { NextResponse } from "next/server";
import type { ApiResponse } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";
import { prisma } from "@spotlight/db";

/**
 * GET /api/alerts
 *
 * List alerts with filters for the current user's scope.
 */
export async function GET(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (!checkPermission(user, "alerts", "read")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // active, read, dismissed
  const severity = searchParams.get("severity");
  const alertType = searchParams.get("type");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

  const where: Record<string, unknown> = {};

  // Scope by organization
  if (user.organizationId) {
    where.organizationId = user.organizationId;
  }

  // Scope by outlets for room managers
  if (user.outletIds && user.outletIds.length > 0) {
    where.outletId = { in: user.outletIds };
  }

  // Status filter
  if (status === "active") {
    where.isRead = false;
    where.isDismissed = false;
  } else if (status === "read") {
    where.isRead = true;
    where.isDismissed = false;
  } else if (status === "dismissed") {
    where.isDismissed = true;
  }

  // Severity filter
  if (severity) {
    where.severity = severity.toUpperCase();
  }

  // Alert type filter
  if (alertType) {
    where.alertType = alertType.toUpperCase();
  }

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where: where as never,
      include: {
        outlet: { select: { name: true, slug: true } },
        product: { select: { name: true, sku: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.alert.count({ where: where as never }),
  ]);

  return NextResponse.json(
    {
      success: true,
      data: {
        data: alerts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    },
    { status: 200 }
  );
}

/**
 * PATCH /api/alerts
 *
 * Dismiss or acknowledge an alert.
 * Accepts { alertId, action: "acknowledge" | "dismiss" | "resolve" }.
 */
export async function PATCH(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (!checkPermission(user, "alerts", "update")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as {
      alertId: string;
      action: "acknowledge" | "dismiss" | "resolve";
    };

    if (!body.alertId || !body.action) {
      return NextResponse.json(
        { success: false, error: "alertId and action are required" },
        { status: 400 }
      );
    }

    // Verify alert exists
    const existing = await prisma.alert.findUnique({
      where: { id: body.alertId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Alert not found" },
        { status: 404 }
      );
    }

    // Map action to Prisma update
    const updateData: Record<string, unknown> = {};
    if (body.action === "acknowledge") {
      updateData.isRead = true;
    } else if (body.action === "dismiss") {
      updateData.isDismissed = true;
      updateData.resolvedAt = new Date();
    } else if (body.action === "resolve") {
      updateData.isDismissed = true;
      updateData.resolvedAt = new Date();
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be acknowledge, dismiss, or resolve." },
        { status: 400 }
      );
    }

    const updated = await prisma.alert.update({
      where: { id: body.alertId },
      data: updateData as never,
      include: {
        outlet: { select: { name: true, slug: true } },
        product: { select: { name: true, sku: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: updated },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
