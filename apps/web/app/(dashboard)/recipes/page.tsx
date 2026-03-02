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
import { getRecipeOverview, getRecipeList } from "@/lib/queries/recipes";

export default async function RecipesPage() {
  const [overview, recipes] = await Promise.all([
    getRecipeOverview(),
    getRecipeList(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Recipe Builder
        </h1>
        <p className="text-muted-foreground">
          Create and manage cocktail recipes with real-time cost calculations.
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Total Recipes"
          value={overview.totalRecipes}
          subtitle="Across all outlets"
        />
        <MetricCard
          label="Avg Cocktail Cost"
          value={`$${overview.avgCost.toFixed(2)}`}
          subtitle="Based on current ingredient prices"
        />
        <MetricCard
          label="Avg Margin"
          value={overview.avgMargin > 0 ? `${overview.avgMargin}%` : "\u2014"}
          subtitle="Across all recipes with pricing"
          trend={overview.avgMargin >= 70 ? "up" : overview.avgMargin > 0 ? "down" : "neutral"}
        />
      </div>

      {/* Recipe Library */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recipe Library</CardTitle>
          <CardDescription>
            All cocktail recipes with ingredient counts, cost, and margin data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recipes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No recipes found. Create recipes by adding ingredients from the product catalog.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Recipe</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Outlet</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Ingredients</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Cost/Serving</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Sell Price</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {recipes.map((recipe) => (
                    <tr key={recipe.id} className="border-b hover:bg-gray-50/30">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-[#06113e]">{recipe.name}</p>
                          {recipe.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">{recipe.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-[10px]">{recipe.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{recipe.outletName}</td>
                      <td className="px-4 py-3 text-right">{recipe.ingredientCount}</td>
                      <td className="px-4 py-3 text-right font-medium">${recipe.costPerServing.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        {recipe.sellingPrice ? `$${recipe.sellingPrice.toFixed(2)}` : "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {recipe.marginPct !== null ? (
                          <span className={recipe.marginPct >= 70 ? "text-[#5ad196] font-medium" : recipe.marginPct >= 50 ? "text-amber-600 font-medium" : "text-red-600 font-medium"}>
                            {recipe.marginPct}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{"\u2014"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
