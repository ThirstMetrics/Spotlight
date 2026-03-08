"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types — mirrors the shapes returned by compliance queries          */
/* ------------------------------------------------------------------ */

interface OutletSummary {
  id: string;
  name: string;
  slug: string;
  total: number;
  compliant: number;
  nonCompliant: number;
  pct: number;
}

interface OutletCompliance {
  id: string;
  name: string;
  slug: string;
  isCompliant: boolean;
  lastOrderDate: Date | string | null;
  lastOrderQuantity: number | null;
}

interface DrillDownItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  minimumQuantity: number | null;
  total: number;
  compliant: number;
  nonCompliant: number;
  status: "full" | "partial" | "none";
  outlets: OutletCompliance[];
}

interface MandateDrillDown {
  id: string;
  name: string;
  description: string | null;
  items: DrillDownItem[];
}

/* The items we surface for a single outlet */
interface OutletItemRow {
  mandateItemId: string;
  productName: string;
  productSku: string;
  category: string;
  mandateName: string;
  isCompliant: boolean;
  lastOrderDate: Date | string | null;
  lastOrderQuantity: number | null;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface OutletComplianceCardsProps {
  outletData: OutletSummary[];
  drillDownData: MandateDrillDown[];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OutletComplianceCards({
  outletData,
  drillDownData,
}: OutletComplianceCardsProps) {
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "compliant" | "non-compliant">(
    "all"
  );

  /* Pivot drill-down data into a map: outletId → OutletItemRow[] */
  const outletItemsMap = useMemo(() => {
    const map = new Map<string, OutletItemRow[]>();
    for (const mandate of drillDownData) {
      for (const item of mandate.items) {
        for (const outlet of item.outlets) {
          const rows = map.get(outlet.id) ?? [];
          rows.push({
            mandateItemId: item.id,
            productName: item.productName,
            productSku: item.productSku,
            category: item.category,
            mandateName: mandate.name,
            isCompliant: outlet.isCompliant,
            lastOrderDate: outlet.lastOrderDate,
            lastOrderQuantity: outlet.lastOrderQuantity,
          });
          map.set(outlet.id, rows);
        }
      }
    }
    // Sort each outlet's items: non-compliant first, then alphabetical
    for (const [id, rows] of map) {
      map.set(
        id,
        rows.sort((a, b) => {
          if (a.isCompliant !== b.isCompliant) return a.isCompliant ? 1 : -1;
          return a.productName.localeCompare(b.productName);
        })
      );
    }
    return map;
  }, [drillDownData]);

  /* Filter selected outlet's items by search + status filter */
  const filteredItems = useMemo(() => {
    if (!selectedOutletId) return [];
    const rows = outletItemsMap.get(selectedOutletId) ?? [];
    const q = search.toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        row.productName.toLowerCase().includes(q) ||
        row.productSku.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.mandateName.toLowerCase().includes(q);
      const matchesFilter =
        filter === "all" ||
        (filter === "compliant" && row.isCompliant) ||
        (filter === "non-compliant" && !row.isCompliant);
      return matchesSearch && matchesFilter;
    });
  }, [selectedOutletId, outletItemsMap, search, filter]);

  const selectedOutlet = outletData.find((o) => o.id === selectedOutletId);

  const toggleOutlet = (id: string) => {
    setSelectedOutletId((prev) => {
      if (prev === id) return null;
      // Reset filters when switching outlets
      setSearch("");
      setFilter("all");
      return id;
    });
  };

  return (
    <div className="space-y-0">
      {/* Outlet card grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {outletData.map((outlet) => {
          const isSelected = outlet.id === selectedOutletId;
          return (
            <div
              key={outlet.id}
              onClick={() => toggleOutlet(outlet.id)}
              className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-[#06113e] border-[#06113e] bg-[#06113e]/[0.02]"
                  : "hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2">
                {isSelected ? (
                  <ChevronDown className="h-4 w-4 text-[#06113e] shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                )}
                <div>
                  <p className="font-medium text-[#06113e]">{outlet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {outlet.compliant}/{outlet.total} items
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      outlet.pct >= 90
                        ? "bg-[#5ad196]"
                        : outlet.pct >= 70
                          ? "bg-amber-400"
                          : "bg-red-400"
                    }`}
                    style={{ width: `${outlet.pct}%` }}
                  />
                </div>
                <span
                  className={`text-sm font-bold tabular-nums ${
                    outlet.pct >= 90
                      ? "text-[#5ad196]"
                      : outlet.pct >= 70
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {outlet.pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded detail panel */}
      {selectedOutlet && (
        <div className="mt-4 border rounded-lg overflow-hidden">
          {/* Panel header */}
          <div className="bg-gray-50/80 border-b px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[#06113e]">
                {selectedOutlet.name}
              </h4>
              <p className="text-xs text-muted-foreground">
                {selectedOutlet.compliant} of {selectedOutlet.total} mandate
                items compliant &middot;{" "}
                {selectedOutlet.nonCompliant > 0 ? (
                  <span className="text-red-600 font-medium">
                    {selectedOutlet.nonCompliant} need attention
                  </span>
                ) : (
                  <span className="text-[#2d8a5e] font-medium">
                    Fully compliant
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Search + filter controls */}
          <div className="px-4 py-3 border-b bg-white flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products, SKUs, mandates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1 rounded-lg border p-1 bg-gray-50">
              {(["all", "compliant", "non-compliant"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filter === f
                      ? "bg-white shadow-sm text-[#06113e]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f === "all"
                    ? "All"
                    : f === "compliant"
                      ? "Compliant"
                      : "Non-Compliant"}
                </button>
              ))}
            </div>
          </div>

          {/* Items table */}
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {search || filter !== "all"
                ? "No items match the current filter."
                : "No mandate items found for this outlet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/60 border-b">
                    <th className="text-left py-2 px-4 font-medium text-gray-600">
                      Product
                    </th>
                    <th className="text-left py-2 px-4 font-medium text-gray-600 hidden sm:table-cell">
                      SKU
                    </th>
                    <th className="text-left py-2 px-4 font-medium text-gray-600 hidden md:table-cell">
                      Category
                    </th>
                    <th className="text-left py-2 px-4 font-medium text-gray-600 hidden lg:table-cell">
                      Mandate
                    </th>
                    <th className="text-center py-2 px-4 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-right py-2 px-4 font-medium text-gray-600 hidden sm:table-cell">
                      Last Qty
                    </th>
                    <th className="text-right py-2 px-4 font-medium text-gray-600">
                      Last Order
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((row) => (
                    <tr
                      key={row.mandateItemId}
                      className="border-b last:border-0 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <span className="font-medium text-[#06113e]">
                          {row.productName}
                        </span>
                        <span className="sm:hidden text-xs text-muted-foreground block">
                          {row.productSku}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground hidden sm:table-cell">
                        {row.productSku}
                      </td>
                      <td className="py-2.5 px-4 hidden md:table-cell">
                        <Badge variant="secondary" className="text-[10px]">
                          {row.category}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 hidden lg:table-cell">
                        <span className="text-xs text-gray-500">
                          {row.mandateName}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {row.isCompliant ? (
                          <span className="inline-flex items-center gap-1.5 text-[#2d8a5e]">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="hidden sm:inline text-xs font-medium">
                              Ordered
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span className="hidden sm:inline text-xs font-medium">
                              Not Ordered
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right text-gray-600 tabular-nums hidden sm:table-cell">
                        {row.lastOrderQuantity ?? "\u2014"}
                      </td>
                      <td className="py-2.5 px-4 text-right text-gray-500">
                        {row.lastOrderDate
                          ? new Date(row.lastOrderDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer summary */}
          {filteredItems.length > 0 && (
            <div className="px-4 py-2 border-t bg-gray-50/40 text-xs text-muted-foreground">
              Showing {filteredItems.length} item
              {filteredItems.length !== 1 ? "s" : ""}
              {search || filter !== "all" ? " (filtered)" : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
