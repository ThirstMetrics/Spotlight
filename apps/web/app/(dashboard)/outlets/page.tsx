export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { getOutlets } from "@/lib/queries/outlets";

export default async function OutletsPage() {
  const outlets = await getOutlets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Outlets
        </h1>
        <p className="text-muted-foreground">
          View and manage all outlets across the property.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {outlets.map((outlet) => (
          <Link key={outlet.id} href={`/outlets/${outlet.slug}`}>
            <Card className="transition-all hover:shadow-md hover:border-[#5ad196]/40 h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-[#06113e]">
                    {outlet.name}
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px]">
                    {outlet.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {outlet.groupName}
                  {outlet.managerName ? ` — ${outlet.managerName}` : ""}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-[#06113e]">
                      {outlet.productCount}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Products</p>
                  </div>
                  <div>
                    <p
                      className={`text-lg font-bold ${
                        outlet.isOverGoal ? "text-red-600" : "text-[#5ad196]"
                      }`}
                    >
                      {outlet.costPct}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Cost % (goal: {outlet.goalPct}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#06113e]">
                      {outlet.compliancePct}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">Compliance</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {outlet.isOverGoal && (
                      <StatusBadge status="danger" label="Over Goal" />
                    )}
                    {outlet.compliancePct < 90 && (
                      <StatusBadge status="warning" label="Low Compliance" />
                    )}
                    {!outlet.isOverGoal && outlet.compliancePct >= 90 && (
                      <StatusBadge status="success" label="On Track" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">&rarr;</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
