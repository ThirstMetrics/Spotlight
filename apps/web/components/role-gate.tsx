"use client";

// =============================================================================
// RoleGate — Conditionally render children based on user role
// =============================================================================

import React from "react";
import { UserRoleType } from "@spotlight/shared";
import { useAuth } from "@/lib/hooks/use-auth";

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface RoleGateProps {
  /** Roles that are permitted to see the children. */
  allowedRoles: UserRoleType[];
  /** Content to render when the user has one of the allowed roles. */
  children: React.ReactNode;
  /** Optional fallback content to render when the user is not allowed. */
  fallback?: React.ReactNode;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * RoleGate checks the current authenticated user's role against the provided
 * `allowedRoles` list. If the user's role is in the list, `children` are
 * rendered; otherwise the optional `fallback` is shown (defaults to nothing).
 *
 * Usage:
 * ```tsx
 * <RoleGate allowedRoles={[UserRoleType.VP, UserRoleType.DIRECTOR]}>
 *   <AdminPanel />
 * </RoleGate>
 * ```
 */
export function RoleGate({
  allowedRoles,
  children,
  fallback = null,
}: RoleGateProps) {
  const { user, isLoading } = useAuth();

  // While auth state is loading, render nothing to avoid flash of content.
  if (isLoading) {
    return null;
  }

  // No user logged in — show fallback.
  if (!user) {
    return <>{fallback}</>;
  }

  // Check if the user's role is in the allowed list.
  if (!allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
