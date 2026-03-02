"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface VolumeChartProps {
  data: Array<{
    month: string;
    label: string;
    BEER: number;
    WINE: number;
    SPIRITS: number;
    SAKE: number;
    NON_ALCOHOLIC: number;
  }>;
}

const CATEGORY_COLORS = {
  SPIRITS: "#06113e",
  WINE: "#5ad196",
  BEER: "#93c5fd",
  SAKE: "#c4b5fd",
  NON_ALCOHOLIC: "#f59e0b",
};

export function VolumeChart({ data }: VolumeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "13px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Bar dataKey="SPIRITS" stackId="a" fill={CATEGORY_COLORS.SPIRITS} name="Spirits" radius={[0, 0, 0, 0]} />
        <Bar dataKey="WINE" stackId="a" fill={CATEGORY_COLORS.WINE} name="Wine" />
        <Bar dataKey="BEER" stackId="a" fill={CATEGORY_COLORS.BEER} name="Beer" />
        <Bar dataKey="SAKE" stackId="a" fill={CATEGORY_COLORS.SAKE} name="Sake" />
        <Bar dataKey="NON_ALCOHOLIC" stackId="a" fill={CATEGORY_COLORS.NON_ALCOHOLIC} name="Non-Alcoholic" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
