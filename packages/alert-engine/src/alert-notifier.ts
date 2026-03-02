import { prisma } from "@spotlight/db";
import type { AlertResult } from "./alert-processor";

/**
 * AlertNotifier handles persisting alert results to the database and
 * managing alert lifecycle (creation, dismissal, read status).
 */
export class AlertNotifier {
  /**
   * Create a new alert record in the database from an alert result.
   * Deduplicates against existing unread alerts to avoid spamming.
   */
  async createAlert(result: AlertResult, organizationId: string): Promise<string | null> {
    // Check for duplicate alerts (same type, outlet, product, still unread)
    const existing = await prisma.alert.findFirst({
      where: {
        organizationId,
        alertType: result.type,
        outletId: result.outletId ?? null,
        productId: result.productId ?? null,
        isDismissed: false,
        isRead: false,
      },
      select: { id: true },
    });

    if (existing) {
      return null; // Already have an active alert for this condition
    }

    const alert = await prisma.alert.create({
      data: {
        organizationId,
        alertType: result.type,
        severity: result.severity,
        title: result.title,
        message: result.message,
        outletId: result.outletId ?? null,
        productId: result.productId ?? null,
        distributorId: result.distributorId ?? null,
        isRead: false,
        isDismissed: false,
      },
    });

    return alert.id;
  }

  /**
   * Batch create alerts from a list of alert results.
   * Returns the IDs of newly created alerts (excludes duplicates).
   */
  async createAlerts(results: AlertResult[], organizationId: string): Promise<string[]> {
    const createdIds: string[] = [];

    for (const result of results) {
      const id = await this.createAlert(result, organizationId);
      if (id) createdIds.push(id);
    }

    return createdIds;
  }

  /**
   * Dismiss an alert (mark as resolved/dismissed by the user).
   */
  async dismissAlert(alertId: string): Promise<void> {
    await prisma.alert.update({
      where: { id: alertId },
      data: {
        isDismissed: true,
        resolvedAt: new Date(),
      },
    });
  }

  /**
   * Mark a specific alert as read.
   * Does not change status if alert is already dismissed.
   */
  async markAsRead(alertId: string): Promise<void> {
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      select: { isDismissed: true },
    });

    // Dismissed takes precedence — don't change back to just "read"
    if (alert?.isDismissed) return;

    await prisma.alert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all unread alerts as read for an organization.
   * Optionally scoped to specific outlet.
   */
  async markAllAsRead(organizationId: string, outletId?: string): Promise<number> {
    const result = await prisma.alert.updateMany({
      where: {
        organizationId,
        isRead: false,
        isDismissed: false,
        ...(outletId ? { outletId } : {}),
      },
      data: { isRead: true },
    });

    return result.count;
  }

  /**
   * Get the count of unread alerts for an organization.
   * Used for the notification badge in the UI header.
   */
  async getUnreadCount(organizationId: string, outletId?: string): Promise<number> {
    return prisma.alert.count({
      where: {
        organizationId,
        isRead: false,
        isDismissed: false,
        ...(outletId ? { outletId } : {}),
      },
    });
  }

  /**
   * Get recent alerts for an organization, sorted by creation date.
   * Used by the alerts feed on the dashboard.
   */
  async getRecentAlerts(
    organizationId: string,
    options: { limit?: number; outletId?: string; includeRead?: boolean } = {}
  ) {
    const { limit = 20, outletId, includeRead = false } = options;

    return prisma.alert.findMany({
      where: {
        organizationId,
        isDismissed: false,
        ...(outletId ? { outletId } : {}),
        ...(!includeRead ? { isRead: false } : {}),
      },
      include: {
        outlet: { select: { name: true, slug: true } },
        product: { select: { name: true, sku: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
