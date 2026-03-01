import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const directItems = [
  {
    product: "Clase Azul Reposado",
    vendor: "Clase Azul Direct",
    outlets: ["Carversteak", "Alle Lounge on 66"],
    frequency: "Monthly",
    firstOrder: "2025-06-15",
    lastOrder: "2026-02-20",
  },
  {
    product: "Dom Perignon 2013",
    vendor: "LVMH Direct",
    outlets: ["Alle Lounge on 66", "Gatsby's Cocktail Lounge"],
    frequency: "Bi-monthly",
    firstOrder: "2025-08-01",
    lastOrder: "2026-01-15",
  },
  {
    product: "Yamazaki 18yr",
    vendor: "Suntory Direct",
    outlets: ["Carversteak"],
    frequency: "Quarterly",
    firstOrder: "2025-09-10",
    lastOrder: "2025-12-08",
  },
  {
    product: "Craft IPA Selection",
    vendor: "Local Brewery Collective",
    outlets: ["Dawg House Saloon", "Pool Bar & Grill"],
    frequency: "Weekly",
    firstOrder: "2025-04-01",
    lastOrder: "2026-02-26",
  },
];

export default function DirectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Direct-to-Outlet Tracking
        </h1>
        <p className="text-muted-foreground">
          Track items shipped directly from vendors to outlets, bypassing the
          warehouse.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Direct Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Active direct-ship products
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Direct Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">
              Shipping directly to outlets
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Outlets Receiving
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              Of 10 total outlets
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Direct Order Tracking Board</CardTitle>
          <CardDescription>
            Item name, outlets, order frequency, and first/last order dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {directItems.map((item) => (
              <div
                key={item.product}
                className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium">{item.product}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.vendor}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {item.outlets.map((outlet) => (
                      <Badge key={outlet} variant="secondary">
                        {outlet}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p>
                    <span className="text-muted-foreground">Frequency:</span>{" "}
                    {item.frequency}
                  </p>
                  <p>
                    <span className="text-muted-foreground">First:</span>{" "}
                    {item.firstOrder}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Last:</span>{" "}
                    {item.lastOrder}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
