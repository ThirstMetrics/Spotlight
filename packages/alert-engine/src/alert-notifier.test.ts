import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@spotlight/db", () => {
  const AlertType = {
    MANDATE_COMPLIANCE: "MANDATE_COMPLIANCE",
    PULL_THROUGH_HIGH: "PULL_THROUGH_HIGH",
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
      alert: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        count: vi.fn(),
      },
    },
  };
});

import { AlertNotifier } from "./alert-notifier";
import type { AlertResult } from "./alert-processor";
import { prisma } from "@spotlight/db";

const mockedAlerts = prisma.alert as unknown as {
  findFirst: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  updateMany: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
};

describe("AlertNotifier", () => {
  let notifier: AlertNotifier;

  beforeEach(() => {
    notifier = new AlertNotifier();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // createAlert
  // ---------------------------------------------------------------------------
  describe("createAlert", () => {
    const sampleResult: AlertResult = {
      type: "MANDATE_COMPLIANCE" as never,
      severity: "WARNING" as never,
      outletId: "outlet-1",
      productId: "prod-1",
      title: "Test Alert",
      message: "Test message",
    };

    it("creates a new alert when no duplicate exists", async () => {
      mockedAlerts.findFirst.mockResolvedValue(null);
      mockedAlerts.create.mockResolvedValue({ id: "alert-123" });

      const id = await notifier.createAlert(sampleResult, "org-1");

      expect(id).toBe("alert-123");
      expect(mockedAlerts.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: "org-1",
          alertType: "MANDATE_COMPLIANCE",
          severity: "WARNING",
          title: "Test Alert",
          isRead: false,
          isDismissed: false,
        }),
      });
    });

    it("returns null when duplicate alert exists", async () => {
      mockedAlerts.findFirst.mockResolvedValue({ id: "existing-alert" });

      const id = await notifier.createAlert(sampleResult, "org-1");

      expect(id).toBeNull();
      expect(mockedAlerts.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // createAlerts (batch)
  // ---------------------------------------------------------------------------
  describe("createAlerts", () => {
    it("creates multiple alerts and returns only new IDs", async () => {
      const results: AlertResult[] = [
        {
          type: "MANDATE_COMPLIANCE" as never,
          severity: "WARNING" as never,
          outletId: "o-1",
          productId: "p-1",
          title: "Alert 1",
          message: "msg 1",
        },
        {
          type: "PULL_THROUGH_HIGH" as never,
          severity: "WARNING" as never,
          outletId: "o-2",
          productId: "p-2",
          title: "Alert 2",
          message: "msg 2",
        },
      ];

      // First is new, second is duplicate
      mockedAlerts.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "existing" });
      mockedAlerts.create.mockResolvedValue({ id: "new-alert" });

      const ids = await notifier.createAlerts(results, "org-1");

      expect(ids).toEqual(["new-alert"]);
      expect(mockedAlerts.create).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // dismissAlert
  // ---------------------------------------------------------------------------
  describe("dismissAlert", () => {
    it("marks alert as dismissed with resolved timestamp", async () => {
      mockedAlerts.update.mockResolvedValue({});

      await notifier.dismissAlert("alert-1");

      expect(mockedAlerts.update).toHaveBeenCalledWith({
        where: { id: "alert-1" },
        data: {
          isDismissed: true,
          resolvedAt: expect.any(Date),
        },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // markAsRead
  // ---------------------------------------------------------------------------
  describe("markAsRead", () => {
    it("marks alert as read when not dismissed", async () => {
      mockedAlerts.findUnique.mockResolvedValue({ isDismissed: false });
      mockedAlerts.update.mockResolvedValue({});

      await notifier.markAsRead("alert-1");

      expect(mockedAlerts.update).toHaveBeenCalledWith({
        where: { id: "alert-1" },
        data: { isRead: true },
      });
    });

    it("does not change dismissed alert", async () => {
      mockedAlerts.findUnique.mockResolvedValue({ isDismissed: true });

      await notifier.markAsRead("alert-1");

      expect(mockedAlerts.update).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // markAllAsRead
  // ---------------------------------------------------------------------------
  describe("markAllAsRead", () => {
    it("updates all unread non-dismissed alerts", async () => {
      mockedAlerts.updateMany.mockResolvedValue({ count: 5 });

      const count = await notifier.markAllAsRead("org-1");

      expect(count).toBe(5);
      expect(mockedAlerts.updateMany).toHaveBeenCalledWith({
        where: {
          organizationId: "org-1",
          isRead: false,
          isDismissed: false,
        },
        data: { isRead: true },
      });
    });

    it("scopes to outlet when provided", async () => {
      mockedAlerts.updateMany.mockResolvedValue({ count: 2 });

      await notifier.markAllAsRead("org-1", "outlet-1");

      expect(mockedAlerts.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          outletId: "outlet-1",
        }),
        data: { isRead: true },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getUnreadCount
  // ---------------------------------------------------------------------------
  describe("getUnreadCount", () => {
    it("returns count of unread non-dismissed alerts", async () => {
      mockedAlerts.count.mockResolvedValue(12);

      const count = await notifier.getUnreadCount("org-1");
      expect(count).toBe(12);
    });
  });

  // ---------------------------------------------------------------------------
  // getRecentAlerts
  // ---------------------------------------------------------------------------
  describe("getRecentAlerts", () => {
    it("returns recent unread alerts by default", async () => {
      const mockAlerts = [{ id: "a1" }, { id: "a2" }];
      mockedAlerts.findMany.mockResolvedValue(mockAlerts);

      const result = await notifier.getRecentAlerts("org-1");

      expect(result).toEqual(mockAlerts);
      expect(mockedAlerts.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: "org-1",
            isDismissed: false,
            isRead: false,
          }),
          take: 20,
        })
      );
    });

    it("includes read alerts when requested", async () => {
      mockedAlerts.findMany.mockResolvedValue([]);

      await notifier.getRecentAlerts("org-1", { includeRead: true });

      expect(mockedAlerts.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: "org-1",
            isDismissed: false,
          }),
        })
      );
      // Should NOT have isRead filter
      const callArgs = mockedAlerts.findMany.mock.calls[0][0];
      expect(callArgs.where.isRead).toBeUndefined();
    });
  });
});
