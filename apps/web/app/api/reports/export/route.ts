// =============================================================================
// /api/reports/export — Report export generation (Excel / CSV)
// =============================================================================

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";
import { prisma } from "@spotlight/db";
import * as XLSX from "xlsx";

interface ExportRequest {
  format: "XLSX" | "CSV";
  reportType:
    | "orders"
    | "margins"
    | "compliance"
    | "inventory"
    | "alerts"
    | "sales";
  filters?: {
    from?: string;
    to?: string;
    outletIds?: string[];
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataRow = Record<string, any>;

/**
 * Query data for the given report type.
 */
async function queryReportData(
  reportType: string,
  filters?: ExportRequest["filters"]
): Promise<{ rows: DataRow[]; sheetName: string }> {
  const dateWhere: Record<string, unknown> = {};
  if (filters?.from) dateWhere.gte = new Date(filters.from);
  if (filters?.to) dateWhere.lte = new Date(filters.to);
  const hasDateFilter = Object.keys(dateWhere).length > 0;

  switch (reportType) {
    case "inventory": {
      const snapshots = await prisma.inventorySnapshot.findMany({
        include: {
          product: { select: { name: true, sku: true, category: true } },
          outlet: { select: { name: true } },
        },
        ...(filters?.outletIds?.length
          ? { where: { outletId: { in: filters.outletIds } } }
          : {}),
        orderBy: { snapshotDate: "desc" },
        distinct: ["outletId", "productId"],
        take: 5000,
      });

      return {
        sheetName: "Inventory",
        rows: snapshots.map((s) => ({
          Outlet: s.outlet.name,
          Product: s.product.name,
          SKU: s.product.sku,
          Category: s.product.category,
          "Quantity On Hand": s.quantityOnHand,
          "Snapshot Date": s.snapshotDate.toISOString().split("T")[0],
        })),
      };
    }

    case "compliance": {
      const compliance = await prisma.mandateCompliance.findMany({
        include: {
          outlet: { select: { name: true } },
          mandateItem: {
            include: {
              product: { select: { name: true, sku: true, category: true } },
              mandate: { select: { name: true } },
            },
          },
        },
        ...(filters?.outletIds?.length
          ? { where: { outletId: { in: filters.outletIds } } }
          : {}),
        take: 5000,
      });

      return {
        sheetName: "Compliance",
        rows: compliance.map((c) => ({
          Outlet: c.outlet.name,
          Mandate: c.mandateItem.mandate.name,
          Product: c.mandateItem.product.name,
          SKU: c.mandateItem.product.sku,
          Category: c.mandateItem.product.category,
          Status: c.isCompliant ? "Compliant" : "Non-Compliant",
          "Last Order Qty": c.lastOrderQuantity,
          "Last Order Date": c.lastOrderDate
            ? c.lastOrderDate.toISOString().split("T")[0]
            : "",
        })),
      };
    }

    case "alerts": {
      const alerts = await prisma.alert.findMany({
        include: {
          outlet: { select: { name: true } },
          product: { select: { name: true, sku: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5000,
      });

      return {
        sheetName: "Alerts",
        rows: alerts.map((a) => ({
          Type: a.alertType,
          Severity: a.severity,
          Title: a.title,
          Message: a.message,
          Outlet: a.outlet?.name ?? "",
          Product: a.product?.name ?? "",
          Read: a.isRead ? "Yes" : "No",
          Dismissed: a.isDismissed ? "Yes" : "No",
          "Created At": a.createdAt.toISOString().split("T")[0],
        })),
      };
    }

    case "orders": {
      const orders = await prisma.orderHistory.findMany({
        include: {
          product: { select: { name: true, sku: true, category: true } },
          outlet: { select: { name: true } },
          distributor: { select: { name: true } },
        },
        ...(hasDateFilter || filters?.outletIds?.length
          ? {
              where: {
                ...(hasDateFilter ? { orderDate: dateWhere } : {}),
                ...(filters?.outletIds?.length
                  ? { outletId: { in: filters.outletIds } }
                  : {}),
              },
            }
          : {}),
        orderBy: { orderDate: "desc" },
        take: 5000,
      });

      return {
        sheetName: "Orders",
        rows: orders.map((o) => ({
          Outlet: o.outlet.name,
          Product: o.product.name,
          SKU: o.product.sku,
          Category: o.product.category,
          Distributor: o.distributor?.name ?? "",
          Quantity: o.quantity,
          "Unit Cost": o.costPerUnit,
          "Total Cost": o.totalCost,
          "Order Date": o.orderDate.toISOString().split("T")[0],
          "Order Type": o.orderType,
        })),
      };
    }

    default:
      return { sheetName: "Export", rows: [] };
  }
}

/**
 * POST /api/reports/export
 *
 * Generate and return a file download (Excel or CSV).
 */
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (!checkPermission(user, "reports", "create")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as ExportRequest;

    if (!body.format || !body.reportType) {
      return NextResponse.json(
        { success: false, error: "format and reportType are required" },
        { status: 400 }
      );
    }

    if (!["XLSX", "CSV"].includes(body.format)) {
      return NextResponse.json(
        { success: false, error: "format must be XLSX or CSV" },
        { status: 400 }
      );
    }

    const { rows, sheetName } = await queryReportData(
      body.reportType,
      body.filters
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No data found for the selected filters" },
        { status: 404 }
      );
    }

    const dateStr = new Date().toISOString().split("T")[0];

    if (body.format === "CSV") {
      const ws = XLSX.utils.json_to_sheet(rows);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const fileName = `${body.reportType}_${dateStr}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    }

    // XLSX
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const fileName = `${body.reportType}_${dateStr}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Export generation failed" },
      { status: 500 }
    );
  }
}
