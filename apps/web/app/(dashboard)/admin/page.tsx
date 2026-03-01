import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const adminSections = [
  {
    title: "Data Uploads",
    description:
      "Upload purchasing, warehouse transfer, direct order, and sales data files.",
    href: "/admin/uploads",
    badge: "Import",
  },
  {
    title: "Alert Configuration",
    description:
      "Configure alert rules, thresholds, and per-SKU overrides.",
    href: "/admin/alerts",
    badge: "Rules",
  },
];

const configSections = [
  {
    title: "Outlets",
    description: "Manage outlet definitions, types, and groupings.",
    count: "10 outlets",
  },
  {
    title: "Outlet Groups",
    description: "Create and manage outlet segment groups for reporting.",
    count: "4 groups",
  },
  {
    title: "Cost Goals",
    description: "Set target cost percentages per outlet and segment.",
    count: "10 goals set",
  },
  {
    title: "Hotel Occupancy",
    description: "Daily people counts, hotel guests, and restaurant covers.",
    count: "365 days",
  },
  {
    title: "User Management",
    description: "Manage user accounts, roles, and access scopes.",
    count: "15 users",
  },
  {
    title: "Field Mappings",
    description: "Saved column mappings for data import sources.",
    count: "3 profiles",
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">
          Manage outlets, outlet groups, cost goals, hotel occupancy, and system
          configuration.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {adminSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <Badge variant="default">{section.badge}</Badge>
                </div>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm text-muted-foreground">
                  Open &rarr;
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>
            Core settings for outlets, goals, occupancy, and users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {configSections.map((section) => (
              <div key={section.title} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{section.title}</h3>
                  <Badge variant="secondary">{section.count}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {section.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
