import { prisma } from "@spotlight/db";

/**
 * Get flash messages overview stats.
 */
export async function getMessageOverview(organizationId?: string) {
  const orgFilter = organizationId ? { organizationId } : {};

  const [total, unread, sent7d] = await Promise.all([
    prisma.flashMessage.count({ where: orgFilter }),
    prisma.flashMessage.count({ where: { isRead: false, ...orgFilter } }),
    prisma.flashMessage.count({
      where: {
        ...orgFilter,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return { total, unread, sentThisWeek: sent7d };
}

/**
 * Get flash messages with sender details.
 */
export async function getMessages(options: {
  limit?: number;
  unreadOnly?: boolean;
  outletId?: string;
  organizationId?: string;
} = {}) {
  const { limit = 50, unreadOnly = false, outletId, organizationId } = options;

  return prisma.flashMessage.findMany({
    where: {
      ...(organizationId ? { organizationId } : {}),
      ...(unreadOnly ? { isRead: false } : {}),
      ...(outletId ? { outletId } : {}),
    },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      outlet: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
