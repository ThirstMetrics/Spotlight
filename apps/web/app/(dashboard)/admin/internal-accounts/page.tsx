export const dynamic = "force-dynamic";

import {
  getAdminTrackingNumbers,
  getOutletOptions,
  getAdminOverview,
} from "@/lib/queries/admin";
import { getServerUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TrackingNumberTable } from "./TrackingNumberTable";
import { TrackingNumberForm } from "./TrackingNumberForm";
import { PasteImportDialog } from "./PasteImportDialog";
import { Hash, Building2, AlertTriangle, BarChart3 } from "lucide-react";
import Link from "next/link";

export default async function InternalAccountsPage() {
  const user = await getServerUser();
  const orgId = user?.organizationId;
  const [trackingNumbers, outlets, overview] = await Promise.all([
    getAdminTrackingNumbers(orgId),
    getOutletOptions(orgId),
    getAdminOverview(orgId),
  ]);

  const totalTracking = trackingNumbers.length;
  const outletsWithAccounts = new Set(trackingNumbers.map((t) => t.outletId)).size;
  const outletsMissing = overview.outletCount - outletsWithAccounts;

  // Find the most common tracking number type
  const typeCounts = trackingNumbers.reduce(
    (acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const typeLabels: Record<string, string> = {
    POS: "POS ID",
    COST_CENTER: "Cost Center",
    PURCHASING_SYSTEM: "Purchasing",
    GL_CODE: "GL Code",
    INVENTORY_SYSTEM: "Inventory",
    OTHER: "Other",
  };
  const mostCommonType = Object.entries(typeCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];

  // Serialize dates for client components
  const serialized = trackingNumbers.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Heading */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-[#06113e] transition-colors"
          >
            Admin
          </Link>
          <span className="text-sm text-muted-foreground">/</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#06113e]">
              Internal Accounts
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage POS IDs, cost centers, GL codes, and other tracking numbers
              per outlet
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TrackingNumberForm outlets={outlets} />
            <PasteImportDialog outlets={outlets} />
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Tracking Numbers"
          value={totalTracking}
          icon={<Hash className="h-5 w-5" />}
        />
        <MetricCard
          label="Outlets With Accounts"
          value={outletsWithAccounts}
          icon={<Building2 className="h-5 w-5" />}
        />
        <MetricCard
          label="Outlets Missing"
          value={outletsMissing}
          icon={<AlertTriangle className="h-5 w-5" />}
          trend={outletsMissing > 0 ? "down" : "up"}
          trendValue={outletsMissing > 0 ? "Need attention" : "All covered"}
        />
        <MetricCard
          label="Most Common Type"
          value={mostCommonType ? typeLabels[mostCommonType[0]] ?? mostCommonType[0] : "—"}
          subtitle={
            mostCommonType ? `${mostCommonType[1]} entries` : "No data yet"
          }
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#06113e]">
            All Tracking Numbers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serialized.length > 0 ? (
            <TrackingNumberTable data={serialized} />
          ) : (
            <div className="py-12 text-center">
              <Hash className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-600">
                No tracking numbers yet
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Use &quot;Paste List&quot; to bulk import or &quot;Add
                Account&quot; to add one at a time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
