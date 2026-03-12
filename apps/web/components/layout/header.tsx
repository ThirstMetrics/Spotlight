"use client";

import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "./breadcrumb";
import { useAlertCount } from "@/lib/hooks/use-alert-count";
import { useAuth, type AuthUser } from "@/lib/hooks/use-auth";
import { UserRoleType } from "@spotlight/shared";

const ROLE_LABELS: Record<string, string> = {
  VP: "VP",
  DIRECTOR: "Director",
  ADMIN: "Admin",
  ROOM_MANAGER: "Room Manager",
  DISTRIBUTOR: "Distributor",
  SUPPLIER: "Supplier",
};

function getRoleViewLabel(user: AuthUser | null): {
  label: string;
  org: string;
} {
  if (!user) return { label: "", org: "" };

  const roleName = ROLE_LABELS[user.role] ?? user.role;

  if (user.role === UserRoleType.DISTRIBUTOR) {
    return {
      label: "Distributor View",
      org: user.distributorName ?? "Distributor",
    };
  }
  if (user.role === UserRoleType.SUPPLIER) {
    return {
      label: "Supplier View",
      org: user.supplierName ?? "Supplier",
    };
  }

  return {
    label: `${roleName} View`,
    org: "Resorts World Las Vegas",
  };
}

export function Header() {
  const { count } = useAlertCount();
  const { user } = useAuth();
  const viewInfo = getRoleViewLabel(user);

  return (
    <div>
      {/* Role Indicator Banner */}
      <div
        className="flex items-center justify-between px-6 py-1.5 text-xs"
        style={{ backgroundColor: "#06113e", color: "rgba(255,255,255,0.9)" }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-wide" style={{ color: "#5ad196" }}>
            SPOTLIGHT
          </span>
          <span className="opacity-40">|</span>
          <span>{viewInfo.org}</span>
          <span className="opacity-40">|</span>
          <span className="font-medium">{viewInfo.label}</span>
        </div>
        {user && (
          <span className="opacity-60">
            {user.name}
          </span>
        )}
      </div>

      {/* Main Header */}
      <header className="flex h-16 items-center justify-between border-b bg-card px-6">
        <Breadcrumb />

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products, outlets..."
              className="w-64 pl-9"
            />
          </div>

          <Link href="/admin/alerts/feed">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {count > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                >
                  {count > 99 ? "99+" : count}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </header>
    </div>
  );
}
