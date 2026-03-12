import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/api/auth/login"];

// Pages that distributor/supplier users are NOT allowed to access
const INTERNAL_ONLY_PATHS = [
  "/compliance",
  "/inventory",
  "/direct",
  "/margins",
  "/recipes",
  "/catalog",
  "/analytics",
  "/admin",
];

/**
 * Decode JWT payload without verification (for edge middleware).
 * Full verification happens in server components / API routes.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths, static assets, and API routes (they do their own auth)
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/logos") ||
    pathname.startsWith("/favicon") ||
    (pathname.startsWith("/api") && !pathname.startsWith("/api/auth/login"))
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("spotlight_auth_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Enforce route-level access for partner roles
  const payload = decodeJwtPayload(token);
  if (payload) {
    const role = payload.role as string;

    if (role === "DISTRIBUTOR" || role === "SUPPLIER") {
      // Block access to internal-only pages
      if (INTERNAL_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.redirect(new URL("/overview", request.url));
      }

      // Distributor can't access /outlets directly
      if (pathname.startsWith("/outlets")) {
        return NextResponse.redirect(new URL("/overview", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logos/).*)"],
};
