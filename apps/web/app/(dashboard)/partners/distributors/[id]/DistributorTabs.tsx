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

// === Types ===

interface OutletRow {
  outletId: string;
  name: string;
  slug: string;
  type: string;
  volume: number;
  spend: number;
  productCount: number;
  lastOrder: string | null;
  topProduct: string;
}

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  subcategory: string | null;
  size: string | null;
  cost: number;
  supplierName: string;
  units: number;
  spend: number;
  outletCount: number;
  lastOrder: string | null;
}

interface WineRow {
  id: string;
  name: string;
  sku: string;
  subcategory: string | null;
  size: string | null;
  cost: number;
  supplierName: string;
  units: number;
  spend: number;
  outlets: string[];
}

interface DistributorTabsProps {
  outletPerformance: OutletRow[];
  productPerformance: ProductRow[];
  winePortfolio: WineRow[];
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

// === Outlet Performance Table ===

function OutletTable({ data }: { data: OutletRow[] }) {
  const [sortKey, setSortKey] = useState<"spend" | "volume" | "productCount">("spend");
  const sorted = useMemo(
    () => [...data].sort((a, b) => b[sortKey] - a[sortKey]),
    [data, sortKey]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Outlet Performance</CardTitle>
        <CardDescription>
          Volume and spend by outlet (last 12 months)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Outlet</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Type</th>
                <th
                  className="px-3 py-2.5 text-right font-medium text-gray-600 cursor-pointer hover:text-[#06113e]"
                  onClick={() => setSortKey("productCount")}
                >
                  Products {sortKey === "productCount" && "▼"}
                </th>
                <th
                  className="px-3 py-2.5 text-right font-medium text-gray-600 cursor-pointer hover:text-[#06113e]"
                  onClick={() => setSortKey("volume")}
                >
                  Units {sortKey === "volume" && "▼"}
                </th>
                <th
                  className="px-3 py-2.5 text-right font-medium text-gray-600 cursor-pointer hover:text-[#06113e]"
                  onClick={() => setSortKey("spend")}
                >
                  Spend {sortKey === "spend" && "▼"}
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Last Order</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Top Product</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.outletId} className="border-b hover:bg-gray-50/30">
                  <td className="px-3 py-2.5 font-medium text-[#06113e]">{row.name}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant="secondary" className="text-[10px]">{row.type}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right">{row.productCount}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{row.volume.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{formatCurrency(row.spend)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{formatDate(row.lastOrder)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{row.topProduct}</td>
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
          (p.subcategory && p.subcategory.toLowerCase().includes(q))
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
            <CardDescription>All products carried — filter by category</CardDescription>
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
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Units (12mo)</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Spend</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Outlets</th>
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
                  <td className="px-3 py-2.5 text-right font-medium">{p.units.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{formatCurrency(p.spend)}</td>
                  <td className="px-3 py-2.5 text-right">{p.outletCount}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{formatDate(p.lastOrder)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
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

// === Wine Portfolio Section ===

function WinePortfolio({ data }: { data: WineRow[] }) {
  if (data.length === 0) return null;

  return (
    <Card className="border-l-4 border-l-[#5ad196]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-[#5ad196]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
          <CardTitle className="text-lg">Wine Portfolio</CardTitle>
        </div>
        <CardDescription>
          {data.length} wines across {new Set(data.flatMap((w) => w.outlets)).size} outlets
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
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Units (12mo)</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600">Spend</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600">Outlet Placement</th>
              </tr>
            </thead>
            <tbody>
              {data.map((w) => (
                <tr key={w.id} className="border-b hover:bg-gray-50/30">
                  <td className="px-3 py-2.5">
                    <div>
                      <p className="font-medium text-[#06113e]">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.supplierName}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{w.subcategory}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{w.size}</td>
                  <td className="px-3 py-2.5 text-right">${w.cost.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{w.units.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{formatCurrency(w.spend)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {w.outlets.map((outlet) => (
                        <span
                          key={outlet}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#06113e]/5 text-[#06113e] border border-[#06113e]/10"
                        >
                          {outlet}
                        </span>
                      ))}
                      {w.outlets.length === 0 && (
                        <span className="text-xs text-muted-foreground">No orders yet</span>
                      )}
                    </div>
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

export function DistributorTabs({ outletPerformance, productPerformance, winePortfolio }: DistributorTabsProps) {
  return (
    <div className="space-y-6">
      <OutletTable data={outletPerformance} />
      <ProductTable data={productPerformance} />
      <WinePortfolio data={winePortfolio} />
    </div>
  );
}
