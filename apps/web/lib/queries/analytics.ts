import { prisma } from "@spotlight/db";

/**
 * Get portal analytics overview metrics.
 */
export async function getAnalyticsOverview() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    activeSessions,
    loginsThisWeek,
    totalInteractions30d,
    exportCount30d,
  ] = await Promise.all([
    // Active sessions (no logout in last 24h)
    prisma.portalSession.count({
      where: {
        logoutAt: null,
        loginAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    }),
    // Logins this week
    prisma.portalSession.count({
      where: { loginAt: { gte: sevenDaysAgo } },
    }),
    // Total interactions last 30 days
    prisma.portalInteraction.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    // Exports last 30 days
    prisma.portalInteraction.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        action: { contains: "export" },
      },
    }),
  ]);

  return {
    activeSessions,
    loginsThisWeek,
    totalInteractions30d,
    exportCount30d,
  };
}

/**
 * Get recent portal sessions with user details.
 */
export async function getRecentSessions(limit = 20) {
  return prisma.portalSession.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          userRoles: {
            include: {
              role: { select: { name: true } },
            },
            take: 1,
          },
        },
      },
    },
    orderBy: { loginAt: "desc" },
    take: limit,
  });
}

/**
 * Get most-viewed pages from portal interactions.
 */
export async function getTopPages(limit = 10) {
  const interactions = await prisma.portalInteraction.groupBy({
    by: ["pagePath"],
    _count: { id: true },
    where: {
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  return interactions.map((i) => ({
    pagePath: i.pagePath,
    views: i._count.id,
  }));
}

/**
 * Get login trend data by day for the last 30 days.
 */
export async function getLoginTrend() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const sessions = await prisma.portalSession.findMany({
    where: { loginAt: { gte: thirtyDaysAgo } },
    select: { loginAt: true },
    orderBy: { loginAt: "asc" },
  });

  // Group by date
  const byDate = new Map<string, number>();
  for (const session of sessions) {
    const date = session.loginAt.toISOString().split("T")[0];
    byDate.set(date, (byDate.get(date) ?? 0) + 1);
  }

  return Array.from(byDate.entries()).map(([date, count]) => ({
    date,
    logins: count,
  }));
}
