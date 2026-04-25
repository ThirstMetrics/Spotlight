export const dynamic = "force-dynamic";

import { getAdminOutlets, getOutletGroupOptions } from "@/lib/queries/admin";
import { getServerUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { OutletTable } from "./OutletTable";
import { OutletForm } from "./OutletForm";
import { Store, CheckCircle, XCircle, Layers } from "lucide-react";

export default async function AdminOutletsPage() {
  const user = await getServerUser();
  const orgId = user?.organizationId;
  const [outlets, groups] = await Promise.all([
    getAdminOutlets(orgId),
    getOutletGroupOptions(orgId),
  ]);

  const totalOutlets = outlets.length;
  const activeOutlets = outlets.filter((o) => o.isActive).length;
  const inactiveOutlets = totalOutlets - activeOutlets;
  const groupCount = groups.length;

  return (
    <div className="space-y-6">
      {/* Heading + action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#06113e]">Outlets</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage venues across your property
          </p>
        </div>
        <OutletForm groups={groups} />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Outlets"
          value={totalOutlets}
          icon={<Store className="h-5 w-5" />}
        />
        <MetricCard
          label="Active"
          value={activeOutlets}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <MetricCard
          label="Inactive"
          value={inactiveOutlets}
          icon={<XCircle className="h-5 w-5" />}
        />
        <MetricCard
          label="Outlet Groups"
          value={groupCount}
          icon={<Layers className="h-5 w-5" />}
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#06113e]">All Outlets</CardTitle>
        </CardHeader>
        <CardContent>
          <OutletTable data={outlets} />
        </CardContent>
      </Card>
    </div>
  );
}
