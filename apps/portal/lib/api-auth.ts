// =============================================================================
// Portal Server-Side Auth Utilities (for API routes)
// =============================================================================

import { jwtVerify } from "jose";
import type { PortalUser } from "./auth";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not configured");
  return new TextEncoder().encode(secret);
}

/**
 * Extract and verify the portal user from a request.
 * Checks Authorization header (Bearer token) and falls back to cookies.
 * Returns null if no valid token is found.
 */
export async function getPortalUser(
  request: Request
): Promise<PortalUser | null> {
  let token: string | null = null;

  // Try Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  // Fall back to cookie
  if (!token) {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(
        /(?:^|;\s*)spotlight_portal_token=([^;]+)/
      );
      if (match) {
        token = match[1];
      }
    }
  }

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
      distributorId: payload.distributorId as string | undefined,
      supplierId: payload.supplierId as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Helper to return a 401 JSON response.
 */
export function unauthorizedResponse() {
  return Response.json(
    { success: false, error: "Unauthorized" },
    { status: 401 }
  );
}
