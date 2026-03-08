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
import { getDistributorDetail } from "@/lib/queries/distributor-detail";
import { DistributorTabs } from "./DistributorTabs";

interface DistributorDetailPageProps {
  params: { id: string };
}

export default async function DistributorDetailPage({
  params,
}: DistributorDetailPageProps) {
  const data = await getDistributorDetail(params.id);
  if (!data) notFound();

  const { distributor, metrics, volumeTrend, categoryBreakdown, outletPerformance, productPerformance, winePortfolio } = data;

  const formatCurrency = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}K`
        : `$${n.toFixed(0)}`;

  // Serialize dates for client component
  const serializedOutlets = outletPerformance.map((o) => ({
    ...o,
    lastOrder: o.lastOrder ? o.lastOrder.toISOString() : null,
  }));

  const serializedProducts = productPerformance.map((p) => ({
    ...p,
    lastOrder: p.lastOrder ? p.lastOrder.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/partners/distributors"
            className="text-sm text-muted-foreground hover:text-[#06113e] transition-colors"
          >
            Distributors
          </Link>
          <span className="text-sm text-muted-foreground">/</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
              {distributor.name}
            </h1>
            <div className="flex items-center gap-3 mt-1.5">
              <Badge variant="secondary">Distributor</Badge>
              {distributor.contactName && (
                <span className="text-sm text-muted-foreground">
                  {distributor.contactName}
                </span>
              )}
              {distributor.contactEmail && (
                <a
                  href={`mailto:${distributor.contactEmail}`}
                  className="text-sm text-[#5ad196] hover:underline"
                >
                  {distributor.contactEmail}
                </a>
              )}
              {distributor.contactPhone && (
                <span className="text-sm text-muted-foreground">
                  {distributor.contactPhone}
                </span>
              )}
            </div>
          </div>
          <ExportButton reportType="orders" />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          label="Products"
          value={metrics.totalProducts}
          subtitle="Active SKUs"
        />
        <MetricCard
          label="Wine SKUs"
          value={metrics.wineProducts}
          subtitle={`${metrics.totalProducts > 0 ? Math.round((metrics.wineProducts / metrics.totalProducts) * 100) : 0}% of portfolio`}
        />
        <MetricCard
          label="Outlets Served"
          value={metrics.outletsServed}
          subtitle="Active outlets"
        />
        <MetricCard
          label="Volume (12mo)"
          value={formatCurrency(metrics.volume12mo)}
          subtitle={`${metrics.totalUnits12mo.toLocaleString()} units`}
        />
        <MetricCard
          label="Revenue Share"
          value={`${metrics.revenueShare}%`}
          subtitle="Of total hotel spend"
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
      <DistributorTabs
        outletPerformance={serializedOutlets}
        productPerformance={serializedProducts}
        winePortfolio={winePortfolio}
      />
    </div>
  );
}
