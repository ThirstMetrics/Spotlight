"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { notify } from "@/lib/hooks/use-notify";

interface TrackingNumberRow {
  id: string;
  outletId: string;
  outletName: string;
  outletType: string;
  outletActive: boolean;
  type: string;
  value: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  POS: "POS ID",
  COST_CENTER: "Cost Center",
  PURCHASING_SYSTEM: "Purchasing",
  GL_CODE: "GL Code",
  INVENTORY_SYSTEM: "Inventory",
  OTHER: "Other",
};

const TYPE_COLORS: Record<string, string> = {
  POS: "bg-blue-100 text-blue-800",
  COST_CENTER: "bg-purple-100 text-purple-800",
  PURCHASING_SYSTEM: "bg-amber-100 text-amber-800",
  GL_CODE: "bg-emerald-100 text-emerald-800",
  INVENTORY_SYSTEM: "bg-cyan-100 text-cyan-800",
  OTHER: "bg-gray-100 text-gray-800",
};

interface TrackingNumberTableProps {
  data: TrackingNumberRow[];
}

export function TrackingNumberTable({ data }: TrackingNumberTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);

    const res = await apiClient(`/api/admin/internal-accounts?id=${id}`, {
      method: "DELETE",
    });

    if (res.success) {
      notify.success("Tracking number removed");
      router.refresh();
    } else {
      notify.error(res.error ?? "Failed to delete");
    }

    setDeletingId(null);
  }

  const columns: Column<TrackingNumberRow>[] = [
    {
      key: "outletName",
      label: "Outlet",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-[#06113e]">{row.outletName}</span>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (row) => (
        <Badge
          variant="secondary"
          className={`text-xs ${TYPE_COLORS[row.type] ?? TYPE_COLORS.OTHER}`}
        >
          {TYPE_LABELS[row.type] ?? row.type}
        </Badge>
      ),
    },
    {
      key: "value",
      label: "Tracking Number",
      sortable: true,
      render: (row) => (
        <code className="rounded bg-gray-100 px-2 py-0.5 text-sm font-mono">
          {row.value}
        </code>
      ),
    },
    {
      key: "notes",
      label: "Notes",
      sortable: false,
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.notes || "—"}
        </span>
      ),
    },
    {
      key: "outletType",
      label: "Outlet Type",
      sortable: true,
      render: (row) => (
        <Badge variant="outline" className="text-xs">
          {row.outletType}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Search outlets, types, or tracking numbers..."
      actions={(row) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
          onClick={() => handleDelete(row.id)}
          disabled={deletingId === row.id}
        >
          {deletingId === row.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      )}
    />
  );
}
