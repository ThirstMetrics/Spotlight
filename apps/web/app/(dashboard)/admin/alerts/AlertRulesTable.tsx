"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/dashboard/DataTable";

interface AlertRuleRow {
  id: string;
  alertType: string;
  isEnabled: boolean;
  thresholdValue: number | null;
  thresholdUnit: string | null;
  appliesToOutlet: string | null;
  appliesToProduct: string | null;
  activeAlerts: number;
  createdBy: string;
}

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

const TYPE_CATEGORIES: Record<string, string> = {
  MANDATE_COMPLIANCE: "Compliance",
  PULL_THROUGH_HIGH: "Inventory",
  PULL_THROUGH_LOW: "Inventory",
  DAYS_OF_INVENTORY: "Inventory",
  NEW_DIRECT_ITEM: "Inventory",
  PRICE_DISCREPANCY: "Price",
  PRICE_CHANGE: "Price",
  COST_GOAL_EXCEEDED: "Cost",
};

const columns: Column<AlertRuleRow>[] = [
  {
    key: "alertType",
    label: "Rule Type",
    render: (row) => (
      <span className="font-medium text-[#06113e]">
        {TYPE_LABELS[row.alertType] ?? row.alertType}
      </span>
    ),
    searchValue: (row) => TYPE_LABELS[row.alertType] ?? row.alertType,
  },
  {
    key: "category",
    label: "Category",
    sortable: false,
    render: (row) => (
      <Badge variant="secondary" className="text-xs">
        {TYPE_CATEGORIES[row.alertType] ?? "Other"}
      </Badge>
    ),
    searchValue: (row) => TYPE_CATEGORIES[row.alertType] ?? "Other",
  },
  {
    key: "thresholdValue",
    label: "Threshold",
    render: (row) => (
      <span className="text-muted-foreground">
        {row.thresholdValue != null
          ? `${row.thresholdValue}${row.thresholdUnit ?? ""}`
          : "Default"}
      </span>
    ),
  },
  {
    key: "scope",
    label: "Scope",
    sortable: false,
    render: (row) => (
      <span className="text-muted-foreground text-xs">
        {row.appliesToProduct ?? row.appliesToOutlet ?? "All"}
      </span>
    ),
    searchValue: (row) =>
      row.appliesToProduct ?? row.appliesToOutlet ?? "All",
  },
  {
    key: "isEnabled",
    label: "Status",
    sortValue: (row) => (row.isEnabled ? 1 : 0),
    render: (row) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          row.isEnabled
            ? "bg-[#5ad196] text-white"
            : "bg-gray-200 text-gray-600"
        }`}
      >
        {row.isEnabled ? "Enabled" : "Disabled"}
      </span>
    ),
    searchValue: (row) => (row.isEnabled ? "enabled" : "disabled"),
  },
  {
    key: "activeAlerts",
    label: "Active Alerts",
    align: "right",
    render: (row) =>
      row.activeAlerts > 0 ? (
        <span className="text-amber-600 font-medium">{row.activeAlerts}</span>
      ) : (
        <span className="text-muted-foreground">0</span>
      ),
  },
  {
    key: "createdBy",
    label: "Created By",
    render: (row) => (
      <span className="text-muted-foreground text-xs">{row.createdBy}</span>
    ),
  },
];

export function AlertRulesTable({ data }: { data: AlertRuleRow[] }) {
  return (
    <DataTable
      data={data}
      columns={columns}
      searchPlaceholder="Search rules..."
    />
  );
}
