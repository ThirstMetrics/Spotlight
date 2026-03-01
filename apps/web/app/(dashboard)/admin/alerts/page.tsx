import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const alertRules = [
  {
    name: "Mandate Item Not Ordered",
    category: "Compliance",
    threshold: "7 days",
    description: "Alert when a mandated item has not been ordered within the configured timeframe",
    enabled: true,
  },
  {
    name: "Pull-Through Above Average",
    category: "Pull-Through",
    threshold: ">120% of 90-day avg",
    description: "Alert when an item's pull-through exceeds the rolling 90-day average",
    enabled: true,
  },
  {
    name: "Pull-Through Below Average",
    category: "Pull-Through",
    threshold: "<80% of 90-day avg",
    description: "Alert when an item's pull-through falls below the rolling 90-day average",
    enabled: true,
  },
  {
    name: "Low Inventory",
    category: "Inventory",
    threshold: "<5 days supply",
    description: "Alert when days-on-hand falls below the configured threshold per SKU",
    enabled: true,
  },
  {
    name: "Price Discrepancy",
    category: "Price",
    threshold: "Any variance",
    description: "Alert when the same product has different prices across outlets",
    enabled: true,
  },
  {
    name: "Price Change",
    category: "Price",
    threshold: ">5% change",
    description: "Alert when a product price changes more than threshold from previous order",
    enabled: false,
  },
  {
    name: "Cost Goal Exceeded",
    category: "Cost Goal",
    threshold: "Above target",
    description: "Alert when an outlet or segment cost percentage exceeds the target goal",
    enabled: true,
  },
  {
    name: "New Direct Item",
    category: "Direct",
    threshold: "First appearance",
    description: "Alert when a new item appears at an outlet via direct order",
    enabled: true,
  },
];

export default function AlertConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Alert Configuration
        </h1>
        <p className="text-muted-foreground">
          Configure alert rules, thresholds, and per-SKU overrides.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              Of 8 total rules
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              SKU Overrides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground">
              Custom thresholds per product
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Alerts Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Resolution Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              Resolved within 48 hours
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alert Rules</CardTitle>
          <CardDescription>
            All configurable alert rules with thresholds and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alertRules.map((rule) => (
              <div
                key={rule.name}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{rule.name}</p>
                    <Badge variant="secondary">{rule.category}</Badge>
                    {!rule.enabled && (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {rule.description}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    variant={rule.enabled ? "success" : "outline"}
                  >
                    {rule.threshold}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center rounded-md border border-dashed p-4">
            <p className="text-sm text-muted-foreground">
              Rule editor form with threshold configuration and SKU override
              management will render here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
