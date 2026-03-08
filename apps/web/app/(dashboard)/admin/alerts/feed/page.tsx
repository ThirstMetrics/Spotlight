export const dynamic = "force-dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getAlerts, getAlertStats } from "@/lib/queries/alerts";
import { AlertFeed } from "./AlertFeed";

export default async function AlertFeedPage() {
  const [alerts, stats] = await Promise.all([
    getAlerts(),
    getAlertStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Alert Feed
        </h1>
        <p className="text-muted-foreground">
          Review and manage system-generated alerts across all outlets.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Unread"
          value={stats.unread}
          subtitle="Require attention"
          trend={stats.unread > 0 ? "down" : undefined}
        />
        <MetricCard
          label="Read"
          value={stats.read}
          subtitle="Acknowledged"
        />
        <MetricCard
          label="Dismissed"
          value={stats.dismissed}
          subtitle="Resolved or dismissed"
        />
        <MetricCard
          label="Total Alerts"
          value={stats.total}
          subtitle="All time"
        />
      </div>

      {/* Alert Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alerts</CardTitle>
          <CardDescription>
            {stats.unread > 0
              ? `${stats.unread} unread alerts requiring review`
              : "All alerts have been reviewed"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No alerts generated yet. Alerts will appear here when data
              thresholds are exceeded.
            </p>
          ) : (
            <AlertFeed initialAlerts={alerts} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
