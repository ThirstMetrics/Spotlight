import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const outlets = [
  { id: "carversteak", name: "Carversteak", type: "Fine Dining" },
  { id: "wallys", name: "Wally's Wine & Spirits", type: "Wine Bar" },
  { id: "crossroads", name: "Crossroads Kitchen", type: "Restaurant" },
  { id: "bar-zazu", name: "Bar Zazu", type: "Cocktail Bar" },
  { id: "redtail", name: "Redtail", type: "Rooftop Bar" },
  { id: "famous-foods", name: "Famous Foods Street Eats", type: "Food Hall" },
  { id: "dawg-house", name: "Dawg House Saloon", type: "Bar & Grill" },
  { id: "alle-lounge", name: "Alle Lounge on 66", type: "Lounge" },
  { id: "gatsbys", name: "Gatsby's Cocktail Lounge", type: "Nightlife" },
  { id: "pool-bar", name: "Pool Bar & Grill", type: "Pool" },
];

export default function OutletsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Outlets</h1>
        <p className="text-muted-foreground">
          View and manage all outlets across the property.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {outlets.map((outlet) => (
          <Link key={outlet.id} href={`/outlets/${outlet.id}`}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{outlet.name}</CardTitle>
                  <Badge variant="secondary">{outlet.type}</Badge>
                </div>
                <CardDescription>
                  Inventory, compliance, and sales data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">View Details</span>
                  <span className="text-muted-foreground">&rarr;</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
