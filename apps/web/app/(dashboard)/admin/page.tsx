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
      href: "#",
      count: overview.outletCount,
      countLabel: "active outlets",
    },
    {
      title: "Outlet Groups",
      description: "Segment outlets for reporting (fine dining, casual, etc.)",
      href: "#",
      count: overview.outletGroupCount,
      countLabel: "groups defined",
    },
    {
      title: "Cost Goals",
      description: "Set target cost percentages per outlet or category",
      href: "#",
      count: overview.costGoalCount,
      countLabel: "goals configured",
    },
    {
      title: "Users & Roles",
      description: "Manage user accounts and role assignments",
      href: "#",
      count: overview.userCount,
      countLabel: "active users",
    },
    {
      title: "Field Mappings",
      description: "Saved column mapping profiles for data imports",
      href: "#",
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
        {sections.map((section) => {
          const Wrapper = section.href !== "#" ? Link : "div";
          return (
            <Card
              key={section.title}
              className={
                section.href !== "#"
                  ? "hover:border-[#5ad196] transition-colors cursor-pointer"
                  : ""
              }
            >
              {section.href !== "#" ? (
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
              ) : (
                <>
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
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
