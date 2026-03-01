import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Map View</h1>
        <p className="text-muted-foreground">
          Geographic visualization of product placement across outlets.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outlet Map</CardTitle>
          <CardDescription>
            Interactive map showing outlets, product placement, and distribution
            coverage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[500px] items-center justify-center rounded-md border border-dashed">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Mapbox GL JS map will render here
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Requires NEXT_PUBLIC_MAP_TOKEN environment variable
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Mapped Outlets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10</div>
            <p className="text-xs text-muted-foreground">
              All outlets geocoded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Product Pins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">
              Unique products mapped
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Distribution Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">
              Active distributor routes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
