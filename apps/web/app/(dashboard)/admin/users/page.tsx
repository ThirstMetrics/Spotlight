export const dynamic = "force-dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getAdminUsers } from "@/lib/queries/admin";
import { prisma } from "@spotlight/db";
import { UsersTable } from "./UsersTable";
import { UserForm } from "./UserForm";

export default async function UsersPage() {
  const [users, outlets, distributors, suppliers] = await Promise.all([
    getAdminUsers(),
    prisma.outlet.findMany({
      select: { id: true, name: true },
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.distributor.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const directors = users.filter((u) => u.role === "DIRECTOR").length;
  const roomManagers = users.filter((u) => u.role === "ROOM_MANAGER").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Users & Roles
        </h1>
        <p className="text-muted-foreground">
          Manage user accounts and role assignments across the organization.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Users"
          value={totalUsers}
          subtitle="All registered accounts"
        />
        <MetricCard
          label="Active"
          value={activeUsers}
          subtitle={`${totalUsers - activeUsers} inactive`}
        />
        <MetricCard
          label="Directors"
          value={directors}
          subtitle="Full access users"
        />
        <MetricCard
          label="Room Managers"
          value={roomManagers}
          subtitle="Outlet-scoped users"
        />
      </div>

      {/* Users Table + Form */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">All Users</CardTitle>
            <CardDescription>
              User accounts with their assigned roles and access scopes
            </CardDescription>
          </div>
          <UserForm
            outlets={outlets}
            distributors={distributors}
            suppliers={suppliers}
          />
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No users configured. Use the Add User button to create the first
              account.
            </p>
          ) : (
            <UsersTable data={users} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
