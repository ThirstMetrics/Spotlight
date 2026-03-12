export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { VolumeChart } from "@/components/dashboard/VolumeChart";
import { CategoryPieChart } from "@/components/dashboard/OutletDetailCharts";
import { ExportButton } from "@/components/dashboard/ExportButton";
import { getSupplierDetail } from "@/lib/queries/supplier-detail";
import { getServerUser } from "@/lib/auth";
import { SupplierTabs } from "./SupplierTabs";

interface SupplierDetailPageProps {
  params: { id: string };
}

export default async function SupplierDetailPage({
  params,
}: SupplierDetailPageProps) {
  const user = await getServerUser();

  // Supplier users can only view their own detail page
  if (user?.role === "SUPPLIER" && user.supplierId && user.supplierId !== params.id) {
    redirect(`/partners/suppliers/${user.supplierId}`);
  }

  // Distributors only see this supplier's products that flow through their distribution
  const scopeDistributorId = user?.role === "DISTRIBUTOR" ? user.distributorId : undefined;
  const data = await getSupplierDetail(params.id, scopeDistributorId);
  if (!data) notFound();

  const { supplier, metrics, volumeTrend, categoryBreakdown, distributorPartners, outletPerformance, productPerformance, winePortfolio } = data;

  const formatCurrency = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}K`
        : `$${n.toFixed(0)}`;

  // Serialize dates for client component
  const serializedDistributorPartners = distributorPartners.map((d) => ({
    ...d,
    lastOrder: d.lastOrder ? d.lastOrder.toISOString() : null,
  }));

  const serializedOutlets = outletPerformance.map((o) => ({
    ...o,
    lastOrder: o.lastOrder ? o.lastOrder.toISOString() : null,
  }));

  const serializedProducts = productPerformance.map((p) => ({
    ...p,
    lastOrder: p.lastOrder ? p.lastOrder.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/partners/suppliers"
            className="text-sm text-muted-foreground hover:text-[#06113e] transition-colors"
          >
            Suppliers
          </Link>
          <span className="text-sm text-muted-foreground">/</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
              {supplier.name}
            </h1>
            <div className="flex items-center gap-3 mt-1.5">
              <Badge variant="secondary">Supplier</Badge>
              {supplier.website && (
                <a
                  href={supplier.website.startsWith("http") ? supplier.website : `https://${supplier.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#5ad196] hover:underline"
                >
                  {supplier.website}
                </a>
              )}
              {supplier.contactName && (
                <span className="text-sm text-muted-foreground">
                  {supplier.contactName}
                </span>
              )}
              {supplier.contactEmail && (
                <a
                  href={`mailto:${supplier.contactEmail}`}
                  className="text-sm text-[#5ad196] hover:underline"
                >
                  {supplier.contactEmail}
                </a>
              )}
              {supplier.contactPhone && (
                <span className="text-sm text-muted-foreground">
                  {supplier.contactPhone}
                </span>
              )}
            </div>
          </div>
          <ExportButton reportType="orders" />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          label="Products"
          value={metrics.totalProducts}
          subtitle="Active SKUs"
        />
        <MetricCard
          label="Wine SKUs"
          value={metrics.wineProducts}
          subtitle={`${metrics.totalProducts > 0 ? Math.round((metrics.wineProducts / metrics.totalProducts) * 100) : 0}% of portfolio`}
        />
        <MetricCard
          label="Distributors"
          value={metrics.distributorCount}
          subtitle="Channel partners"
        />
        <MetricCard
          label="Outlets Reached"
          value={metrics.outletsServed}
          subtitle="Active outlets"
        />
        <MetricCard
          label="Volume (12mo)"
          value={formatCurrency(metrics.volume12mo)}
          subtitle={`${metrics.totalUnits12mo.toLocaleString()} units`}
        />
        <MetricCard
          label="Growth"
          value={`${metrics.yoyChange >= 0 ? "+" : ""}${metrics.yoyChange}%`}
          trend={metrics.yoyChange >= 0 ? "up" : "down"}
          trendValue="vs prior period"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Volume by Category</CardTitle>
            <CardDescription>
              Order volume trend over the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {volumeTrend.length > 0 ? (
              <VolumeChart data={volumeTrend} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No volume data available
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Mix</CardTitle>
            <CardDescription>
              Distribution by category (12 months)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length > 0 ? (
              <CategoryPieChart data={categoryBreakdown} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No category data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Interactive Tables */}
      <SupplierTabs
        distributorPartners={serializedDistributorPartners}
        outletPerformance={serializedOutlets}
        productPerformance={serializedProducts}
        winePortfolio={winePortfolio}
      />
    </div>
  );
}
