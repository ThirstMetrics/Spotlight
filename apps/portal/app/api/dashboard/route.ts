import { NextResponse } from "next/server";
import { prisma } from "@spotlight/db";
import { getPortalUser, unauthorizedResponse } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const user = await getPortalUser(request);
    if (!user) return unauthorizedResponse();

    if (user.role === "DISTRIBUTOR" && user.distributorId) {
      return await getDistributorDashboard(user.distributorId);
    }

    if (user.role === "SUPPLIER" && user.supplierId) {
      return await getSupplierDashboard(user.supplierId);
    }

    return NextResponse.json(
      { success: false, error: "No distributor or supplier association found" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getDistributorDashboard(distributorId: string) {
  // Aggregate order data for this distributor
  const [volumeAgg, revenueAgg, outletCount, productCount, recentOrders] =
    await Promise.all([
      // Total order volume
      prisma.orderHistory.aggregate({
        where: { distributorId },
        _sum: { quantity: true },
      }),
      // Total revenue
      prisma.orderHistory.aggregate({
        where: { distributorId },
        _sum: { totalCost: true },
      }),
      // Number of distinct outlets served
      prisma.orderHistory.findMany({
        where: { distributorId },
        select: { outletId: true },
        distinct: ["outletId"],
      }),
      // Number of distinct products carried
      prisma.orderHistory.findMany({
        where: { distributorId },
        select: { productId: true },
        distinct: ["productId"],
      }),
      // Recent orders (last 10)
      prisma.orderHistory.findMany({
        where: { distributorId },
        orderBy: { orderDate: "desc" },
        take: 10,
        include: {
          outlet: { select: { name: true } },
          product: { select: { name: true, sku: true, category: true } },
        },
      }),
    ]);

  return NextResponse.json({
    success: true,
    data: {
      role: "DISTRIBUTOR",
      metrics: {
        totalVolume: volumeAgg._sum.quantity ?? 0,
        totalRevenue: revenueAgg._sum.totalCost ?? 0,
        outletsServed: outletCount.length,
        productsCarried: productCount.length,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        outletName: o.outlet.name,
        productName: o.product.name,
        productSku: o.product.sku,
        category: o.product.category,
        quantity: o.quantity,
        totalCost: o.totalCost,
        orderDate: o.orderDate,
        orderType: o.orderType,
      })),
    },
  });
}

async function getSupplierDashboard(supplierId: string) {
  // For suppliers, aggregate across all distributors that carry their products
  const [volumeAgg, revenueAgg, distributorCount, outletCount, topProducts] =
    await Promise.all([
      // Total order volume where supplier's products are involved
      prisma.orderHistory.aggregate({
        where: { supplierId },
        _sum: { quantity: true },
      }),
      // Total revenue
      prisma.orderHistory.aggregate({
        where: { supplierId },
        _sum: { totalCost: true },
      }),
      // Number of distinct distributors carrying their products
      prisma.orderHistory.findMany({
        where: { supplierId },
        select: { distributorId: true },
        distinct: ["distributorId"],
      }),
      // Number of distinct outlets reached
      prisma.orderHistory.findMany({
        where: { supplierId },
        select: { outletId: true },
        distinct: ["outletId"],
      }),
      // Recent orders as proxy for top products
      prisma.orderHistory.findMany({
        where: { supplierId },
        orderBy: { orderDate: "desc" },
        take: 10,
        include: {
          outlet: { select: { name: true } },
          product: { select: { name: true, sku: true, category: true } },
          distributor: { select: { name: true } },
        },
      }),
    ]);

  return NextResponse.json({
    success: true,
    data: {
      role: "SUPPLIER",
      metrics: {
        totalVolume: volumeAgg._sum.quantity ?? 0,
        totalRevenue: revenueAgg._sum.totalCost ?? 0,
        distributorCount: distributorCount.length,
        outletsReached: outletCount.length,
      },
      recentOrders: topProducts.map((o) => ({
        id: o.id,
        outletName: o.outlet.name,
        productName: o.product.name,
        productSku: o.product.sku,
        category: o.product.category,
        distributorName: o.distributor.name,
        quantity: o.quantity,
        totalCost: o.totalCost,
        orderDate: o.orderDate,
        orderType: o.orderType,
      })),
    },
  });
}
