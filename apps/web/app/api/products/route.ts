// =============================================================================
// /api/products — Product catalog endpoints
// =============================================================================

import { NextResponse } from "next/server";
import { Category, UserRoleType } from "@spotlight/shared";
import type { ApiResponse, PaginatedResponse, Product } from "@spotlight/shared";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/rbac";

/**
 * GET /api/products
 *
 * List products from the master catalog with optional filters.
 *
 * Full implementation will:
 * - Query products table with optional filters: category, search term, brand, isActive
 * - Distributors see only products they carry (join through distributor_products)
 * - Suppliers see only their own products (join through distributor_products.supplierId)
 * - Support pagination and sorting (by name, category, brand)
 * - Include distributor cost info when user has appropriate access
 */
export async function GET(request: Request): Promise<NextResponse<ApiResponse<PaginatedResponse<Product>>>> {
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
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);

  // TODO: Replace with real database query using filters.
  const placeholderProducts: Product[] = [
    {
      id: "prod_001",
      sku: "BV-CAB-001",
      name: "Cabernet Sauvignon Reserve 2022",
      category: Category.WINE,
      subcategory: "Red Wine",
      brand: "Napa Valley Vineyards",
      size: "750ml",
      unit: "bottle",
      description: "Premium Napa Valley Cabernet Sauvignon",
      isActive: true,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: "prod_002",
      sku: "SP-VOD-001",
      name: "Premium Vodka",
      category: Category.SPIRITS,
      subcategory: "Vodka",
      brand: "Crystal Clear",
      size: "1L",
      unit: "bottle",
      description: "Triple-distilled premium vodka",
      isActive: true,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: "prod_003",
      sku: "BR-IPA-001",
      name: "West Coast IPA",
      category: Category.BEER,
      subcategory: "IPA",
      brand: "Pacific Brewing Co.",
      size: "12oz",
      unit: "can",
      description: "Hoppy West Coast style IPA",
      isActive: true,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    },
  ];

  // Apply category filter if provided
  let filtered = placeholderProducts;
  if (category) {
    filtered = filtered.filter((p) => p.category === category);
  }
  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.brand && p.brand.toLowerCase().includes(term)),
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        data: filtered,
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
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
 * Full implementation will:
 * - Validate required fields (sku, name, category, size, unit)
 * - Check for duplicate SKU
 * - Create the product record in the database
 * - Optionally link to distributor via distributor_products
 * - Return the created product
 */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<Product>>> {
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

    // TODO: Replace with real database insert.
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      sku: body.sku,
      name: body.name,
      category: body.category,
      subcategory: body.subcategory,
      brand: body.brand,
      size: body.size,
      unit: body.unit,
      description: body.description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(
      { success: true, data: newProduct },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }
}
