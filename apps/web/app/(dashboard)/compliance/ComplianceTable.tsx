"use client";

import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTable, type Column } from "@/components/dashboard/DataTable";

interface ComplianceRow {
  id: string;
  outletName: string;
  mandateName: string;
  productName: string;
  productSku: string;
  category: string;
  isCompliant: boolean;
  lastOrderQuantity: number | null;
  lastOrderDate: Date | string | null;
}

const columns: Column<ComplianceRow>[] = [
  {
    key: "outletName",
    label: "Outlet",
    render: (row) => (
      <span className="font-medium text-[#06113e]">{row.outletName}</span>
    ),
  },
  {
    key: "mandateName",
    label: "Mandate",
    render: (row) => (
      <span className="text-muted-foreground">{row.mandateName}</span>
    ),
  },
  {
    key: "productName",
    label: "Product",
    render: (row) => (
      <div>
        <p className="font-medium">{row.productName}</p>
        <p className="text-xs text-muted-foreground">{row.productSku}</p>
      </div>
    ),
    searchValue: (row) => `${row.productName} ${row.productSku}`,
  },
  {
    key: "category",
    label: "Category",
    render: (row) => (
      <Badge variant="secondary" className="text-[10px]">
        {row.category}
      </Badge>
    ),
  },
  {
    key: "isCompliant",
    label: "Status",
    align: "center",
    sortValue: (row) => (row.isCompliant ? 1 : 0),
    render: (row) => (
      <StatusBadge
        status={row.isCompliant ? "success" : "danger"}
        label={row.isCompliant ? "Compliant" : "Non-Compliant"}
      />
    ),
    searchValue: (row) => (row.isCompliant ? "compliant" : "non-compliant"),
  },
  {
    key: "lastOrderQuantity",
    label: "Last Qty",
    align: "right",
    render: (row) => <span>{row.lastOrderQuantity ?? "\u2014"}</span>,
  },
  {
    key: "lastOrderDate",
    label: "Last Order",
    render: (row) => (
      <span className="text-muted-foreground">
        {row.lastOrderDate
          ? new Date(row.lastOrderDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Never ordered"}
      </span>
    ),
    sortValue: (row) =>
      row.lastOrderDate ? new Date(row.lastOrderDate).getTime() : 0,
  },
];

export function ComplianceTable({ data }: { data: ComplianceRow[] }) {
  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Search outlets, products..."
    />
  );
}
