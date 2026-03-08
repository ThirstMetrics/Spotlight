export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getAlertRules } from "@/lib/queries/admin";
import { prisma } from "@spotlight/db";
import { AlertRulesTable } from "./AlertRulesTable";

export default async function AlertRulesPage() {
  const [rules, alertStats] = await Promise.all([
    getAlertRules(),
    Promise.all([
      prisma.alertRule.count({ where: { isEnabled: true } }),
      prisma.alert.count({ where: { isDismissed: false, isRead: false } }),
      prisma.alert.count(),
      prisma.alert.count({ where: { isDismissed: true } }),
    ]),
  ]);

  const [enabledRules, activeAlerts, totalAlerts, resolvedAlerts] = alertStats;
  const resolutionRate =
    totalAlerts > 0 ? Math.round((resolvedAlerts / totalAlerts) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Alert Rules
        </h1>
        <p className="text-muted-foreground">
          Configure alert thresholds and manage notification rules.{" "}
          <Link
            href="/admin/alerts/feed"
            className="text-[#5ad196] hover:underline font-medium"
          >
            View Alert Feed →
          </Link>
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Active Rules"
          value={enabledRules}
          subtitle={`${rules.length} total configured`}
        />
        <MetricCard
          label="Unread Alerts"
          value={activeAlerts}
          subtitle="Pending review"
        />
        <MetricCard
          label="Total Generated"
          value={totalAlerts}
          subtitle="All time"
        />
        <MetricCard
          label="Resolution Rate"
          value={`${resolutionRate}%`}
          subtitle={`${resolvedAlerts} resolved`}
        />
      </div>

      {/* Alert Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configured Alert Rules</CardTitle>
          <CardDescription>
            Rules determine when alerts are generated based on data thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No alert rules configured. Alert rules are automatically created
              with default thresholds.
            </p>
          ) : (
            <AlertRulesTable data={rules} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
