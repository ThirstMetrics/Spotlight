"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/dashboard/DataTable";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  scope: string;
  isActive: boolean;
  lastLoginAt: Date | string | null;
  createdAt: Date | string;
}

const ROLE_COLORS: Record<string, string> = {
  DIRECTOR: "bg-[#06113e] text-white",
  VP: "bg-[#06113e] text-white",
  ADMIN: "bg-blue-500 text-white",
  ROOM_MANAGER: "bg-[#5ad196] text-white",
  DISTRIBUTOR: "bg-purple-500 text-white",
  SUPPLIER: "bg-amber-500 text-white",
};

const ROLE_LABELS: Record<string, string> = {
  VP: "VP",
  DIRECTOR: "Director",
  ADMIN: "Admin",
  ROOM_MANAGER: "Room Manager",
  DISTRIBUTOR: "Distributor",
  SUPPLIER: "Supplier",
};

const columns: Column<UserRow>[] = [
  {
    key: "name",
    label: "Name",
    render: (row) => (
      <span className="font-medium text-[#06113e]">{row.name}</span>
    ),
  },
  {
    key: "email",
    label: "Email",
    render: (row) => (
      <span className="text-muted-foreground">{row.email}</span>
    ),
  },
  {
    key: "role",
    label: "Role",
    render: (row) => (
      <Badge
        className={`text-xs ${ROLE_COLORS[row.role] ?? "bg-gray-200 text-gray-800"}`}
      >
        {ROLE_LABELS[row.role] ?? row.role}
      </Badge>
    ),
    searchValue: (row) => ROLE_LABELS[row.role] ?? row.role,
  },
  {
    key: "scope",
    label: "Scope",
    render: (row) => (
      <span className="text-muted-foreground text-xs">{row.scope}</span>
    ),
  },
  {
    key: "lastLoginAt",
    label: "Last Login",
    render: (row) => (
      <span className="text-muted-foreground">
        {row.lastLoginAt
          ? new Date(row.lastLoginAt).toLocaleDateString()
          : "Never"}
      </span>
    ),
    sortValue: (row) =>
      row.lastLoginAt ? new Date(row.lastLoginAt).getTime() : 0,
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
];

export function UsersTable({ data }: { data: UserRow[] }) {
  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Search users by name, email, role..."
    />
  );
}
