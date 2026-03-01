import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const alertCategories = [
  {
    name: "Compliance",
    count: 3,
    variant: "destructive" as const,
    description: "Mandated items not ordered within required timeframe",
  },
  {
    name: "Pull-Through",
    count: 5,
    variant: "warning" as const,
    description: "Items above or below historic pull-through averages",
  },
  {
    name: "Inventory",
    count: 2,
    variant: "destructive" as const,
    description: "Items below minimum days-on-hand thresholds",
  },
  {
    name: "Price",
    count: 1,
    variant: "warning" as const,
    description: "Price discrepancies across outlets or from previous orders",
  },
  {
    name: "Cost Goal",
    count: 4,
    variant: "warning" as const,
    description: "Outlets or segments exceeding target cost percentages",
  },
];

const sampleAlerts = [
  {
    type: "Inventory",
    message: "Carversteak: Clase Azul Reposado below 5-day supply threshold",
    severity: "high",
    timestamp: "2 hours ago",
  },
  {
    type: "Pull-Through",
    message: "Pool Bar & Grill: Corona Extra pull-through 145% above 90-day avg",
    severity: "medium",
    timestamp: "4 hours ago",
  },
  {
    type: "Compliance",
    message: "Redtail: Opus One 2021 not ordered — mandate item overdue",
    severity: "high",
    timestamp: "1 day ago",
  },
];

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Inventory & Alerts
        </h1>
        <p className="text-muted-foreground">
          Monitor inventory levels, pull-through rates, and active alerts across
          all outlets.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {alertCategories.map((category) => (
          <Card key={category.name}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {category.name}
                </CardTitle>
                <Badge variant={category.variant}>{category.count}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {category.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <CardDescription>
            Latest alerts requiring attention across all outlets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sampleAlerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-start justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        alert.severity === "high" ? "destructive" : "warning"
                      }
                    >
                      {alert.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {alert.timestamp}
                    </span>
                  </div>
                  <p className="text-sm">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Levels</CardTitle>
          <CardDescription>
            Days-on-hand by outlet and product category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">
              AG Grid inventory table will render here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
