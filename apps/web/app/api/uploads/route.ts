// =============================================================================
// /api/uploads — File upload handling and upload history
// =============================================================================

import { NextResponse } from "next/server";
import { UserRoleType } from "@spotlight/shared";
import type { ApiResponse, PaginatedResponse, Upload } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission, filterByScope } from "@/lib/rbac";

/**
 * POST /api/uploads
 *
 * Handle a new file upload (CSV or Excel). Returns an upload ID that can be
 * used to track processing status.
 *
 * Full implementation will:
 * - Accept multipart form data with the file and metadata
 * - Validate file type (CSV, XLSX) and size limits
 * - Detect or load saved field mapping profile for the source format
 * - Create an upload record in the database with PENDING status
 * - Queue the file for async processing by the data-engine
 * - Return the upload ID and initial status
 */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<{ uploadId: string; status: string }>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "uploads", "create")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  // TODO: Parse multipart form data, validate file, create upload record.
  const placeholderUpload = {
    uploadId: "upl_placeholder_001",
    status: "PENDING",
  };

  return NextResponse.json(
    { success: true, data: placeholderUpload },
    { status: 201 },
  );
}

/**
 * GET /api/uploads
 *
 * List past uploads for the current user's organization.
 *
 * Full implementation will:
 * - Query uploads table filtered by user's organization scope
 * - Support pagination (page, pageSize query params)
 * - Support filtering by status, uploadType, dateRange
 * - Return paginated list with processing statistics
 */
export async function GET(request: Request): Promise<NextResponse<ApiResponse<PaginatedResponse<Upload>>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "uploads", "read")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  // TODO: Replace with real database query filtered by user scope.
  const placeholderUploads: Upload[] = [
    {
      id: "upl_placeholder_001",
      organizationId: "org_placeholder_001",
      userId: user.id,
      fileName: "birchstreet_orders_jan2026.xlsx",
      fileSize: 245760,
      fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      uploadType: "WAREHOUSE_TRANSFER",
      source: "BIRCHSTREET",
      status: "COMPLETED" as Upload["status"],
      totalRows: 1500,
      processedRows: 1497,
      failedRows: 3,
      createdAt: new Date("2026-01-15T10:30:00Z"),
      updatedAt: new Date("2026-01-15T10:32:00Z"),
    },
  ];

  const filtered = filterByScope(user, placeholderUploads as unknown as Record<string, unknown>[]) as unknown as Upload[];

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
