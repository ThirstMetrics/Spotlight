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
import {
  getInventoryOverview,
  getInventoryItems,
  getInventoryAlerts,
} from "@/lib/queries/inventory";
import { InventoryTable } from "./InventoryTable";
import { ExportButton } from "@/components/dashboard/ExportButton";

export default async function InventoryPage() {
  const [overview, items, alerts] = await Promise.all([
    getInventoryOverview(),
    getInventoryItems(),
    getInventoryAlerts(),
  ]);

  const formatCurrency = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}K`
        : `$${n.toFixed(0)}`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
            Inventory
          </h1>
          <p className="text-muted-foreground">
            Alerts, pull-through analysis, and days-on-hand tracking.
          </p>
        </div>
        <ExportButton reportType="inventory" />
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Tracked Items"
          value={overview.totalItems}
          subtitle="Outlet × product pairs"
        />
        <MetricCard
          label="Low Stock"
          value={overview.lowStockCount}
          subtitle="Below 5 days on hand"
          trend={overview.lowStockCount > 0 ? "down" : undefined}
        />
        <MetricCard
          label="Out of Stock"
          value={overview.outOfStockCount}
          subtitle="Zero quantity"
        />
        <MetricCard
          label="Transfers (90d)"
          value={overview.totalTransfers}
          subtitle={formatCurrency(overview.transferCost)}
        />
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Inventory Alerts</CardTitle>
            <CardDescription>
              {alerts.length} unresolved alerts requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <Badge
                    variant={
                      alert.severity === "CRITICAL"
                        ? "destructive"
                        : alert.severity === "WARNING"
                          ? "warning"
                          : "secondary"
                    }
                    className="mt-0.5 shrink-0"
                  >
                    {alert.severity}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#06113e]">
                      {alert.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.outlet?.name && (
                        <span className="mr-2">{alert.outlet.name}</span>
                      )}
                      {alert.product?.name && (
                        <span className="text-gray-400">
                          {alert.product.name}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inventory Levels</CardTitle>
          <CardDescription>
            Current quantities and days-on-hand by outlet and product (sorted by
            lowest stock first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No inventory data available. Upload warehouse transfer data to
              track inventory levels.
            </p>
          ) : (
            <InventoryTable data={items} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
