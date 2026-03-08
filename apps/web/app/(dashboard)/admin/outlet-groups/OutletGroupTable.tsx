"use client";

import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";

interface OutletGroupRow {
  id: string;
  name: string;
  outlets: { id: string; name: string; isActive: boolean }[];
  outletCount: number;
  createdAt: Date | string;
}

const columns: Column<OutletGroupRow>[] = [
  {
    key: "name",
    label: "Group Name",
    sortable: true,
    render: (row) => (
      <span className="font-medium text-[#06113e]">{row.name}</span>
    ),
  },
  {
    key: "outlets",
    label: "Outlets",
    sortable: false,
    render: (row) =>
      row.outlets.length === 0 ? (
        <span className="text-muted-foreground text-xs">No outlets assigned</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {row.outlets.map((outlet) => (
            <Badge
              key={outlet.id}
              variant={outlet.isActive ? "secondary" : "outline"}
              className="text-xs"
            >
              {outlet.name}
            </Badge>
          ))}
        </div>
      ),
  },
  {
    key: "outletCount",
    label: "Outlet Count",
    align: "right",
    sortable: true,
    render: (row) => (
      <span className="tabular-nums">{row.outletCount}</span>
    ),
  },
  {
    key: "createdAt",
    label: "Created",
    sortable: true,
    sortValue: (row) => new Date(row.createdAt).getTime(),
    render: (row) => (
      <span className="text-muted-foreground">
        {new Date(row.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
    ),
  },
];

export function OutletGroupTable({ data }: { data: OutletGroupRow[] }) {
  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Search groups..."
    />
  );
}
