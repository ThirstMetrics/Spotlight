"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CostGoalChartProps {
  data: Array<{
    name: string;
    actualCostPct: number;
    goalCostPct: number;
  }>;
}

export function CostGoalChart({ data }: CostGoalChartProps) {
  // Truncate long outlet names for small screens
  const chartData = data.map((d) => ({
    ...d,
    shortName: d.name.length > 14 ? d.name.slice(0, 13) + "…" : d.name,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 32 + 40)}>
      <BarChart data={chartData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} domain={[0, 40]} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="shortName" tick={{ fontSize: 10, fill: "#64748b" }} width={100} />
        <Tooltip
          formatter={(value: number) => [`${value}%`, ""]}
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "13px",
          }}
        />
        <Bar dataKey="actualCostPct" name="Actual Cost %" radius={[0, 4, 4, 0]} barSize={20}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.actualCostPct > entry.goalCostPct ? "#ef4444" : "#5ad196"}
            />
          ))}
        </Bar>
        {data.map((entry, index) => (
          <ReferenceLine
            key={index}
            x={entry.goalCostPct}
            stroke="#06113e"
            strokeDasharray="3 3"
            strokeWidth={1.5}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
