import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const marginMetrics = [
  {
    label: "Total Revenue",
    value: "$1,247,500",
    change: "+8.3% vs last month",
  },
  { label: "Total Cost", value: "$412,800", change: "-2.1% vs last month" },
  { label: "Margin %", value: "66.9%", change: "+1.4% vs last month" },
  { label: "Cost %", value: "33.1%", change: "Goal: 30.0%" },
];

const categoryBreakdown = [
  { category: "Spirits", revenue: "$542,000", cost: "$162,600", margin: "70.0%", costPct: "30.0%" },
  { category: "Wine", revenue: "$387,200", cost: "$135,520", margin: "65.0%", costPct: "35.0%" },
  { category: "Beer", revenue: "$198,300", cost: "$69,405", margin: "65.0%", costPct: "35.0%" },
  { category: "Sake", revenue: "$120,000", cost: "$45,275", margin: "62.3%", costPct: "37.7%" },
];

export default function MarginsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Margin Analysis</h1>
        <p className="text-muted-foreground">
          Cost percentages, revenue analysis, and margin projections across
          outlets and categories.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {marginMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Cost Trends</CardTitle>
            <CardDescription>
              Monthly comparison of revenue and cost across all outlets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">
                Recharts line chart will render here
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost % by Outlet</CardTitle>
            <CardDescription>
              Current cost percentage vs goal by outlet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">
                Recharts bar chart will render here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>
            Revenue, cost, and margin analysis by beverage category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">Revenue</th>
                  <th className="px-4 py-3 text-right font-medium">Cost</th>
                  <th className="px-4 py-3 text-right font-medium">Margin %</th>
                  <th className="px-4 py-3 text-right font-medium">Cost %</th>
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map((row) => (
                  <tr key={row.category} className="border-b">
                    <td className="px-4 py-3 font-medium">{row.category}</td>
                    <td className="px-4 py-3 text-right">{row.revenue}</td>
                    <td className="px-4 py-3 text-right">{row.cost}</td>
                    <td className="px-4 py-3 text-right">{row.margin}</td>
                    <td className="px-4 py-3 text-right">{row.costPct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
