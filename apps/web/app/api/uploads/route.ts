// =============================================================================
// /api/uploads — File upload handling and upload history
// =============================================================================

import { NextResponse } from "next/server";
import type { ApiResponse } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";
import { prisma } from "@spotlight/db";
import {
  FileParser,
  WarehouseTransferProcessor,
  DirectOrderProcessor,
  SalesDataProcessor,
} from "@spotlight/data-engine";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const UPLOAD_TYPE_MAP: Record<string, string> = {
  warehouse_transfer: "WAREHOUSE_TRANSFER",
  direct_order: "DIRECT_ORDER",
  sales_data: "SALES_DATA",
  distributor_chart: "DISTRIBUTOR_CHART",
};

const SOURCE_MAP: Record<string, string> = {
  birchstreet: "BIRCHSTREET",
  stratton_warren: "STRATTON_WARREN",
  oracle: "ORACLE",
  micros: "MICROS",
  agilysys: "AGILYSYS",
  toast: "TOAST",
  other: "OTHER",
};

/**
 * POST /api/uploads
 *
 * Handle a new file upload (CSV or Excel). Parses, validates, and processes
 * the file through the data-engine pipeline.
 */
export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<{ uploadId: string; status: string; recordsProcessed: number; recordsFailed: number }>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (!checkPermission(user, "uploads", "create")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const uploadType = (formData.get("uploadType") as string) ?? "";
    const source = (formData.get("source") as string) ?? "other";
    const organizationId = user.organizationId ?? "";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File exceeds 50MB limit" },
        { status: 400 }
      );
    }

    const resolvedType = UPLOAD_TYPE_MAP[uploadType.toLowerCase()] ?? "WAREHOUSE_TRANSFER";
    const resolvedSource = SOURCE_MAP[source.toLowerCase()] ?? "OTHER";

    // Create upload record
    const upload = await prisma.upload.create({
      data: {
        organizationId,
        uploadedBy: user.id,
        fileName: file.name,
        fileSize: file.size,
        uploadType: resolvedType as never,
        uploadSource: resolvedSource as never,
        status: "PROCESSING",
      },
    });

    // Parse the file
    const parser = new FileParser();
    const buffer = Buffer.from(await file.arrayBuffer());
    const parseResult = await parser.parse({ name: file.name, content: buffer });

    if (parseResult.rows.length === 0) {
      await prisma.upload.update({
        where: { id: upload.id },
        data: { status: "FAILED", errorMessage: "No data rows found in file" },
      });
      return NextResponse.json(
        { success: false, error: "No data rows found in file" },
        { status: 400 }
      );
    }

    // Use parsed rows directly — processors auto-resolve fields by common names
    const mappedRows = parseResult.rows;

    // Process based on upload type
    let processed = 0;
    let failed = 0;

    if (resolvedType === "WAREHOUSE_TRANSFER") {
      const processor = new WarehouseTransferProcessor();
      const result = await processor.process(mappedRows, organizationId, upload.id);
      processed = result.processed;
      failed = result.failed;
    } else if (resolvedType === "DIRECT_ORDER") {
      const processor = new DirectOrderProcessor();
      const result = await processor.process(mappedRows, organizationId, upload.id);
      processed = result.processed;
      failed = result.failed;
    } else if (resolvedType === "SALES_DATA") {
      const processor = new SalesDataProcessor();
      const result = await processor.process(mappedRows, organizationId, upload.id);
      processed = result.processed;
      failed = result.failed;
    }

    // Update upload record with results
    await prisma.upload.update({
      where: { id: upload.id },
      data: {
        status: failed === parseResult.rows.length ? "FAILED" : "COMPLETED",
        recordsProcessed: processed,
        recordsFailed: failed,
        completedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          uploadId: upload.id,
          status: failed === parseResult.rows.length ? "FAILED" : "COMPLETED",
          recordsProcessed: processed,
          recordsFailed: failed,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Upload processing failed",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/uploads
 *
 * List past uploads for the current user's organization.
 */
export async function GET(
  request: Request
): Promise<NextResponse<ApiResponse<unknown>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (!checkPermission(user, "uploads", "read")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
  const status = searchParams.get("status");
  const uploadType = searchParams.get("uploadType");

  const where: Record<string, unknown> = {};
  if (user.organizationId) {
    where.organizationId = user.organizationId;
  }
  if (status) {
    where.status = status.toUpperCase();
  }
  if (uploadType) {
    where.uploadType = uploadType.toUpperCase();
  }

  const [uploads, total] = await Promise.all([
    prisma.upload.findMany({
      where: where as never,
      include: {
        uploader: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.upload.count({ where: where as never }),
  ]);

  return NextResponse.json(
    {
      success: true,
      data: {
        data: uploads,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    },
    { status: 200 }
  );
}
