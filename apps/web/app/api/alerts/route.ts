// =============================================================================
// /api/alerts — Alert listing and acknowledgement endpoints
// =============================================================================

import { NextResponse } from "next/server";
import { AlertStatus, UserRoleType } from "@spotlight/shared";
import type { ApiResponse, PaginatedResponse, Alert } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission, filterByScope } from "@/lib/rbac";

/**
 * GET /api/alerts
 *
 * List alerts with filters for the current user's scope.
 *
 * Full implementation will:
 * - Query alerts table filtered by user's organization/outlet scope
 * - Support query params: status (ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED),
 *   alertType, severity (INFO, WARNING, CRITICAL), outletId, productId
 * - Support date range filtering (from, to)
 * - Support pagination (page, pageSize) and sorting (sortBy, sortOrder)
 * - Join alert_rules for additional context
 * - Room Manager sees only alerts for their outlets
 * - Distributor/Supplier see no alerts (permission denied)
 */
export async function GET(request: Request): Promise<NextResponse<ApiResponse<PaginatedResponse<Alert>>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "alerts", "read")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as AlertStatus | null;
  const severity = searchParams.get("severity");
  const alertType = searchParams.get("type");

  // TODO: Replace with real database query.
  const placeholderAlerts: Alert[] = [
    {
      id: "alt_001",
      alertRuleId: "rule_001",
      organizationId: "org_placeholder_001",
      outletId: "out_001",
      productId: "prod_001",
      status: AlertStatus.ACTIVE,
      title: "Mandate item not ordered",
      message: "Cabernet Sauvignon Reserve 2022 has not been ordered by Steakhouse within the 7-day compliance window.",
      data: { mandateId: "mnd_001", daysSinceMandate: 10 },
      createdAt: new Date("2026-01-11T08:00:00Z"),
      updatedAt: new Date("2026-01-11T08:00:00Z"),
    },
    {
      id: "alt_002",
      alertRuleId: "rule_003",
      organizationId: "org_placeholder_001",
      outletId: "out_002",
      productId: "prod_002",
      status: AlertStatus.ACTIVE,
      title: "Pull-through above average",
      message: "Premium Vodka usage at Pool Bar is 145% of the 90-day rolling average.",
      data: { currentRate: 145, baselineRate: 100, threshold: 120 },
      createdAt: new Date("2026-02-20T14:30:00Z"),
      updatedAt: new Date("2026-02-20T14:30:00Z"),
    },
    {
      id: "alt_003",
      alertRuleId: "rule_005",
      organizationId: "org_placeholder_001",
      outletId: "out_003",
      status: AlertStatus.ACKNOWLEDGED,
      title: "Cost percentage exceeding goal",
      message: "Lobby Lounge spirits cost is 28.5% against a 25% target.",
      data: { currentCostPercent: 28.5, targetCostPercent: 25 },
      acknowledgedBy: "usr_placeholder_001",
      acknowledgedAt: new Date("2026-02-22T10:00:00Z"),
      createdAt: new Date("2026-02-21T09:00:00Z"),
      updatedAt: new Date("2026-02-22T10:00:00Z"),
    },
  ];

  let filtered = filterByScope(user, placeholderAlerts as unknown as Record<string, unknown>[]) as unknown as Alert[];

  // Apply client-side filters on placeholder data
  if (status) {
    filtered = filtered.filter((a) => a.status === status);
  }
  if (severity) {
    // Severity would come from the joined alert_rule — placeholder just returns all
  }
  if (alertType) {
    // alertType would come from the joined alert_rule — placeholder just returns all
  }

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
 * PATCH /api/alerts
 *
 * Dismiss or acknowledge an alert. Accepts { alertId, action: "acknowledge" | "dismiss" | "resolve" }.
 *
 * Full implementation will:
 * - Validate the alert exists and user has access to it
 * - Update alert status (ACKNOWLEDGED, DISMISSED, or RESOLVED)
 * - Record who acknowledged/dismissed and when
 * - Return the updated alert
 */
export async function PATCH(request: Request): Promise<NextResponse<ApiResponse<Alert>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "alerts", "update")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
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
        { status: 400 },
      );
    }

    const statusMap: Record<string, AlertStatus> = {
      acknowledge: AlertStatus.ACKNOWLEDGED,
      dismiss: AlertStatus.DISMISSED,
      resolve: AlertStatus.RESOLVED,
    };

    const newStatus = statusMap[body.action];
    if (!newStatus) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be acknowledge, dismiss, or resolve." },
        { status: 400 },
      );
    }

    // TODO: Replace with real database update.
    const updatedAlert: Alert = {
      id: body.alertId,
      alertRuleId: "rule_001",
      organizationId: user.organizationId ?? "org_placeholder_001",
      status: newStatus,
      title: "Placeholder alert",
      message: "This alert has been updated.",
      data: {},
      acknowledgedBy: body.action === "acknowledge" ? user.id : undefined,
      acknowledgedAt: body.action === "acknowledge" ? new Date() : undefined,
      resolvedAt: body.action === "resolve" ? new Date() : undefined,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date(),
    };

    return NextResponse.json(
      { success: true, data: updatedAlert },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }
}
