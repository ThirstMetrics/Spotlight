/**
 * @spotlight/alert-engine
 *
 * Alert rules, calculations, and notification dispatch for the Spotlight platform.
 * Handles compliance monitoring, inventory anomaly detection, price tracking,
 * and cost goal enforcement across all outlets in an organization.
 */

export { AlertProcessor } from './alert-processor';
export type { AlertResult, AlertType, AlertSeverity } from './alert-processor';

export { AlertNotifier } from './alert-notifier';
