// =============================================================================
// POST /api/auth/login — Authenticate user and return JWT
// =============================================================================

import { NextResponse } from "next/server";
import type { ApiResponse } from "@spotlight/shared";
import { UserRoleType } from "@spotlight/shared";

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRoleType;
    organizationId?: string;
    outletIds?: string[];
    distributorId?: string;
    supplierId?: string;
  };
}

/**
 * POST /api/auth/login
 *
 * Accepts email and password credentials, validates them against the database,
 * and returns a signed JWT along with the user profile.
 *
 * Full implementation will:
 * - Look up user by email in the database
 * - Verify password hash (bcrypt)
 * - Load the user's role and scope from user_roles table
 * - Sign a JWT with user claims (sub, email, name, role, scope)
 * - Record the login in portal_sessions for analytics
 * - Return the token and user payload
 */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<LoginResponse>>> {
  try {
    const body = (await request.json()) as LoginRequest;

    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      );
    }

    // TODO: Replace placeholder with real database lookup and password verification.
    const placeholderUser: LoginResponse = {
      token: "placeholder-jwt-token",
      user: {
        id: "usr_placeholder_001",
        email: body.email,
        name: "Demo User",
        role: UserRoleType.ADMIN,
        organizationId: "org_placeholder_001",
        outletIds: ["out_placeholder_001", "out_placeholder_002"],
      },
    };

    return NextResponse.json(
      { success: true, data: placeholderUser },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
