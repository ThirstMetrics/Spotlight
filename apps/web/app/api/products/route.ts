// =============================================================================
// /api/products — Product catalog endpoints
// =============================================================================

import { NextResponse } from "next/server";
import { Category, UserRoleType } from "@spotlight/shared";
import type { ApiResponse, PaginatedResponse, Product } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";
import { prisma, Prisma } from "@spotlight/db";

/**
 * Map a Prisma product record to the shared Product interface.
 *
 * The Prisma model omits `brand` and `description` (which are optional on the
 * shared type) and has `size`/`unit` as nullable. This helper normalizes the
 * shape so API consumers always receive a consistent type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProduct(record: Record<string, any>): Product {
  return {
    id: record.id,
    sku: record.sku,
    name: record.name,
    category: record.category as Category,
    subcategory: record.subcategory ?? undefined,
    size: record.size ?? "",
    unit: record.unit ?? "",
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * GET /api/products
 *
 * List products from the master catalog with optional filters.
 *
 * Supports query parameters:
 * - `category` — filter by Category enum value (BEER, WINE, SPIRITS, SAKE)
 * - `search`   — free-text search across name, sku, and brand
 * - `page`     — page number (default 1)
 * - `pageSize` — results per page (default 20, max 100)
 *
 * RBAC scoping:
 * - VP / DIRECTOR / ADMIN / ROOM_MANAGER: see all products
 * - DISTRIBUTOR: only products they carry (via distributor_products)
 * - SUPPLIER: only products they supply (via distributor_products)
 */
export async function GET(
  request: Request,
): Promise<NextResponse<ApiResponse<PaginatedResponse<Product>>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "products", "read")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as Category | null;
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)),
  );

  // ---- Build the where clause ----

  const where: Prisma.ProductWhereInput = {
    isActive: true,
  };

  // Category filter
  if (category && Object.values(Category).includes(category)) {
    where.category = category;
  }

  // Free-text search across name, sku (brand is not in Prisma model)
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }

  // ---- RBAC scoping ----

  if (user.role === UserRoleType.DISTRIBUTOR && user.distributorId) {
    // Distributors only see products they carry
    where.distributorProducts = {
      some: {
        distributorId: user.distributorId,
      },
    };
  } else if (user.role === UserRoleType.SUPPLIER && user.supplierId) {
    // Suppliers only see products they supply (across all distributors)
    where.distributorProducts = {
      some: {
        supplierId: user.supplierId,
      },
    };
  }
  // VP, DIRECTOR, ADMIN, ROOM_MANAGER — no additional scoping needed

  // ---- Execute query with pagination ----

  const [records, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  const products = records.map(toProduct);

  return NextResponse.json(
    {
      success: true,
      data: {
        data: products,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    },
    { status: 200 },
  );
}

/**
 * POST /api/products
 *
 * Create a new product in the master catalog.
 *
 * Required fields: sku, name, category, size, unit.
 * Optional fields: subcategory.
 *
 * Returns 409 if a product with the same SKU already exists.
 */
export async function POST(
  request: Request,
): Promise<NextResponse<ApiResponse<Product>>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (!checkPermission(user, "products", "create")) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as Partial<Product>;

    if (!body.sku || !body.name || !body.category || !body.size || !body.unit) {
      return NextResponse.json(
        { success: false, error: "Fields sku, name, category, size, and unit are required" },
        { status: 400 },
      );
    }

    // Validate category enum value
    if (!Object.values(Category).includes(body.category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Must be one of: ${Object.values(Category).join(", ")}` },
        { status: 400 },
      );
    }

    // Check for duplicate SKU
    const existing = await prisma.product.findUnique({
      where: { sku: body.sku },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `A product with SKU "${body.sku}" already exists` },
        { status: 409 },
      );
    }

    // Create the product
    const record = await prisma.product.create({
      data: {
        sku: body.sku,
        name: body.name,
        category: body.category,
        subcategory: body.subcategory ?? null,
        size: body.size,
        unit: body.unit,
        isActive: true,
      },
    });

    return NextResponse.json(
      { success: true, data: toProduct(record) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }
}
