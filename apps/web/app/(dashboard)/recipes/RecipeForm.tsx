"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { notify } from "@/lib/hooks/use-notify";
import { Plus, Trash2, Loader2, Search } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  size?: string;
  unit?: string;
}

interface Outlet {
  id: string;
  name: string;
}

interface IngredientRow {
  key: string; // stable client-side key for list rendering
  productId: string;
  productName: string;
  productSku: string;
  unitCost: number;
  quantity: string; // kept as string so the input can show "0.5" etc.
  unit: string;
  notes: string;
}

export interface RecipeFormData {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  yieldServings: number;
  sellingPrice?: number | null;
  outletId?: string | null;
  ingredients: {
    productId: string;
    productName: string;
    productSku: string;
    unitCost: number;
    quantity: number;
    unit: string;
    notes?: string;
  }[];
}

interface RecipeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass existing recipe data to edit mode */
  initialData?: RecipeFormData;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { value: "COCKTAIL", label: "Cocktail" },
  { value: "WINE_COCKTAIL", label: "Wine Cocktail" },
  { value: "BEER_COCKTAIL", label: "Beer Cocktail" },
  { value: "MOCKTAIL", label: "Mocktail" },
  { value: "BATCH", label: "Batch" },
];

const COMMON_UNITS = ["oz", "ml", "cl", "dash", "splash", "barspoon", "cup", "fl oz"];

let keyCounter = 0;
function nextKey() {
  return `ing-${++keyCounter}`;
}

function emptyRow(): IngredientRow {
  return {
    key: nextKey(),
    productId: "",
    productName: "",
    productSku: "",
    unitCost: 0,
    quantity: "1",
    unit: "oz",
    notes: "",
  };
}

// ---------------------------------------------------------------------------
// Product Search Combobox (inline, no external dependency)
// ---------------------------------------------------------------------------

interface ProductSearchProps {
  value: string;
  productName: string;
  onChange: (product: Product) => void;
  products: Product[];
}

function ProductSearch({ value, productName, onChange, products }: ProductSearchProps) {
  const [query, setQuery] = useState(productName);
  const [open, setOpen] = useState(false);

  // Keep query in sync when parent resets the row
  useEffect(() => {
    setQuery(productName);
  }, [productName]);

  const filtered = query.length >= 1
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 12)
    : [];

  function handleSelect(p: Product) {
    setQuery(p.name);
    setOpen(false);
    onChange(p);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
        <Input
          placeholder="Search products..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) {
              onChange({ id: "", name: "", sku: "", category: "", size: "", unit: "" });
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="pl-8 text-sm h-8"
          aria-label="Search products"
        />
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded border border-gray-200 bg-white shadow-md text-sm">
          {filtered.map((p) => (
            <li
              key={p.id}
              className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                p.id === value ? "bg-blue-50" : ""
              }`}
              onMouseDown={() => handleSelect(p)}
            >
              <span className="font-medium truncate max-w-[65%]">{p.name}</span>
              <span className="text-gray-400 text-xs shrink-0 ml-2">{p.sku}</span>
            </li>
          ))}
        </ul>
      )}
      {open && query.length >= 1 && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400 shadow-md">
          No products found
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main RecipeForm Component
// ---------------------------------------------------------------------------

export function RecipeForm({ open, onOpenChange, initialData }: RecipeFormProps) {
  const router = useRouter();
  const isEdit = !!initialData?.id;

  // Form state
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "COCKTAIL");
  const [yieldServings, setYieldServings] = useState(
    String(initialData?.yieldServings ?? 1),
  );
  const [sellingPrice, setSellingPrice] = useState(
    initialData?.sellingPrice != null ? String(initialData.sellingPrice) : "",
  );
  const [outletId, setOutletId] = useState(initialData?.outletId ?? "");

  const [rows, setRows] = useState<IngredientRow[]>(() => {
    if (initialData?.ingredients?.length) {
      return initialData.ingredients.map((ing) => ({
        key: nextKey(),
        productId: ing.productId,
        productName: ing.productName,
        productSku: ing.productSku,
        unitCost: ing.unitCost,
        quantity: String(ing.quantity),
        unit: ing.unit,
        notes: ing.notes ?? "",
      }));
    }
    return [emptyRow()];
  });

  // Remote data
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load products and outlets on open
  const loadData = useCallback(async () => {
    setLoadingData(true);
    const [prodRes, outletRes] = await Promise.all([
      apiClient<{ data: Product[]; total: number }>("/api/products?pageSize=200"),
      apiClient<{ data: Outlet[]; total: number }>("/api/outlets?pageSize=100&isActive=true"),
    ]);
    if (prodRes.success && prodRes.data) {
      setProducts(prodRes.data.data);
    }
    if (outletRes.success && outletRes.data) {
      setOutlets(outletRes.data.data);
    }
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  // Re-sync form when initialData changes (edit re-open)
  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setDescription(initialData?.description ?? "");
      setCategory(initialData?.category ?? "COCKTAIL");
      setYieldServings(String(initialData?.yieldServings ?? 1));
      setSellingPrice(
        initialData?.sellingPrice != null ? String(initialData.sellingPrice) : "",
      );
      setOutletId(initialData?.outletId ?? "");
      setRows(
        initialData?.ingredients?.length
          ? initialData.ingredients.map((ing) => ({
              key: nextKey(),
              productId: ing.productId,
              productName: ing.productName,
              productSku: ing.productSku,
              unitCost: ing.unitCost,
              quantity: String(ing.quantity),
              unit: ing.unit,
              notes: ing.notes ?? "",
            }))
          : [emptyRow()],
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData?.id]);

  // ---------------------------------------------------------------------------
  // Client-side cost calculation
  // ---------------------------------------------------------------------------

  const totalCost = rows.reduce((sum, row) => {
    const qty = parseFloat(row.quantity);
    return sum + (isNaN(qty) ? 0 : qty * row.unitCost);
  }, 0);

  const yield_ = parseInt(yieldServings) || 1;
  const costPerServing = totalCost / yield_;

  const sellPrice = parseFloat(sellingPrice);
  const marginPct =
    sellingPrice && !isNaN(sellPrice) && sellPrice > 0 && costPerServing > 0
      ? Math.round(((sellPrice - costPerServing) / sellPrice) * 100)
      : null;

  // ---------------------------------------------------------------------------
  // Ingredient row handlers
  // ---------------------------------------------------------------------------

  function updateRow(key: string, patch: Partial<IngredientRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  function handleProductSelect(key: string, product: Product) {
    // Try to infer a sensible unit from the product's unit field
    const inferredUnit = product.unit?.toLowerCase().includes("oz")
      ? "oz"
      : product.unit?.toLowerCase().includes("ml")
      ? "ml"
      : "oz";

    // Look up cost from products array (the API returns it via distributorProducts)
    // The /api/products list doesn't include cost; we'll look up from what we fetched.
    // We store unitCost = 0 here; when the recipe is saved the API will compute the
    // live cost from distributor_products. The client-side preview will show $0 if cost
    // isn't available, which is acceptable.
    updateRow(key, {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      unitCost: 0, // we don't have cost in the products list endpoint
      unit: inferredUnit,
    });
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit() {
    if (!name.trim()) {
      notify.warning("Recipe name is required");
      return;
    }

    const yieldNum = parseInt(yieldServings);
    if (!yieldNum || yieldNum < 1) {
      notify.warning("Yield servings must be at least 1");
      return;
    }

    const validRows = rows.filter((r) => r.productId && parseFloat(r.quantity) > 0);
    if (validRows.length === 0) {
      notify.warning("Add at least one ingredient with a product and quantity");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      category: category || undefined,
      yieldServings: yieldNum,
      sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
      outletId: outletId || null,
      ingredients: validRows.map((r) => ({
        productId: r.productId,
        quantity: parseFloat(r.quantity),
        unit: r.unit.trim() || "oz",
        notes: r.notes.trim() || undefined,
      })),
    };

    setSubmitting(true);

    const res = isEdit
      ? await apiClient(`/api/recipes/${initialData!.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      : await apiClient("/api/recipes", {
          method: "POST",
          body: JSON.stringify(payload),
        });

    if (res.success) {
      notify.success(isEdit ? "Recipe updated" : "Recipe created");
      onOpenChange(false);
      router.refresh();
    } else {
      notify.error(res.error ?? "Failed to save recipe");
    }

    setSubmitting(false);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Recipe" : "New Recipe"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the recipe details and ingredients."
              : "Create a new cocktail recipe with ingredients and pricing."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="rf-name">Recipe Name *</Label>
              <Input
                id="rf-name"
                placeholder="e.g. Classic Old Fashioned"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rf-category">Category</Label>
              <select
                id="rf-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rf-outlet">Outlet (optional)</Label>
              <select
                id="rf-outlet"
                value={outletId}
                onChange={(e) => setOutletId(e.target.value)}
                className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm"
                disabled={loadingData}
              >
                <option value="">All outlets</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rf-yield">Yield (servings) *</Label>
              <Input
                id="rf-yield"
                type="number"
                min={1}
                step={1}
                placeholder="1"
                value={yieldServings}
                onChange={(e) => setYieldServings(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rf-price">Selling Price ($)</Label>
              <Input
                id="rf-price"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="rf-desc">Description</Label>
              <Textarea
                id="rf-desc"
                placeholder="Optional notes about this recipe..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          {/* Cost preview */}
          {(totalCost > 0 || marginPct !== null) && (
            <div className="flex items-center gap-4 rounded-md bg-gray-50 px-4 py-2.5 text-sm">
              <span className="text-gray-500">
                Batch cost:{" "}
                <span className="font-semibold text-gray-900">
                  ${totalCost.toFixed(2)}
                </span>
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">
                Cost/serving:{" "}
                <span className="font-semibold text-gray-900">
                  ${costPerServing.toFixed(2)}
                </span>
              </span>
              {marginPct !== null && (
                <>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">
                    Margin:{" "}
                    <span
                      className={`font-semibold ${
                        marginPct >= 70
                          ? "text-[#5ad196]"
                          : marginPct >= 50
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {marginPct}%
                    </span>
                  </span>
                </>
              )}
            </div>
          )}

          {/* Ingredients */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ingredients *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
                className="h-7 gap-1 text-xs border-[#06113e] text-[#06113e] hover:bg-[#06113e]/5"
              >
                <Plus className="h-3 w-3" />
                Add ingredient
              </Button>
            </div>

            {loadingData && (
              <p className="text-sm text-muted-foreground py-2">
                Loading products...
              </p>
            )}

            {!loadingData && (
              <div className="rounded border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[1fr_80px_80px_1fr_32px] gap-2 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
                  <span>Product</span>
                  <span>Qty</span>
                  <span>Unit</span>
                  <span>Notes</span>
                  <span />
                </div>

                {/* Rows */}
                {rows.map((row, idx) => (
                  <div
                    key={row.key}
                    className={`grid grid-cols-[1fr_80px_80px_1fr_32px] gap-2 items-center px-3 py-2 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                    }`}
                  >
                    {/* Product search */}
                    <ProductSearch
                      value={row.productId}
                      productName={row.productName}
                      products={products}
                      onChange={(p) => handleProductSelect(row.key, p)}
                    />

                    {/* Quantity */}
                    <Input
                      type="number"
                      min={0}
                      step={0.25}
                      value={row.quantity}
                      onChange={(e) =>
                        updateRow(row.key, { quantity: e.target.value })
                      }
                      className="h-8 text-sm text-right"
                      aria-label="Quantity"
                    />

                    {/* Unit */}
                    <div className="relative">
                      <Input
                        list={`units-${row.key}`}
                        value={row.unit}
                        onChange={(e) =>
                          updateRow(row.key, { unit: e.target.value })
                        }
                        className="h-8 text-sm"
                        aria-label="Unit"
                      />
                      <datalist id={`units-${row.key}`}>
                        {COMMON_UNITS.map((u) => (
                          <option key={u} value={u} />
                        ))}
                      </datalist>
                    </div>

                    {/* Notes */}
                    <Input
                      placeholder="optional"
                      value={row.notes}
                      onChange={(e) =>
                        updateRow(row.key, { notes: e.target.value })
                      }
                      className="h-8 text-sm"
                      aria-label="Notes"
                    />

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      disabled={rows.length === 1}
                      className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                      aria-label="Remove ingredient"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#06113e] text-white hover:bg-[#06113e]/90"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Saving..." : "Creating..."}
              </>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Create Recipe"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
