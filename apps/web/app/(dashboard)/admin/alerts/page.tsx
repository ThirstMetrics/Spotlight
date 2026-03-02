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
import { getAlertRules } from "@/lib/queries/admin";
import { prisma } from "@spotlight/db";

const TYPE_LABELS: Record<string, string> = {
  MANDATE_COMPLIANCE: "Mandate Compliance",
  PULL_THROUGH_HIGH: "Pull-Through High",
  PULL_THROUGH_LOW: "Pull-Through Low",
  DAYS_OF_INVENTORY: "Days of Inventory",
  NEW_DIRECT_ITEM: "New Direct Item",
  PRICE_DISCREPANCY: "Price Discrepancy",
  PRICE_CHANGE: "Price Change",
  COST_GOAL_EXCEEDED: "Cost Goal Exceeded",
};

const TYPE_CATEGORIES: Record<string, string> = {
  MANDATE_COMPLIANCE: "Compliance",
  PULL_THROUGH_HIGH: "Inventory",
  PULL_THROUGH_LOW: "Inventory",
  DAYS_OF_INVENTORY: "Inventory",
  NEW_DIRECT_ITEM: "Inventory",
  PRICE_DISCREPANCY: "Price",
  PRICE_CHANGE: "Price",
  COST_GOAL_EXCEEDED: "Cost",
};

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
          Configure alert thresholds and manage notification rules.
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Rule Type
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Threshold
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Scope
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      Active Alerts
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Created By
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="border-b hover:bg-gray-50/30"
                    >
                      <td className="px-4 py-3 font-medium text-[#06113e]">
                        {TYPE_LABELS[rule.alertType] ?? rule.alertType}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs">
                          {TYPE_CATEGORIES[rule.alertType] ?? "Other"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {rule.thresholdValue != null
                          ? `${rule.thresholdValue}${rule.thresholdUnit ?? ""}`
                          : "Default"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {rule.appliesToProduct
                          ? rule.appliesToProduct
                          : rule.appliesToOutlet}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            rule.isEnabled
                              ? "bg-[#5ad196] text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {rule.isEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {rule.activeAlerts > 0 ? (
                          <span className="text-amber-600">
                            {rule.activeAlerts}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {rule.createdBy}
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
