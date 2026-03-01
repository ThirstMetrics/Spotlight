import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const suppliers = [
  {
    name: "Diageo",
    brands: "Johnnie Walker, Don Julio, Tanqueray",
    outlets: 10,
    volume: "$245,800",
  },
  {
    name: "Pernod Ricard",
    brands: "Absolut, Jameson, The Glenlivet",
    outlets: 8,
    volume: "$198,300",
  },
  {
    name: "LVMH / Moet Hennessy",
    brands: "Hennessy, Veuve Clicquot, Dom Perignon",
    outlets: 7,
    volume: "$312,500",
  },
  {
    name: "Bacardi Limited",
    brands: "Bacardi, Grey Goose, Patron",
    outlets: 9,
    volume: "$167,400",
  },
  {
    name: "Brown-Forman",
    brands: "Jack Daniel's, Woodford Reserve, Old Forester",
    outlets: 8,
    volume: "$134,200",
  },
];

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
        <p className="text-muted-foreground">
          Supplier performance aggregated across all distributors.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              Across all distributors
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Multi-Distributor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              Supplied through 2+ distributors
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Supplier Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,058,200</div>
            <p className="text-xs text-muted-foreground">Current period</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Performance</CardTitle>
          <CardDescription>
            Volume, outlet coverage, and brand portfolio by supplier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Supplier</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Key Brands
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Outlets</th>
                  <th className="px-4 py-3 text-right font-medium">Volume</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.name} className="border-b">
                    <td className="px-4 py-3 font-medium">{supplier.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {supplier.brands}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="secondary">
                        {supplier.outlets} outlets
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {supplier.volume}
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
