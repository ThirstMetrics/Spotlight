"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/dashboard/DataTable";

interface InventoryItem {
  outletId: string;
  outletName: string;
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  quantityOnHand: number;
  avgDailyUsage: number;
  daysOnHand: number;
}

const columns: Column<InventoryItem>[] = [
  {
    key: "outletName",
    label: "Outlet",
    render: (row) => (
      <span className="font-medium text-[#06113e]">{row.outletName}</span>
    ),
  },
  {
    key: "productName",
    label: "Product",
    render: (row) => (
      <div>
        <span className="font-medium">{row.productName}</span>
        <span className="text-xs text-muted-foreground ml-1">
          ({row.productSku})
        </span>
      </div>
    ),
    searchValue: (row) => `${row.productName} ${row.productSku}`,
  },
  {
    key: "category",
    label: "Category",
    render: (row) => (
      <Badge variant="secondary" className="text-xs">
        {row.category}
      </Badge>
    ),
  },
  {
    key: "quantityOnHand",
    label: "Qty On Hand",
    align: "right",
    render: (row) => (
      <span className="font-medium">{row.quantityOnHand.toFixed(0)}</span>
    ),
  },
  {
    key: "avgDailyUsage",
    label: "Avg Daily Usage",
    align: "right",
    render: (row) => (
      <span className="text-muted-foreground">{row.avgDailyUsage.toFixed(1)}</span>
    ),
  },
  {
    key: "daysOnHand",
    label: "Days On Hand",
    align: "right",
    render: (row) => (
      <span
        className={
          row.daysOnHand <= 2
            ? "text-red-600 font-bold"
            : row.daysOnHand <= 5
              ? "text-amber-600 font-medium"
              : "text-[#5ad196] font-medium"
        }
      >
        {row.daysOnHand >= 999 ? "\u221E" : `${row.daysOnHand}d`}
      </span>
    ),
  },
];

export function InventoryTable({ data }: { data: InventoryItem[] }) {
  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Search products, outlets..."
    />
  );
}
