export const dynamic = "force-dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getUploadHistory, getUploadStats } from "@/lib/queries/admin";

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

export default async function UploadsPage() {
  const [uploads, stats] = await Promise.all([
    getUploadHistory(),
    getUploadStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Data Uploads
        </h1>
        <p className="text-muted-foreground">
          Upload CSV/Excel files for warehouse transfers, direct orders, and
          sales data.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Uploads"
          value={stats.total}
          subtitle={`${stats.recent} in last 30 days`}
        />
        <MetricCard
          label="Completed"
          value={stats.completed}
          subtitle={`${stats.totalRecords.toLocaleString()} records processed`}
        />
        <MetricCard
          label="Failed"
          value={stats.failed}
          trend={stats.failed > 0 ? "down" : undefined}
        />
        <MetricCard
          label="Records Processed"
          value={stats.totalRecords.toLocaleString()}
          subtitle="Across all uploads"
        />
      </div>

      {/* Upload Types */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(
          [
            "WAREHOUSE_TRANSFER",
            "DIRECT_ORDER",
            "SALES_DATA",
            "DISTRIBUTOR_CHART",
          ] as const
        ).map((type) => {
          const count = uploads.filter((u) => u.uploadType === type).length;
          const lastUpload = uploads.find((u) => u.uploadType === type);
          return (
            <Card key={type} className="hover:border-[#5ad196] transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {TYPE_LABELS[type]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-[#06113e]">
                  {count} uploads
                </div>
                <p className="text-xs text-muted-foreground">
                  {lastUpload
                    ? `Last: ${new Date(lastUpload.createdAt).toLocaleDateString()}`
                    : "No uploads yet"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upload History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload History</CardTitle>
          <CardDescription>
            Recent file uploads and their processing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploads.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No uploads yet. Use the upload form above to import data files.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      File Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      Records
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Uploaded By
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((upload) => (
                    <tr
                      key={upload.id}
                      className="border-b hover:bg-gray-50/30"
                    >
                      <td className="px-4 py-3 font-medium text-[#06113e]">
                        {upload.fileName}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({(upload.fileSize / 1024).toFixed(0)} KB)
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs">
                          {TYPE_LABELS[upload.uploadType] ?? upload.uploadType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {upload.uploadSource}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[upload.status] ?? "bg-gray-200"}`}
                        >
                          {upload.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {upload.recordsProcessed != null ? (
                          <span>
                            {upload.recordsProcessed}
                            {(upload.recordsFailed ?? 0) > 0 && (
                              <span className="text-red-500 ml-1">
                                ({upload.recordsFailed} failed)
                              </span>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {upload.uploader.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(upload.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
