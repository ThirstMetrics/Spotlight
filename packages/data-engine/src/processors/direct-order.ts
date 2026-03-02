import { prisma } from "@spotlight/db";
import type { MappedRow } from "../field-mapper";

export interface DirectOrderResult {
  processed: number;
  failed: number;
  createdIds: string[];
  newItemAlerts: Array<{ outletId: string; productId: string; productName: string }>;
  errors: Array<{ row: number; message: string }>;
}

/**
 * DirectOrderProcessor writes validated direct-to-outlet order data
 * to the database and detects new items at outlets.
 */
export class DirectOrderProcessor {
  async process(
    rows: MappedRow[],
    organizationId: string,
    uploadId?: string
  ): Promise<DirectOrderResult> {
    const result: DirectOrderResult = {
      processed: 0,
      failed: 0,
      createdIds: [],
      newItemAlerts: [],
      errors: [],
    };

    const productCache = new Map<string, { id: string; name: string }>();
    const outletCache = new Map<string, string>();
    const distributorCache = new Map<string, string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Resolve product by SKU
        const sku = String(row.sku ?? row.productSku ?? "").trim();
        let product = productCache.get(sku);
        if (!product && sku) {
          const found = await prisma.product.findFirst({
            where: { sku },
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
        const outletName = String(row.outlet ?? row.outletName ?? "").trim();
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

        // Resolve distributor (optional)
        const distName = String(row.distributor ?? row.distributorName ?? "").trim();
        let distributorId: string | null = null;
        if (distName) {
          distributorId = distributorCache.get(distName) ?? null;
          if (!distributorId) {
            const dist = await prisma.distributor.findFirst({
              where: { name: { contains: distName, mode: "insensitive" } },
              select: { id: true },
            });
            if (dist) {
              distributorId = dist.id;
              distributorCache.set(distName, dist.id);
            }
          }
        }

        // Check if new item for outlet
        const isNew = await this.isNewItemForOutlet(outletId, product.id);
        if (isNew) {
          result.newItemAlerts.push({
            outletId,
            productId: product.id,
            productName: product.name,
          });
        }

        const quantity = Number(row.quantity ?? 0);
        const costPerUnit = Number(row.costPerUnit ?? row.unitCost ?? 0);
        const totalCost = Number(row.totalCost ?? quantity * costPerUnit);
        const orderDate = row.orderDate ? new Date(String(row.orderDate)) : new Date();

        const order = await prisma.directOrder.create({
          data: {
            organizationId,
            outletId,
            productId: product.id,
            distributorId,
            quantity,
            costPerUnit,
            totalCost,
            orderDate,
            referenceNumber: row.referenceNumber ? String(row.referenceNumber) : null,
            uploadId: uploadId ?? null,
          },
        });

        result.createdIds.push(order.id);
        result.processed++;
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

  async isNewItemForOutlet(outletId: string, productId: string): Promise<boolean> {
    const existing = await prisma.directOrder.findFirst({
      where: { outletId, productId },
      select: { id: true },
    });
    if (existing) return false;

    const warehouseExisting = await prisma.warehouseTransfer.findFirst({
      where: { outletId, productId },
      select: { id: true },
    });
    return !warehouseExisting;
  }
}
