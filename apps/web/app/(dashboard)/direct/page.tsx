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
import { getDirectOverview, getDirectTrackingBoard } from "@/lib/queries/direct";

export default async function DirectPage() {
  const [overview, trackingBoard] = await Promise.all([
    getDirectOverview(),
    getDirectTrackingBoard(),
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
            <div className="space-y-3">
              {trackingBoard.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between hover:border-[#5ad196]/40 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[#06113e]">
                        {item.productName}
                      </p>
                      <Badge variant="secondary" className="text-[10px]">
                        {item.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.vendorName}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {item.outlets.map((outlet) => (
                        <Badge
                          key={outlet}
                          variant="outline"
                          className="text-[10px] border-[#5ad196]/30 text-[#06113e]"
                        >
                          {outlet}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-sm shrink-0 space-y-0.5">
                    <p>
                      <span className="text-muted-foreground">Frequency:</span>{" "}
                      <span className="font-medium">{item.frequency}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Orders:</span>{" "}
                      <span className="font-medium">{item.orderCount}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        ({item.totalQuantity.toLocaleString()} units)
                      </span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">First:</span>{" "}
                      {new Date(item.firstOrder).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Last:</span>{" "}
                      {new Date(item.lastOrder).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
