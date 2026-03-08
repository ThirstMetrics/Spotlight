// =============================================================================
// Portal Client-Side Auth Utilities
// =============================================================================

const TOKEN_KEY = "spotlight_portal_token";
const USER_KEY = "spotlight_portal_user";

export interface PortalUser {
  id: string;
  email: string;
  name: string;
  role: string;
  distributorId?: string;
  supplierId?: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): PortalUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PortalUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: PortalUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Make an authenticated fetch request to portal API routes.
 * Automatically includes the Bearer token header.
 */
export async function portalFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}
