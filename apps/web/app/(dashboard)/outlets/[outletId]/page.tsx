import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OutletDetailPageProps {
  params: Promise<{ outletId: string }>;
}

export default async function OutletDetailPage({
  params,
}: OutletDetailPageProps) {
  const { outletId } = await params;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Outlet Detail</h1>
          <Badge variant="outline">{outletId}</Badge>
        </div>
        <p className="text-muted-foreground">
          Products, inventory, compliance status, and trends for this outlet.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cost %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
          <CardDescription>
            Full product list with order history, inventory levels, and
            compliance status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-96 items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">
              AG Grid data table will render here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
