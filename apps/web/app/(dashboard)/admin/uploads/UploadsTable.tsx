"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/dashboard/DataTable";

interface UploadRow {
  id: string;
  fileName: string;
  fileSize: number;
  uploadType: string;
  uploadSource: string;
  status: string;
  recordsProcessed: number | null;
  recordsFailed: number | null;
  uploader: { name: string };
  createdAt: Date | string;
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-[#5ad196] text-white",
  PROCESSING: "bg-blue-500 text-white",
  PENDING: "bg-amber-500 text-white",
  FAILED: "bg-red-500 text-white",
};

const TYPE_LABELS: Record<string, string> = {
  WAREHOUSE_TRANSFER: "Warehouse Transfer",
  DIRECT_ORDER: "Direct Order",
  SALES_DATA: "Sales Data",
  DISTRIBUTOR_CHART: "Distributor Chart",
};

const columns: Column<UploadRow>[] = [
  {
    key: "fileName",
    label: "File Name",
    render: (row) => (
      <span className="font-medium text-[#06113e]">
        {row.fileName}
        <span className="text-xs text-muted-foreground ml-1">
          ({(row.fileSize / 1024).toFixed(0)} KB)
        </span>
      </span>
    ),
  },
  {
    key: "uploadType",
    label: "Type",
    render: (row) => (
      <Badge variant="secondary" className="text-xs">
        {TYPE_LABELS[row.uploadType] ?? row.uploadType}
      </Badge>
    ),
    searchValue: (row) => TYPE_LABELS[row.uploadType] ?? row.uploadType,
  },
  {
    key: "uploadSource",
    label: "Source",
    render: (row) => (
      <span className="text-muted-foreground">{row.uploadSource}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (row) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[row.status] ?? "bg-gray-200"}`}
      >
        {row.status}
      </span>
    ),
  },
  {
    key: "recordsProcessed",
    label: "Records",
    align: "right",
    render: (row) =>
      row.recordsProcessed != null ? (
        <span>
          {row.recordsProcessed}
          {(row.recordsFailed ?? 0) > 0 && (
            <span className="text-red-500 ml-1">
              ({row.recordsFailed} failed)
            </span>
          )}
        </span>
      ) : (
        <span className="text-muted-foreground">\u2014</span>
      ),
    sortValue: (row) => row.recordsProcessed ?? 0,
  },
  {
    key: "uploader",
    label: "Uploaded By",
    render: (row) => (
      <span className="text-muted-foreground">{row.uploader.name}</span>
    ),
    searchValue: (row) => row.uploader.name,
    sortValue: (row) => row.uploader.name,
  },
  {
    key: "createdAt",
    label: "Date",
    render: (row) => (
      <span className="text-muted-foreground">
        {new Date(row.createdAt).toLocaleDateString()}
      </span>
    ),
    sortValue: (row) => new Date(row.createdAt).getTime(),
  },
];

export function UploadsTable({ data }: { data: UploadRow[] }) {
  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Search files, sources..."
    />
  );
}
