// =============================================================================
// Alert Types & Configuration
// =============================================================================

/**
 * All supported alert types in the system.
 */
export enum AlertType {
  MANDATE_COMPLIANCE = 'MANDATE_COMPLIANCE',
  PULL_THROUGH_HIGH = 'PULL_THROUGH_HIGH',
  PULL_THROUGH_LOW = 'PULL_THROUGH_LOW',
  DAYS_OF_INVENTORY = 'DAYS_OF_INVENTORY',
  NEW_DIRECT_ITEM = 'NEW_DIRECT_ITEM',
  PRICE_DISCREPANCY = 'PRICE_DISCREPANCY',
  PRICE_CHANGE = 'PRICE_CHANGE',
  COST_GOAL_EXCEEDED = 'COST_GOAL_EXCEEDED',
}

/**
 * Alert severity levels determining urgency and display priority.
 */
export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

/**
 * Configuration for pull-through alerts (high and low thresholds).
 */
export interface PullThroughAlertConfig {
  type: AlertType.PULL_THROUGH_HIGH | AlertType.PULL_THROUGH_LOW;
  thresholdPercent: number;
  baselineDays: number;
}

/**
 * Configuration for days-of-inventory alerts.
 */
export interface DaysOfInventoryAlertConfig {
  type: AlertType.DAYS_OF_INVENTORY;
  minimumDays: number;
}

/**
 * Configuration for mandate compliance alerts.
 */
export interface MandateComplianceAlertConfig {
  type: AlertType.MANDATE_COMPLIANCE;
  graceDays: number;
}

/**
 * Configuration for price discrepancy alerts (same product, different prices).
 */
export interface PriceDiscrepancyAlertConfig {
  type: AlertType.PRICE_DISCREPANCY;
  thresholdPercent: number;
}

/**
 * Configuration for price change alerts (price changed from previous order).
 */
export interface PriceChangeAlertConfig {
  type: AlertType.PRICE_CHANGE;
  thresholdPercent: number;
}

/**
 * Configuration for cost goal exceeded alerts.
 */
export interface CostGoalExceededAlertConfig {
  type: AlertType.COST_GOAL_EXCEEDED;
  bufferPercent: number;
}

/**
 * Configuration for new direct item alerts.
 */
export interface NewDirectItemAlertConfig {
  type: AlertType.NEW_DIRECT_ITEM;
}

/**
 * Union of all alert configuration types.
 */
export type AlertConfig =
  | PullThroughAlertConfig
  | DaysOfInventoryAlertConfig
  | MandateComplianceAlertConfig
  | PriceDiscrepancyAlertConfig
  | PriceChangeAlertConfig
  | CostGoalExceededAlertConfig
  | NewDirectItemAlertConfig;
