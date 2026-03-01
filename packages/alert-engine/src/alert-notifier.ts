import type { AlertResult } from './alert-processor';

/**
 * AlertNotifier handles persisting alert results to the database and
 * managing alert lifecycle (creation, dismissal, read status).
 * It also dispatches real-time notifications via Supabase Realtime
 * to connected clients.
 */
export class AlertNotifier {
  /**
   * Create a new alert record in the database from an alert result.
   *
   * TODO: Implement alert creation:
   * 1. Check for duplicate alerts (same type, outlet, product, still unread)
   *    to avoid spamming users with the same alert
   * 2. Insert a new record into the alerts table via Prisma:
   *    - type, severity, title, message, metadata from AlertResult
   *    - organization_id from parameter
   *    - outlet_id, product_id from AlertResult (if present)
   *    - status: 'unread'
   *    - created_at: now
   * 3. Determine notification targets based on alert type and RBAC:
   *    - Mandate compliance: director + room manager for the outlet
   *    - Pull-through/inventory: room manager + admin
   *    - Price alerts: admin
   *    - Cost goal: director + admin
   * 4. Dispatch real-time notification via Supabase Realtime channel
   * 5. Optionally queue email notification for critical alerts
   *
   * @param result - The alert result to persist
   * @param organizationId - The organization this alert belongs to
   */
  async createAlert(result: AlertResult, organizationId: string): Promise<void> {
    // TODO: Check for existing duplicate unread alert
    // TODO: Insert alert record via Prisma
    // TODO: Determine notification targets based on alert type and roles
    // TODO: Broadcast via Supabase Realtime to connected clients
    // TODO: Queue email notification for critical severity alerts
    // TODO: Log alert creation for audit trail
    console.log(
      `[AlertNotifier] Creating alert: type=${result.type}, severity=${result.severity}, org=${organizationId}`
    );
  }

  /**
   * Dismiss an alert (mark as resolved/dismissed by the user).
   *
   * TODO: Implement alert dismissal:
   * 1. Update the alert record status to 'dismissed'
   * 2. Record who dismissed it and when
   * 3. Optionally record a dismissal reason/note
   * 4. Broadcast the status change via Supabase Realtime
   *    so other connected clients see the update
   *
   * @param alertId - The ID of the alert to dismiss
   */
  async dismissAlert(alertId: string): Promise<void> {
    // TODO: Update alert status to 'dismissed' via Prisma
    // TODO: Set dismissed_at timestamp and dismissed_by user ID
    // TODO: Broadcast status change via Supabase Realtime
    // TODO: Log dismissal for audit trail
    console.log(`[AlertNotifier] Dismissing alert: ${alertId}`);
  }

  /**
   * Get the count of unread alerts for an organization.
   * Used for the notification badge in the UI header.
   *
   * TODO: Implement unread count query:
   * 1. Count alerts WHERE organization_id = param AND status = 'unread'
   * 2. Optionally filter by the current user's accessible outlets
   *    (room managers should only see counts for their outlets)
   * 3. Cache the result briefly to avoid excessive DB queries
   *    on frequent UI polling
   *
   * @param organizationId - The organization to count unread alerts for
   * @returns Number of unread alerts
   */
  async getUnreadCount(organizationId: string): Promise<number> {
    // TODO: Query alerts table for unread count via Prisma
    // TODO: Apply RBAC filtering based on current user's role and outlet access
    // TODO: Consider caching with short TTL for frequently polled counts
    console.log(
      `[AlertNotifier] Getting unread count for org ${organizationId}`
    );
    return 0;
  }

  /**
   * Mark a specific alert as read.
   *
   * TODO: Implement mark-as-read:
   * 1. Update the alert record status to 'read'
   * 2. Record who read it and when
   * 3. Broadcast the status change via Supabase Realtime
   *    to update notification badges on other clients
   * 4. Do not change status if alert is already 'dismissed'
   *
   * @param alertId - The ID of the alert to mark as read
   */
  async markAsRead(alertId: string): Promise<void> {
    // TODO: Fetch current alert status
    // TODO: If already 'dismissed', skip update (dismissed takes precedence)
    // TODO: Update alert status to 'read' via Prisma
    // TODO: Set read_at timestamp and read_by user ID
    // TODO: Broadcast updated unread count via Supabase Realtime
    console.log(`[AlertNotifier] Marking alert as read: ${alertId}`);
  }
}
