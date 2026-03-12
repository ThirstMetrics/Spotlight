// =============================================================================
// Auth Utilities — JWT verification and user extraction
// =============================================================================

import { jwtVerify } from "jose";
import { UserRoleType } from "@spotlight/shared";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Authenticated user payload extracted from a verified JWT.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRoleType;
  organizationId?: string;
  organizationName?: string;
  outletIds?: string[];
  distributorId?: string;
  distributorName?: string;
  supplierId?: string;
  supplierName?: string;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Returns the JWT secret as a Uint8Array suitable for jose.
 * Throws if the environment variable is not set.
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not configured");
  }
  return new TextEncoder().encode(secret);
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Verify a raw JWT string and return the decoded AuthUser payload.
 *
 * @param token - The raw JWT bearer token (without "Bearer " prefix).
 * @returns The authenticated user, or `null` if the token is invalid / expired.
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    // Validate that required claims exist
    if (!payload.sub || !payload.email || !payload.role) {
      return null;
    }

    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: (payload.name as string) ?? "",
      role: payload.role as UserRoleType,
      organizationId: payload.organizationId as string | undefined,
      organizationName: payload.organizationName as string | undefined,
      outletIds: payload.outletIds as string[] | undefined,
      distributorId: payload.distributorId as string | undefined,
      distributorName: payload.distributorName as string | undefined,
      supplierId: payload.supplierId as string | undefined,
      supplierName: payload.supplierName as string | undefined,
    };
  } catch {
    // Token verification failed (expired, malformed, bad signature, etc.)
    return null;
  }
}

/**
 * Extract and verify the Bearer token from an incoming request's
 * Authorization header.
 *
 * @param request - The incoming Next.js / Web API Request object.
 * @returns The authenticated user, or `null` if no valid token is present.
 */
export async function getAuthUser(
  request: Request,
): Promise<AuthUser | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  const token = parts[1];
  return verifyToken(token);
}

/**
 * Get the authenticated user from the cookie in a Server Component.
 * Uses next/headers to read the httpOnly cookie set at login.
 *
 * @returns The authenticated user, or `null` if no valid token is present.
 */
export async function getServerUser(): Promise<AuthUser | null> {
  // Dynamic import to avoid breaking client bundles
  const { cookies } = await import("next/headers");
  const cookieStore = cookies();
  const token = cookieStore.get("spotlight_auth_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
