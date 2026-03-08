"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/hooks/use-auth";
import { useMessageCount } from "@/lib/hooks/use-message-count";
import {
  LayoutDashboard,
  Store,
  ClipboardCheck,
  Package,
  Truck,
  DollarSign,
  ChefHat,
  BookOpen,
  Users,
  Building2,
  Map,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/overview", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/outlets", label: "Outlets", icon: Store },
      { href: "/compliance", label: "Compliance", icon: ClipboardCheck },
      { href: "/inventory", label: "Inventory & Alerts", icon: Package },
      { href: "/direct", label: "Direct Orders", icon: Truck },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/margins", label: "Margins", icon: DollarSign },
      { href: "/recipes", label: "Recipes", icon: ChefHat },
      { href: "/catalog", label: "Catalog", icon: BookOpen },
    ],
  },
  {
    label: "Partners",
    items: [
      { href: "/partners/distributors", label: "Distributors", icon: Users },
      { href: "/partners/suppliers", label: "Suppliers", icon: Building2 },
      { href: "/map", label: "Map View", icon: Map },
    ],
  },
  {
    label: "Communication",
    items: [
      { href: "/messages", label: "Messages", icon: MessageSquare },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin", label: "Admin", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const unreadMessageCount = useMessageCount();

  const displayName = user?.name ?? "User";
  const displayRole = user?.role ?? "Director";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      style={{
        backgroundColor: "var(--color-sidebar)",
        color: "var(--color-sidebar-foreground)",
      }}
    >
      {/* Header */}
      <div
        className="flex h-16 items-center justify-between px-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        {!collapsed && (
          <Link href="/overview" className="flex items-center gap-2 min-w-0">
            <Image
              src={theme.logo.horizontal}
              alt={theme.label}
              width={140}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
        )}
        {collapsed && (
          <Link href="/overview" className="mx-auto">
            <Image
              src={theme.logo.icon}
              alt={theme.label}
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              priority
            />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 hover:bg-white/10"
          style={{ color: "var(--color-sidebar-foreground)" }}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Property Info */}
      {!collapsed && (
        <div
          className="px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        >
          <p className="text-xs opacity-60">Property</p>
          <p className="text-sm font-medium truncate">Resorts World Las Vegas</p>
          <p className="text-xs opacity-60 capitalize">{displayRole}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-2">
            {!collapsed && (
              <p className="px-4 py-1 text-xs font-medium uppercase tracking-wider opacity-50">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              const isMessagesLink = item.href === "/messages";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm transition-colors relative",
                    isActive
                      ? "font-medium border-r-2"
                      : "opacity-70 hover:opacity-100",
                    collapsed && "justify-center px-2"
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: "var(--color-sidebar-active)",
                          color: "var(--color-accent, #5ad196)",
                          borderColor: "var(--color-accent, #5ad196)",
                        }
                      : undefined
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && isMessagesLink && unreadMessageCount > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium">
                      {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                    </span>
                  )}
                  {collapsed && isMessagesLink && unreadMessageCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium translate-x-2 -translate-y-2">
                      {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-medium">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs opacity-60 capitalize">{displayRole}</p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-white/10"
              style={{ color: "var(--color-sidebar-foreground)" }}
              onClick={logout}
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
