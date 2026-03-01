import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sampleRecipes = [
  {
    name: "Classic Margarita",
    category: "Cocktail",
    ingredients: 4,
    cost: "$3.25",
    margin: "78%",
  },
  {
    name: "Old Fashioned",
    category: "Cocktail",
    ingredients: 3,
    cost: "$4.10",
    margin: "72%",
  },
  {
    name: "Espresso Martini",
    category: "Cocktail",
    ingredients: 4,
    cost: "$3.85",
    margin: "74%",
  },
  {
    name: "Aperol Spritz",
    category: "Cocktail",
    ingredients: 3,
    cost: "$2.90",
    margin: "80%",
  },
  {
    name: "Negroni",
    category: "Cocktail",
    ingredients: 3,
    cost: "$3.50",
    margin: "76%",
  },
];

export default function RecipesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recipe Builder</h1>
        <p className="text-muted-foreground">
          Create and manage cocktail recipes with real-time cost calculations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Recipes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">
              Across all outlets
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Cocktail Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$3.52</div>
            <p className="text-xs text-muted-foreground">
              Based on current ingredient prices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">76%</div>
            <p className="text-xs text-muted-foreground">
              Across all recipes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recipe Library</CardTitle>
          <CardDescription>
            All cocktail recipes with ingredient counts, cost, and margin data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Recipe</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Ingredients
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Cost</th>
                  <th className="px-4 py-3 text-right font-medium">Margin</th>
                </tr>
              </thead>
              <tbody>
                {sampleRecipes.map((recipe) => (
                  <tr key={recipe.name} className="border-b">
                    <td className="px-4 py-3 font-medium">{recipe.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{recipe.category}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {recipe.ingredients}
                    </td>
                    <td className="px-4 py-3 text-right">{recipe.cost}</td>
                    <td className="px-4 py-3 text-right">{recipe.margin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-center rounded-md border border-dashed p-8">
            <p className="text-sm text-muted-foreground">
              Recipe builder form with ingredient selection and real-time cost
              calculation will render here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
