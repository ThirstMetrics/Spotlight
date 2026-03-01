"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
  overview: "Overview",
  outlets: "Outlets",
  compliance: "Compliance",
  inventory: "Inventory & Alerts",
  margins: "Margins",
  partners: "Partners",
  distributors: "Distributors",
  suppliers: "Suppliers",
  catalog: "Catalog",
  recipes: "Recipes",
  direct: "Direct Orders",
  map: "Map View",
  messages: "Messages",
  analytics: "Analytics",
  admin: "Admin",
  uploads: "Data Uploads",
  alerts: "Alert Config",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname?.split("/").filter(Boolean) || [];

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/overview" className="hover:text-foreground">
        <Home className="h-4 w-4" />
      </Link>
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const label = routeLabels[segment] || segment;
        const isLast = index === segments.length - 1;

        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link href={href} className="hover:text-foreground">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
