import { prisma } from "@spotlight/db";
import type { MappedRow } from "../field-mapper";

export interface SalesDataResult {
  processed: number;
  failed: number;
  createdIds: string[];
  costGoalAlerts: Array<{ outletId: string; category: string; actual: number; goal: number }>;
  errors: Array<{ row: number; message: string }>;
}

export type POSSource = "micros" | "agilysys" | "toast" | "unknown";

/**
 * SalesDataProcessor writes validated POS sales data to the database
 * and checks cost goals.
 */
export class SalesDataProcessor {
  async process(
    rows: MappedRow[],
    organizationId: string,
    uploadId?: string
  ): Promise<SalesDataResult> {
    const result: SalesDataResult = {
      processed: 0,
      failed: 0,
      createdIds: [],
      costGoalAlerts: [],
      errors: [],
    };

    const productCache = new Map<string, { id: string; name: string }>();
    const outletCache = new Map<string, string>();
    const checkedOutlets = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Resolve product by SKU or name
        const sku = String(row.sku ?? row.productSku ?? row.itemCode ?? "").trim();
        let product = productCache.get(sku);
        if (!product && sku) {
          const found = await prisma.product.findFirst({
            where: {
              OR: [{ sku }, { name: { contains: sku, mode: "insensitive" } }],
            },
            select: { id: true, name: true },
          });
          if (found) {
            product = found;
            productCache.set(sku, found);
          }
        }
        if (!product) {
          result.errors.push({ row: i + 1, message: `Product not found: ${sku}` });
          result.failed++;
          continue;
        }

        // Resolve outlet
        const outletName = String(row.outlet ?? row.outletName ?? row.location ?? "").trim();
        let outletId = outletCache.get(outletName);
        if (!outletId && outletName) {
          const outlet = await prisma.outlet.findFirst({
            where: {
              organizationId,
              OR: [
                { name: { contains: outletName, mode: "insensitive" } },
                { slug: outletName.toLowerCase().replace(/\s+/g, "-") },
              ],
            },
            select: { id: true },
          });
          if (outlet) {
            outletId = outlet.id;
            outletCache.set(outletName, outlet.id);
          }
        }
        if (!outletId) {
          result.errors.push({ row: i + 1, message: `Outlet not found: ${outletName}` });
          result.failed++;
          continue;
        }

        const revenue = Number(row.revenue ?? row.sales ?? row.amount ?? 0);
        const quantitySold = Number(row.quantitySold ?? row.quantity ?? 0);
        const itemName = String(row.itemName ?? row.productName ?? product.name);
        const saleDate = row.saleDate
          ? new Date(String(row.saleDate))
          : row.date
            ? new Date(String(row.date))
            : new Date();

        const sale = await prisma.salesData.create({
          data: {
            organizationId,
            outletId,
            productId: product.id,
            itemName,
            revenue,
            quantitySold,
            saleDate,
            uploadId: uploadId ?? null,
          },
        });

        result.createdIds.push(sale.id);
        result.processed++;

        // Check cost goal once per outlet
        if (!checkedOutlets.has(outletId)) {
          checkedOutlets.add(outletId);
          const alert = await this.checkCostGoal(outletId);
          if (alert && alert.exceeded) {
            result.costGoalAlerts.push({
              outletId,
              category: "all",
              actual: alert.actual,
              goal: alert.goal,
            });
          }
        }
      } catch (err) {
        result.errors.push({
          row: i + 1,
          message: err instanceof Error ? err.message : "Unknown error",
        });
        result.failed++;
      }
    }

    return result;
  }

  detectPOSSource(headers: string[]): POSSource {
    const normalized = headers.map((h) => h.toLowerCase());

    if (normalized.some((h) => h.includes("rvc") || h.includes("revenue center"))) {
      return "micros";
    }
    if (normalized.some((h) => h.includes("dept") || h.includes("department"))) {
      return "agilysys";
    }
    if (normalized.some((h) => h.includes("menu item") || h.includes("toast"))) {
      return "toast";
    }

    return "unknown";
  }

  async checkCostGoal(
    outletId: string,
    category?: string
  ): Promise<{ actual: number; goal: number; exceeded: boolean } | null> {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [costGoal, salesAgg, costAgg] = await Promise.all([
      prisma.costGoal.findFirst({
        where: { outletId, ...(category ? { category: category as never } : {}) },
        orderBy: { effectiveDate: "desc" },
        select: { targetCostPercentage: true },
      }),
      prisma.salesData.aggregate({
        _sum: { revenue: true },
        where: { outletId, saleDate: { gte: threeMonthsAgo } },
      }),
      prisma.orderHistory.aggregate({
        _sum: { totalCost: true },
        where: { outletId, orderDate: { gte: threeMonthsAgo } },
      }),
    ]);

    if (!costGoal) return null;

    const revenue = salesAgg._sum.revenue ?? 0;
    const cost = costAgg._sum.totalCost ?? 0;
    const actual = revenue > 0 ? Math.round((cost / revenue) * 100) : 0;

    return {
      actual,
      goal: costGoal.targetCostPercentage,
      exceeded: actual > costGoal.targetCostPercentage,
    };
  }
}
