"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { notify } from "@/lib/hooks/use-notify";
import { RecipeForm, type RecipeFormData } from "./RecipeForm";
import { Pencil, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Ingredient {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unit: string;
  unitCost: number;
  cost: number;
  notes: string | null;
}

export interface RecipeCardData {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  outletId: string | null;
  outletName: string | null;
  yieldServings: number;
  sellingPrice: number | null;
  totalCost: number;
  costPerServing: number;
  marginPct: number | null;
  ingredientCount: number;
  ingredients: Ingredient[];
}

interface RecipeCardProps {
  recipe: RecipeCardData;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  COCKTAIL: "Cocktail",
  WINE_COCKTAIL: "Wine Cocktail",
  BEER_COCKTAIL: "Beer Cocktail",
  MOCKTAIL: "Mocktail",
  BATCH: "Batch",
};

const CATEGORY_COLORS: Record<string, string> = {
  COCKTAIL: "bg-blue-100 text-blue-700",
  WINE_COCKTAIL: "bg-purple-100 text-purple-700",
  BEER_COCKTAIL: "bg-amber-100 text-amber-700",
  MOCKTAIL: "bg-teal-100 text-teal-700",
  BATCH: "bg-orange-100 text-orange-700",
};

function marginColor(pct: number): string {
  if (pct >= 70) return "text-[#5ad196] font-semibold";
  if (pct >= 50) return "text-amber-600 font-semibold";
  return "text-red-600 font-semibold";
}

// ---------------------------------------------------------------------------
// Delete Confirmation Dialog (lightweight inline, no extra deps)
// ---------------------------------------------------------------------------

interface DeleteDialogProps {
  open: boolean;
  recipeName: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteDialog({
  open,
  recipeName,
  deleting,
  onConfirm,
  onCancel,
}: DeleteDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-gray-900">Delete Recipe</h2>
        <p className="mt-2 text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-medium text-gray-900">{recipeName}</span>? This
          action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={deleting}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RecipeCard
// ---------------------------------------------------------------------------

export function RecipeCard({ recipe }: RecipeCardProps) {
  const router = useRouter();

  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const categoryLabel = recipe.category
    ? (CATEGORY_LABELS[recipe.category] ?? recipe.category)
    : null;
  const categoryClass = recipe.category
    ? (CATEGORY_COLORS[recipe.category] ?? "bg-gray-100 text-gray-700")
    : "bg-gray-100 text-gray-700";

  // Build RecipeFormData for the edit dialog
  const editData: RecipeFormData = {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description ?? undefined,
    category: recipe.category ?? undefined,
    yieldServings: recipe.yieldServings,
    sellingPrice: recipe.sellingPrice,
    outletId: recipe.outletId,
    ingredients: recipe.ingredients.map((ing) => ({
      productId: ing.productId,
      productName: ing.productName,
      productSku: ing.productSku,
      unitCost: ing.unitCost,
      quantity: ing.quantity,
      unit: ing.unit,
      notes: ing.notes ?? undefined,
    })),
  };

  async function handleDelete() {
    setDeleting(true);
    const res = await apiClient(`/api/recipes/${recipe.id}`, {
      method: "DELETE",
    });
    if (res.success) {
      notify.success("Recipe deleted");
      setDeleteOpen(false);
      router.refresh();
    } else {
      notify.error(res.error ?? "Failed to delete recipe");
    }
    setDeleting(false);
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-sm transition-shadow">
        {/* Card header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4">
          {/* Left: info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-[#06113e] truncate">{recipe.name}</h3>
              {categoryLabel && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryClass}`}
                >
                  {categoryLabel}
                </span>
              )}
            </div>
            {recipe.description && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                {recipe.description}
              </p>
            )}
            {recipe.outletName && (
              <p className="mt-0.5 text-xs text-gray-400">{recipe.outletName}</p>
            )}
          </div>

          {/* Right: metrics + actions */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Metrics row */}
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="text-xs text-gray-400">Ingredients</p>
                <p className="font-medium text-gray-700">{recipe.ingredientCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Cost/serving</p>
                <p className="font-medium text-gray-700">
                  ${recipe.costPerServing.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Sell price</p>
                <p className="font-medium text-gray-700">
                  {recipe.sellingPrice != null
                    ? `$${recipe.sellingPrice.toFixed(2)}`
                    : "\u2014"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Margin</p>
                {recipe.marginPct !== null ? (
                  <p className={marginColor(recipe.marginPct)}>
                    {recipe.marginPct}%
                  </p>
                ) : (
                  <p className="text-gray-400">\u2014</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:text-[#06113e] hover:bg-gray-100 transition-colors"
                title="Edit recipe"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete recipe"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title={expanded ? "Collapse" : "Expand ingredients"}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile metrics (visible on small screens only) */}
        <div className="sm:hidden flex items-center gap-4 px-5 pb-3 text-sm border-t border-gray-100 pt-3">
          <div className="text-center">
            <p className="text-xs text-gray-400">Ings</p>
            <p className="font-medium">{recipe.ingredientCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Cost</p>
            <p className="font-medium">${recipe.costPerServing.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Price</p>
            <p className="font-medium">
              {recipe.sellingPrice != null
                ? `$${recipe.sellingPrice.toFixed(2)}`
                : "\u2014"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Margin</p>
            {recipe.marginPct !== null ? (
              <p className={marginColor(recipe.marginPct)}>{recipe.marginPct}%</p>
            ) : (
              <p className="text-gray-400">\u2014</p>
            )}
          </div>
        </div>

        {/* Expanded ingredient list */}
        {expanded && recipe.ingredients.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400">
                  <th className="py-1 text-left font-medium">Ingredient</th>
                  <th className="py-1 text-right font-medium">Qty</th>
                  <th className="py-1 text-right font-medium">Unit</th>
                  <th className="py-1 text-right font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {recipe.ingredients.map((ing) => (
                  <tr key={ing.id} className="border-t border-gray-50">
                    <td className="py-1.5 text-gray-700">{ing.productName}</td>
                    <td className="py-1.5 text-right text-gray-600">
                      {ing.quantity}
                    </td>
                    <td className="py-1.5 text-right text-gray-600">{ing.unit}</td>
                    <td className="py-1.5 text-right text-gray-700 font-medium">
                      ${ing.cost.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-gray-200">
                  <td
                    colSpan={3}
                    className="py-1.5 text-right font-medium text-gray-500"
                  >
                    Batch total
                  </td>
                  <td className="py-1.5 text-right font-semibold text-[#06113e]">
                    ${recipe.totalCost.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <RecipeForm
        open={editOpen}
        onOpenChange={setEditOpen}
        initialData={editData}
      />

      {/* Delete confirmation */}
      <DeleteDialog
        open={deleteOpen}
        recipeName={recipe.name}
        deleting={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
