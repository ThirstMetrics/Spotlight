"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";

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

interface ComplianceDrillDownProps {
  data: MandateDrillDown[];
}

export function ComplianceDrillDown({ data }: ComplianceDrillDownProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "compliant" | "non-compliant">("all");

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredData = useMemo(() => {
    const q = search.toLowerCase();
    return data
      .map((mandate) => ({
        ...mandate,
        items: mandate.items.filter((item) => {
          const matchesSearch =
            !q ||
            item.productName.toLowerCase().includes(q) ||
            item.productSku.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q);
          const matchesFilter =
            filter === "all" ||
            (filter === "compliant" && item.status === "full") ||
            (filter === "non-compliant" && item.status !== "full");
          return matchesSearch && matchesFilter;
        }),
      }))
      .filter((m) => m.items.length > 0);
  }, [data, search, filter]);

  const statusBadge = (status: "full" | "partial" | "none") => {
    if (status === "full")
      return (
        <Badge className="bg-[#5ad196]/15 text-[#2d8a5e] border-[#5ad196]/30 hover:bg-[#5ad196]/20">
          Compliant
        </Badge>
      );
    if (status === "partial")
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
          Partial
        </Badge>
      );
    return (
      <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
        Non-Compliant
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products, SKUs..."
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
              {f === "all" ? "All" : f === "compliant" ? "Compliant" : "Non-Compliant"}
            </button>
          ))}
        </div>
      </div>

      {/* Mandate groups */}
      {filteredData.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No items match the current filter.
        </div>
      ) : (
        filteredData.map((mandate) => (
          <div key={mandate.id} className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-[#06113e]">{mandate.name}</h3>
              <Badge variant="outline" className="text-[10px]">
                {mandate.items.length} items
              </Badge>
            </div>

            {/* Items table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-600 w-8"></th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Product</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 hidden sm:table-cell">SKU</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600 hidden md:table-cell">Category</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Outlets</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mandate.items.map((item) => {
                    const isExpanded = expandedItems.has(item.id);
                    return (
                      <>
                        {/* Item row */}
                        <tr
                          key={item.id}
                          className="border-b last:border-0 cursor-pointer hover:bg-gray-50/50 transition-colors"
                          onClick={() => toggleItem(item.id)}
                        >
                          <td className="py-2.5 px-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-[#06113e]">{item.productName}</span>
                            <span className="sm:hidden text-xs text-muted-foreground block">{item.productSku}</span>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground hidden sm:table-cell">
                            {item.productSku}
                          </td>
                          <td className="py-2.5 px-3 hidden md:table-cell">
                            <Badge variant="secondary" className="text-[10px]">
                              {item.category}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-14 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    item.status === "full"
                                      ? "bg-[#5ad196]"
                                      : item.status === "partial"
                                        ? "bg-amber-400"
                                        : "bg-red-400"
                                  }`}
                                  style={{
                                    width: `${item.total > 0 ? (item.compliant / item.total) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 tabular-nums">
                                {item.compliant}/{item.total}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">{statusBadge(item.status)}</td>
                        </tr>

                        {/* Expanded outlet rows */}
                        {isExpanded && (
                          <tr key={`${item.id}-detail`}>
                            <td colSpan={6} className="bg-gray-50/60 px-3 py-0">
                              <div className="py-2 pl-6">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-gray-500">
                                      <th className="text-left py-1 pr-3 font-medium">Outlet</th>
                                      <th className="text-center py-1 px-3 font-medium">Status</th>
                                      <th className="text-right py-1 px-3 font-medium hidden sm:table-cell">Last Order Qty</th>
                                      <th className="text-right py-1 pl-3 font-medium">Last Order Date</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.outlets.map((outlet) => (
                                      <tr key={outlet.id} className="border-t border-gray-100">
                                        <td className="py-1.5 pr-3 font-medium text-[#06113e]">
                                          {outlet.name}
                                        </td>
                                        <td className="py-1.5 px-3 text-center">
                                          {outlet.isCompliant ? (
                                            <span className="inline-flex items-center gap-1 text-[#2d8a5e]">
                                              <CheckCircle2 className="h-3.5 w-3.5" />
                                              <span className="hidden sm:inline">Ordered</span>
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 text-red-600">
                                              <XCircle className="h-3.5 w-3.5" />
                                              <span className="hidden sm:inline">Not Ordered</span>
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-1.5 px-3 text-right text-gray-600 hidden sm:table-cell">
                                          {outlet.lastOrderQuantity ?? "\u2014"}
                                        </td>
                                        <td className="py-1.5 pl-3 text-right text-gray-500">
                                          {outlet.lastOrderDate
                                            ? new Date(outlet.lastOrderDate).toLocaleDateString(
                                                "en-US",
                                                { month: "short", day: "numeric", year: "numeric" }
                                              )
                                            : "Never"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
