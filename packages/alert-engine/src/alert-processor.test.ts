import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @spotlight/db before importing the processor
vi.mock("@spotlight/db", () => {
  const AlertType = {
    MANDATE_COMPLIANCE: "MANDATE_COMPLIANCE",
    PULL_THROUGH_HIGH: "PULL_THROUGH_HIGH",
    PULL_THROUGH_LOW: "PULL_THROUGH_LOW",
    DAYS_OF_INVENTORY: "DAYS_OF_INVENTORY",
    NEW_DIRECT_ITEM: "NEW_DIRECT_ITEM",
    PRICE_DISCREPANCY: "PRICE_DISCREPANCY",
    PRICE_CHANGE: "PRICE_CHANGE",
    COST_GOAL_EXCEEDED: "COST_GOAL_EXCEEDED",
  };

  const AlertSeverity = {
    INFO: "INFO",
    WARNING: "WARNING",
    CRITICAL: "CRITICAL",
  };

  return {
    AlertType,
    AlertSeverity,
    prisma: {
      mandate: { findUnique: vi.fn(), findMany: vi.fn() },
      directOrder: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
      warehouseTransfer: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        aggregate: vi.fn(),
      },
      inventorySnapshot: { findFirst: vi.fn() },
      product: { findUnique: vi.fn(), findFirst: vi.fn() },
      outlet: { findUnique: vi.fn(), findMany: vi.fn() },
      orderHistory: { findFirst: vi.fn(), findMany: vi.fn(), aggregate: vi.fn() },
      salesData: { aggregate: vi.fn() },
      costGoal: { findFirst: vi.fn() },
      alert: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    },
  };
});

import { AlertProcessor } from "./alert-processor";
import { prisma } from "@spotlight/db";

const mockedPrisma = prisma as unknown as {
  mandate: { findUnique: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  directOrder: { findFirst: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
  warehouseTransfer: { findFirst: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn>; aggregate: ReturnType<typeof vi.fn> };
  inventorySnapshot: { findFirst: ReturnType<typeof vi.fn> };
  product: { findUnique: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn> };
  outlet: { findUnique: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  orderHistory: { findFirst: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn>; aggregate: ReturnType<typeof vi.fn> };
  salesData: { aggregate: ReturnType<typeof vi.fn> };
  costGoal: { findFirst: ReturnType<typeof vi.fn> };
  alert: { findFirst: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> };
};

describe("AlertProcessor", () => {
  let processor: AlertProcessor;

  beforeEach(() => {
    processor = new AlertProcessor();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // checkMandateCompliance
  // ---------------------------------------------------------------------------
  describe("checkMandateCompliance", () => {
    it("returns empty array if mandate not found", async () => {
      mockedPrisma.mandate.findUnique.mockResolvedValue(null);

      const alerts = await processor.checkMandateCompliance("outlet-1", "mandate-1");
      expect(alerts).toEqual([]);
    });

    it("returns empty array if mandate is inactive", async () => {
      mockedPrisma.mandate.findUnique.mockResolvedValue({
        id: "mandate-1",
        isActive: false,
        mandateItems: [],
      });

      const alerts = await processor.checkMandateCompliance("outlet-1", "mandate-1");
      expect(alerts).toEqual([]);
    });

    it("skips items that are already compliant", async () => {
      mockedPrisma.mandate.findUnique.mockResolvedValue({
        id: "mandate-1",
        name: "Test Mandate",
        isActive: true,
        startDate: new Date("2025-01-01"),
        mandateItems: [
          {
            productId: "prod-1",
            product: { id: "prod-1", name: "Test Product", sku: "TST001" },
            mandateCompliance: [{ isCompliant: true }],
          },
        ],
      });

      const alerts = await processor.checkMandateCompliance("outlet-1", "mandate-1");
      expect(alerts).toEqual([]);
    });

    it("generates alert for unordered mandate item past grace period", async () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

      mockedPrisma.mandate.findUnique.mockResolvedValue({
        id: "mandate-1",
        name: "National Program",
        isActive: true,
        startDate: eightDaysAgo,
        mandateItems: [
          {
            productId: "prod-1",
            product: { id: "prod-1", name: "Tito's Vodka", sku: "TIT001" },
            mandateCompliance: [],
          },
        ],
      });

      // No orders found
      mockedPrisma.directOrder.findFirst.mockResolvedValue(null);
      mockedPrisma.warehouseTransfer.findFirst.mockResolvedValue(null);

      const alerts = await processor.checkMandateCompliance("outlet-1", "mandate-1");

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("MANDATE_COMPLIANCE");
      expect(alerts[0].severity).toBe("CRITICAL"); // Past grace period
      expect(alerts[0].title).toContain("Tito's Vodka");
      expect(alerts[0].outletId).toBe("outlet-1");
      expect(alerts[0].productId).toBe("prod-1");
    });

    it("generates WARNING for non-compliant item within grace period", async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      mockedPrisma.mandate.findUnique.mockResolvedValue({
        id: "mandate-1",
        name: "Test Mandate",
        isActive: true,
        startDate: twoDaysAgo,
        mandateItems: [
          {
            productId: "prod-1",
            product: { id: "prod-1", name: "Grey Goose", sku: "GRY001" },
            mandateCompliance: [],
          },
        ],
      });

      mockedPrisma.directOrder.findFirst.mockResolvedValue(null);
      mockedPrisma.warehouseTransfer.findFirst.mockResolvedValue(null);

      const alerts = await processor.checkMandateCompliance("outlet-1", "mandate-1");

      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe("WARNING"); // Within grace period
    });

    it("skips item that has a direct order", async () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

      mockedPrisma.mandate.findUnique.mockResolvedValue({
        id: "mandate-1",
        name: "Test Mandate",
        isActive: true,
        startDate: eightDaysAgo,
        mandateItems: [
          {
            productId: "prod-1",
            product: { id: "prod-1", name: "Belvedere", sku: "BEL001" },
            mandateCompliance: [],
          },
        ],
      });

      // Has a direct order
      mockedPrisma.directOrder.findFirst.mockResolvedValue({
        orderDate: new Date(),
        quantity: 12,
      });
      mockedPrisma.warehouseTransfer.findFirst.mockResolvedValue(null);

      const alerts = await processor.checkMandateCompliance("outlet-1", "mandate-1");
      expect(alerts).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // checkPullThroughHigh
  // ---------------------------------------------------------------------------
  describe("checkPullThroughHigh", () => {
    it("returns null when no historic data", async () => {
      mockedPrisma.warehouseTransfer.aggregate
        .mockResolvedValueOnce({ _sum: { quantity: 0 } }) // 90-day
        .mockResolvedValueOnce({ _sum: { quantity: 10 } }); // 30-day

      const result = await processor.checkPullThroughHigh("outlet-1", "prod-1");
      expect(result).toBeNull();
    });

    it("returns null when current is within threshold", async () => {
      // 90-day total = 90 → avg monthly = 30
      // 30-day total = 30 → 100% of avg → below 120% threshold
      mockedPrisma.warehouseTransfer.aggregate
        .mockResolvedValueOnce({ _sum: { quantity: 90 } }) // 90-day
        .mockResolvedValueOnce({ _sum: { quantity: 30 } }); // 30-day

      const result = await processor.checkPullThroughHigh("outlet-1", "prod-1");
      expect(result).toBeNull();
    });

    it("generates alert when pull-through exceeds threshold", async () => {
      // 90-day total = 90 → avg monthly = 30
      // 30-day total = 50 → 167% of avg → above 120% threshold
      mockedPrisma.warehouseTransfer.aggregate
        .mockResolvedValueOnce({ _sum: { quantity: 90 } }) // 90-day
        .mockResolvedValueOnce({ _sum: { quantity: 50 } }); // 30-day

      mockedPrisma.product.findUnique.mockResolvedValue({
        name: "Hennessy VS",
        sku: "HEN001",
      });

      const result = await processor.checkPullThroughHigh("outlet-1", "prod-1");

      expect(result).not.toBeNull();
      expect(result!.type).toBe("PULL_THROUGH_HIGH");
      expect(result!.severity).toBe("WARNING");
      expect(result!.metadata?.percentOfAvg).toBe(167);
      expect(result!.title).toContain("Hennessy VS");
    });

    it("respects custom threshold", async () => {
      // 90-day total = 90 → avg monthly = 30
      // 30-day total = 35 → 117% of avg → below default 120% but above 110%
      mockedPrisma.warehouseTransfer.aggregate
        .mockResolvedValueOnce({ _sum: { quantity: 90 } }) // 90-day
        .mockResolvedValueOnce({ _sum: { quantity: 35 } }); // 30-day

      mockedPrisma.product.findUnique.mockResolvedValue({
        name: "Test",
        sku: "TST",
      });

      const result = await processor.checkPullThroughHigh("outlet-1", "prod-1", 110);

      expect(result).not.toBeNull();
      expect(result!.metadata?.percentOfAvg).toBe(117);
    });
  });

  // ---------------------------------------------------------------------------
  // checkPullThroughLow
  // ---------------------------------------------------------------------------
  describe("checkPullThroughLow", () => {
    it("returns null when no historic data", async () => {
      mockedPrisma.warehouseTransfer.aggregate
        .mockResolvedValueOnce({ _sum: { quantity: 0 } })
        .mockResolvedValueOnce({ _sum: { quantity: 5 } });

      const result = await processor.checkPullThroughLow("outlet-1", "prod-1");
      expect(result).toBeNull();
    });

    it("returns null when current period is zero (product removed)", async () => {
      mockedPrisma.warehouseTransfer.aggregate
        .mockResolvedValueOnce({ _sum: { quantity: 90 } })
        .mockResolvedValueOnce({ _sum: { quantity: 0 } });

      const result = await processor.checkPullThroughLow("outlet-1", "prod-1");
      expect(result).toBeNull();
    });

    it("returns null when pull-through is above threshold", async () => {
      // 90-day total = 90 → avg monthly = 30
      // 30-day total = 25 → 83% → above 80% threshold
      mockedPrisma.warehouseTransfer.aggregate
        .mockResolvedValueOnce({ _sum: { quantity: 90 } })
        .mockResolvedValueOnce({ _sum: { quantity: 25 } });

      const result = await processor.checkPullThroughLow("outlet-1", "prod-1");
      expect(result).toBeNull();
    });

    it("generates alert when pull-through is below threshold", async () => {
      // 90-day total = 90 → avg monthly = 30
      // 30-day total = 15 → 50% → below 80% threshold
      mockedPrisma.warehouseTransfer.aggregate
        .mockResolvedValueOnce({ _sum: { quantity: 90 } })
        .mockResolvedValueOnce({ _sum: { quantity: 15 } });

      mockedPrisma.product.findUnique.mockResolvedValue({
        name: "Johnnie Walker Blue",
        sku: "JWB001",
      });

      const result = await processor.checkPullThroughLow("outlet-1", "prod-1");

      expect(result).not.toBeNull();
      expect(result!.type).toBe("PULL_THROUGH_LOW");
      expect(result!.metadata?.percentOfAvg).toBe(50);
    });
  });

  // ---------------------------------------------------------------------------
  // checkDaysOfInventory
  // ---------------------------------------------------------------------------
  describe("checkDaysOfInventory", () => {
    it("returns null when no inventory snapshot exists", async () => {
      mockedPrisma.inventorySnapshot.findFirst.mockResolvedValue(null);

      const result = await processor.checkDaysOfInventory("outlet-1", "prod-1");
      expect(result).toBeNull();
    });

    it("returns null when quantity on hand is zero", async () => {
      mockedPrisma.inventorySnapshot.findFirst.mockResolvedValue({
        quantityOnHand: 0,
        snapshotDate: new Date(),
      });

      const result = await processor.checkDaysOfInventory("outlet-1", "prod-1");
      expect(result).toBeNull();
    });

    it("returns null when no usage data (product inactive)", async () => {
      mockedPrisma.inventorySnapshot.findFirst.mockResolvedValue({
        quantityOnHand: 10,
        snapshotDate: new Date(),
      });
      mockedPrisma.warehouseTransfer.aggregate.mockResolvedValue({
        _sum: { quantity: 0 },
      });

      const result = await processor.checkDaysOfInventory("outlet-1", "prod-1");
      expect(result).toBeNull();
    });

    it("returns null when days of inventory is above threshold", async () => {
      mockedPrisma.inventorySnapshot.findFirst.mockResolvedValue({
        quantityOnHand: 100,
        snapshotDate: new Date(),
      });
      // 90-day total = 90 → 1 per day → 100 days remaining
      mockedPrisma.warehouseTransfer.aggregate.mockResolvedValue({
        _sum: { quantity: 90 },
      });

      const result = await processor.checkDaysOfInventory("outlet-1", "prod-1");
      expect(result).toBeNull();
    });

    it("generates WARNING when days remaining < 5 but > 2", async () => {
      mockedPrisma.inventorySnapshot.findFirst.mockResolvedValue({
        quantityOnHand: 4,
        snapshotDate: new Date(),
      });
      // 90-day total = 90 → 1 per day → 4 days remaining
      mockedPrisma.warehouseTransfer.aggregate.mockResolvedValue({
        _sum: { quantity: 90 },
      });
      mockedPrisma.product.findUnique.mockResolvedValue({
        name: "Don Julio 1942",
        sku: "DJ1942",
      });

      const result = await processor.checkDaysOfInventory("outlet-1", "prod-1");

      expect(result).not.toBeNull();
      expect(result!.type).toBe("DAYS_OF_INVENTORY");
      expect(result!.severity).toBe("WARNING");
      expect(result!.metadata?.daysRemaining).toBe(4);
    });

    it("generates CRITICAL when days remaining <= 2", async () => {
      mockedPrisma.inventorySnapshot.findFirst.mockResolvedValue({
        quantityOnHand: 2,
        snapshotDate: new Date(),
      });
      // 90-day total = 90 → 1 per day → 2 days remaining
      mockedPrisma.warehouseTransfer.aggregate.mockResolvedValue({
        _sum: { quantity: 90 },
      });
      mockedPrisma.product.findUnique.mockResolvedValue({
        name: "Macallan 18",
        sku: "MAC018",
      });

      const result = await processor.checkDaysOfInventory("outlet-1", "prod-1");

      expect(result).not.toBeNull();
      expect(result!.severity).toBe("CRITICAL");
      expect(result!.metadata?.daysRemaining).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // checkNewDirectItem
  // ---------------------------------------------------------------------------
  describe("checkNewDirectItem", () => {
    it("returns null if product has warehouse transfer history", async () => {
      mockedPrisma.directOrder.findFirst.mockResolvedValue({
        id: "do-1",
        orderDate: new Date(),
        quantity: 6,
      });
      mockedPrisma.warehouseTransfer.findFirst.mockResolvedValue({
        id: "wt-1",
      });

      const result = await processor.checkNewDirectItem("outlet-1", "prod-1");
      expect(result).toBeNull();
    });

    it("returns null if product has more than 1 direct order", async () => {
      mockedPrisma.directOrder.findFirst.mockResolvedValue({
        id: "do-1",
        orderDate: new Date(),
        quantity: 6,
      });
      mockedPrisma.warehouseTransfer.findFirst.mockResolvedValue(null);
      mockedPrisma.directOrder.count.mockResolvedValue(3);

      const result = await processor.checkNewDirectItem("outlet-1", "prod-1");
      expect(result).toBeNull();
    });

    it("generates INFO alert for first-ever direct order at outlet", async () => {
      mockedPrisma.directOrder.findFirst.mockResolvedValue({
        id: "do-1",
        orderDate: new Date("2025-12-01"),
        quantity: 6,
      });
      mockedPrisma.warehouseTransfer.findFirst.mockResolvedValue(null);
      mockedPrisma.directOrder.count.mockResolvedValue(1);
      mockedPrisma.product.findUnique.mockResolvedValue({
        name: "Espolòn Reposado",
        sku: "ESP002",
        category: "SPIRITS",
      });
      mockedPrisma.outlet.findUnique.mockResolvedValue({
        name: "Carversteak",
      });

      const result = await processor.checkNewDirectItem("outlet-1", "prod-1");

      expect(result).not.toBeNull();
      expect(result!.type).toBe("NEW_DIRECT_ITEM");
      expect(result!.severity).toBe("INFO");
      expect(result!.title).toContain("Carversteak");
      expect(result!.title).toContain("Espolòn Reposado");
    });
  });

  // ---------------------------------------------------------------------------
  // checkPriceDiscrepancy
  // ---------------------------------------------------------------------------
  describe("checkPriceDiscrepancy", () => {
    it("returns null with fewer than 2 outlets", async () => {
      const result = await processor.checkPriceDiscrepancy("prod-1", ["outlet-1"]);
      expect(result).toBeNull();
    });

    it("returns null when all outlets have same price", async () => {
      mockedPrisma.orderHistory.findFirst
        .mockResolvedValueOnce({ costPerUnit: 25.0 })
        .mockResolvedValueOnce({ costPerUnit: 25.0 });
      mockedPrisma.directOrder.findFirst
        .mockResolvedValue(null);
      mockedPrisma.outlet.findUnique
        .mockResolvedValueOnce({ name: "Bar A" })
        .mockResolvedValueOnce({ name: "Bar B" });

      const result = await processor.checkPriceDiscrepancy("prod-1", [
        "outlet-1",
        "outlet-2",
      ]);
      expect(result).toBeNull();
    });

    it("generates alert when prices differ across outlets", async () => {
      // Outlet 1: direct order at $20, Outlet 2: order history at $28
      mockedPrisma.orderHistory.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ costPerUnit: 28.0 });
      mockedPrisma.directOrder.findFirst
        .mockResolvedValueOnce({ costPerUnit: 20.0 })
        .mockResolvedValueOnce(null);
      mockedPrisma.outlet.findUnique
        .mockResolvedValueOnce({ name: "Pool Bar" })
        .mockResolvedValueOnce({ name: "Steakhouse" });
      mockedPrisma.product.findUnique.mockResolvedValue({
        name: "Patrón Silver",
        sku: "PAT001",
      });

      const result = await processor.checkPriceDiscrepancy("prod-1", [
        "outlet-1",
        "outlet-2",
      ]);

      expect(result).not.toBeNull();
      expect(result!.type).toBe("PRICE_DISCREPANCY");
      expect(result!.metadata?.minPrice).toBe(20);
      expect(result!.metadata?.maxPrice).toBe(28);
      expect(result!.metadata?.variance).toBe(40); // (28-20)/20*100
    });
  });

  // ---------------------------------------------------------------------------
  // checkPriceChange
  // ---------------------------------------------------------------------------
  describe("checkPriceChange", () => {
    it("returns null when fewer than 2 orders exist", async () => {
      mockedPrisma.orderHistory.findMany.mockResolvedValue([
        { costPerUnit: 30, orderDate: new Date() },
      ]);

      const result = await processor.checkPriceChange("prod-1", "outlet-1");
      expect(result).toBeNull();
    });

    it("returns null when price unchanged", async () => {
      mockedPrisma.orderHistory.findMany.mockResolvedValue([
        { costPerUnit: 30, orderDate: new Date("2025-12-15") },
        { costPerUnit: 30, orderDate: new Date("2025-11-15") },
      ]);

      const result = await processor.checkPriceChange("prod-1", "outlet-1");
      expect(result).toBeNull();
    });

    it("generates WARNING for price increase >= 5%", async () => {
      mockedPrisma.orderHistory.findMany.mockResolvedValue([
        { costPerUnit: 33, orderDate: new Date("2025-12-15") },
        { costPerUnit: 30, orderDate: new Date("2025-11-15") },
      ]);
      mockedPrisma.product.findUnique.mockResolvedValue({
        name: "Absolut",
        sku: "ABS001",
      });

      const result = await processor.checkPriceChange("prod-1", "outlet-1");

      expect(result).not.toBeNull();
      expect(result!.type).toBe("PRICE_CHANGE");
      expect(result!.severity).toBe("WARNING"); // 10% change >= 5%
      expect(result!.title).toContain("increase");
      expect(result!.metadata?.pctChange).toBe(10);
    });

    it("generates INFO for small price decrease < 5%", async () => {
      mockedPrisma.orderHistory.findMany.mockResolvedValue([
        { costPerUnit: 29, orderDate: new Date("2025-12-15") },
        { costPerUnit: 30, orderDate: new Date("2025-11-15") },
      ]);
      mockedPrisma.product.findUnique.mockResolvedValue({
        name: "Svedka",
        sku: "SVD001",
      });

      const result = await processor.checkPriceChange("prod-1", "outlet-1");

      expect(result).not.toBeNull();
      expect(result!.severity).toBe("INFO");
      expect(result!.title).toContain("decrease");
    });
  });

  // ---------------------------------------------------------------------------
  // checkCostGoal
  // ---------------------------------------------------------------------------
  describe("checkCostGoal", () => {
    it("returns null when no cost goal is configured", async () => {
      mockedPrisma.costGoal.findFirst.mockResolvedValue(null);

      const result = await processor.checkCostGoal("outlet-1");
      expect(result).toBeNull();
    });

    it("returns null when no revenue data", async () => {
      mockedPrisma.costGoal.findFirst.mockResolvedValue({
        targetCostPercentage: 25,
      });
      mockedPrisma.salesData.aggregate.mockResolvedValue({
        _sum: { revenue: 0 },
      });
      mockedPrisma.orderHistory.aggregate.mockResolvedValue({
        _sum: { totalCost: 0 },
      });

      const result = await processor.checkCostGoal("outlet-1");
      expect(result).toBeNull();
    });

    it("returns null when cost % is within goal", async () => {
      mockedPrisma.costGoal.findFirst.mockResolvedValue({
        targetCostPercentage: 30,
      });
      mockedPrisma.salesData.aggregate.mockResolvedValue({
        _sum: { revenue: 100000 },
      });
      mockedPrisma.orderHistory.aggregate.mockResolvedValue({
        _sum: { totalCost: 25000 },
      });

      const result = await processor.checkCostGoal("outlet-1");
      expect(result).toBeNull(); // 25% < 30% goal
    });

    it("generates WARNING when cost % exceeds goal by < 5 points", async () => {
      mockedPrisma.costGoal.findFirst.mockResolvedValue({
        targetCostPercentage: 25,
      });
      mockedPrisma.salesData.aggregate.mockResolvedValue({
        _sum: { revenue: 100000 },
      });
      mockedPrisma.orderHistory.aggregate.mockResolvedValue({
        _sum: { totalCost: 28000 },
      });
      mockedPrisma.outlet.findUnique.mockResolvedValue({
        name: "Carversteak",
      });

      const result = await processor.checkCostGoal("outlet-1");

      expect(result).not.toBeNull();
      expect(result!.type).toBe("COST_GOAL_EXCEEDED");
      expect(result!.severity).toBe("WARNING"); // 28% - 25% = 3 points < 5
      expect(result!.metadata?.actualPct).toBe(28);
      expect(result!.metadata?.goalPct).toBe(25);
    });

    it("generates CRITICAL when cost % exceeds goal by >= 5 points", async () => {
      mockedPrisma.costGoal.findFirst.mockResolvedValue({
        targetCostPercentage: 25,
      });
      mockedPrisma.salesData.aggregate.mockResolvedValue({
        _sum: { revenue: 100000 },
      });
      mockedPrisma.orderHistory.aggregate.mockResolvedValue({
        _sum: { totalCost: 35000 },
      });
      mockedPrisma.outlet.findUnique.mockResolvedValue({
        name: "Pool Bar",
      });

      const result = await processor.checkCostGoal("outlet-1");

      expect(result).not.toBeNull();
      expect(result!.severity).toBe("CRITICAL"); // 35% - 25% = 10 points >= 5
    });
  });
});
