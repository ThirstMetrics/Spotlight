import type { MappedRow } from '../field-mapper';

/**
 * Result of processing a batch of POS sales data.
 */
export interface SalesDataResult {
  /** Number of records successfully processed */
  processed: number;
  /** Number of records that failed to process */
  failed: number;
  /** IDs of newly created sales_data records */
  createdIds: string[];
  /** Outlets where cost percentage now exceeds their goal */
  costGoalAlerts: Array<{ outletId: string; category: string; actual: number; goal: number }>;
  /** Any errors encountered during processing */
  errors: Array<{ row: number; message: string }>;
}

/**
 * Supported POS source systems. Each has slightly different export formats
 * that are normalized during field mapping.
 */
export type POSSource = 'micros' | 'agilysys' | 'toast' | 'unknown';

/**
 * SalesDataProcessor handles writing validated POS sales data to the database.
 * Sales data is used for margin analysis, cost percentage tracking, and
 * recipe costing. Supports Micros, Agilysys, and Toast POS exports.
 */
export class SalesDataProcessor {
  /**
   * Process a batch of validated, mapped POS sales data rows.
   *
   * TODO: Implement processing pipeline that:
   * 1. Resolves product IDs against the master product catalog
   * 2. Resolves outlet IDs
   * 3. Detects the POS source system (Micros, Agilysys, Toast)
   * 4. Creates sales_data records in the database via Prisma
   * 5. Recalculates margins for affected outlet/product combinations:
   *    - Margin = (Revenue - Cost) / Revenue * 100
   *    - Uses latest order cost from distributor_products
   * 6. Checks cost percentage against cost_goals for each outlet
   * 7. Triggers the alert engine to check:
   *    - Cost percentage exceeding goal
   *    - Significant margin changes vs. prior period
   * 8. Returns processing summary including cost goal alerts
   *
   * @param rows - Validated and mapped rows ready for database insertion
   * @param organizationId - The organization this sales data belongs to
   * @returns Processing result with counts, cost goal alerts, and any errors
   */
  async process(
    rows: MappedRow[],
    organizationId: string
  ): Promise<SalesDataResult> {
    // TODO: Implement product ID resolution
    // TODO: Implement outlet ID resolution
    // TODO: Detect POS source system from data patterns
    // TODO: Batch insert sales_data via Prisma createMany
    // TODO: Recalculate margins for affected products/outlets
    // TODO: Check cost goals and generate alerts
    // TODO: Handle duplicate sales records (same date/outlet/product)
    // TODO: Add transaction support for atomicity

    console.log(
      `[SalesDataProcessor] Processing ${rows.length} rows for org ${organizationId}`
    );

    return {
      processed: rows.length,
      failed: 0,
      createdIds: [],
      costGoalAlerts: [],
      errors: [],
    };
  }

  /**
   * Detect which POS system the data came from based on column patterns.
   *
   * TODO: Analyze column names and data patterns to identify the source:
   * - Micros: typically has "RVC" (revenue center) columns
   * - Agilysys: typically has "Dept" or "Department" columns
   * - Toast: typically has "Restaurant" and "Menu Item" columns
   *
   * @param headers - Column headers from the source file
   * @returns The detected POS source system
   */
  detectPOSSource(headers: string[]): POSSource {
    // TODO: Implement pattern matching against known POS column names
    // TODO: Use source-presets.ts for reference patterns
    // TODO: Return 'unknown' if no match found and log warning
    const normalizedHeaders = headers.map((h) => h.toLowerCase());

    if (normalizedHeaders.some((h) => h.includes('rvc') || h.includes('revenue center'))) {
      return 'micros';
    }
    if (normalizedHeaders.some((h) => h.includes('dept') || h.includes('department'))) {
      return 'agilysys';
    }
    if (normalizedHeaders.some((h) => h.includes('menu item') || h.includes('toast'))) {
      return 'toast';
    }

    return 'unknown';
  }

  /**
   * Calculate margin for a product at an outlet using the latest cost and sales data.
   *
   * TODO: Implement margin calculation:
   * - Product Cost = latest order cost from distributor_products
   * - For cocktails: cost = sum(ingredient cost * quantity per recipe) / yield
   * - Revenue = from POS sales data
   * - Margin = (Revenue - Cost) / Revenue * 100
   *
   * @param productId - The product to calculate margin for
   * @param outletId - The outlet to calculate margin at
   * @returns Calculated margin percentage, or null if insufficient data
   */
  async calculateMargin(
    productId: string,
    outletId: string
  ): Promise<number | null> {
    // TODO: Fetch latest product cost from distributor_products
    // TODO: If product is a recipe/cocktail, calculate from recipe_ingredients
    // TODO: Fetch revenue from sales_data for this product/outlet
    // TODO: Calculate and return margin percentage
    // TODO: Handle edge cases (zero revenue, missing cost data)
    console.log(
      `[SalesDataProcessor] Calculating margin for product ${productId} at outlet ${outletId}`
    );
    return null;
  }

  /**
   * Check if an outlet's cost percentage exceeds its goal for a category.
   *
   * TODO: Compare actual cost percentage against cost_goals:
   * - Aggregate costs and revenues for the outlet (optionally by category)
   * - Calculate actual cost percentage
   * - Compare against the goal set by admin
   * - Return alert data if threshold is exceeded
   *
   * @param outletId - The outlet to check
   * @param category - Optional category filter (beer, wine, spirits, sake)
   * @returns Cost goal comparison data, or null if no goal is set
   */
  async checkCostGoal(
    outletId: string,
    category?: string
  ): Promise<{ actual: number; goal: number; exceeded: boolean } | null> {
    // TODO: Fetch cost_goal for this outlet/category from database
    // TODO: Aggregate actual costs and revenues from sales_data
    // TODO: Calculate actual cost percentage
    // TODO: Compare against goal and return result
    console.log(
      `[SalesDataProcessor] Checking cost goal for outlet ${outletId}, category: ${category || 'all'}`
    );
    return null;
  }
}
