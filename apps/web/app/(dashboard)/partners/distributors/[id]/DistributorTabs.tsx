"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getAuthToken } from "@/lib/hooks/use-auth";

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
  distributorName: string;
  organizationName: string;
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

// === New Item Setup Form ===

interface RwlvSetupItem {
  id: string;
  rwlvDescription: string;
  category: string;
  vendor: string;
  vendorProductNum: string;
  vendorDescription: string;
  vendorPack: string;
  mfg: string;
  mfgNum: string;
  storageType: string;
  caseSplittable: string;
  stockedStatus: string;
  leadTime: string;
  vendorCost: string;
  canSplitCase: string;
  orderBy: string;
  priceBy: string;
  status: string;
  createdAt: string;
  reviewNote?: string | null;
  reviewer?: { name: string } | null;
}

const EMPTY_SETUP_ITEM = {
  rwlvDescription: "",
  category: "",
  vendor: "",
  vendorProductNum: "",
  vendorDescription: "",
  vendorPack: "",
  mfg: "",
  mfgNum: "",
  storageType: "Shelf-stable",
  caseSplittable: "Yes",
  stockedStatus: "Stocked",
  leadTime: "Stocked",
  vendorCost: "",
  canSplitCase: "Yes",
  orderBy: "case",
  priceBy: "case",
};

function NewItemSetup({ distributorName, organizationName }: { distributorName: string; organizationName: string }) {
  const [items, setItems] = useState<RwlvSetupItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_SETUP_ITEM, vendor: distributorName });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch("/api/admin/item-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch {
      // silently fail on fetch
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async () => {
    if (!form.rwlvDescription.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/admin/item-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setForm({ ...EMPTY_SETUP_ITEM, vendor: distributorName });
      setShowForm(false);
      fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const F = ({ label, value, field, placeholder, span }: { label: string; value: string; field: string; placeholder?: string; span?: number }) => (
    <div className={span ? `sm:col-span-${span}` : ""}>
      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</label>
      <Input
        value={value}
        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
        placeholder={placeholder}
        className="mt-0.5 text-sm h-8"
      />
    </div>
  );

  const Sel = ({ label, value, field, options }: { label: string; value: string; field: string; options: string[] }) => (
    <div>
      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
        className="mt-0.5 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm h-8"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{organizationName} Item Add Form</CardTitle>
            <CardDescription>
              Submit new items using the {organizationName} setup format. Items flow to the director&apos;s pending approval workflow.
            </CardDescription>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm font-medium text-white rounded-md"
            style={{ backgroundColor: "#5ad196" }}
          >
            + Add Item
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-6 rounded-lg border border-[#06113e]/20 bg-gray-50/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-[#06113e]">New Item Setup</h4>
              <Badge variant="secondary" className="text-[10px]">{organizationName} Format</Badge>
            </div>
            <div className="grid gap-x-3 gap-y-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              <div className="col-span-2">
                <F label="Product Description *" value={form.rwlvDescription} field="rwlvDescription" placeholder="e.g., Opus One 2021 750ML/6" />
              </div>
              <F label="Category" value={form.category} field="category" placeholder="e.g., CALIFORNIA Red" />
              <F label="Vendor" value={form.vendor} field="vendor" placeholder={distributorName} />
              <F label="Vendor Product #" value={form.vendorProductNum} field="vendorProductNum" placeholder="e.g., 10119" />
              <div className="col-span-2">
                <F label="Vendor Description" value={form.vendorDescription} field="vendorDescription" placeholder="e.g., Opus One 2021 6/750ml" />
              </div>
              <F label="Vendor Pack" value={form.vendorPack} field="vendorPack" placeholder="e.g., 6" />
              <F label="MFG (Manufacturer)" value={form.mfg} field="mfg" placeholder="e.g., Opus One Winery" />
              <F label="MFG #" value={form.mfgNum} field="mfgNum" placeholder="" />
              <Sel label="Storage Type" value={form.storageType} field="storageType" options={["Shelf-stable", "Refrigerated", "Frozen"]} />
              <Sel label="Is Master Case Split-able?" value={form.caseSplittable} field="caseSplittable" options={["Yes", "No"]} />
              <Sel label="Stocked or Non-stocked" value={form.stockedStatus} field="stockedStatus" options={["Stocked", "Non-stocked"]} />
              <F label="Lead Time (if not stocked)" value={form.leadTime} field="leadTime" placeholder="e.g., 3 business days" />
              <F label="Vendor Current Cost ($)" value={form.vendorCost} field="vendorCost" placeholder="Case cost" />
              <Sel label="Can You Split a Case?" value={form.canSplitCase} field="canSplitCase" options={["Yes", "No"]} />
              <Sel label="Order By" value={form.orderBy} field="orderBy" options={["case", "each", "keg"]} />
              <Sel label="Price By" value={form.priceBy} field="priceBy" options={["case", "each", "keg"]} />
            </div>
            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white rounded-md bg-[#06113e] hover:bg-[#06113e]/90 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit for Review"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 rounded-md border hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Submitted items table — matches RWLV spreadsheet columns */}
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="px-2 py-2 text-left font-medium text-gray-600">Description</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600">Category</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600">Vendor</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600">Vendor #</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600">Pack</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600">MFG</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600">Storage</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600">Stocked</th>
                  <th className="px-2 py-2 text-right font-medium text-gray-600">Cost</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600">Split?</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50/30">
                    <td className="px-2 py-2 font-medium text-[#06113e] max-w-[200px] truncate">{item.rwlvDescription}</td>
                    <td className="px-2 py-2 text-muted-foreground">{item.category || "—"}</td>
                    <td className="px-2 py-2 text-muted-foreground">{item.vendor}</td>
                    <td className="px-2 py-2 font-mono text-muted-foreground">{item.vendorProductNum || "—"}</td>
                    <td className="px-2 py-2">{item.vendorPack || "—"}</td>
                    <td className="px-2 py-2 text-muted-foreground">{item.mfg || "—"}</td>
                    <td className="px-2 py-2">{item.storageType}</td>
                    <td className="px-2 py-2">{item.stockedStatus}</td>
                    <td className="px-2 py-2 text-right font-medium">{item.vendorCost ? `$${item.vendorCost}` : "—"}</td>
                    <td className="px-2 py-2">{item.canSplitCase}</td>
                    <td className="px-2 py-2">
                      <Badge className={`text-[10px] ${
                        item.status === "APPROVED" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                        item.status === "REJECTED" ? "bg-red-100 text-red-800 hover:bg-red-100" :
                        item.status === "NEEDS_INFO" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                        "bg-amber-100 text-amber-800 hover:bg-amber-100"
                      }`}>
                        {item.status === "PENDING" ? "Pending Review" :
                         item.status === "NEEDS_INFO" ? "Needs Info" :
                         item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !showForm && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground mb-1">No new items submitted</p>
              <p className="text-xs text-muted-foreground">
                Click &ldquo;+ Add Item&rdquo; to submit a product setup for {organizationName} approval.
              </p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

// === Main Export ===

export function DistributorTabs({ distributorName, organizationName, outletPerformance, productPerformance, winePortfolio }: DistributorTabsProps) {
  const [activeView, setActiveView] = useState<"current" | "new-items">("current");

  return (
    <div className="space-y-6">
      {/* Top-level tab switcher */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveView("current")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeView === "current"
              ? "border-[#06113e] text-[#06113e]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Current Products
        </button>
        <button
          onClick={() => setActiveView("new-items")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeView === "new-items"
              ? "border-[#06113e] text-[#06113e]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          New Item Setup
        </button>
      </div>

      {activeView === "current" ? (
        <>
          <OutletTable data={outletPerformance} />
          <ProductTable data={productPerformance} />
          <WinePortfolio data={winePortfolio} />
        </>
      ) : (
        <NewItemSetup distributorName={distributorName} organizationName={organizationName} />
      )}
    </div>
  );
}
