/**
 * Compliance Queries
 * Server-side data fetching for mandate compliance views
 */

import { prisma } from "@spotlight/db";

/** Get compliance overview stats */
export async function getComplianceOverview() {
  const [totalItems, compliantItems, mandateCount, outletsTracked, mandateItemCount] = await Promise.all([
    prisma.mandateCompliance.count(),
    prisma.mandateCompliance.count({ where: { isCompliant: true } }),
    prisma.mandate.count({ where: { isActive: true } }),
    prisma.outlet.count({ where: { isActive: true, mandateCompliance: { some: {} } } }),
    prisma.mandateItem.count(),
  ]);

  const compliancePct = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0;
  const nonCompliantCount = totalItems - compliantItems;

  return {
    totalItems,
    compliantItems,
    nonCompliantCount,
    compliancePct,
    activeMandates: mandateCount,
    outletsTracked,
    totalMandateItems: mandateItemCount,
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

/** Get compliance drill-down — mandate items with per-outlet compliance status */
export async function getComplianceDrillDown() {
  const mandates = await prisma.mandate.findMany({
    where: { isActive: true },
    include: {
      mandateItems: {
        include: {
          product: { select: { id: true, name: true, sku: true, category: true } },
          mandateCompliance: {
            include: {
              outlet: { select: { id: true, name: true, slug: true } },
            },
            orderBy: { outlet: { name: "asc" } },
          },
        },
        orderBy: { product: { name: "asc" } },
      },
    },
    orderBy: { name: "asc" },
  });

  return mandates.map((mandate) => ({
    id: mandate.id,
    name: mandate.name,
    description: mandate.description,
    items: mandate.mandateItems.map((mi) => {
      const total = mi.mandateCompliance.length;
      const compliant = mi.mandateCompliance.filter((c) => c.isCompliant).length;
      const status: "full" | "partial" | "none" =
        total === 0 ? "none" : compliant === total ? "full" : compliant > 0 ? "partial" : "none";
      return {
        id: mi.id,
        productId: mi.product.id,
        productName: mi.product.name,
        productSku: mi.product.sku,
        category: mi.product.category,
        minimumQuantity: mi.minimumQuantity,
        total,
        compliant,
        nonCompliant: total - compliant,
        status,
        outlets: mi.mandateCompliance.map((c) => ({
          id: c.outlet.id,
          name: c.outlet.name,
          slug: c.outlet.slug,
          isCompliant: c.isCompliant,
          lastOrderDate: c.lastOrderDate,
          lastOrderQuantity: c.lastOrderQuantity,
        })),
      };
    }),
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
