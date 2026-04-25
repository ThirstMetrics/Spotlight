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
import { MarginTrendChart, OutletMarginBar } from "@/components/dashboard/MarginCharts";
import {
  getMarginMetrics,
  getMonthlyMarginTrend,
  getCategoryMargins,
  getMarginByOutlet,
} from "@/lib/queries/margins";
import { getServerUser } from "@/lib/auth";

export default async function MarginsPage() {
  const user = await getServerUser();
  const [metrics, trendData, categoryData, outletData] = await Promise.all([
    getMarginMetrics(user?.organizationId),
    getMonthlyMarginTrend(user?.organizationId),
    getCategoryMargins(user?.organizationId),
    getMarginByOutlet(user?.organizationId),
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
          Margin Analysis
        </h1>
        <p className="text-muted-foreground">
          Cost percentages, revenue analysis, and margin projections across outlets
          and categories.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(metrics.revenue)}
          trend={metrics.revenueChange >= 0 ? "up" : "down"}
          trendValue={`${Math.abs(metrics.revenueChange)}% vs prior period`}
        />
        <MetricCard
          label="Total Cost"
          value={formatCurrency(metrics.cost)}
          trend={metrics.costChange <= 0 ? "up" : "down"}
          trendValue={`${Math.abs(metrics.costChange)}% vs prior period`}
        />
        <MetricCard
          label="Margin %"
          value={`${metrics.marginPct}%`}
          trend={metrics.marginChange >= 0 ? "up" : "down"}
          trendValue={`${Math.abs(metrics.marginChange)}% vs prior period`}
        />
        <MetricCard
          label="Cost %"
          value={`${metrics.costPct}%`}
          subtitle="Last 90 days"
          trend={metrics.costPct <= 30 ? "up" : "down"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue vs Cost Trends</CardTitle>
            <CardDescription>
              Monthly comparison over the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <MarginTrendChart data={trendData} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No trend data available
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cost % by Outlet</CardTitle>
            <CardDescription>
              Current cost percentage vs goal by outlet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {outletData.length > 0 ? (
              <OutletMarginBar data={outletData} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No outlet data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category Breakdown</CardTitle>
          <CardDescription>
            Revenue, cost, and margin analysis by beverage category (last 90 days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Revenue</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Cost</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Margin %</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Cost %</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((row) => (
                  <tr key={row.category} className="border-b hover:bg-gray-50/30">
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{row.category}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(row.revenue)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(row.cost)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={row.marginPct >= 65 ? "text-[#5ad196] font-medium" : row.marginPct >= 50 ? "text-amber-600 font-medium" : "text-red-600 font-medium"}>
                        {row.marginPct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{row.costPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Outlet Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Margin by Outlet</CardTitle>
          <CardDescription>Revenue, cost, and cost % with goal comparison per outlet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Outlet</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Revenue</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Cost</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Cost %</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Goal</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {outletData.map((outlet) => (
                  <tr key={outlet.id} className="border-b hover:bg-gray-50/30">
                    <td className="px-4 py-3 font-medium text-[#06113e]">{outlet.name}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(outlet.revenue)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(outlet.cost)}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      <span className={outlet.isOverGoal ? "text-red-600" : "text-[#5ad196]"}>{outlet.costPct}%</span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{outlet.goalPct}%</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={outlet.isOverGoal ? "destructive" : "success"} className="text-[10px]">
                        {outlet.isOverGoal ? "Over Goal" : "On Target"}
                      </Badge>
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
