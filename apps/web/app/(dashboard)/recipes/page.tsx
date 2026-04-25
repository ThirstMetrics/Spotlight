export const dynamic = "force-dynamic";

import { MetricCard } from "@/components/dashboard/MetricCard";
import { getRecipeOverview, getRecipeList } from "@/lib/queries/recipes";
import { getServerUser } from "@/lib/auth";
import { NewRecipeButton } from "./NewRecipeButton";
import { RecipeCard, type RecipeCardData } from "./RecipeCard";

export default async function RecipesPage() {
  const user = await getServerUser();
  const organizationId = user?.organizationId;

  const [overview, recipes] = await Promise.all([
    getRecipeOverview({ organizationId }),
    getRecipeList({ organizationId }),
  ]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
            Recipe Builder
          </h1>
          <p className="text-muted-foreground">
            Create and manage cocktail recipes with real-time cost calculations.
          </p>
        </div>
        <NewRecipeButton />
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
          trend={
            overview.avgMargin >= 70
              ? "up"
              : overview.avgMargin > 0
              ? "down"
              : "neutral"
          }
        />
      </div>

      {/* Recipe Library */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#06113e]">Recipe Library</h2>
          <p className="text-sm text-muted-foreground">
            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
          </p>
        </div>

        {recipes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No recipes yet. Click{" "}
              <span className="font-medium text-[#06113e]">New Recipe</span> to
              create your first one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
