import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sampleProducts = [
  {
    sku: "SP-001",
    name: "Grey Goose Vodka",
    category: "Spirits",
    size: "1L",
    distributors: 2,
    substitution: null,
  },
  {
    sku: "SP-002",
    name: "Hendrick's Gin",
    category: "Spirits",
    size: "750ml",
    distributors: 1,
    substitution: null,
  },
  {
    sku: "WN-015",
    name: "Caymus Cabernet Sauvignon",
    category: "Wine",
    size: "750ml",
    distributors: 1,
    substitution: "Silver Oak Cabernet Sauvignon",
  },
  {
    sku: "BR-008",
    name: "Modelo Especial",
    category: "Beer",
    size: "12pk",
    distributors: 2,
    substitution: null,
  },
  {
    sku: "SK-003",
    name: "Dassai 23 Junmai Daiginjo",
    category: "Sake",
    size: "720ml",
    distributors: 1,
    substitution: "Kubota Manju",
  },
];

export default function CatalogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
        <p className="text-muted-foreground">
          Master product list with substitution tracking and distributor
          coverage.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Spirits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">112</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Wine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Beer / Sake</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>
            All products with category, size, distributor coverage, and
            substitution info
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">SKU</th>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Size</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Distributors
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Substitution
                  </th>
                </tr>
              </thead>
              <tbody>
                {sampleProducts.map((product) => (
                  <tr key={product.sku} className="border-b">
                    <td className="px-4 py-3 font-mono text-xs">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{product.category}</Badge>
                    </td>
                    <td className="px-4 py-3">{product.size}</td>
                    <td className="px-4 py-3 text-right">
                      {product.distributors}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.substitution || "---"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-center rounded-md border border-dashed p-4">
            <p className="text-sm text-muted-foreground">
              Full AG Grid catalog table with search and filtering will render
              here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
