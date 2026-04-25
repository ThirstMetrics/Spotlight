import { prisma } from "@spotlight/db";

/**
 * Get admin dashboard overview counts.
 */
export async function getAdminOverview(organizationId?: string) {
  const [
    outletCount,
    outletGroupCount,
    costGoalCount,
    userCount,
    fieldMappingCount,
    uploadCount,
    alertRuleCount,
    trackingNumberCount,
  ] = await Promise.all([
    prisma.outlet.count({
      where: { isActive: true, ...(organizationId ? { organizationId } : {}) },
    }),
    prisma.outletGroup.count({
      where: { ...(organizationId ? { organizationId } : {}) },
    }),
    prisma.costGoal.count({
      where: { ...(organizationId ? { outlet: { organizationId } } : {}) },
    }),
    prisma.user.count({
      where: {
        isActive: true,
        ...(organizationId
          ? { userRoles: { some: { organizationId } } }
          : {}),
      },
    }),
    prisma.fieldMappingProfile.count({
      where: { ...(organizationId ? { organizationId } : {}) },
    }),
    prisma.upload.count({
      where: { ...(organizationId ? { organizationId } : {}) },
    }),
    prisma.alertRule.count({
      where: { ...(organizationId ? { organizationId } : {}) },
    }),
    prisma.outletTrackingNumber.count({
      where: { ...(organizationId ? { outlet: { organizationId } } : {}) },
    }),
  ]);

  return {
    outletCount,
    outletGroupCount,
    costGoalCount,
    userCount,
    fieldMappingCount,
    uploadCount,
    alertRuleCount,
    trackingNumberCount,
  };
}

/**
 * Get upload history with status and record counts.
 */
export async function getUploadHistory(limit = 50, organizationId?: string) {
  return prisma.upload.findMany({
    where: { ...(organizationId ? { organizationId } : {}) },
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
export async function getAlertRules(organizationId?: string) {
  const rules = await prisma.alertRule.findMany({
    where: { ...(organizationId ? { organizationId } : {}) },
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
    where: {
      isDismissed: false,
      ...(organizationId ? { organizationId } : {}),
    },
  });

  const countMap = new Map(alertCounts.map((a) => [a.alertType, a._count.id]));

  return rules.map((rule) => ({
    id: rule.id,
    alertType: rule.alertType,
    isEnabled: rule.isEnabled,
    thresholdValue: rule.thresholdValue,
    thresholdUnit: rule.thresholdUnit,
    appliesToOutlet: rule.appliesToOutlet?.name ?? "All Outlets",
    appliesToProduct: rule.appliesToProduct?.name ?? null,
    createdBy: rule.creator.name,
    activeAlerts: countMap.get(rule.alertType) ?? 0,
  }));
}

// ============================================================================
// OUTLETS
// ============================================================================

/**
 * Get outlets with group, manager, and order count.
 */
export async function getAdminOutlets(organizationId?: string) {
  const outlets = await prisma.outlet.findMany({
    where: { ...(organizationId ? { organizationId } : {}) },
    include: {
      outletGroup: { select: { id: true, name: true } },
      _count: { select: { orderHistory: true } },
    },
    orderBy: { name: "asc" },
  });

  return outlets.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    type: o.type,
    managerName: o.managerName,
    phone: o.phone,
    isActive: o.isActive,
    groupId: o.outletGroup?.id ?? null,
    groupName: o.outletGroup?.name ?? null,
    orderCount: o._count.orderHistory,
    createdAt: o.createdAt,
  }));
}

/**
 * Get lightweight outlet group list for select dropdowns.
 */
export async function getOutletGroupOptions(organizationId?: string) {
  return prisma.outletGroup.findMany({
    where: { ...(organizationId ? { organizationId } : {}) },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

// ============================================================================
// OUTLET GROUPS
// ============================================================================

/**
 * Get outlet groups with assigned outlets.
 */
export async function getAdminOutletGroups(organizationId?: string) {
  const groups = await prisma.outletGroup.findMany({
    where: { ...(organizationId ? { organizationId } : {}) },
    include: {
      outlets: { select: { id: true, name: true, isActive: true } },
    },
    orderBy: { name: "asc" },
  });

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    outlets: g.outlets,
    outletCount: g.outlets.length,
    createdAt: g.createdAt,
  }));
}

// ============================================================================
// COST GOALS
// ============================================================================

/**
 * Get cost goals with outlet names.
 */
export async function getAdminCostGoals(organizationId?: string) {
  const goals = await prisma.costGoal.findMany({
    where: { ...(organizationId ? { outlet: { organizationId } } : {}) },
    include: {
      outlet: { select: { name: true } },
      creator: { select: { name: true } },
    },
    orderBy: [{ outlet: { name: "asc" } }, { category: "asc" }],
  });

  return goals.map((g) => ({
    id: g.id,
    outletId: g.outletId,
    outletName: g.outlet.name,
    category: g.category,
    targetCostPercentage: g.targetCostPercentage,
    effectiveDate: g.effectiveDate,
    createdBy: g.creator.name,
    createdAt: g.createdAt,
  }));
}

// ============================================================================
// USERS & ROLES
// ============================================================================

/**
 * Get users with role assignments.
 */
export async function getAdminUsers(organizationId?: string) {
  const users = await prisma.user.findMany({
    where: {
      ...(organizationId
        ? { userRoles: { some: { organizationId } } }
        : {}),
    },
    include: {
      userRoles: {
        include: {
          role: { select: { name: true } },
          organization: { select: { name: true } },
          outlet: { select: { name: true } },
          distributor: { select: { name: true } },
          supplier: { select: { name: true } },
        },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return users.map((u) => {
    const assignment = u.userRoles[0];
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      role: assignment?.role?.name ?? "ADMIN",
      scope: assignment?.outlet?.name
        ?? assignment?.distributor?.name
        ?? assignment?.supplier?.name
        ?? assignment?.organization?.name
        ?? "—",
      createdAt: u.createdAt,
    };
  });
}

// ============================================================================
// FIELD MAPPINGS
// ============================================================================

/**
 * Get field mapping profiles.
 */
export async function getAdminFieldMappings(organizationId?: string) {
  const profiles = await prisma.fieldMappingProfile.findMany({
    where: { ...(organizationId ? { organizationId } : {}) },
    include: {
      creator: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return profiles.map((p) => ({
    id: p.id,
    name: p.name,
    source: p.source,
    uploadType: p.uploadType,
    columnCount: Array.isArray(p.mapping) ? (p.mapping as unknown[]).length : Object.keys(p.mapping as object).length,
    createdBy: p.creator.name,
    createdAt: p.createdAt,
  }));
}

// ============================================================================
// INTERNAL ACCOUNTS (TRACKING NUMBERS)
// ============================================================================

/**
 * Get all outlet tracking numbers with outlet info.
 */
export async function getAdminTrackingNumbers(organizationId?: string) {
  const records = await prisma.outletTrackingNumber.findMany({
    where: { ...(organizationId ? { outlet: { organizationId } } : {}) },
    include: {
      outlet: { select: { name: true, type: true, isActive: true } },
    },
    orderBy: [{ outlet: { name: "asc" } }, { type: "asc" }],
  });

  return records.map((r) => ({
    id: r.id,
    outletId: r.outletId,
    outletName: r.outlet.name,
    outletType: r.outlet.type,
    outletActive: r.outlet.isActive,
    type: r.type,
    value: r.value,
    notes: r.notes,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

/**
 * Get lightweight outlet list for dropdowns and paste-import matching.
 */
export async function getOutletOptions(organizationId?: string) {
  return prisma.outlet.findMany({
    select: { id: true, name: true },
    where: { isActive: true, ...(organizationId ? { organizationId } : {}) },
    orderBy: { name: "asc" },
  });
}

// ============================================================================
// UPLOADS
// ============================================================================

/**
 * Get upload stats summary.
 */
export async function getUploadStats(organizationId?: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const orgFilter = organizationId ? { organizationId } : {};

  const [total, recent, completed, failed, totalRecords] = await Promise.all([
    prisma.upload.count({ where: { ...orgFilter } }),
    prisma.upload.count({ where: { createdAt: { gte: thirtyDaysAgo }, ...orgFilter } }),
    prisma.upload.count({ where: { status: "COMPLETED", ...orgFilter } }),
    prisma.upload.count({ where: { status: "FAILED", ...orgFilter } }),
    prisma.upload.aggregate({
      _sum: { recordsProcessed: true },
      where: { status: "COMPLETED", ...orgFilter },
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
