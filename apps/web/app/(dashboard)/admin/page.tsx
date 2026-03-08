export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminOverview } from "@/lib/queries/admin";

export default async function AdminPage() {
  const overview = await getAdminOverview();

  const sections = [
    {
      title: "Data Uploads",
      description: "Upload and manage CSV/Excel data files",
      href: "/admin/uploads",
      count: overview.uploadCount,
      countLabel: "total uploads",
    },
    {
      title: "Alert Rules",
      description: "Configure alert thresholds and notification rules",
      href: "/admin/alerts",
      count: overview.alertRuleCount,
      countLabel: "active rules",
    },
    {
      title: "Outlets",
      description: "Manage outlet configurations and groupings",
      href: "/admin/outlets",
      count: overview.outletCount,
      countLabel: "active outlets",
    },
    {
      title: "Outlet Groups",
      description: "Segment outlets for reporting (fine dining, casual, etc.)",
      href: "/admin/outlet-groups",
      count: overview.outletGroupCount,
      countLabel: "groups defined",
    },
    {
      title: "Internal Accounts",
      description: "POS IDs, cost centers, GL codes, and tracking numbers per outlet",
      href: "/admin/internal-accounts",
      count: overview.trackingNumberCount,
      countLabel: "tracking numbers",
    },
    {
      title: "Cost Goals",
      description: "Set target cost percentages per outlet or category",
      href: "/admin/cost-goals",
      count: overview.costGoalCount,
      countLabel: "goals configured",
    },
    {
      title: "Users & Roles",
      description: "Manage user accounts and role assignments",
      href: "/admin/users",
      count: overview.userCount,
      countLabel: "active users",
    },
    {
      title: "Field Mappings",
      description: "Saved column mapping profiles for data imports",
      href: "/admin/field-mappings",
      count: overview.fieldMappingCount,
      countLabel: "saved profiles",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Admin Settings
        </h1>
        <p className="text-muted-foreground">
          Configure outlets, alert rules, cost goals, and system settings.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Card
            key={section.title}
            className="hover:border-[#5ad196] transition-colors cursor-pointer"
          >
            <Link href={section.href} className="block">
              <CardHeader>
                <CardTitle className="text-lg text-[#06113e]">
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#06113e]">
                  {section.count}
                </div>
                <p className="text-xs text-muted-foreground">
                  {section.countLabel}
                </p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
