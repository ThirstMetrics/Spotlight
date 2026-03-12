export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getDistributors, getPartnerOverview } from "@/lib/queries/partners";
import { getServerUser } from "@/lib/auth";

export default async function DistributorsPage() {
  const user = await getServerUser();

  // Distributor users go directly to their own detail page
  if (user?.role === "DISTRIBUTOR" && user.distributorId) {
    redirect(`/partners/distributors/${user.distributorId}`);
  }

  // Suppliers shouldn't see the distributors list
  if (user?.role === "SUPPLIER") {
    redirect("/overview");
  }

  const [distributors, overview] = await Promise.all([
    getDistributors(),
    getPartnerOverview(),
  ]);

  const formatCurrency = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}K`
        : `$${n.toFixed(0)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Distributors
        </h1>
        <p className="text-muted-foreground">
          View distributor performance, volume, and year-over-year trends.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Distributors"
          value={overview.distributorCount}
          subtitle="Active partners"
        />
        <MetricCard
          label="Total Volume"
          value={formatCurrency(overview.totalVolume)}
          subtitle="Last 90 days"
        />
        <MetricCard
          label="Total Products"
          value={overview.totalProducts}
          subtitle="Across all distributors"
        />
        <MetricCard
          label="YoY Growth"
          value={`${overview.yoyGrowth >= 0 ? "+" : ""}${overview.yoyGrowth}%`}
          trend={overview.yoyGrowth >= 0 ? "up" : "down"}
          trendValue="vs prior period"
        />
      </div>

      {/* Distributor Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {distributors.map((distributor) => (
          <Link key={distributor.id} href={`/partners/distributors/${distributor.id}`}>
          <Card className="cursor-pointer hover:ring-2 hover:ring-[#06113e]/20 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-[#06113e]">
                  {distributor.name}
                </CardTitle>
                <Badge
                  variant={
                    distributor.yoyChange >= 0 ? "success" : "destructive"
                  }
                >
                  {distributor.yoyChange >= 0 ? "+" : ""}
                  {distributor.yoyChange}%
                </Badge>
              </div>
              <CardDescription>
                {distributor.productCount} products in catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Volume (90d)</span>
                  <span className="font-medium">
                    {formatCurrency(distributor.volume)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Outlets Served</span>
                  <span className="font-medium">{distributor.outletCount}</span>
                </div>
                {distributor.contactName && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Contact</span>
                    <span className="text-muted-foreground text-xs">
                      {distributor.contactName}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </Link>
        ))}
      </div>

      {/* Distributor Table */}
      {distributors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distributor Summary</CardTitle>
            <CardDescription>
              Volume, product count, and growth across all distributors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Distributor
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      Products
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      Outlets
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      Volume (90d)
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      YoY Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {distributors.map((dist) => (
                    <tr
                      key={dist.id}
                      className="border-b hover:bg-gray-50/30"
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/partners/distributors/${dist.id}`} className="text-[#06113e] hover:underline">
                          {dist.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {dist.productCount}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {dist.outletCount}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(dist.volume)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            dist.yoyChange >= 0
                              ? "text-[#5ad196] font-medium"
                              : "text-red-600 font-medium"
                          }
                        >
                          {dist.yoyChange >= 0 ? "+" : ""}
                          {dist.yoyChange}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {distributors.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <p className="text-sm text-muted-foreground text-center">
              No distributor data available. Upload order data to see
              distributor metrics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
