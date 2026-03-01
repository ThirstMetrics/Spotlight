// =============================================================================
// /api/reports/export — Report export generation (Excel / CSV)
// =============================================================================

import { NextResponse } from "next/server";
import { UserRoleType } from "@spotlight/shared";
import type { ApiResponse, ExportFormat } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ExportRequest {
  /** Output format: XLSX or CSV. */
  format: ExportFormat;
  /** Type of report to export. */
  reportType:
    | "orders"
    | "margins"
    | "compliance"
    | "inventory"
    | "alerts"
    | "sales"
    | "distributor_summary"
    | "supplier_summary";
  /** Optional filters to apply to the exported data. */
  filters?: {
    from?: string;
    to?: string;
    outletIds?: string[];
    outletGroupIds?: string[];
    categories?: string[];
    productIds?: string[];
    distributorId?: string;
    supplierId?: string;
  };
}

interface ExportResponse {
  /** Unique ID for the generated export file. */
  exportId: string;
  /** The filename that will be served for download. */
  fileName: string;
  /** The MIME type of the generated file. */
  mimeType: string;
  /** URL to download the generated file (will be a temporary signed URL). */
  downloadUrl: string;
  /** Number of rows included in the export. */
  rowCount: number;
}

/**
 * POST /api/reports/export
 *
 * Generate an export file (Excel or CSV) for the specified report type and filters.
 *
 * Full implementation will:
 * - Validate the request body (format, reportType required)
 * - Query the appropriate data tables based on reportType and user scope
 * - Apply all provided filters (date range, outlets, categories, etc.)
 * - Scope data based on user role:
 *   - VP/Director: full data access
 *   - Admin: organization-scoped
 *   - Room Manager: outlet-scoped
 *   - Distributor: their products only
 *   - Supplier: their products across distributors
 * - Generate the file using SheetJS (XLSX) or Papa Parse (CSV)
 * - Store the file temporarily (Supabase Storage or local temp)
 * - Return the download URL and metadata
 * - Track the export in portal_interactions for analytics
 */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<ExportResponse>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "reports", "create")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as ExportRequest;

    if (!body.format || !body.reportType) {
      return NextResponse.json(
        { success: false, error: "format and reportType are required" },
        { status: 400 },
      );
    }

    if (!["XLSX", "CSV"].includes(body.format)) {
      return NextResponse.json(
        { success: false, error: "format must be XLSX or CSV" },
        { status: 400 },
      );
    }

    const validReportTypes = [
      "orders",
      "margins",
      "compliance",
      "inventory",
      "alerts",
      "sales",
      "distributor_summary",
      "supplier_summary",
    ];
    if (!validReportTypes.includes(body.reportType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid reportType. Must be one of: ${validReportTypes.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const extension = body.format === "XLSX" ? "xlsx" : "csv";
    const mimeType =
      body.format === "XLSX"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "text/csv";

    // TODO: Replace with real data query, file generation, and upload.
    const exportId = `exp_${Date.now()}`;
    const fileName = `${body.reportType}_export_${new Date().toISOString().split("T")[0]}.${extension}`;

    const response: ExportResponse = {
      exportId,
      fileName,
      mimeType,
      downloadUrl: `/api/reports/export/${exportId}/download`,
      rowCount: 150, // Placeholder row count
    };

    return NextResponse.json(
      { success: true, data: response },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }
}
