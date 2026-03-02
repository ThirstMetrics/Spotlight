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
import { getCatalogOverview, getCatalogProducts } from "@/lib/queries/catalog";

export default async function CatalogPage() {
  const [overview, products] = await Promise.all([
    getCatalogOverview(),
    getCatalogProducts(),
  ]);

  const formatCurrency = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Product Catalog
        </h1>
        <p className="text-muted-foreground">
          Master product catalog with distributor coverage and substitutions.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Total SKUs" value={overview.total} />
        <MetricCard label="Spirits" value={overview.spirits} />
        <MetricCard label="Wine" value={overview.wine} />
        <MetricCard label="Beer" value={overview.beer} />
        <MetricCard
          label="Sake & N/A"
          value={overview.sake + overview.nonAlcoholic}
        />
      </div>

      {/* Product Catalog Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Product Catalog</CardTitle>
          <CardDescription>
            {products.length} active products with distributor pricing
            {overview.substitutions > 0 &&
              ` — ${overview.substitutions} substitution rules defined`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No products in the catalog. Products are created during data
              ingestion or can be added manually.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Size
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      Distributors
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">
                      Avg Cost
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      Substitutions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b hover:bg-gray-50/30"
                    >
                      <td className="px-4 py-3 font-medium text-[#06113e]">
                        {product.name}
                        {product.subcategory && (
                          <span className="text-xs text-muted-foreground block">
                            {product.subcategory}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {product.sku}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {product.size ?? "—"}
                        {product.unit ? ` ${product.unit}` : ""}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {product.distributorCount > 0 ? (
                          <span
                            className="cursor-help"
                            title={product.distributors
                              .map((d) => `${d.name} (${d.supplierName})`)
                              .join(", ")}
                          >
                            {product.distributorCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {product.avgCost > 0
                          ? formatCurrency(product.avgCost)
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {product.substitutions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {product.substitutions.map((sub) => (
                              <Badge
                                key={sub.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {sub.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            None
                          </span>
                        )}
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
