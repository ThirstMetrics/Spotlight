// =============================================================================
// Role & Permission Types
// =============================================================================

/**
 * User role types determining access level in the system.
 */
export enum UserRoleType {
  VP = 'VP',
  DIRECTOR = 'DIRECTOR',
  ADMIN = 'ADMIN',
  ROOM_MANAGER = 'ROOM_MANAGER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  SUPPLIER = 'SUPPLIER',
}

/**
 * Scope defining what entities a user role grants access to.
 */
export interface RoleScope {
  organizationId?: string;
  outletIds?: string[];
  distributorId?: string;
  supplierId?: string;
}

/**
 * Permission check payload used by the RBAC middleware.
 */
export interface PermissionCheck {
  userId: string;
  role: UserRoleType;
  scope: RoleScope;
  action: string;
  resource: string;
}
