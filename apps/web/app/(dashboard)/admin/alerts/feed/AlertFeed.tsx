"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { notify } from "@/lib/hooks/use-notify";
import { CheckCircle, XCircle, Eye } from "lucide-react";

interface AlertItem {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: Date | string;
  resolvedAt: Date | string | null;
  outlet: { name: string; slug: string } | null;
  product: { name: string; sku: string } | null;
}

type FilterTab = "all" | "active" | "read" | "dismissed";

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-red-500 text-white",
  WARNING: "bg-amber-500 text-white",
  INFO: "bg-blue-500 text-white",
};

const TYPE_LABELS: Record<string, string> = {
  MANDATE_COMPLIANCE: "Mandate Compliance",
  PULL_THROUGH_HIGH: "Pull-Through High",
  PULL_THROUGH_LOW: "Pull-Through Low",
  DAYS_OF_INVENTORY: "Days of Inventory",
  NEW_DIRECT_ITEM: "New Direct Item",
  PRICE_DISCREPANCY: "Price Discrepancy",
  PRICE_CHANGE: "Price Change",
  COST_GOAL_EXCEEDED: "Cost Goal Exceeded",
};

export function AlertFeed({ initialAlerts }: { initialAlerts: AlertItem[] }) {
  const router = useRouter();
  const [alerts, setAlerts] = useState(initialAlerts);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = alerts.filter((a) => {
    if (filter === "active") return !a.isRead && !a.isDismissed;
    if (filter === "read") return a.isRead && !a.isDismissed;
    if (filter === "dismissed") return a.isDismissed;
    return true;
  });

  async function handleAction(alertId: string, action: "acknowledge" | "dismiss") {
    setLoadingId(alertId);
    const res = await apiClient("/api/alerts", {
      method: "PATCH",
      body: JSON.stringify({ alertId, action }),
    });

    if (res.success) {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? {
                ...a,
                isRead: action === "acknowledge" ? true : a.isRead,
                isDismissed: action === "dismiss" ? true : a.isDismissed,
                resolvedAt: action === "dismiss" ? new Date().toISOString() : a.resolvedAt,
              }
            : a
        )
      );
      notify.success(
        action === "acknowledge" ? "Alert marked as read" : "Alert dismissed"
      );
      router.refresh();
    } else {
      notify.error(res.error ?? "Failed to update alert");
    }
    setLoadingId(null);
  }

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: alerts.length },
    {
      key: "active",
      label: "Active",
      count: alerts.filter((a) => !a.isRead && !a.isDismissed).length,
    },
    {
      key: "read",
      label: "Read",
      count: alerts.filter((a) => a.isRead && !a.isDismissed).length,
    },
    {
      key: "dismissed",
      label: "Dismissed",
      count: alerts.filter((a) => a.isDismissed).length,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === tab.key
                ? "border-[#06113e] text-[#06113e]"
                : "border-transparent text-muted-foreground hover:text-[#06113e]"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({tab.count})
            </span>
          </button>
        ))}
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No alerts in this category.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                !alert.isRead && !alert.isDismissed
                  ? "bg-white border-l-4 border-l-amber-400"
                  : alert.isDismissed
                    ? "bg-gray-50/50 opacity-60"
                    : "bg-white"
              }`}
            >
              <Badge
                className={`mt-0.5 shrink-0 text-[10px] ${SEVERITY_STYLES[alert.severity] ?? "bg-gray-500 text-white"}`}
              >
                {alert.severity}
              </Badge>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-[#06113e]">
                      {alert.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {alert.message}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(alert.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {TYPE_LABELS[alert.alertType] ?? alert.alertType}
                  </span>
                  {alert.outlet && (
                    <span className="text-xs text-muted-foreground">
                      {alert.outlet.name}
                    </span>
                  )}
                  {alert.product && (
                    <span className="text-xs text-gray-400">
                      {alert.product.name}
                    </span>
                  )}
                </div>

                {/* Actions */}
                {!alert.isDismissed && (
                  <div className="flex gap-2 mt-3">
                    {!alert.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingId === alert.id}
                        onClick={() => handleAction(alert.id, "acknowledge")}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Mark Read
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingId === alert.id}
                      onClick={() => handleAction(alert.id, "dismiss")}
                      className="text-muted-foreground"
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      Dismiss
                    </Button>
                  </div>
                )}

                {alert.isDismissed && alert.resolvedAt && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-[#5ad196]" />
                    Dismissed{" "}
                    {new Date(alert.resolvedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
