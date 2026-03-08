"use client";

import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";

interface CostGoalRow {
  id: string;
  outletName: string;
  category: string | null;
  targetCostPercentage: number;
  effectiveDate: Date | string;
  createdBy: string;
}

const columns: Column<CostGoalRow>[] = [
  {
    key: "outletName",
    label: "Outlet",
    sortable: true,
    render: (row) => (
      <span className="font-medium text-[#06113e]">{row.outletName}</span>
    ),
  },
  {
    key: "category",
    label: "Category",
    sortable: true,
    sortValue: (row) => row.category ?? "ALL",
    render: (row) =>
      row.category ? (
        <Badge variant="secondary" className="text-xs">
          {row.category}
        </Badge>
      ) : (
        <Badge variant="outline" className="text-xs">
          All Categories
        </Badge>
      ),
  },
  {
    key: "targetCostPercentage",
    label: "Target %",
    align: "right",
    sortable: true,
    render: (row) => (
      <span className="tabular-nums font-medium">
        {row.targetCostPercentage.toFixed(1)}%
      </span>
    ),
  },
  {
    key: "effectiveDate",
    label: "Effective Date",
    sortable: true,
    sortValue: (row) => new Date(row.effectiveDate).getTime(),
    render: (row) => (
      <span className="text-muted-foreground">
        {new Date(row.effectiveDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
    ),
  },
  {
    key: "createdBy",
    label: "Created By",
    sortable: true,
    render: (row) => (
      <span className="text-muted-foreground">{row.createdBy}</span>
    ),
  },
];

export function CostGoalTable({ data }: { data: CostGoalRow[] }) {
  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Search goals..."
    />
  );
}
