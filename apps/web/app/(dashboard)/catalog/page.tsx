export const dynamic = "force-dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getCatalogOverview, getCatalogProducts } from "@/lib/queries/catalog";
import { CatalogTable } from "./CatalogTable";

export default async function CatalogPage() {
  const [overview, products] = await Promise.all([
    getCatalogOverview(),
    getCatalogProducts(),
  ]);

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
            <CatalogTable data={products} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
