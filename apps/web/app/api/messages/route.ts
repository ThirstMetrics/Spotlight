// =============================================================================
// /api/messages — Flash message system endpoints
// =============================================================================

import { NextResponse } from "next/server";
import { UserRoleType } from "@spotlight/shared";
import type { ApiResponse, PaginatedResponse, FlashMessage } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission, filterByScope } from "@/lib/rbac";

/**
 * GET /api/messages
 *
 * List flash messages for the current user.
 *
 * Full implementation will:
 * - Query flash_messages table for messages sent to or from the current user
 * - VP/Director: see all messages across the organization
 * - Admin: see all messages in their organization
 * - Room Manager: see messages addressed to them or their outlet
 * - Support filtering: isRead, outletId, fromUserId, date range
 * - Support pagination and sorting (newest first by default)
 * - Mark messages as delivered when fetched (for real-time tracking)
 * - Integrate with Supabase Realtime for live push notifications
 */
export async function GET(request: Request): Promise<NextResponse<ApiResponse<PaginatedResponse<FlashMessage>>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "messages", "read")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const isRead = searchParams.get("isRead");
  const outletId = searchParams.get("outletId");

  // TODO: Replace with real database query.
  const placeholderMessages: FlashMessage[] = [
    {
      id: "msg_001",
      organizationId: "org_placeholder_001",
      fromUserId: "usr_director_001",
      toUserId: "usr_placeholder_001",
      outletId: "out_001",
      subject: "Wine order reminder",
      body: "Please ensure the Q1 2026 wine mandate items are ordered by end of week. The Cabernet Sauvignon Reserve is still outstanding for Steakhouse.",
      isRead: false,
      createdAt: new Date("2026-02-25T09:00:00Z"),
      updatedAt: new Date("2026-02-25T09:00:00Z"),
    },
    {
      id: "msg_002",
      organizationId: "org_placeholder_001",
      fromUserId: "usr_placeholder_001",
      toUserId: "usr_director_001",
      outletId: "out_002",
      subject: "Pool Bar inventory update",
      body: "Vodka pull-through was high last week due to the pool party event. Volumes should normalize this week.",
      isRead: true,
      readAt: new Date("2026-02-24T15:00:00Z"),
      createdAt: new Date("2026-02-24T11:00:00Z"),
      updatedAt: new Date("2026-02-24T15:00:00Z"),
    },
  ];

  let filtered = filterByScope(user, placeholderMessages as unknown as Record<string, unknown>[]) as unknown as FlashMessage[];

  // Apply client-side filters on placeholder data
  if (isRead !== null) {
    const readBool = isRead === "true";
    filtered = filtered.filter((m) => m.isRead === readBool);
  }
  if (outletId) {
    filtered = filtered.filter((m) => m.outletId === outletId);
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
 * POST /api/messages
 *
 * Send a new flash message. Room Managers can send messages; VP/Director/Admin
 * can send to any user or outlet.
 *
 * Full implementation will:
 * - Validate required fields (subject, body, and either toUserId or outletId)
 * - Check sender permissions based on role
 * - Room Manager can only send messages within their outlet scope
 * - Create the message record in flash_messages table
 * - Broadcast via Supabase Realtime for instant delivery
 * - Track in portal_interactions for analytics
 * - Return the created message
 */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<FlashMessage>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "messages", "create")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      toUserId?: string;
      outletId?: string;
      subject: string;
      body: string;
    };

    if (!body.subject || !body.body) {
      return NextResponse.json(
        { success: false, error: "Subject and body are required" },
        { status: 400 },
      );
    }

    if (!body.toUserId && !body.outletId) {
      return NextResponse.json(
        { success: false, error: "Either toUserId or outletId is required" },
        { status: 400 },
      );
    }

    // TODO: Replace with real database insert and Supabase Realtime broadcast.
    const newMessage: FlashMessage = {
      id: `msg_${Date.now()}`,
      organizationId: user.organizationId ?? "org_placeholder_001",
      fromUserId: user.id,
      toUserId: body.toUserId,
      outletId: body.outletId,
      subject: body.subject,
      body: body.body,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(
      { success: true, data: newMessage },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }
}
