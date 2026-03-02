import { prisma } from "@spotlight/db";
import type { MappedRow } from "../field-mapper";

export interface WarehouseTransferResult {
  processed: number;
  failed: number;
  createdIds: string[];
  errors: Array<{ row: number; message: string }>;
}

/**
 * WarehouseTransferProcessor writes validated warehouse transfer data
 * to the database and updates inventory snapshots.
 */
export class WarehouseTransferProcessor {
  async process(
    rows: MappedRow[],
    organizationId: string,
    uploadId?: string
  ): Promise<WarehouseTransferResult> {
    const result: WarehouseTransferResult = {
      processed: 0,
      failed: 0,
      createdIds: [],
      errors: [],
    };

    // Resolve products by SKU and outlets by name/slug
    const productCache = new Map<string, string>();
    const outletCache = new Map<string, string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Resolve product
        const sku = String(row.sku ?? row.productSku ?? "").trim();
        let productId = productCache.get(sku);
        if (!productId && sku) {
          const product = await prisma.product.findFirst({
            where: { sku },
            select: { id: true },
          });
          if (product) {
            productId = product.id;
            productCache.set(sku, product.id);
          }
        }
        if (!productId) {
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

        const quantity = Number(row.quantity ?? 0);
        const costPerUnit = Number(row.costPerUnit ?? row.unitCost ?? 0);
        const totalCost = Number(row.totalCost ?? quantity * costPerUnit);
        const transferDate = row.transferDate
          ? new Date(String(row.transferDate))
          : new Date();

        const transfer = await prisma.warehouseTransfer.create({
          data: {
            organizationId,
            outletId,
            productId,
            quantity,
            costPerUnit,
            totalCost,
            transferDate,
            referenceNumber: row.referenceNumber ? String(row.referenceNumber) : null,
            uploadId: uploadId ?? null,
          },
        });

        result.createdIds.push(transfer.id);
        result.processed++;

        // Update inventory snapshot
        await this.updateInventorySnapshot(outletId, productId, quantity);
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

  async updateInventorySnapshot(
    outletId: string,
    productId: string,
    quantity: number
  ): Promise<void> {
    const existing = await prisma.inventorySnapshot.findFirst({
      where: { outletId, productId },
      orderBy: { snapshotDate: "desc" },
    });

    const newQty = (existing?.quantityOnHand ?? 0) + quantity;

    await prisma.inventorySnapshot.create({
      data: {
        outletId,
        productId,
        quantityOnHand: newQty,
        snapshotDate: new Date(),
      },
    });
  }
}
