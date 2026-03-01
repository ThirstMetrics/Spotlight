import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sampleCompliance = [
  {
    outlet: "Carversteak",
    mandate: "National Spirits Program",
    product: "Grey Goose Vodka 1L",
    status: "compliant",
    lastOrder: "2026-02-18",
  },
  {
    outlet: "Bar Zazu",
    mandate: "National Spirits Program",
    product: "Hendrick's Gin 750ml",
    status: "compliant",
    lastOrder: "2026-02-22",
  },
  {
    outlet: "Redtail",
    mandate: "Wine Portfolio",
    product: "Opus One 2021",
    status: "non-compliant",
    lastOrder: "Never ordered",
  },
  {
    outlet: "Pool Bar & Grill",
    mandate: "Beer Program",
    product: "Corona Extra 12pk",
    status: "compliant",
    lastOrder: "2026-02-25",
  },
  {
    outlet: "Dawg House Saloon",
    mandate: "National Spirits Program",
    product: "Don Julio 1942",
    status: "pending",
    lastOrder: "2026-01-10",
  },
];

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "compliant":
      return <Badge variant="success">Compliant</Badge>;
    case "non-compliant":
      return <Badge variant="destructive">Non-Compliant</Badge>;
    case "pending":
      return <Badge variant="warning">Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Compliance Tracker
        </h1>
        <p className="text-muted-foreground">
          Track mandate compliance across all outlets. Matrix view showing
          ordered vs not-ordered status.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">
              47 of 50 items ordered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Mandates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Across all outlet groups
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Non-Compliant Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">3</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Matrix</CardTitle>
          <CardDescription>
            Mandate compliance status by outlet and product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Outlet</th>
                  <th className="px-4 py-3 text-left font-medium">Mandate</th>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Last Order
                  </th>
                </tr>
              </thead>
              <tbody>
                {sampleCompliance.map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-3 font-medium">{row.outlet}</td>
                    <td className="px-4 py-3">{row.mandate}</td>
                    <td className="px-4 py-3">{row.product}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.lastOrder}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
