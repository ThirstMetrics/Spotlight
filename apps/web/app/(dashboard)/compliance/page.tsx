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
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  getComplianceOverview,
  getComplianceMatrix,
  getComplianceByOutlet,
} from "@/lib/queries/compliance";

export default async function CompliancePage() {
  const [overview, matrix, byOutlet] = await Promise.all([
    getComplianceOverview(),
    getComplianceMatrix(),
    getComplianceByOutlet(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Compliance Tracker
        </h1>
        <p className="text-muted-foreground">
          Track mandate compliance across all outlets. Matrix view showing ordered
          vs not-ordered status.
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Overall Compliance"
          value={`${overview.compliancePct}%`}
          subtitle={`${overview.compliantItems} of ${overview.totalItems} items ordered`}
          trend={overview.compliancePct >= 90 ? "up" : "down"}
        />
        <MetricCard
          label="Active Mandates"
          value={overview.activeMandates}
          subtitle="Across all outlet groups"
        />
        <MetricCard
          label="Non-Compliant Items"
          value={overview.nonCompliantCount}
          subtitle="Require attention"
          trend={overview.nonCompliantCount > 0 ? "down" : "up"}
        />
      </div>

      {/* Compliance by Outlet */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compliance by Outlet</CardTitle>
          <CardDescription>
            Each outlet&apos;s mandate compliance rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {byOutlet.map((outlet) => (
              <div
                key={outlet.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium text-[#06113e]">{outlet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {outlet.compliant}/{outlet.total} items
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        outlet.pct >= 90
                          ? "bg-[#5ad196]"
                          : outlet.pct >= 70
                            ? "bg-amber-400"
                            : "bg-red-400"
                      }`}
                      style={{ width: `${outlet.pct}%` }}
                    />
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      outlet.pct >= 90
                        ? "text-[#5ad196]"
                        : outlet.pct >= 70
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {outlet.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compliance Matrix</CardTitle>
          <CardDescription>
            Mandate compliance status by outlet and product
          </CardDescription>
        </CardHeader>
        <CardContent>
          {matrix.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No mandate compliance data found. Upload mandate data to start tracking.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                      Outlet
                    </th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                      Mandate
                    </th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                      Product
                    </th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                      Category
                    </th>
                    <th className="px-3 py-2.5 text-center font-medium text-gray-600">
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-right font-medium text-gray-600">
                      Last Qty
                    </th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                      Last Order
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-gray-50/30">
                      <td className="px-3 py-2.5 font-medium text-[#06113e]">
                        {row.outletName}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {row.mandateName}
                      </td>
                      <td className="px-3 py-2.5">
                        <div>
                          <p className="font-medium">{row.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.productSku}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {row.category}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <StatusBadge
                          status={row.isCompliant ? "success" : "danger"}
                          label={row.isCompliant ? "Compliant" : "Non-Compliant"}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {row.lastOrderQuantity ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {row.lastOrderDate
                          ? new Date(row.lastOrderDate).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric", year: "numeric" }
                            )
                          : "Never ordered"}
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
