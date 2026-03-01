import type { MappedRow } from '../field-mapper';

/**
 * Result of processing a batch of direct orders.
 */
export interface DirectOrderResult {
  /** Number of records successfully processed */
  processed: number;
  /** Number of records that failed to process */
  failed: number;
  /** IDs of newly created direct_orders records */
  createdIds: string[];
  /** Products detected as new to an outlet */
  newItemAlerts: Array<{ outletId: string; productId: string; productName: string }>;
  /** Any errors encountered during processing */
  errors: Array<{ row: number; message: string }>;
}

/**
 * DirectOrderProcessor handles writing validated direct-to-outlet order data
 * to the database. Direct orders bypass the central warehouse and go straight
 * from vendors to individual outlets. This processor also maintains the
 * direct-to-outlet tracking board.
 */
export class DirectOrderProcessor {
  /**
   * Process a batch of validated, mapped direct order rows.
   *
   * TODO: Implement processing pipeline that:
   * 1. Resolves product IDs against the master product catalog
   * 2. Resolves outlet IDs and distributor IDs
   * 3. Checks if each product is new to the outlet (first-time order)
   * 4. Creates direct_orders records in the database via Prisma
   * 5. Updates the direct-to-outlet tracking board:
   *    - item name, which outlets use it, order frequency
   *    - first order date, last order date
   * 6. Triggers the alert engine to check:
   *    - New item appearing at an outlet (alert to director)
   *    - Price discrepancies vs. other outlets
   *    - Price changes from previous order
   * 7. Returns processing summary including new item alerts
   *
   * @param rows - Validated and mapped rows ready for database insertion
   * @param organizationId - The organization these orders belong to
   * @returns Processing result with counts, new item alerts, and any errors
   */
  async process(
    rows: MappedRow[],
    organizationId: string
  ): Promise<DirectOrderResult> {
    // TODO: Implement product ID resolution (lookup by SKU, name, or UPC)
    // TODO: Implement outlet and distributor ID resolution
    // TODO: Check order_history for first-time product/outlet combinations
    // TODO: Batch insert direct_orders via Prisma createMany
    // TODO: Update tracking board data (first/last order dates, frequency)
    // TODO: Trigger alert engine for new items, price discrepancies
    // TODO: Handle partial failures gracefully
    // TODO: Add transaction support for atomicity

    console.log(
      `[DirectOrderProcessor] Processing ${rows.length} rows for org ${organizationId}`
    );

    return {
      processed: rows.length,
      failed: 0,
      createdIds: [],
      newItemAlerts: [],
      errors: [],
    };
  }

  /**
   * Check if a product has been ordered by a specific outlet before.
   *
   * TODO: Query order_history and direct_orders tables to determine
   * if this product/outlet combination has appeared before.
   * Used to trigger "new item at outlet" alerts for the director.
   *
   * @param outletId - The outlet placing the order
   * @param productId - The product being ordered
   * @returns True if this is the first time this outlet has ordered this product
   */
  async isNewItemForOutlet(
    outletId: string,
    productId: string
  ): Promise<boolean> {
    // TODO: Query direct_orders WHERE outlet_id = outletId AND product_id = productId
    // TODO: Also check warehouse_transfers for the same combination
    // TODO: Return true if no prior orders found
    console.log(
      `[DirectOrderProcessor] Checking if product ${productId} is new to outlet ${outletId}`
    );
    return false;
  }

  /**
   * Update the direct-to-outlet tracking board for a product.
   *
   * TODO: Maintain a denormalized tracking view that shows:
   * - Product name and category
   * - Which outlets currently order it
   * - Order frequency (weekly, monthly, quarterly)
   * - First and last order dates
   * - Average order quantity
   * Used by directors to monitor direct ordering patterns.
   *
   * @param productId - The product to update tracking for
   * @param outletId - The outlet that placed the order
   * @param orderDate - When the order was placed
   */
  async updateTrackingBoard(
    productId: string,
    outletId: string,
    orderDate: Date
  ): Promise<void> {
    // TODO: Upsert tracking board record for this product
    // TODO: Add outlet to the list of outlets ordering this product
    // TODO: Update last_order_date
    // TODO: Recalculate order frequency
    console.log(
      `[DirectOrderProcessor] Updating tracking board for product ${productId} at outlet ${outletId}`
    );
  }
}
