"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/dashboard/DataTable";

interface OutletRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  managerName: string | null;
  phone: string | null;
  isActive: boolean;
  groupName: string | null;
  orderCount: number;
}

const TYPE_LABELS: Record<string, string> = {
  restaurant: "Restaurant",
  bar: "Bar",
  lounge: "Lounge",
  pool: "Pool",
  nightclub: "Nightclub",
  cafe: "Cafe",
  other: "Other",
};

const columns: Column<OutletRow>[] = [
  {
    key: "name",
    label: "Name",
    render: (row) => (
      <span className="font-medium text-[#06113e]">{row.name}</span>
    ),
  },
  {
    key: "type",
    label: "Type",
    render: (row) => (
      <span className="text-muted-foreground">
        {TYPE_LABELS[row.type] ?? row.type}
      </span>
    ),
    searchValue: (row) => TYPE_LABELS[row.type] ?? row.type,
  },
  {
    key: "groupName",
    label: "Group",
    sortable: false,
    render: (row) =>
      row.groupName ? (
        <Badge variant="secondary" className="text-xs">
          {row.groupName}
        </Badge>
      ) : (
        <span className="text-muted-foreground text-xs">--</span>
      ),
    searchValue: (row) => row.groupName ?? "",
  },
  {
    key: "managerName",
    label: "Manager",
    render: (row) => (
      <span className="text-muted-foreground">
        {row.managerName ?? "--"}
      </span>
    ),
    searchValue: (row) => row.managerName ?? "",
  },
  {
    key: "isActive",
    label: "Status",
    sortValue: (row) => (row.isActive ? 1 : 0),
    render: (row) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          row.isActive
            ? "bg-[#5ad196] text-white"
            : "bg-gray-200 text-gray-600"
        }`}
      >
        {row.isActive ? "Active" : "Inactive"}
      </span>
    ),
    searchValue: (row) => (row.isActive ? "active" : "inactive"),
  },
  {
    key: "orderCount",
    label: "Orders",
    align: "right",
    render: (row) =>
      row.orderCount > 0 ? (
        <span className="font-medium">{row.orderCount.toLocaleString()}</span>
      ) : (
        <span className="text-muted-foreground">0</span>
      ),
  },
];

export function OutletTable({ data }: { data: OutletRow[] }) {
  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Search outlets..."
    />
  );
}
