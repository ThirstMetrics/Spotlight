import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const uploadTypes = [
  {
    type: "Purchases",
    description: "BirchStreet, Stratton Warren, or Oracle purchase order exports",
    lastUpload: "2026-02-28",
    format: "CSV / Excel",
  },
  {
    type: "Warehouse Transfers",
    description: "Items transferred from central warehouse to outlets",
    lastUpload: "2026-02-27",
    format: "CSV / Excel",
  },
  {
    type: "Direct Orders",
    description: "Items shipped directly from vendors to outlets",
    lastUpload: "2026-02-25",
    format: "CSV / Excel",
  },
  {
    type: "Sales Data",
    description: "POS exports from Micros, Agilysys, or Toast",
    lastUpload: "2026-02-28",
    format: "Excel",
  },
];

const recentUploads = [
  {
    filename: "birchstreet_feb_2026.xlsx",
    type: "Purchases",
    records: 1247,
    status: "processed",
    date: "2026-02-28",
  },
  {
    filename: "warehouse_transfers_wk8.csv",
    type: "Warehouse Transfers",
    records: 342,
    status: "processed",
    date: "2026-02-27",
  },
  {
    filename: "micros_sales_feb.xlsx",
    type: "Sales Data",
    records: 4521,
    status: "processed",
    date: "2026-02-28",
  },
  {
    filename: "direct_orders_feb.csv",
    type: "Direct Orders",
    records: 56,
    status: "warnings",
    date: "2026-02-25",
  },
];

export default function UploadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Uploads</h1>
        <p className="text-muted-foreground">
          Upload purchasing, warehouse transfer, direct order, and sales data
          files.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {uploadTypes.map((upload) => (
          <Card key={upload.type}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{upload.type}</CardTitle>
                <Badge variant="secondary">{upload.format}</Badge>
              </div>
              <CardDescription>{upload.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-24 flex-1 items-center justify-center rounded-md border border-dashed">
                  <p className="text-sm text-muted-foreground">
                    Drop file here or click to upload
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Last upload: {upload.lastUpload}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
          <CardDescription>
            Upload history with processing status and record counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">File</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Records</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentUploads.map((upload) => (
                  <tr key={upload.filename} className="border-b">
                    <td className="px-4 py-3 font-mono text-xs">
                      {upload.filename}
                    </td>
                    <td className="px-4 py-3">{upload.type}</td>
                    <td className="px-4 py-3 text-right">
                      {upload.records.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          upload.status === "processed"
                            ? "success"
                            : "warning"
                        }
                      >
                        {upload.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {upload.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
