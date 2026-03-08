export const dynamic = "force-dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getAdminCostGoals } from "@/lib/queries/admin";
import { prisma } from "@spotlight/db";
import { CostGoalTable } from "./CostGoalTable";
import { CostGoalForm } from "./CostGoalForm";

export default async function CostGoalsPage() {
  const [goals, outlets] = await Promise.all([
    getAdminCostGoals(),
    prisma.outlet.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalGoals = goals.length;

  const avgTarget =
    totalGoals > 0
      ? goals.reduce((sum, g) => sum + g.targetCostPercentage, 0) / totalGoals
      : 0;

  const uniqueOutletIds = new Set(goals.map((g) => g.outletId));
  const outletsCovered = uniqueOutletIds.size;
  const outletsMissing = outlets.length - outletsCovered;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Cost Goals
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Set target cost percentages per outlet or beverage category.
          </p>
          <CostGoalForm outlets={outlets} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Total Goals"
          value={totalGoals}
          subtitle="All configured"
        />
        <MetricCard
          label="Avg Target %"
          value={`${avgTarget.toFixed(1)}%`}
          subtitle="Across all goals"
        />
        <MetricCard
          label="Outlets Covered"
          value={outletsCovered}
          subtitle={`of ${outlets.length} active`}
        />
        <MetricCard
          label="Outlets Missing Goals"
          value={outletsMissing}
          trend={outletsMissing > 0 ? "down" : undefined}
          trendValue={outletsMissing > 0 ? "needs attention" : undefined}
          subtitle={outletsMissing === 0 ? "All covered" : undefined}
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Cost Goals</CardTitle>
          <CardDescription>
            {totalGoals > 0
              ? `${totalGoals} goal(s) across ${outletsCovered} outlet(s)`
              : "No cost goals configured yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CostGoalTable data={goals} />
        </CardContent>
      </Card>
    </div>
  );
}
