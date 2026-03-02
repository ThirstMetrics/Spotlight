import { prisma } from "@spotlight/db";

/**
 * Get flash messages overview stats.
 */
export async function getMessageOverview() {
  const [total, unread, sent7d] = await Promise.all([
    prisma.flashMessage.count(),
    prisma.flashMessage.count({ where: { isRead: false } }),
    prisma.flashMessage.count({
      where: {
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
} = {}) {
  const { limit = 50, unreadOnly = false, outletId } = options;

  return prisma.flashMessage.findMany({
    where: {
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
