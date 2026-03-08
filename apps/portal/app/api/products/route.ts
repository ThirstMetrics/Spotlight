import { NextResponse } from "next/server";
import { prisma } from "@spotlight/db";
import { getPortalUser, unauthorizedResponse } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const user = await getPortalUser(request);
    if (!user) return unauthorizedResponse();

    if (user.role === "DISTRIBUTOR" && user.distributorId) {
      return await getDistributorProducts(user.distributorId);
    }

    if (user.role === "SUPPLIER" && user.supplierId) {
      return await getSupplierProducts(user.supplierId);
    }

    return NextResponse.json(
      { success: false, error: "No distributor or supplier association found" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Products API error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getDistributorProducts(distributorId: string) {
  const products = await prisma.distributorProduct.findMany({
    where: { distributorId, isActive: true },
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          category: true,
          subcategory: true,
          size: true,
          unit: true,
        },
      },
      supplier: {
        select: { name: true },
      },
    },
    orderBy: { product: { name: "asc" } },
  });

  return NextResponse.json({
    success: true,
    data: {
      role: "DISTRIBUTOR",
      products: products.map((dp) => ({
        id: dp.id,
        productId: dp.product.id,
        sku: dp.product.sku,
        name: dp.product.name,
        category: dp.product.category,
        subcategory: dp.product.subcategory,
        size: dp.product.size,
        unit: dp.product.unit,
        cost: dp.cost,
        supplierName: dp.supplier.name,
      })),
    },
  });
}

async function getSupplierProducts(supplierId: string) {
  const products = await prisma.distributorProduct.findMany({
    where: { supplierId, isActive: true },
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          category: true,
          subcategory: true,
          size: true,
          unit: true,
        },
      },
      distributor: {
        select: { name: true },
      },
    },
    orderBy: { product: { name: "asc" } },
  });

  return NextResponse.json({
    success: true,
    data: {
      role: "SUPPLIER",
      products: products.map((dp) => ({
        id: dp.id,
        productId: dp.product.id,
        sku: dp.product.sku,
        name: dp.product.name,
        category: dp.product.category,
        subcategory: dp.product.subcategory,
        size: dp.product.size,
        unit: dp.product.unit,
        cost: dp.cost,
        distributorName: dp.distributor.name,
      })),
    },
  });
}
