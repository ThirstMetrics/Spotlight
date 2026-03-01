import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const metrics = [
  { label: "Total SKUs", value: "247", change: "+12 this month" },
  { label: "Active Outlets", value: "10", change: "All operational" },
  { label: "Compliance", value: "94%", change: "+2% from last month" },
  { label: "Open Alerts", value: "3", change: "2 high priority" },
];

const topProducts = [
  { name: "Tito's Handmade Vodka", category: "Spirits", volume: "142 units" },
  { name: "Caymus Cabernet Sauvignon", category: "Wine", volume: "98 units" },
  { name: "Clase Azul Reposado", category: "Spirits", volume: "87 units" },
  { name: "Veuve Clicquot Yellow Label", category: "Wine", volume: "76 units" },
  { name: "Modelo Especial", category: "Beer", volume: "234 units" },
];

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Overview Dashboard
        </h1>
        <p className="text-muted-foreground">
          Hotel-wide metrics, volume trends, cost analysis, and alerts at a
          glance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Volume Trends</CardTitle>
            <CardDescription>
              Monthly purchase volume across all outlets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">
                Recharts area chart will render here
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Highest volume items this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {index + 1}.
                    </span>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {product.name}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {product.category}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.volume}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
