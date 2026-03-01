// =============================================================================
// RBAC Utilities — Role-based access control, permission checks, scope filters
// =============================================================================

import { NextResponse } from "next/server";
import { UserRoleType } from "@spotlight/shared";
import { getAuthUser, type AuthUser } from "./auth";

// -----------------------------------------------------------------------------
// Permission Definitions
// -----------------------------------------------------------------------------

type Action = "read" | "create" | "update" | "delete";

/**
 * Map of resource names to allowed actions per role.
 *
 * VP / DIRECTOR  — full access to everything
 * ADMIN          — full access within their organization
 * ROOM_MANAGER   — read-only on their outlets, can create messages
 * DISTRIBUTOR    — read-only on their products
 * SUPPLIER       — read-only on their products across distributors
 */
const RolePermissions: Record<UserRoleType, Record<string, Action[]>> = {
  [UserRoleType.VP]: {
    outlets: ["read", "create", "update", "delete"],
    products: ["read", "create", "update", "delete"],
    mandates: ["read", "create", "update", "delete"],
    alerts: ["read", "create", "update", "delete"],
    orders: ["read", "create", "update", "delete"],
    margins: ["read", "create", "update", "delete"],
    reports: ["read", "create", "update", "delete"],
    messages: ["read", "create", "update", "delete"],
    uploads: ["read", "create", "update", "delete"],
    occupancy: ["read", "create", "update", "delete"],
    users: ["read", "create", "update", "delete"],
    recipes: ["read", "create", "update", "delete"],
    analytics: ["read", "create", "update", "delete"],
  },
  [UserRoleType.DIRECTOR]: {
    outlets: ["read", "create", "update", "delete"],
    products: ["read", "create", "update", "delete"],
    mandates: ["read", "create", "update", "delete"],
    alerts: ["read", "create", "update", "delete"],
    orders: ["read", "create", "update", "delete"],
    margins: ["read", "create", "update", "delete"],
    reports: ["read", "create", "update", "delete"],
    messages: ["read", "create", "update", "delete"],
    uploads: ["read", "create", "update", "delete"],
    occupancy: ["read", "create", "update", "delete"],
    users: ["read", "create", "update", "delete"],
    recipes: ["read", "create", "update", "delete"],
    analytics: ["read", "create", "update", "delete"],
  },
  [UserRoleType.ADMIN]: {
    outlets: ["read", "create", "update", "delete"],
    products: ["read", "create", "update", "delete"],
    mandates: ["read", "create", "update"],
    alerts: ["read", "update"],
    orders: ["read", "create", "update"],
    margins: ["read"],
    reports: ["read", "create"],
    messages: ["read", "create", "update"],
    uploads: ["read", "create"],
    occupancy: ["read", "create", "update"],
    users: ["read", "create", "update"],
    recipes: ["read", "create", "update", "delete"],
    analytics: ["read"],
  },
  [UserRoleType.ROOM_MANAGER]: {
    outlets: ["read"],
    products: ["read"],
    mandates: ["read"],
    alerts: ["read", "update"],
    orders: ["read"],
    margins: ["read"],
    reports: ["read"],
    messages: ["read", "create"],
    uploads: [],
    occupancy: ["read"],
    users: [],
    recipes: ["read"],
    analytics: [],
  },
  [UserRoleType.DISTRIBUTOR]: {
    outlets: ["read"],
    products: ["read"],
    mandates: [],
    alerts: [],
    orders: ["read"],
    margins: [],
    reports: ["read"],
    messages: ["read"],
    uploads: [],
    occupancy: [],
    users: [],
    recipes: [],
    analytics: [],
  },
  [UserRoleType.SUPPLIER]: {
    outlets: ["read"],
    products: ["read"],
    mandates: [],
    alerts: [],
    orders: ["read"],
    margins: [],
    reports: ["read"],
    messages: ["read"],
    uploads: [],
    occupancy: [],
    users: [],
    recipes: [],
    analytics: [],
  },
};

// -----------------------------------------------------------------------------
// Permission Checking
// -----------------------------------------------------------------------------

/**
 * Check whether the given user has permission to perform an action on a resource.
 *
 * @param user     - The authenticated user.
 * @param resource - The resource name (e.g. "outlets", "products").
 * @param action   - The CRUD action being attempted.
 * @returns `true` if permitted, `false` otherwise.
 */
export function checkPermission(
  user: AuthUser,
  resource: string,
  action: Action,
): boolean {
  const rolePerms = RolePermissions[user.role];
  if (!rolePerms) {
    return false;
  }

  const allowedActions = rolePerms[resource];
  if (!allowedActions) {
    return false;
  }

  return allowedActions.includes(action);
}

// -----------------------------------------------------------------------------
// Route Handler Wrappers
// -----------------------------------------------------------------------------

type RouteHandler = (
  request: Request,
  context: { user: AuthUser; params?: Record<string, string> },
) => Promise<NextResponse>;

/**
 * Wrap a route handler with authentication.
 * Returns 401 if no valid token is provided.
 */
export function withAuth(handler: RouteHandler) {
  return async (
    request: Request,
    routeContext?: { params?: Record<string, string> },
  ): Promise<NextResponse> => {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    return handler(request, {
      user,
      params: routeContext?.params,
    });
  };
}

/**
 * Wrap a route handler with both authentication and role checking.
 * Returns 401 if no valid token, 403 if role is insufficient.
 *
 * @param roles   - Array of roles that are allowed to access this handler.
 * @param handler - The underlying route handler.
 */
export function withRole(roles: UserRoleType[], handler: RouteHandler) {
  return withAuth(async (request, context) => {
    if (!roles.includes(context.user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    return handler(request, context);
  });
}

// -----------------------------------------------------------------------------
// Scope-Based Data Filtering
// -----------------------------------------------------------------------------

/**
 * Filter an array of data records based on the user's scope.
 *
 * The filter inspects the user's role and narrows data accordingly:
 * - VP / DIRECTOR: no filtering (sees everything).
 * - ADMIN: filters to records matching the user's organizationId.
 * - ROOM_MANAGER: filters to records matching the user's outlet IDs.
 * - DISTRIBUTOR: filters to records matching the user's distributorId.
 * - SUPPLIER: filters to records matching the user's supplierId.
 *
 * Records are expected to have optional `organizationId`, `outletId`,
 * `distributorId`, and/or `supplierId` fields.
 */
export function filterByScope<
  T extends Record<string, unknown>,
>(user: AuthUser, data: T[]): T[] {
  switch (user.role) {
    case UserRoleType.VP:
    case UserRoleType.DIRECTOR:
      // Full access — return everything.
      return data;

    case UserRoleType.ADMIN:
      if (!user.organizationId) return data;
      return data.filter(
        (record) => record.organizationId === user.organizationId,
      );

    case UserRoleType.ROOM_MANAGER:
      if (!user.outletIds || user.outletIds.length === 0) return [];
      return data.filter((record) =>
        user.outletIds!.includes(record.outletId as string),
      );

    case UserRoleType.DISTRIBUTOR:
      if (!user.distributorId) return [];
      return data.filter(
        (record) => record.distributorId === user.distributorId,
      );

    case UserRoleType.SUPPLIER:
      if (!user.supplierId) return [];
      return data.filter(
        (record) => record.supplierId === user.supplierId,
      );

    default:
      return [];
  }
}
