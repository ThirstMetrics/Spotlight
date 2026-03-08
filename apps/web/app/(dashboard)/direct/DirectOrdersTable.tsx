"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/dashboard/DataTable";

interface DirectOrderRow {
  productName: string;
  productSku: string;
  category: string;
  vendorName: string;
  outlets: string[];
  frequency: string;
  orderCount: number;
  totalQuantity: number;
  firstOrder: Date;
  lastOrder: Date;
}

const columns: Column<DirectOrderRow>[] = [
  {
    key: "productName",
    label: "Product",
    render: (row) => (
      <div>
        <p className="font-medium text-[#06113e]">{row.productName}</p>
        <p className="text-xs text-muted-foreground font-mono">{row.productSku}</p>
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
    key: "vendorName",
    label: "Vendor",
    render: (row) => (
      <span className="text-muted-foreground">{row.vendorName}</span>
    ),
  },
  {
    key: "outlets",
    label: "Outlets",
    sortable: false,
    render: (row) => (
      <div className="flex flex-wrap gap-1">
        {row.outlets.map((outlet) => (
          <Badge
            key={outlet}
            variant="outline"
            className="text-[10px] border-[#5ad196]/30 text-[#06113e]"
          >
            {outlet}
          </Badge>
        ))}
      </div>
    ),
    searchValue: (row) => row.outlets.join(" "),
  },
  {
    key: "frequency",
    label: "Frequency",
    render: (row) => <span className="text-sm">{row.frequency}</span>,
  },
  {
    key: "orderCount",
    label: "Orders",
    align: "right",
    render: (row) => (
      <div className="text-right">
        <span className="font-medium">{row.orderCount}</span>
        <span className="text-muted-foreground text-xs ml-1">
          ({row.totalQuantity.toLocaleString()} units)
        </span>
      </div>
    ),
    sortValue: (row) => row.orderCount,
  },
  {
    key: "lastOrder",
    label: "Last Order",
    align: "right",
    render: (row) => (
      <span className="text-muted-foreground text-xs">
        {new Date(row.lastOrder).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
    ),
    sortValue: (row) => new Date(row.lastOrder).getTime(),
  },
];

export function DirectOrdersTable({ data }: { data: DirectOrderRow[] }) {
  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Search direct orders..."
    />
  );
}
