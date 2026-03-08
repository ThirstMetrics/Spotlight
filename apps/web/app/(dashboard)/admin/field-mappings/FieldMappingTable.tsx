"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Trash2, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { notify } from "@/lib/hooks/use-notify";

export interface FieldMappingRow {
  id: string;
  name: string;
  source: string;
  uploadType: string;
  columnCount: number;
  createdBy: string;
  createdAt: string;
}

const SOURCE_COLORS: Record<string, string> = {
  BIRCHSTREET: "bg-blue-500 text-white",
  STRATTON_WARREN: "bg-purple-500 text-white",
  ORACLE: "bg-red-500 text-white",
  MICROS: "bg-amber-500 text-white",
  AGILYSYS: "bg-[#5ad196] text-white",
  TOAST: "bg-orange-500 text-white",
  OTHER: "bg-gray-500 text-white",
};

const SOURCE_LABELS: Record<string, string> = {
  BIRCHSTREET: "BirchStreet",
  STRATTON_WARREN: "Stratton Warren",
  ORACLE: "Oracle",
  MICROS: "Micros",
  AGILYSYS: "Agilysys",
  TOAST: "Toast",
  OTHER: "Other",
};

const TYPE_LABELS: Record<string, string> = {
  WAREHOUSE_TRANSFER: "Warehouse Transfer",
  DIRECT_ORDER: "Direct Order",
  SALES_DATA: "Sales Data",
  DISTRIBUTOR_CHART: "Distributor Chart",
};

const TYPE_COLORS: Record<string, string> = {
  WAREHOUSE_TRANSFER: "bg-blue-100 text-blue-800",
  DIRECT_ORDER: "bg-purple-100 text-purple-800",
  SALES_DATA: "bg-emerald-100 text-emerald-800",
  DISTRIBUTOR_CHART: "bg-amber-100 text-amber-800",
};

interface FieldMappingTableProps {
  data: FieldMappingRow[];
}

export function FieldMappingTable({ data }: FieldMappingTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete mapping profile "${name}"? This cannot be undone.`)) return;

    setDeletingId(id);

    const res = await apiClient(`/api/admin/field-mappings?id=${id}`, {
      method: "DELETE",
    });

    if (res.success) {
      notify.success("Mapping profile deleted");
      router.refresh();
    } else {
      notify.error(res.error ?? "Failed to delete mapping profile");
    }

    setDeletingId(null);
  }

  const columns: Column<FieldMappingRow>[] = [
    {
      key: "name",
      label: "Profile Name",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-[#06113e]">{row.name}</span>
      ),
    },
    {
      key: "source",
      label: "Source",
      sortable: true,
      render: (row) => (
        <Badge
          className={`text-xs ${SOURCE_COLORS[row.source] ?? "bg-gray-200 text-gray-800"}`}
        >
          {SOURCE_LABELS[row.source] ?? row.source}
        </Badge>
      ),
      searchValue: (row) => SOURCE_LABELS[row.source] ?? row.source,
    },
    {
      key: "uploadType",
      label: "Upload Type",
      sortable: true,
      render: (row) => (
        <Badge
          variant="secondary"
          className={`text-xs ${TYPE_COLORS[row.uploadType] ?? "bg-gray-100 text-gray-700"}`}
        >
          {TYPE_LABELS[row.uploadType] ?? row.uploadType}
        </Badge>
      ),
      searchValue: (row) => TYPE_LABELS[row.uploadType] ?? row.uploadType,
    },
    {
      key: "columnCount",
      label: "Columns Mapped",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className="text-sm font-mono text-[#06113e]">{row.columnCount}</span>
      ),
    },
    {
      key: "createdBy",
      label: "Created By",
      render: (row) => (
        <span className="text-muted-foreground text-xs">{row.createdBy}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (row) => (
        <span className="text-muted-foreground text-xs">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
      sortValue: (row) => new Date(row.createdAt).getTime(),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Search profiles, sources, or types..."
      actions={(row) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
          onClick={() => handleDelete(row.id, row.name)}
          disabled={deletingId === row.id}
          title="Delete profile"
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
