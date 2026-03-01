// =============================================================================
// Business Calculation Utilities
// =============================================================================

/**
 * Calculate gross margin percentage.
 *
 * @param cost    - Total cost of goods.
 * @param revenue - Total revenue.
 * @returns Margin as a percentage (e.g. 75 for 75%). Returns 0 if revenue is 0.
 */
export function calculateMargin(cost: number, revenue: number): number {
  if (revenue === 0) return 0;
  return ((revenue - cost) / revenue) * 100;
}

/**
 * Calculate cost percentage (inverse of margin).
 *
 * @param cost    - Total cost of goods.
 * @param revenue - Total revenue.
 * @returns Cost as a percentage of revenue (e.g. 25 for 25%). Returns 0 if revenue is 0.
 */
export function calculateCostPercentage(cost: number, revenue: number): number {
  if (revenue === 0) return 0;
  return (cost / revenue) * 100;
}

/**
 * Calculate estimated days of inventory remaining.
 *
 * @param currentStock   - Current inventory quantity on hand.
 * @param avgDailyUsage  - Average daily usage/consumption rate.
 * @returns Estimated days of inventory remaining. Returns Infinity if avgDailyUsage is 0.
 */
export function calculateDaysOfInventory(currentStock: number, avgDailyUsage: number): number {
  if (avgDailyUsage === 0) return Infinity;
  return currentStock / avgDailyUsage;
}

/**
 * Calculate pull-through rate as a percentage of the historic average.
 *
 * @param currentPeriod   - Current period usage quantity.
 * @param historicAverage - Rolling historic average usage.
 * @returns Pull-through percentage (e.g. 120 means 120% of historic average). Returns 0 if historicAverage is 0.
 */
export function calculatePullThrough(currentPeriod: number, historicAverage: number): number {
  if (historicAverage === 0) return 0;
  return (currentPeriod / historicAverage) * 100;
}

/**
 * Calculate the total cost of a recipe from its ingredients.
 *
 * @param ingredients - Array of ingredients with cost per unit and quantity used.
 * @returns Total recipe cost.
 */
export function calculateRecipeCost(ingredients: { cost: number; quantity: number }[]): number {
  return ingredients.reduce((total, ingredient) => total + ingredient.cost * ingredient.quantity, 0);
}

/**
 * Calculate cost per serving based on total recipe cost and yield.
 *
 * @param totalCost - Total cost of the recipe.
 * @param yield_    - Number of servings the recipe produces.
 * @returns Cost per individual serving. Returns 0 if yield is 0.
 */
export function calculateCostPerServing(totalCost: number, yield_: number): number {
  if (yield_ === 0) return 0;
  return totalCost / yield_;
}

/**
 * Calculate year-over-year change and percentage change.
 *
 * @param current  - Current period value.
 * @param previous - Previous period (same period last year) value.
 * @returns Object with absolute change and percentage change. percentChange is 0 if previous is 0.
 */
export function yearOverYear(
  current: number,
  previous: number
): { change: number; percentChange: number } {
  const change = current - previous;
  const percentChange = previous === 0 ? 0 : (change / previous) * 100;
  return { change, percentChange };
}
