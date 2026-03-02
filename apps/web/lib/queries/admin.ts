import { prisma } from "@spotlight/db";

/**
 * Get admin dashboard overview counts.
 */
export async function getAdminOverview() {
  const [
    outletCount,
    outletGroupCount,
    costGoalCount,
    userCount,
    fieldMappingCount,
    uploadCount,
    alertRuleCount,
  ] = await Promise.all([
    prisma.outlet.count({ where: { isActive: true } }),
    prisma.outletGroup.count(),
    prisma.costGoal.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.fieldMappingProfile.count(),
    prisma.upload.count(),
    prisma.alertRule.count(),
  ]);

  return {
    outletCount,
    outletGroupCount,
    costGoalCount,
    userCount,
    fieldMappingCount,
    uploadCount,
    alertRuleCount,
  };
}

/**
 * Get upload history with status and record counts.
 */
export async function getUploadHistory(limit = 50) {
  return prisma.upload.findMany({
    include: {
      uploader: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get alert rules with counts of triggered alerts.
 */
export async function getAlertRules() {
  const rules = await prisma.alertRule.findMany({
    include: {
      appliesToOutlet: { select: { name: true } },
      appliesToProduct: { select: { name: true, sku: true } },
      creator: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get alert counts by type
  const alertCounts = await prisma.alert.groupBy({
    by: ["alertType"],
    _count: { id: true },
    where: { isDismissed: false },
  });

  const countMap = new Map(alertCounts.map((a) => [a.alertType, a._count.id]));

  return rules.map((rule) => ({
    id: rule.id,
    alertType: rule.alertType,
    isEnabled: rule.isEnabled,
    thresholdValue: rule.thresholdValue,
    thresholdUnit: rule.thresholdUnit,
    appliesToOutlet: rule.appliesToOutlet?.name ?? "All Outlets",
    appliesToProduct: rule.appliesToProduct?.name,
    createdBy: rule.creator.name,
    activeAlerts: countMap.get(rule.alertType) ?? 0,
  }));
}

/**
 * Get upload stats summary.
 */
export async function getUploadStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [total, recent, completed, failed, totalRecords] = await Promise.all([
    prisma.upload.count(),
    prisma.upload.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.upload.count({ where: { status: "COMPLETED" } }),
    prisma.upload.count({ where: { status: "FAILED" } }),
    prisma.upload.aggregate({
      _sum: { recordsProcessed: true },
      where: { status: "COMPLETED" },
    }),
  ]);

  return {
    total,
    recent,
    completed,
    failed,
    totalRecords: totalRecords._sum.recordsProcessed ?? 0,
  };
}
