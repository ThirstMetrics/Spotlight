// =============================================================================
// /api/messages — Flash message system endpoints
// =============================================================================

import { NextResponse } from "next/server";
import type { ApiResponse } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";
import { prisma } from "@spotlight/db";

/**
 * GET /api/messages
 *
 * List flash messages for the current user's organization.
 */
export async function GET(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (!checkPermission(user, "messages", "read")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const isRead = searchParams.get("isRead");
  const outletId = searchParams.get("outletId");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 50)));

  const where: Record<string, unknown> = {};

  if (user.organizationId) {
    where.organizationId = user.organizationId;
  }

  // Room managers only see messages for their outlets
  if (user.outletIds && user.outletIds.length > 0) {
    where.outletId = { in: [...user.outletIds, null] };
  }

  if (isRead === "true") {
    where.isRead = true;
  } else if (isRead === "false") {
    where.isRead = false;
  }

  if (outletId) {
    where.outletId = outletId;
  }

  const [messages, total] = await Promise.all([
    prisma.flashMessage.findMany({
      where: where as never,
      include: {
        sender: { select: { name: true, email: true } },
        outlet: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.flashMessage.count({ where: where as never }),
  ]);

  return NextResponse.json(
    {
      success: true,
      data: {
        data: messages,
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
 * POST /api/messages
 *
 * Send a new flash message.
 */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (!checkPermission(user, "messages", "create")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as {
      outletId?: string;
      subject: string;
      body: string;
    };

    if (!body.subject || !body.body) {
      return NextResponse.json(
        { success: false, error: "Subject and body are required" },
        { status: 400 }
      );
    }

    const message = await prisma.flashMessage.create({
      data: {
        organizationId: user.organizationId ?? "",
        senderId: user.id,
        outletId: body.outletId || null,
        subject: body.subject,
        body: body.body,
      },
      include: {
        sender: { select: { name: true, email: true } },
        outlet: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: message },
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
 * PATCH /api/messages
 *
 * Mark a message as read.
 */
export async function PATCH(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (!checkPermission(user, "messages", "update")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as {
      messageId: string;
    };

    if (!body.messageId) {
      return NextResponse.json(
        { success: false, error: "Message ID is required" },
        { status: 400 }
      );
    }

    const message = await prisma.flashMessage.update({
      where: { id: body.messageId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
      include: {
        sender: { select: { name: true, email: true } },
        outlet: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: message },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
