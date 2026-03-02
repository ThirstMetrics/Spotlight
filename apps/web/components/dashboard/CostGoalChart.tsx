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
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} domain={[0, 50]} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} width={120} />
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
