"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  /** Return the raw sortable value for this column (defaults to row[key]) */
  sortValue?: (row: T) => string | number;
  /** Return the searchable string for this column (defaults to String(row[key])) */
  searchValue?: (row: T) => string;
  render: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  /** Optional action column rendered at the end of each row */
  actions?: (row: T, index: number) => React.ReactNode;
  pageSize?: number;
  searchPlaceholder?: string;
}

type SortDir = "asc" | "desc";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  actions,
  pageSize: initialPageSize = 25,
  searchPlaceholder = "Search...",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = col.searchValue
          ? col.searchValue(row)
          : String((row as Record<string, unknown>)[col.key] ?? "");
        return val.toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal = col.sortValue
        ? col.sortValue(a)
        : (a as Record<string, unknown>)[col.key];
      const bVal = col.sortValue
        ? col.sortValue(b)
        : (b as Record<string, unknown>)[col.key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let cmp = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [filtered, sortKey, sortDir, columns]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePageIndex = Math.min(page, totalPages - 1);
  const paged = sorted.slice(
    safePageIndex * pageSize,
    safePageIndex * pageSize + pageSize
  );

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  }

  return (
    <div className="space-y-3">
      {/* Toolbar: search + page size */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>of {sorted.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium text-gray-600 ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left"
                  } ${col.sortable !== false ? "cursor-pointer select-none hover:text-[#06113e]" : ""}`}
                  onClick={
                    col.sortable !== false ? () => handleSort(col.key) : undefined
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && (
                      <span className="inline-flex flex-col">
                        {sortKey === col.key ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-30" />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {search ? "No results match your search." : "No data available."}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={i}
                  className="border-b hover:bg-gray-50/30"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 ${
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                            ? "text-center"
                            : ""
                      }`}
                    >
                      {col.render(row, safePageIndex * pageSize + i)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">
                      {actions(row, safePageIndex * pageSize + i)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {safePageIndex * pageSize + 1}–
            {Math.min((safePageIndex + 1) * pageSize, sorted.length)} of{" "}
            {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={safePageIndex === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              // Show pages around current page
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i;
              } else if (safePageIndex <= 2) {
                pageNum = i;
              } else if (safePageIndex >= totalPages - 3) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = safePageIndex - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={safePageIndex === pageNum ? "default" : "outline"}
                  size="sm"
                  className={
                    safePageIndex === pageNum
                      ? "bg-[#06113e] text-white hover:bg-[#06113e]/90"
                      : ""
                  }
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum + 1}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={safePageIndex >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
