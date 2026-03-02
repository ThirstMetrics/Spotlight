"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function MetricCard({ label, value, subtitle, icon, trend, trendValue }: MetricCardProps) {
  const trendColor = trend === "up" ? "text-[#5ad196]" : trend === "down" ? "text-red-500" : "text-gray-500";
  const trendArrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{label}</CardTitle>
        {icon && <div className="text-[#06113e] opacity-70">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#06113e]">{value}</div>
        {(subtitle || trendValue) && (
          <p className="text-xs mt-1">
            {trendValue && (
              <span className={trendColor}>
                {trendArrow} {trendValue}{" "}
              </span>
            )}
            {subtitle && <span className="text-gray-500">{subtitle}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
