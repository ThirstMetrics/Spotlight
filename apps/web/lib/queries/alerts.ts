import { prisma } from "@spotlight/db";

/**
 * Get alert instances with related data for the alert feed.
 */
export async function getAlerts(options?: {
  filter?: "all" | "active" | "read" | "dismissed";
  limit?: number;
  organizationId?: string;
}) {
  const { filter = "all", limit = 100, organizationId } = options ?? {};

  const where: Record<string, unknown> = {};
  if (filter === "active") {
    where.isRead = false;
    where.isDismissed = false;
  } else if (filter === "read") {
    where.isRead = true;
    where.isDismissed = false;
  } else if (filter === "dismissed") {
    where.isDismissed = true;
  }

  if (organizationId) {
    where.outlet = { organizationId };
  }

  return prisma.alert.findMany({
    where: where as never,
    include: {
      outlet: { select: { name: true, slug: true } },
      product: { select: { name: true, sku: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get alert stats for the feed header.
 */
export async function getAlertStats(options?: { organizationId?: string }) {
  const { organizationId } = options ?? {};
  const orgFilter = organizationId ? { outlet: { organizationId } } : {};

  const [total, unread, dismissed] = await Promise.all([
    prisma.alert.count({ where: { ...orgFilter } }),
    prisma.alert.count({ where: { isRead: false, isDismissed: false, ...orgFilter } }),
    prisma.alert.count({ where: { isDismissed: true, ...orgFilter } }),
  ]);

  return { total, unread, dismissed, read: total - unread - dismissed };
}

/**
 * Get unread alert count (for header badge).
 */
export async function getUnreadAlertCount(options?: { organizationId?: string }) {
  const { organizationId } = options ?? {};
  return prisma.alert.count({
    where: {
      isRead: false,
      isDismissed: false,
      ...(organizationId ? { outlet: { organizationId } } : {}),
    },
  });
}
