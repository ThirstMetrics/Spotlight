/**
 * Types of alerts the system can generate.
 * Each maps to a specific business rule defined in the alert engine.
 */
export type AlertType =
  | 'mandate_compliance'
  | 'pull_through_high'
  | 'pull_through_low'
  | 'days_of_inventory'
  | 'new_direct_item'
  | 'price_discrepancy'
  | 'price_change'
  | 'cost_goal_exceeded';

/**
 * Alert severity levels. Determines notification urgency and UI treatment.
 */
export type AlertSeverity = 'critical' | 'warning' | 'info';

/**
 * The result of an alert check. Contains all information needed to
 * create an alert record and notify the appropriate users.
 */
export interface AlertResult {
  /** The type of alert triggered */
  type: AlertType;
  /** How severe/urgent the alert is */
  severity: AlertSeverity;
  /** The outlet this alert relates to (if applicable) */
  outletId?: string;
  /** The product this alert relates to (if applicable) */
  productId?: string;
  /** Short title for the alert (shown in notification list) */
  title: string;
  /** Detailed message explaining the alert condition */
  message: string;
  /** Additional structured data for the alert (thresholds, values, etc.) */
  metadata?: Record<string, unknown>;
}

/**
 * Default thresholds for alert rules. These can be overridden per
 * organization or per outlet in the admin settings.
 */
const DEFAULT_THRESHOLDS = {
  /** Percentage above rolling average to trigger high pull-through alert */
  pullThroughHighPercent: 120,
  /** Percentage below rolling average to trigger low pull-through alert */
  pullThroughLowPercent: 80,
  /** Default minimum days of inventory before alerting */
  daysOfInventoryMin: 5,
  /** Days after mandate creation to expect first order */
  mandateComplianceDays: 7,
  /** Rolling average window in days */
  rollingAverageDays: 90,
};

/**
 * AlertProcessor evaluates alert rules against current data and returns
 * alert results for conditions that are triggered. Each check method
 * corresponds to a specific alert rule defined in the business requirements.
 */
export class AlertProcessor {
  /**
   * Check mandate compliance for an outlet.
   * Verifies that all mandated items have been ordered within the required timeframe.
   *
   * TODO: Implement mandate compliance check:
   * 1. Fetch mandate_items for the given mandateId
   * 2. For each mandate item, check mandate_compliance and order_history
   *    to see if the outlet has ordered it
   * 3. For items not yet ordered, check if the mandate was created more
   *    than 7 days ago (configurable)
   * 4. Generate an alert for each non-compliant item
   * 5. Alert severity: 'warning' if within grace period, 'critical' if overdue
   *
   * @param outletId - The outlet to check compliance for
   * @param mandateId - The mandate to check against
   * @returns Array of alert results, one per non-compliant item
   */
  async checkMandateCompliance(
    outletId: string,
    mandateId: string
  ): Promise<AlertResult[]> {
    // TODO: Fetch mandate with its items from database
    // TODO: Fetch order_history for this outlet to check which items have been ordered
    // TODO: Compare mandate items vs ordered items
    // TODO: Check mandate creation date vs. grace period (default 7 days)
    // TODO: Generate alerts for non-compliant items
    // TODO: Include mandate name, item name, and days overdue in metadata
    console.log(
      `[AlertProcessor] Checking mandate compliance for outlet ${outletId}, mandate ${mandateId}`
    );
    return [];
  }

  /**
   * Check if pull-through for a product at an outlet is above historic average.
   *
   * TODO: Implement high pull-through detection:
   * 1. Calculate rolling 90-day average pull-through for this product/outlet
   * 2. Get the current period pull-through (configurable: weekly, monthly)
   * 3. If current > average * (threshold / 100), generate alert
   * 4. Optionally compare against same-period-last-year
   * 5. Include both current and average values in metadata
   *
   * @param outletId - The outlet to check
   * @param productId - The product to check
   * @param threshold - Percentage above average to trigger (default: 120%)
   * @returns Alert result if threshold exceeded, null otherwise
   */
  async checkPullThroughHigh(
    outletId: string,
    productId: string,
    threshold: number = DEFAULT_THRESHOLDS.pullThroughHighPercent
  ): Promise<AlertResult | null> {
    // TODO: Query warehouse_transfers for this product/outlet over last 90 days
    // TODO: Calculate rolling average daily/weekly pull-through
    // TODO: Get current period pull-through
    // TODO: Compare current vs. average * (threshold / 100)
    // TODO: If exceeded, return AlertResult with type 'pull_through_high'
    // TODO: Include current value, average, threshold, and % over in metadata
    console.log(
      `[AlertProcessor] Checking high pull-through for outlet ${outletId}, product ${productId}, threshold ${threshold}%`
    );
    return null;
  }

  /**
   * Check if pull-through for a product at an outlet is below historic average.
   *
   * TODO: Implement low pull-through detection:
   * 1. Calculate rolling 90-day average pull-through for this product/outlet
   * 2. Get the current period pull-through
   * 3. If current < average * (threshold / 100), generate alert
   * 4. Exclude items with zero pull-through (may indicate removal from menu)
   * 5. Include both current and average values in metadata
   *
   * @param outletId - The outlet to check
   * @param productId - The product to check
   * @param threshold - Percentage below average to trigger (default: 80%)
   * @returns Alert result if threshold breached, null otherwise
   */
  async checkPullThroughLow(
    outletId: string,
    productId: string,
    threshold: number = DEFAULT_THRESHOLDS.pullThroughLowPercent
  ): Promise<AlertResult | null> {
    // TODO: Query warehouse_transfers for this product/outlet over last 90 days
    // TODO: Calculate rolling average daily/weekly pull-through
    // TODO: Get current period pull-through
    // TODO: Skip if current period is zero (product may have been removed)
    // TODO: Compare current vs. average * (threshold / 100)
    // TODO: If below, return AlertResult with type 'pull_through_low'
    // TODO: Include current value, average, threshold, and % under in metadata
    console.log(
      `[AlertProcessor] Checking low pull-through for outlet ${outletId}, product ${productId}, threshold ${threshold}%`
    );
    return null;
  }

  /**
   * Check if days of inventory for a product at an outlet is below threshold.
   *
   * TODO: Implement days-of-inventory check:
   * 1. Get current inventory level from inventory_snapshots
   * 2. Calculate average daily usage from warehouse_transfers (90-day rolling)
   * 3. Days of inventory = current level / average daily usage
   * 4. If below threshold, generate alert
   * 5. Handle edge cases: zero usage (infinite days), zero inventory
   *
   * @param outletId - The outlet to check
   * @param productId - The product to check
   * @param threshold - Minimum days of inventory before alerting (default: 5)
   * @returns Alert result if below threshold, null otherwise
   */
  async checkDaysOfInventory(
    outletId: string,
    productId: string,
    threshold: number = DEFAULT_THRESHOLDS.daysOfInventoryMin
  ): Promise<AlertResult | null> {
    // TODO: Fetch latest inventory_snapshot for this outlet/product
    // TODO: Calculate average daily usage from warehouse_transfers (90-day window)
    // TODO: Compute days of inventory = current qty / avg daily usage
    // TODO: If days < threshold, return AlertResult with type 'days_of_inventory'
    // TODO: Handle zero usage (don't alert if product is inactive)
    // TODO: Include current qty, avg daily usage, and days remaining in metadata
    console.log(
      `[AlertProcessor] Checking days of inventory for outlet ${outletId}, product ${productId}, threshold ${threshold} days`
    );
    return null;
  }

  /**
   * Check if a product is new to a specific outlet (first-time direct order).
   *
   * TODO: Implement new direct item detection:
   * 1. Check direct_orders history for this product/outlet combination
   * 2. If no prior orders exist, this is a new item for this outlet
   * 3. Generate informational alert for the director
   * 4. Include product details and outlet name in the alert
   *
   * @param outletId - The outlet that received the item
   * @param productId - The product to check
   * @returns Alert result if this is a new item, null otherwise
   */
  async checkNewDirectItem(
    outletId: string,
    productId: string
  ): Promise<AlertResult | null> {
    // TODO: Query direct_orders and warehouse_transfers for prior occurrences
    // TODO: If no prior orders exist, this is new
    // TODO: Return AlertResult with type 'new_direct_item', severity 'info'
    // TODO: Include product name, category, and distributor in metadata
    // TODO: Include first order date and quantity
    console.log(
      `[AlertProcessor] Checking for new direct item: outlet ${outletId}, product ${productId}`
    );
    return null;
  }

  /**
   * Check if the same product is priced differently across outlets.
   *
   * TODO: Implement price discrepancy detection:
   * 1. For the given product, fetch the latest order cost from each outlet
   * 2. Compare prices across all provided outlets
   * 3. If prices differ, generate alert with the price range
   * 4. Include all outlet/price pairs in metadata for admin review
   *
   * @param productId - The product to check prices for
   * @param outletIds - The outlets to compare across
   * @returns Alert result if prices differ, null if consistent
   */
  async checkPriceDiscrepancy(
    productId: string,
    outletIds: string[]
  ): Promise<AlertResult | null> {
    // TODO: Fetch latest order cost per outlet from order_history/direct_orders
    // TODO: Compare all prices to find discrepancies
    // TODO: If prices differ, return AlertResult with type 'price_discrepancy'
    // TODO: Include min price, max price, affected outlets in metadata
    // TODO: Calculate percentage variance between min and max
    console.log(
      `[AlertProcessor] Checking price discrepancy for product ${productId} across ${outletIds.length} outlets`
    );
    return null;
  }

  /**
   * Check if the price of a product changed from the previous order at an outlet.
   *
   * TODO: Implement price change detection:
   * 1. Get the two most recent orders for this product/outlet
   * 2. Compare the unit cost between them
   * 3. If different, generate alert with the percentage change
   * 4. Severity: 'info' for small changes (<5%), 'warning' for larger
   *
   * @param productId - The product to check
   * @param outletId - The outlet to check at
   * @returns Alert result if price changed, null if consistent
   */
  async checkPriceChange(
    productId: string,
    outletId: string
  ): Promise<AlertResult | null> {
    // TODO: Fetch the two most recent orders for this product/outlet
    // TODO: Compare unit_cost values
    // TODO: Calculate percentage change
    // TODO: Return AlertResult with type 'price_change' if changed
    // TODO: Set severity based on change magnitude
    // TODO: Include old price, new price, % change, order dates in metadata
    console.log(
      `[AlertProcessor] Checking price change for product ${productId} at outlet ${outletId}`
    );
    return null;
  }

  /**
   * Check if an outlet's cost percentage exceeds its configured goal.
   *
   * TODO: Implement cost goal check:
   * 1. Fetch the cost_goal for this outlet (optionally filtered by category)
   * 2. Calculate actual cost percentage from sales_data and order costs
   * 3. If actual > goal, generate alert
   * 4. Support category-level checks (beer, wine, spirits, sake) and overall
   *
   * @param outletId - The outlet to check
   * @param category - Optional category filter (beer, wine, spirits, sake)
   * @returns Alert result if cost exceeds goal, null if within target
   */
  async checkCostGoal(
    outletId: string,
    category?: string
  ): Promise<AlertResult | null> {
    // TODO: Fetch cost_goals for this outlet from database
    // TODO: Aggregate costs from order_history for the current period
    // TODO: Aggregate revenue from sales_data for the current period
    // TODO: Calculate actual cost percentage = total_cost / total_revenue * 100
    // TODO: Compare against goal
    // TODO: Return AlertResult with type 'cost_goal_exceeded' if over
    // TODO: Include actual %, goal %, variance, and period in metadata
    console.log(
      `[AlertProcessor] Checking cost goal for outlet ${outletId}, category: ${category || 'all'}`
    );
    return null;
  }

  /**
   * Run all alert checks for an entire organization.
   * This is the main entry point called after data ingestion or on a schedule.
   *
   * TODO: Implement full organization alert scan:
   * 1. Fetch all outlets for the organization
   * 2. Fetch all active mandates
   * 3. Fetch all products with recent activity
   * 4. Run each alert check type across all relevant outlet/product combinations
   * 5. Deduplicate alerts (don't re-create alerts that already exist and are unread)
   * 6. Batch create new alerts via AlertNotifier
   * 7. Return all generated alerts
   *
   * Performance considerations:
   * - Run checks in parallel where possible
   * - Use bulk database queries instead of per-item queries
   * - Cache frequently accessed data (rolling averages, cost goals)
   * - Consider running on a background job queue for large organizations
   *
   * @param organizationId - The organization to process alerts for
   * @returns All alert results generated during the scan
   */
  async processAllAlerts(organizationId: string): Promise<AlertResult[]> {
    // TODO: Fetch all outlets for the organization
    // TODO: Fetch all active mandates and their items
    // TODO: Fetch all products with recent order/transfer activity
    // TODO: Run mandate compliance checks for each outlet/mandate
    // TODO: Run pull-through checks (high and low) for each outlet/product
    // TODO: Run days-of-inventory checks for each outlet/product
    // TODO: Run price discrepancy checks across outlets
    // TODO: Run price change checks for recent orders
    // TODO: Run cost goal checks for each outlet
    // TODO: Deduplicate against existing unread alerts
    // TODO: Create new alerts via AlertNotifier
    // TODO: Log processing summary (total checks, alerts generated, time elapsed)
    console.log(
      `[AlertProcessor] Processing all alerts for organization ${organizationId}`
    );
    return [];
  }
}
