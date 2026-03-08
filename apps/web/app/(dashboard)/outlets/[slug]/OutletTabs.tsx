"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

// === Types ===

interface DistributorRow {
  distributorId: string;
  name: string;
  productCount: number;
  volume: number;
  spend: number;
  lastOrder: string | null;
}

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  subcategory: string | null;
  size: string | null;
  cost: number;
  distributorName: string;
  supplierName: string;
  units: number;
  spend: number;
  lastOrder: string | null;
}

interface WineRow {
  id: string;
  name: string;
  sku: string;
  subcategory: string;
  size: string | null;
  cost: number;
  distributorName: string;
  supplierName: string;
  units: number;
  spend: number;
}

interface InventoryRow {
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  quantityOnHand: number;
  avgDailyUsage: number;
  daysOnHand: number;
  lastUpdated: string;
}

interface ComplianceRow {
  productName: string;
  productSku: string;
  isCompliant: boolean;
  lastOrderDate: string | null;
  lastOrderQuantity: number | null;
}

interface RecipeRow {
  id: string;
  name: string;
  ingredientCount: number;
  totalCost: number;
  costPerServing: number;
  sellingPrice: number | null;
  marginPct: number | null;
}

interface OutletTabsProps {
  distributorBreakdown: DistributorRow[];
  productPerformance: ProductRow[];
  wineProgram: WineRow[];
  inventorySnapshot: InventoryRow[];
  compliance: ComplianceRow[];
  recipes: RecipeRow[];
}

// === Helpers ===

const formatCurrency = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `$${(n / 1_000).toFixed(0)}K`
      : `$${n.toFixed(0)}`;

const formatDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "—";

const CATEGORY_TABS = ["All", "WINE", "SPIRITS", "BEER", "SAKE"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  All: "All",
  WINE: "Wine",
  SPIRITS: "Spirits",
  BEER: "Beer",
  SAKE: "Sake",
};

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  WINE: "bg-emerald-100 text-emerald-800",
  SPIRITS: "bg-indigo-100 text-indigo-800",
  BEER: "bg-blue-100 text-blue-800",
  SAKE: "bg-violet-100 text-violet-800",
  NON_ALCOHOLIC: "bg-amber-100 text-amber-800",
};

// === Distributor Breakdown ===

function DistributorBreakdown({ data }: { data: DistributorRow[] }) {
  if (data.length === 0) return null;

  return (
    <Card className="border-l-4 border-l-[#06113e]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-[#06113e]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <CardTitle className="text-lg">Distributor Breakdown</CardTitle>
        </div>
        <CardDescription>
          Which distributors supply this venue and volume through each
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Distributor</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Products</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Units (12mo)</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Spend</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.distributorId} className="border-b hover:bg-gray-50/30">
                  <td className="px-3 py-2.5 font-medium text-[#06113e]">{row.name}</td>
                  <td className="px-3 py-2.5 text-right">{row.productCount}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{row.volume.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{formatCurrency(row.spend)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{formatDate(row.lastOrder)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// === Product Performance Table ===

function ProductTable({ data }: { data: ProductRow[] }) {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = data;
    if (activeTab !== "All") {
      result = result.filter((p) => p.category === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
          p.distributorName.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q)
      );
    }
    return result;
  }, [data, activeTab, search]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Product Performance</CardTitle>
            <CardDescription>All products ordered — filter by category</CardDescription>
          </div>
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        {/* Category tabs */}
        <div className="flex gap-1 mt-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? "bg-[#06113e] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {CATEGORY_LABELS[tab]}
              {tab !== "All" && (
                <span className="ml-1 opacity-70">
                  ({data.filter((p) => p.category === tab).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Product</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">SKU</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Category</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Size</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Cost</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Distributor</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Supplier</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Units (12mo)</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Spend</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50/30">
                  <td className="px-3 py-2.5">
                    <div>
                      <p className="font-medium text-[#06113e]">{p.name}</p>
                      {p.subcategory && (
                        <p className="text-xs text-muted-foreground">{p.subcategory}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{p.sku}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${CATEGORY_BADGE_COLORS[p.category] ?? "bg-gray-100 text-gray-700"}`}>
                      {p.category}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{p.size}</td>
                  <td className="px-3 py-2.5 text-right">${p.cost.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{p.distributorName}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{p.supplierName}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{p.units.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{formatCurrency(p.spend)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{formatDate(p.lastOrder)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                    No products match the current filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Showing {filtered.length} of {data.length} products
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// === Wine Program ===

function WineProgram({ data }: { data: WineRow[] }) {
  if (data.length === 0) return null;

  const uniqueSuppliers = new Set(data.map((w) => w.supplierName)).size;

  return (
    <Card className="border-l-4 border-l-[#5ad196]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-[#5ad196]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
          <CardTitle className="text-lg">Wine Program</CardTitle>
        </div>
        <CardDescription>
          {data.length} wines from {uniqueSuppliers} supplier{uniqueSuppliers !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Wine</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Varietal / Type</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Size</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Cost</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Distributor</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Supplier</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Units (12mo)</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Spend</th>
              </tr>
            </thead>
            <tbody>
              {data.map((w) => (
                <tr key={w.id} className="border-b hover:bg-gray-50/30">
                  <td className="px-3 py-2.5">
                    <div>
                      <p className="font-medium text-[#06113e]">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.sku}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{w.subcategory}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{w.size}</td>
                  <td className="px-3 py-2.5 text-right">${w.cost.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{w.distributorName}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{w.supplierName}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{w.units.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{formatCurrency(w.spend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// === Inventory Status ===

function InventoryStatus({ data }: { data: InventoryRow[] }) {
  if (data.length === 0) return null;

  const lowStockCount = data.filter((i) => i.daysOnHand < 5 && i.daysOnHand > 0).length;
  const criticalCount = data.filter((i) => i.daysOnHand <= 0 || (i.quantityOnHand <= 0)).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-[#06113e]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
          <CardTitle className="text-lg">Inventory Status</CardTitle>
        </div>
        <CardDescription>
          {data.length} items tracked
          {criticalCount > 0 && <span className="text-red-600 font-medium ml-2">{criticalCount} critical</span>}
          {lowStockCount > 0 && <span className="text-amber-600 font-medium ml-2">{lowStockCount} low stock</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Product</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Category</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">On Hand</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Daily Usage</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Days Supply</th>
                <th className="px-3 py-2.5 text-center font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const status =
                  item.quantityOnHand <= 0 || item.daysOnHand <= 0
                    ? "danger"
                    : item.daysOnHand < 5
                      ? "warning"
                      : "success";
                const statusLabel =
                  status === "danger"
                    ? "Critical"
                    : status === "warning"
                      ? "Low Stock"
                      : "OK";
                return (
                  <tr key={item.productId} className="border-b hover:bg-gray-50/30">
                    <td className="px-3 py-2.5">
                      <div>
                        <p className="font-medium text-[#06113e]">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.productSku}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${CATEGORY_BADGE_COLORS[item.category] ?? "bg-gray-100 text-gray-700"}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium">{item.quantityOnHand}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">{item.avgDailyUsage}</td>
                    <td className="px-3 py-2.5 text-right font-medium">
                      {item.daysOnHand >= 999 ? "999+" : item.daysOnHand}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <StatusBadge status={status} label={statusLabel} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// === Compliance Table ===

function ComplianceTable({ data }: { data: ComplianceRow[] }) {
  if (data.length === 0) return null;

  const compliantCount = data.filter((c) => c.isCompliant).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Mandate Compliance</CardTitle>
        <CardDescription>
          {compliantCount} of {data.length} required items compliant
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Product</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">SKU</th>
                <th className="px-3 py-2.5 text-center font-medium text-gray-600">Status</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Last Qty</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50/30">
                  <td className="px-3 py-2.5 font-medium text-[#06113e]">{item.productName}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{item.productSku}</td>
                  <td className="px-3 py-2.5 text-center">
                    <StatusBadge
                      status={item.isCompliant ? "success" : "danger"}
                      label={item.isCompliant ? "Compliant" : "Non-Compliant"}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right">{item.lastOrderQuantity ?? "—"}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{formatDate(item.lastOrderDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// === Recipe Summary ===

function RecipeSummary({ data }: { data: RecipeRow[] }) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-[#06113e]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
          </svg>
          <CardTitle className="text-lg">Cocktail Recipes</CardTitle>
        </div>
        <CardDescription>
          {data.length} active recipes for this venue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Recipe</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Ingredients</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Cost/Serving</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Menu Price</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Margin</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50/30">
                  <td className="px-3 py-2.5 font-medium text-[#06113e]">{r.name}</td>
                  <td className="px-3 py-2.5 text-right">{r.ingredientCount}</td>
                  <td className="px-3 py-2.5 text-right font-medium">${r.costPerServing.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right">
                    {r.sellingPrice ? `$${r.sellingPrice.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {r.marginPct !== null ? (
                      <span className={r.marginPct >= 75 ? "text-[#5ad196] font-medium" : r.marginPct >= 65 ? "text-amber-600 font-medium" : "text-red-600 font-medium"}>
                        {r.marginPct}%
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// === Main Export ===

export function OutletTabs({
  distributorBreakdown,
  productPerformance,
  wineProgram,
  inventorySnapshot,
  compliance,
  recipes,
}: OutletTabsProps) {
  return (
    <div className="space-y-6">
      <DistributorBreakdown data={distributorBreakdown} />
      <ProductTable data={productPerformance} />
      <WineProgram data={wineProgram} />
      <InventoryStatus data={inventorySnapshot} />
      <ComplianceTable data={compliance} />
      <RecipeSummary data={recipes} />
    </div>
  );
}
