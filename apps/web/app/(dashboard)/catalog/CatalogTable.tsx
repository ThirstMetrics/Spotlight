"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/dashboard/DataTable";

interface CatalogProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  subcategory: string | null;
  size: string | null;
  unit: string | null;
  distributorCount: number;
  distributors: { name: string; supplierName: string }[];
  avgCost: number;
  substitutions: { id: string; name: string }[];
}

const formatCurrency = (n: number) => `$${n.toFixed(2)}`;

const columns: Column<CatalogProduct>[] = [
  {
    key: "name",
    label: "Product",
    render: (row) => (
      <span className="font-medium text-[#06113e]">
        {row.name}
        {row.subcategory && (
          <span className="text-xs text-muted-foreground block">
            {row.subcategory}
          </span>
        )}
      </span>
    ),
    searchValue: (row) => `${row.name} ${row.subcategory ?? ""}`,
  },
  {
    key: "sku",
    label: "SKU",
    render: (row) => (
      <span className="text-muted-foreground font-mono text-xs">{row.sku}</span>
    ),
  },
  {
    key: "category",
    label: "Category",
    render: (row) => (
      <Badge variant="secondary" className="text-xs">
        {row.category}
      </Badge>
    ),
  },
  {
    key: "size",
    label: "Size",
    render: (row) => (
      <span className="text-muted-foreground">
        {row.size ?? "\u2014"}
        {row.unit ? ` ${row.unit}` : ""}
      </span>
    ),
    sortable: false,
  },
  {
    key: "distributorCount",
    label: "Distributors",
    align: "right",
    render: (row) =>
      row.distributorCount > 0 ? (
        <span
          className="cursor-help"
          title={row.distributors
            .map((d) => `${d.name} (${d.supplierName})`)
            .join(", ")}
        >
          {row.distributorCount}
        </span>
      ) : (
        <span className="text-muted-foreground">\u2014</span>
      ),
  },
  {
    key: "avgCost",
    label: "Avg Cost",
    align: "right",
    render: (row) => (
      <span className="font-medium">
        {row.avgCost > 0 ? formatCurrency(row.avgCost) : "\u2014"}
      </span>
    ),
  },
  {
    key: "substitutions",
    label: "Substitutions",
    sortable: false,
    render: (row) =>
      row.substitutions.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {row.substitutions.map((sub) => (
            <Badge key={sub.id} variant="outline" className="text-xs">
              {sub.name}
            </Badge>
          ))}
        </div>
      ) : (
        <span className="text-muted-foreground text-xs">None</span>
      ),
  },
];

export function CatalogTable({ data }: { data: CatalogProduct[] }) {
  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Search products, SKUs..."
    />
  );
}
