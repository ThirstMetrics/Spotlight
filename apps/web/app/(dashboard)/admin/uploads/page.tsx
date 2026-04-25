export const dynamic = "force-dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getUploadHistory, getUploadStats } from "@/lib/queries/admin";
import { getServerUser } from "@/lib/auth";
import { UploadsTable } from "./UploadsTable";
import { FileUploader } from "@/components/dashboard/FileUploader";

const TYPE_LABELS: Record<string, string> = {
  WAREHOUSE_TRANSFER: "Warehouse Transfer",
  DIRECT_ORDER: "Direct Order",
  SALES_DATA: "Sales Data",
  DISTRIBUTOR_CHART: "Distributor Chart",
};

export default async function UploadsPage() {
  const user = await getServerUser();
  const orgId = user?.organizationId;
  const [uploads, stats] = await Promise.all([
    getUploadHistory(50, orgId),
    getUploadStats(orgId),
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

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Data File</CardTitle>
          <CardDescription>
            Upload a CSV or Excel file from your inventory or POS system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader />
        </CardContent>
      </Card>

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
            <UploadsTable data={uploads} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
