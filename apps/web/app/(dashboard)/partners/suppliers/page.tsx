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
import { getSuppliers, getPartnerOverview } from "@/lib/queries/partners";

export default async function SuppliersPage() {
  const [suppliers, overview] = await Promise.all([
    getSuppliers(),
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
          Suppliers
        </h1>
        <p className="text-muted-foreground">
          Supplier performance aggregated across all distributors.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Total Suppliers"
          value={overview.supplierCount}
          subtitle="Across all distributors"
        />
        <MetricCard
          label="Multi-Distributor"
          value={overview.multiDistributorSuppliers}
          subtitle="Supplied through 2+ distributors"
        />
        <MetricCard
          label="Total Supplier Volume"
          value={formatCurrency(overview.totalVolume)}
          subtitle="Current period"
        />
      </div>

      {/* Supplier Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Supplier Performance</CardTitle>
          <CardDescription>
            Volume, outlet coverage, and brand portfolio by supplier
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No supplier data available. Upload order data to see supplier
              metrics.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Supplier
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Key Products
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      Products
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      Distributors
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      Outlets
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      Volume
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="border-b hover:bg-gray-50/30"
                    >
                      <td className="px-4 py-3 font-medium text-[#06113e]">
                        {supplier.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {supplier.topProducts.join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {supplier.productCount}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="secondary">
                          {supplier.distributorCount}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="secondary">
                          {supplier.outletCount} outlets
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(supplier.volume)}
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
