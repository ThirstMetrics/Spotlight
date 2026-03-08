"use client";

import { useEffect, useState } from "react";
import { portalFetch } from "@/lib/auth";

interface ProductItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  category: string;
  subcategory: string | null;
  size: string | null;
  unit: string | null;
  cost: number;
  supplierName?: string;
  distributorName?: string;
}

interface ProductsData {
  role: string;
  products: ProductItem[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ProductsPage() {
  const [data, setData] = useState<ProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await portalFetch("/api/products");
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error || "Failed to load products");
          return;
        }
        setData(json.data);
      } catch {
        setError("Unable to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#06113e]">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Loading products...</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-4 w-full bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#06113e]">Products</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isSupplier = data.role === "SUPPLIER";

  // Get unique categories for filter
  const categories = Array.from(
    new Set(data.products.map((p) => p.category))
  ).sort();

  // Filter products
  const filtered = data.products.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "ALL" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#06113e]">Products</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data.products.length} products in your catalog
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#06113e] focus:outline-none focus:ring-1 focus:ring-[#06113e]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#06113e] focus:outline-none focus:ring-1 focus:ring-[#06113e]"
        >
          <option value="ALL">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Products table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">
              {search || categoryFilter !== "ALL"
                ? "No products match your filters."
                : "No products found."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  {isSupplier && (
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Distributor
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      {product.subcategory && (
                        <p className="text-xs text-gray-400">
                          {product.subcategory}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {product.sku}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                      {product.size || "-"}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                      {product.unit || "-"}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(product.cost)}
                    </td>
                    {isSupplier && (
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                        {product.distributorName}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Results count */}
        <div className="border-t border-gray-100 px-6 py-3">
          <p className="text-xs text-gray-400">
            Showing {filtered.length} of {data.products.length} products
          </p>
        </div>
      </div>
    </div>
  );
}
