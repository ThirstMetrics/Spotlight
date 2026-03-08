export const dynamic = "force-dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMapData } from "@/lib/queries/map";
import OutletMap from "./OutletMap";

export default async function MapPage() {
  const { outlets, summary } = await getMapData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Map View
        </h1>
        <p className="text-muted-foreground">
          Geographic visualization of product placement across Resorts World
          outlets.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Mapped Outlets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#06113e]">
              {summary.totalOutlets}
            </div>
            <p className="text-xs text-muted-foreground">
              All outlets geocoded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#06113e]">
              {summary.totalProducts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique products in catalog
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Distributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#06113e]">
              {summary.totalDistributors}
            </div>
            <p className="text-xs text-muted-foreground">
              Distribution partners
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Resorts World Las Vegas — Outlet Map</CardTitle>
          <CardDescription>
            Click an outlet marker to view order volume, product count, and
            sales data. Marker size reflects relative order volume.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OutletMap outlets={outlets} />
        </CardContent>
      </Card>
    </div>
  );
}
