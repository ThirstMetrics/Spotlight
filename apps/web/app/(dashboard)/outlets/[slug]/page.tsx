export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { VolumeChart } from "@/components/dashboard/VolumeChart";
import { CategoryPieChart } from "@/components/dashboard/OutletDetailCharts";
import { ExportButton } from "@/components/dashboard/ExportButton";
import { getOutletBySlug } from "@/lib/queries/outlets";
import { getOutletDetailEnhanced } from "@/lib/queries/outlet-detail";
import { getServerUser } from "@/lib/auth";
import { OutletTabs } from "./OutletTabs";

interface OutletDetailPageProps {
  params: { slug: string };
}

export default async function OutletDetailPage({
  params,
}: OutletDetailPageProps) {
  const user = await getServerUser();
  const organizationId = user?.organizationId;

  const resolved = await getOutletBySlug(params.slug, organizationId);
  if (!resolved) notFound();

  const data = await getOutletDetailEnhanced(resolved.id);
  if (!data) notFound();

  const {
    outlet,
    metrics,
    volumeTrend,
    categoryBreakdown,
    distributorBreakdown,
    productPerformance,
    wineProgram,
    inventorySnapshot,
    compliance,
    recipes,
  } = data;

  const formatCurrency = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}K`
        : `$${n.toFixed(0)}`;

  // Serialize dates for client components
  const serializedDistributorBreakdown = distributorBreakdown.map((d) => ({
    ...d,
    lastOrder: d.lastOrder ? d.lastOrder.toISOString() : null,
  }));

  const serializedProductPerformance = productPerformance.map((p) => ({
    ...p,
    lastOrder: p.lastOrder ? p.lastOrder.toISOString() : null,
  }));

  const serializedInventorySnapshot = inventorySnapshot.map((i) => ({
    ...i,
    lastUpdated: i.lastUpdated ? i.lastUpdated.toISOString() : "",
  }));

  const serializedCompliance = compliance.map((c) => ({
    ...c,
    lastOrderDate: c.lastOrderDate ? c.lastOrderDate.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/outlets"
            className="text-sm text-muted-foreground hover:text-[#06113e] transition-colors"
          >
            Outlets
          </Link>
          <span className="text-sm text-muted-foreground">/</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
              {outlet.name}
            </h1>
            <div className="flex items-center gap-3 mt-1.5">
              <Badge variant="secondary">{outlet.type}</Badge>
              {outlet.groupName && (
                <span className="text-sm text-muted-foreground">
                  {outlet.groupName}
                </span>
              )}
              {outlet.managerName && (
                <span className="text-sm text-muted-foreground">
                  Manager: {outlet.managerName}
                </span>
              )}
              {outlet.costGoal > 0 && (
                <Badge variant="outline" className="text-xs">
                  Target: {outlet.costGoal}% cost
                </Badge>
              )}
            </div>
          </div>
          <ExportButton reportType="orders" />
        </div>
      </div>

      {/* Metric Cards - Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Products"
          value={metrics.totalProducts}
          subtitle="Active SKUs (90d)"
        />
        <MetricCard
          label="Wine SKUs"
          value={metrics.wineProducts}
          subtitle={`${metrics.totalProducts > 0 ? Math.round((metrics.wineProducts / metrics.totalProducts) * 100) : 0}% of portfolio`}
        />
        <MetricCard
          label="Spirits SKUs"
          value={metrics.spiritsProducts}
          subtitle={`${metrics.totalProducts > 0 ? Math.round((metrics.spiritsProducts / metrics.totalProducts) * 100) : 0}% of portfolio`}
        />
        <MetricCard
          label="Total Spend"
          value={formatCurrency(metrics.totalSpend90d)}
          subtitle="Last 90 days"
        />
      </div>

      {/* Metric Cards - Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Revenue"
          value={formatCurrency(metrics.revenue90d)}
          subtitle="Last 90 days"
        />
        <MetricCard
          label="Pour Cost %"
          value={`${metrics.costPct}%`}
          subtitle={`Target: ${outlet.costGoal}%`}
          trend={metrics.costPct <= outlet.costGoal ? "up" : "down"}
          trendValue={metrics.costPct <= outlet.costGoal ? "On target" : "Over target"}
        />
        <MetricCard
          label="Compliance"
          value={`${metrics.compliancePct}%`}
          subtitle="Mandate items"
          trend={metrics.compliancePct >= 90 ? "up" : "down"}
        />
        <MetricCard
          label="Growth"
          value={`${metrics.yoyChange >= 0 ? "+" : ""}${metrics.yoyChange}%`}
          trend={metrics.yoyChange >= 0 ? "up" : "down"}
          trendValue="vs prior period"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Volume by Category</CardTitle>
            <CardDescription>
              Order volume trend over the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {volumeTrend.length > 0 ? (
              <VolumeChart data={volumeTrend} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No volume data available
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Mix</CardTitle>
            <CardDescription>
              Distribution by category (12 months)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length > 0 ? (
              <CategoryPieChart data={categoryBreakdown} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No category data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Interactive Tables */}
      <OutletTabs
        distributorBreakdown={serializedDistributorBreakdown}
        productPerformance={serializedProductPerformance}
        wineProgram={wineProgram}
        inventorySnapshot={serializedInventorySnapshot}
        compliance={serializedCompliance}
        recipes={recipes}
      />
    </div>
  );
}
