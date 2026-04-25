export const dynamic = "force-dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getAdminOutletGroups } from "@/lib/queries/admin";
import { getServerUser } from "@/lib/auth";
import { OutletGroupTable } from "./OutletGroupTable";
import { OutletGroupForm } from "./OutletGroupForm";

export default async function OutletGroupsPage() {
  const user = await getServerUser();
  const groups = await getAdminOutletGroups(user?.organizationId);

  const totalGroups = groups.length;
  const totalOutletsAssigned = groups.reduce(
    (sum, g) => sum + g.outletCount,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Outlet Groups
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Segment outlets for reporting — fine dining, casual, poolside, etc.
          </p>
          <OutletGroupForm />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          label="Total Groups"
          value={totalGroups}
          subtitle="Defined segments"
        />
        <MetricCard
          label="Outlets Assigned"
          value={totalOutletsAssigned}
          subtitle="Across all groups"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Outlet Groups</CardTitle>
          <CardDescription>
            {totalGroups > 0
              ? `${totalGroups} group(s) — ${totalOutletsAssigned} outlet(s) assigned`
              : "No outlet groups defined yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OutletGroupTable data={groups} />
        </CardContent>
      </Card>
    </div>
  );
}
