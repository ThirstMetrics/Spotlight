import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const distributors = [
  {
    name: "Southern Glazer's Wine & Spirits",
    products: 124,
    volume: "$487,200",
    yoy: "+12.3%",
  },
  {
    name: "Republic National Distributing",
    products: 89,
    volume: "$312,500",
    yoy: "+8.7%",
  },
  {
    name: "Breakthru Beverage Group",
    products: 67,
    volume: "$198,400",
    yoy: "-2.1%",
  },
  {
    name: "Young's Market Company",
    products: 43,
    volume: "$142,800",
    yoy: "+15.4%",
  },
];

export default function DistributorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Distributors</h1>
        <p className="text-muted-foreground">
          View distributor performance, volume, and year-over-year trends.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Distributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,140,900</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">323</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">YoY Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+9.1%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {distributors.map((distributor) => (
          <Card key={distributor.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{distributor.name}</CardTitle>
                <Badge
                  variant={
                    distributor.yoy.startsWith("+") ? "success" : "destructive"
                  }
                >
                  {distributor.yoy}
                </Badge>
              </div>
              <CardDescription>
                {distributor.products} products in catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Volume</span>
                <span className="font-medium">{distributor.volume}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Volume Trends by Distributor</CardTitle>
          <CardDescription>
            Monthly purchase volume comparison across distributors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">
              Recharts stacked bar chart will render here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
