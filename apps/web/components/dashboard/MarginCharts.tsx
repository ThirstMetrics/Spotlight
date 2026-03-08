"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

interface MarginTrendProps {
  data: Array<{
    month: string;
    label: string;
    revenue: number;
    cost: number;
    costPct: number;
  }>;
}

export function MarginTrendChart({ data }: MarginTrendProps) {
  const formatCurrency = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#64748b" }}
          interval={0}
          angle={-35}
          textAnchor="end"
          height={45}
        />
        <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={formatCurrency} width={50} />
        <Tooltip
          formatter={(value: number, name: string) => [formatCurrency(value), name]}
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} iconSize={10} />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#5ad196"
          strokeWidth={2}
          dot={{ fill: "#5ad196", r: 2 }}
        />
        <Line
          type="monotone"
          dataKey="cost"
          name="Cost"
          stroke="#06113e"
          strokeWidth={2}
          dot={{ fill: "#06113e", r: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface OutletMarginBarProps {
  data: Array<{
    name: string;
    costPct: number;
    goalPct: number;
  }>;
}

export function OutletMarginBar({ data }: OutletMarginBarProps) {
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
            fontSize: "12px",
          }}
        />
        <Bar dataKey="costPct" name="Cost %" radius={[0, 4, 4, 0]} barSize={16}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.costPct > entry.goalPct ? "#ef4444" : "#5ad196"}
            />
          ))}
        </Bar>
        {data.length > 0 && (
          <ReferenceLine
            x={data[0]?.goalPct ?? 25}
            stroke="#06113e"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{ value: "Goal", position: "top", fontSize: 10, fill: "#06113e" }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
