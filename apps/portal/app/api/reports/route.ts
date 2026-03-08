import { NextResponse } from "next/server";
import { prisma } from "@spotlight/db";
import { getPortalUser, unauthorizedResponse } from "@/lib/api-auth";
import * as XLSX from "xlsx";

interface ReportRequest {
  type: "orders" | "products" | "volume";
  format: "csv" | "xlsx";
  dateFrom?: string;
  dateTo?: string;
}

type DataRow = Record<string, unknown>;

/**
 * Query report data for the given report type.
 */
async function queryReportData(
  reportType: string,
  distributorId?: string,
  supplierId?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{ rows: DataRow[]; sheetName: string }> {
  const dateWhere: Record<string, unknown> = {};
  if (dateFrom) dateWhere.gte = new Date(dateFrom);
  if (dateTo) dateWhere.lte = new Date(dateTo);
  const hasDateFilter = Object.keys(dateWhere).length > 0;

  switch (reportType) {
    case "orders": {
      // All orders for this partner's products
      const where: Record<string, unknown> = {};
      if (distributorId) where.distributorId = distributorId;
      if (supplierId) where.supplierId = supplierId;
      if (hasDateFilter) where.orderDate = dateWhere;

      const orders = await prisma.orderHistory.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true, category: true } },
          outlet: { select: { name: true } },
          distributor: { select: { name: true } },
        },
        orderBy: { orderDate: "desc" },
        take: 10000,
      });

      return {
        sheetName: "Order History",
        rows: orders.map((o) => ({
          Date: o.orderDate.toISOString().split("T")[0],
          Outlet: o.outlet.name,
          Product: o.product.name,
          SKU: o.product.sku,
          Category: o.product.category,
          Quantity: o.quantity,
          "Unit Cost": o.costPerUnit,
          "Total Cost": o.totalCost,
          Distributor: o.distributor?.name ?? "",
          "Order Type": o.orderType,
        })),
      };
    }

    case "products": {
      // Product catalog for this partner
      if (distributorId) {
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
            supplier: { select: { name: true } },
          },
          orderBy: { product: { name: "asc" } },
          take: 10000,
        });

        return {
          sheetName: "Product Catalog",
          rows: products.map((dp) => ({
            SKU: dp.product.sku,
            "Product Name": dp.product.name,
            Category: dp.product.category,
            Subcategory: dp.product.subcategory || "",
            Size: dp.product.size || "",
            Unit: dp.product.unit || "",
            Cost: dp.cost,
            Supplier: dp.supplier.name,
            Active: "Yes",
          })),
        };
      }

      // Supplier view
      if (supplierId) {
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
            distributor: { select: { name: true } },
          },
          orderBy: { product: { name: "asc" } },
          take: 10000,
        });

        return {
          sheetName: "Product Catalog",
          rows: products.map((dp) => ({
            SKU: dp.product.sku,
            "Product Name": dp.product.name,
            Category: dp.product.category,
            Subcategory: dp.product.subcategory || "",
            Size: dp.product.size || "",
            Unit: dp.product.unit || "",
            Cost: dp.cost,
            Distributor: dp.distributor.name,
            Active: "Yes",
          })),
        };
      }

      return { sheetName: "Product Catalog", rows: [] };
    }

    case "volume": {
      // Monthly volume summary
      const where: Record<string, unknown> = {};
      if (distributorId) where.distributorId = distributorId;
      if (supplierId) where.supplierId = supplierId;
      if (hasDateFilter) where.orderDate = dateWhere;

      const orders = await prisma.orderHistory.findMany({
        where,
        include: {
          product: { select: { name: true, category: true } },
          outlet: { select: { name: true } },
        },
        orderBy: { orderDate: "desc" },
        take: 10000,
      });

      // Aggregate by month, outlet, and product
      const volumeMap = new Map<
        string,
        {
          month: string;
          outlet: string;
          product: string;
          category: string;
          qty: number;
          revenue: number;
        }
      >();

      orders.forEach((o) => {
        const month = o.orderDate.toISOString().split("T")[0].substring(0, 7); // YYYY-MM
        const key = `${month}|${o.outlet.name}|${o.product.name}`;
        const existing = volumeMap.get(key) || {
          month,
          outlet: o.outlet.name,
          product: o.product.name,
          category: o.product.category,
          qty: 0,
          revenue: 0,
        };
        existing.qty += o.quantity;
        existing.revenue += o.totalCost;
        volumeMap.set(key, existing);
      });

      const rows = Array.from(volumeMap.values()).map((v) => ({
        Month: v.month,
        Outlet: v.outlet,
        Product: v.product,
        Category: v.category,
        "Total Qty": v.qty,
        "Total Revenue": v.revenue,
      }));

      return {
        sheetName: "Volume Summary",
        rows,
      };
    }

    default:
      return { sheetName: "Export", rows: [] };
  }
}

/**
 * GET /api/reports
 * Query params: type, format, dateFrom, dateTo
 */
export async function GET(request: Request) {
  try {
    const user = await getPortalUser(request);
    if (!user) return unauthorizedResponse();

    const url = new URL(request.url);
    const type = url.searchParams.get("type") as
      | "orders"
      | "products"
      | "volume"
      | null;
    const format = url.searchParams.get("format") as "csv" | "xlsx" | null;
    const dateFrom = url.searchParams.get("dateFrom") || undefined;
    const dateTo = url.searchParams.get("dateTo") || undefined;

    if (!type || !format) {
      return NextResponse.json(
        { success: false, error: "type and format query params are required" },
        { status: 400 }
      );
    }

    if (!["orders", "products", "volume"].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "type must be one of: orders, products, volume",
        },
        { status: 400 }
      );
    }

    if (!["csv", "xlsx"].includes(format)) {
      return NextResponse.json(
        { success: false, error: "format must be csv or xlsx" },
        { status: 400 }
      );
    }

    // Get the report data
    const { rows, sheetName } = await queryReportData(
      type,
      user.distributorId,
      user.supplierId,
      dateFrom,
      dateTo
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No data found for the selected filters" },
        { status: 404 }
      );
    }

    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `${type}_${dateStr}`;

    if (format === "csv") {
      const ws = XLSX.utils.json_to_sheet(rows);
      const csv = XLSX.utils.sheet_to_csv(ws);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileName}.csv"`,
        },
      });
    }

    // XLSX
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("Reports API error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
