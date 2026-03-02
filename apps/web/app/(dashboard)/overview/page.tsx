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
import { VolumeChart } from "@/components/dashboard/VolumeChart";
import { CostGoalChart } from "@/components/dashboard/CostGoalChart";
import {
  getOverviewMetrics,
  getVolumeByMonth,
  getTopProducts,
  getRecentAlerts,
  getCostVsGoalByOutlet,
  getYoYComparison,
} from "@/lib/queries/overview";

export default async function OverviewPage() {
  const [metrics, volumeData, topProducts, alerts, costGoal, yoy] =
    await Promise.all([
      getOverviewMetrics(),
      getVolumeByMonth(),
      getTopProducts(8),
      getRecentAlerts(5),
      getCostVsGoalByOutlet(),
      getYoYComparison(),
    ]);

  const formatCurrency = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}K`
        : `$${n}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Overview Dashboard
        </h1>
        <p className="text-muted-foreground">
          Hotel-wide metrics, volume trends, cost analysis, and alerts at a glance.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total SKUs"
          value={metrics.totalProducts.toLocaleString()}
          subtitle="Active products"
        />
        <MetricCard
          label="Active Outlets"
          value={metrics.activeOutlets}
          subtitle="With orders in last 30 days"
        />
        <MetricCard
          label="Compliance"
          value={`${metrics.compliancePct}%`}
          subtitle="Mandate items ordered"
          trend={metrics.compliancePct >= 90 ? "up" : "down"}
        />
        <MetricCard
          label="Open Alerts"
          value={metrics.openAlerts}
          subtitle="Unread alerts"
          trend={metrics.openAlerts > 5 ? "down" : "up"}
        />
      </div>

      {/* YoY Comparison */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="YTD Volume"
          value={metrics.totalProducts > 0 ? yoy.volume.current.toLocaleString() : "—"}
          trend={yoy.volume.changePct >= 0 ? "up" : "down"}
          trendValue={`${Math.abs(yoy.volume.changePct)}% vs last year`}
        />
        <MetricCard
          label="Revenue (12mo)"
          value={formatCurrency(metrics.revenue)}
          subtitle="Total POS revenue"
        />
        <MetricCard
          label="Cost (12mo)"
          value={formatCurrency(metrics.cost)}
          subtitle={`${metrics.costPct}% of revenue`}
          trend={metrics.costPct > 25 ? "down" : "up"}
        />
        <MetricCard
          label="YTD Cost Change"
          value={`${yoy.cost.changePct >= 0 ? "+" : ""}${yoy.cost.changePct}%`}
          trend={yoy.cost.changePct <= 0 ? "up" : "down"}
          trendValue="vs last year"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-lg">Volume Trends</CardTitle>
            <CardDescription>
              Monthly purchase volume by category (last 12 months)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VolumeChart data={volumeData} />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Top Products</CardTitle>
            <CardDescription>Highest volume items (90 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-5">
                      {index + 1}.
                    </span>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5">
                          {product.category}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {product.sku}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">
                      {product.volume.toLocaleString()}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      {formatCurrency(product.totalCost)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost vs Goal + Alerts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-lg">Cost % vs Goal by Outlet</CardTitle>
            <CardDescription>
              Green = under goal, Red = over goal (last 90 days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CostGoalChart data={costGoal} />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Recent Alerts</CardTitle>
            <CardDescription>Unresolved alerts requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No open alerts
              </p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <div
                      className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                        alert.severity === "CRITICAL"
                          ? "bg-red-500"
                          : alert.severity === "WARNING"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">
                        {alert.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {alert.outlet?.name}
                        {alert.product?.name
                          ? ` — ${alert.product.name}`
                          : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {new Date(alert.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        alert.severity === "CRITICAL"
                          ? "destructive"
                          : alert.severity === "WARNING"
                            ? "warning"
                            : "secondary"
                      }
                      className="shrink-0 text-[10px]"
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
