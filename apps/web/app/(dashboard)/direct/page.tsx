export const dynamic = "force-dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getDirectOverview, getDirectTrackingBoard } from "@/lib/queries/direct";
import { getServerUser } from "@/lib/auth";
import { DirectOrdersTable } from "./DirectOrdersTable";

export default async function DirectPage() {
  const user = await getServerUser();
  const organizationId = user?.organizationId;

  const [overview, trackingBoard] = await Promise.all([
    getDirectOverview({ organizationId }),
    getDirectTrackingBoard({ organizationId }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Direct-to-Outlet Tracking
        </h1>
        <p className="text-muted-foreground">
          Track items shipped directly from vendors to outlets, bypassing the
          warehouse.
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Direct Items"
          value={overview.directItems}
          subtitle="Active direct-ship products"
        />
        <MetricCard
          label="Direct Vendors"
          value={overview.directVendors}
          subtitle="Shipping directly to outlets"
        />
        <MetricCard
          label="Outlets Receiving"
          value={overview.outletsReceiving}
          subtitle={`Of ${overview.totalOutlets} total outlets`}
        />
      </div>

      {/* Tracking Board */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Direct Order Tracking Board</CardTitle>
          <CardDescription>
            Item name, outlets, order frequency, and first/last order dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trackingBoard.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No direct orders recorded. Direct orders will appear here when vendors
              ship directly to outlets.
            </p>
          ) : (
            <DirectOrdersTable data={trackingBoard} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
