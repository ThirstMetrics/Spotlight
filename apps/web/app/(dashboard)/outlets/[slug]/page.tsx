export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  VolumeTrendChart,
  CategoryPieChart,
} from "@/components/dashboard/OutletDetailCharts";
import { getOutletBySlug, getOutletDetail } from "@/lib/queries/outlets";

interface OutletDetailPageProps {
  params: { slug: string };
}

export default async function OutletDetailPage({ params }: OutletDetailPageProps) {
  const resolved = await getOutletBySlug(params.slug);
  if (!resolved) notFound();

  const data = await getOutletDetail(resolved.id);
  if (!data) notFound();

  const { outlet, products, trendData, categoryData, compliance } = data;

  const totalSpend = products.reduce((sum, p) => sum + p.totalSpend, 0);
  const totalVolume = products.reduce((sum, p) => sum + p.avgMonthlyVolume * 3, 0);
  const compliantCount = compliance.filter((c) => c.isCompliant).length;
  const compliancePct =
    compliance.length > 0
      ? Math.round((compliantCount / compliance.length) * 100)
      : 100;

  const formatCurrency = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}K`
        : `$${n.toFixed(0)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/outlets"
              className="text-sm text-muted-foreground hover:text-[#06113e]"
            >
              Outlets
            </Link>
            <span className="text-sm text-muted-foreground">/</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
            {outlet.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{outlet.type}</Badge>
            {outlet.groupName && (
              <span className="text-sm text-muted-foreground">
                {outlet.groupName}
              </span>
            )}
            {outlet.managerName && (
              <span className="text-sm text-muted-foreground">
                — {outlet.managerName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Products Ordered"
          value={products.length}
          subtitle="Last 90 days"
        />
        <MetricCard
          label="Total Spend"
          value={formatCurrency(totalSpend)}
          subtitle="Last 90 days"
        />
        <MetricCard
          label="Cost Goal"
          value={`${outlet.costGoal}%`}
          subtitle="Target cost percentage"
        />
        <MetricCard
          label="Compliance"
          value={`${compliancePct}%`}
          subtitle={`${compliantCount} of ${compliance.length} items`}
          trend={compliancePct >= 90 ? "up" : "down"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Volume Trend</CardTitle>
            <CardDescription>Order volume over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <VolumeTrendChart data={trendData} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No trend data available
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Mix</CardTitle>
            <CardDescription>Order volume by category (90 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <CategoryPieChart data={categoryData} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No category data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Products</CardTitle>
          <CardDescription>
            All products ordered by this outlet in the last 90 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                    Product
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                    Category
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                    Distributor
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-600">
                    Avg/Month
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-600">
                    Unit Cost
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-600">
                    Total Spend
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                    Last Order
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 30).map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50/30">
                    <td className="px-3 py-2.5">
                      <div>
                        <p className="font-medium text-[#06113e]">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant="secondary" className="text-[10px]">
                        {product.category}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {product.distributor}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium">
                      {product.avgMonthlyVolume.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      ${product.currentCost.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium">
                      {formatCurrency(product.totalSpend)}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {product.lastOrderDate
                        ? new Date(product.lastOrderDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length > 30 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Showing 30 of {products.length} products
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compliance */}
      {compliance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mandate Compliance</CardTitle>
            <CardDescription>
              Required items and their order status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                      Product
                    </th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                      SKU
                    </th>
                    <th className="px-3 py-2.5 text-center font-medium text-gray-600">
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-right font-medium text-gray-600">
                      Last Qty
                    </th>
                    <th className="px-3 py-2.5 text-left font-medium text-gray-600">
                      Last Order
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compliance.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50/30">
                      <td className="px-3 py-2.5 font-medium text-[#06113e]">
                        {item.productName}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {item.productSku}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <StatusBadge
                          status={item.isCompliant ? "success" : "danger"}
                          label={item.isCompliant ? "Compliant" : "Non-Compliant"}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {item.lastOrderQuantity ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {item.lastOrderDate
                          ? new Date(item.lastOrderDate).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )
                          : "Never ordered"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
