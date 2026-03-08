export const dynamic = "force-dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  getComplianceOverview,
  getComplianceDrillDown,
  getComplianceByOutlet,
} from "@/lib/queries/compliance";
import { ComplianceDrillDown } from "./ComplianceDrillDown";
import { OutletComplianceCards } from "./OutletComplianceCards";
import { ExportButton } from "@/components/dashboard/ExportButton";

export default async function CompliancePage() {
  const [overview, drillDown, byOutlet] = await Promise.all([
    getComplianceOverview(),
    getComplianceDrillDown(),
    getComplianceByOutlet(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
            Compliance Tracker
          </h1>
          <p className="text-muted-foreground">
            Track mandate compliance across all outlets. Expand items to see per-outlet
            status.
          </p>
        </div>
        <ExportButton reportType="compliance" />
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Mandate Items"
          value={overview.totalMandateItems}
          subtitle={`${overview.activeMandates} active mandates`}
        />
        <MetricCard
          label="Overall Compliance"
          value={`${overview.compliancePct}%`}
          subtitle={`${overview.compliantItems} of ${overview.totalItems} compliant`}
          trend={overview.compliancePct >= 90 ? "up" : "down"}
        />
        <MetricCard
          label="Non-Compliant"
          value={overview.nonCompliantCount}
          subtitle="Items require attention"
          trend={overview.nonCompliantCount > 0 ? "down" : "up"}
        />
        <MetricCard
          label="Outlets Tracked"
          value={overview.outletsTracked}
          subtitle="Active outlets with mandates"
        />
      </div>

      {/* Compliance by Outlet */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compliance by Outlet</CardTitle>
          <CardDescription>
            Click an outlet to see its mandate item details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OutletComplianceCards
            outletData={byOutlet}
            drillDownData={drillDown}
          />
        </CardContent>
      </Card>

      {/* Compliance Drill-Down */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Item Compliance Detail</CardTitle>
          <CardDescription>
            Click any item to see which outlets are compliant or non-compliant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {drillDown.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No mandate compliance data found. Upload mandate data to start tracking.
            </p>
          ) : (
            <ComplianceDrillDown data={drillDown} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
