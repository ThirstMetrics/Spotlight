import { NextResponse } from "next/server";
import { prisma } from "@spotlight/db";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/admin/item-requests
 * List item setup requests. Directors/admins see all; distributors see their own.
 */
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const where =
    user.role === "DISTRIBUTOR" && user.distributorId
      ? { distributorId: user.distributorId }
      : {};

  const requests = await prisma.itemSetupRequest.findMany({
    where,
    include: {
      distributor: { select: { name: true } },
      submitter: { select: { name: true, email: true } },
      reviewer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: requests });
}

/**
 * POST /api/admin/item-requests
 * Create a new item setup request (distributor submits).
 */
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  if (user.role !== "DISTRIBUTOR" || !user.distributorId) {
    return NextResponse.json({ success: false, error: "Only distributors can submit setup requests" }, { status: 403 });
  }

  const body = await request.json();

  if (!body.rwlvDescription?.trim()) {
    return NextResponse.json({ success: false, error: "RWLV product description is required" }, { status: 400 });
  }

  const created = await prisma.itemSetupRequest.create({
    data: {
      distributorId: user.distributorId,
      submittedBy: user.id,
      rwlvDescription: body.rwlvDescription,
      category: body.category ?? "",
      vendor: body.vendor ?? "",
      vendorProductNum: body.vendorProductNum ?? "",
      vendorDescription: body.vendorDescription ?? "",
      vendorPack: body.vendorPack ?? "",
      mfg: body.mfg ?? "",
      mfgNum: body.mfgNum ?? "",
      storageType: body.storageType ?? "Shelf-stable",
      caseSplittable: body.caseSplittable ?? "Yes",
      stockedStatus: body.stockedStatus ?? "Stocked",
      leadTime: body.leadTime ?? "Stocked",
      vendorCost: body.vendorCost ?? "",
      canSplitCase: body.canSplitCase ?? "Yes",
      orderBy: body.orderBy ?? "case",
      priceBy: body.priceBy ?? "case",
    },
    include: {
      distributor: { select: { name: true } },
      submitter: { select: { name: true } },
    },
  });

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}

/**
 * PATCH /api/admin/item-requests
 * Update status (director/admin reviews).
 */
export async function PATCH(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  if (!["VP", "DIRECTOR", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ success: false, error: "Not authorized to review requests" }, { status: 403 });
  }

  const body = await request.json();

  if (!body.id || !body.status) {
    return NextResponse.json({ success: false, error: "id and status are required" }, { status: 400 });
  }

  if (!["APPROVED", "REJECTED", "NEEDS_INFO", "PENDING"].includes(body.status)) {
    return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.itemSetupRequest.update({
    where: { id: body.id },
    data: {
      status: body.status,
      reviewedBy: user.id,
      reviewNote: body.reviewNote ?? null,
    },
    include: {
      distributor: { select: { name: true } },
      submitter: { select: { name: true } },
      reviewer: { select: { name: true } },
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
