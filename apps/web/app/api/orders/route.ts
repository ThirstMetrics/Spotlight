// =============================================================================
// /api/orders — Order history endpoints
// =============================================================================

import { NextResponse } from "next/server";
import { UserRoleType } from "@spotlight/shared";
import type { ApiResponse, PaginatedResponse, OrderHistory } from "@spotlight/shared";
import { prisma } from "@spotlight/db";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";
import type { Prisma } from "@spotlight/db";

/**
 * GET /api/orders
 *
 * Retrieve order history with filtering by date range, outlet, product, and distributor.
 *
 * Query params:
 *   - from, to (date range for orderDate)
 *   - outletId (single outlet filter)
 *   - productId (single product filter)
 *   - distributorId (single distributor filter)
 *   - page (default 1)
 *   - pageSize (default 20)
 *
 * RBAC scoping:
 *   - VP/DIRECTOR: all orders across all organizations
 *   - ADMIN: orders within their organization
 *   - ROOM_MANAGER: orders for their assigned outlets only
 *   - DISTRIBUTOR: orders for their distributor only
 *   - SUPPLIER: orders for products they supply (via supplierId on order or distributorProducts)
 *
 * Includes product (name, sku, category), outlet (name), and distributor (name) for display.
 * Results ordered by orderDate descending.
 */
export async function GET(request: Request): Promise<NextResponse<ApiResponse<PaginatedResponse<OrderHistory>>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "orders", "read")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const outletId = searchParams.get("outletId");
  const productId = searchParams.get("productId");
  const distributorId = searchParams.get("distributorId");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);

  // ---------------------------------------------------------------------------
  // Build the Prisma where clause
  // ---------------------------------------------------------------------------

  const where: Prisma.OrderHistoryWhereInput = {};

  // Date range filters
  if (from || to) {
    where.orderDate = {};
    if (from) {
      where.orderDate.gte = new Date(from);
    }
    if (to) {
      where.orderDate.lte = new Date(to);
    }
  }

  // Explicit query param filters
  if (outletId) {
    where.outletId = outletId;
  }
  if (productId) {
    where.productId = productId;
  }
  if (distributorId) {
    where.distributorId = distributorId;
  }

  // ---------------------------------------------------------------------------
  // RBAC scope restrictions
  // ---------------------------------------------------------------------------

  switch (user.role) {
    case UserRoleType.VP:
    case UserRoleType.DIRECTOR:
      // Full access — no additional filtering
      break;

    case UserRoleType.ADMIN:
      if (user.organizationId) {
        where.organizationId = user.organizationId;
      }
      break;

    case UserRoleType.ROOM_MANAGER:
      if (user.outletIds && user.outletIds.length > 0) {
        where.outletId = { in: user.outletIds };
      } else {
        // No assigned outlets — return empty result
        return NextResponse.json(
          {
            success: true,
            data: { data: [], total: 0, page, pageSize, totalPages: 0 },
          },
          { status: 200 },
        );
      }
      break;

    case UserRoleType.DISTRIBUTOR:
      if (user.distributorId) {
        where.distributorId = user.distributorId;
      } else {
        return NextResponse.json(
          {
            success: true,
            data: { data: [], total: 0, page, pageSize, totalPages: 0 },
          },
          { status: 200 },
        );
      }
      break;

    case UserRoleType.SUPPLIER:
      if (user.supplierId) {
        // Filter orders where the supplier is directly tagged, or where the
        // product is supplied by this supplier via the distributorProducts table.
        where.OR = [
          { supplierId: user.supplierId },
          {
            product: {
              distributorProducts: {
                some: { supplierId: user.supplierId },
              },
            },
          },
        ];
      } else {
        return NextResponse.json(
          {
            success: true,
            data: { data: [], total: 0, page, pageSize, totalPages: 0 },
          },
          { status: 200 },
        );
      }
      break;

    default:
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
  }

  // ---------------------------------------------------------------------------
  // Query the database
  // ---------------------------------------------------------------------------

  const [orders, total] = await Promise.all([
    prisma.orderHistory.findMany({
      where,
      include: {
        product: {
          select: { name: true, sku: true, category: true, unit: true },
        },
        outlet: {
          select: { name: true },
        },
        distributor: {
          select: { name: true },
        },
      },
      orderBy: { orderDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.orderHistory.count({ where }),
  ]);

  // ---------------------------------------------------------------------------
  // Map Prisma results to the OrderHistory shared type shape
  // ---------------------------------------------------------------------------

  const data: OrderHistory[] = orders.map((order) => ({
    id: order.id,
    organizationId: order.organizationId,
    outletId: order.outletId,
    productId: order.productId,
    distributorId: order.distributorId,
    quantity: order.quantity,
    unit: order.product.unit ?? "each",
    unitCost: order.costPerUnit,
    totalCost: order.totalCost,
    orderDate: order.orderDate,
    uploadId: order.uploadId ?? undefined,
    createdAt: order.createdAt,
    updatedAt: order.createdAt,
  }));

  return NextResponse.json(
    {
      success: true,
      data: {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    },
    { status: 200 },
  );
}
