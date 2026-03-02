/**
 * Compliance Queries
 * Server-side data fetching for mandate compliance views
 */

import { prisma } from "@spotlight/db";

/** Get compliance overview stats */
export async function getComplianceOverview() {
  const [totalItems, compliantItems, mandateCount, outletCompliance] = await Promise.all([
    prisma.mandateCompliance.count(),
    prisma.mandateCompliance.count({ where: { isCompliant: true } }),
    prisma.mandate.count({ where: { isActive: true } }),
    prisma.mandateCompliance.groupBy({
      by: ["outletId"],
      _count: { id: true, _all: true },
      where: { isCompliant: true },
    }),
  ]);

  const compliancePct = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0;
  const nonCompliantCount = totalItems - compliantItems;

  return {
    totalItems,
    compliantItems,
    nonCompliantCount,
    compliancePct,
    activeMandates: mandateCount,
  };
}

/** Get compliance matrix — all mandate items with outlet compliance status */
export async function getComplianceMatrix() {
  const compliance = await prisma.mandateCompliance.findMany({
    include: {
      outlet: { select: { id: true, name: true, slug: true } },
      mandateItem: {
        include: {
          product: { select: { name: true, sku: true, category: true } },
          mandate: { select: { name: true } },
        },
      },
    },
    orderBy: [
      { outlet: { name: "asc" } },
      { mandateItem: { product: { name: "asc" } } },
    ],
  });

  return compliance.map((c) => ({
    id: c.id,
    outletName: c.outlet.name,
    outletSlug: c.outlet.slug,
    mandateName: c.mandateItem.mandate.name,
    productName: c.mandateItem.product.name,
    productSku: c.mandateItem.product.sku,
    category: c.mandateItem.product.category,
    isCompliant: c.isCompliant,
    lastOrderDate: c.lastOrderDate,
    lastOrderQuantity: c.lastOrderQuantity,
  }));
}

/** Get compliance grouped by outlet */
export async function getComplianceByOutlet() {
  const outlets = await prisma.outlet.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      mandateCompliance: {
        select: { isCompliant: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return outlets.map((outlet) => {
    const total = outlet.mandateCompliance.length;
    const compliant = outlet.mandateCompliance.filter((c) => c.isCompliant).length;
    return {
      id: outlet.id,
      name: outlet.name,
      slug: outlet.slug,
      total,
      compliant,
      nonCompliant: total - compliant,
      pct: total > 0 ? Math.round((compliant / total) * 100) : 100,
    };
  });
}
