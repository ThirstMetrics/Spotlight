"use client";

// =============================================================================
// useAuth — Zustand-based authentication state hook
// =============================================================================

import { create } from "zustand";
import { UserRoleType } from "@spotlight/shared";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Client-side representation of the authenticated user.
 * Mirrors the server-side AuthUser but lives in the Zustand store.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRoleType;
  organizationId?: string;
  outletIds?: string[];
  distributorId?: string;
  supplierId?: string;
}

interface AuthState {
  /** The currently authenticated user, or null if not logged in. */
  user: AuthUser | null;
  /** Whether an auth check or login attempt is in progress. */
  isLoading: boolean;
  /** The most recent auth error message, if any. */
  error: string | null;
  /**
   * Attempt to log in with email and password.
   * On success, sets `user` and persists the token.
   */
  login: (email: string, password: string) => Promise<void>;
  /** Log out the current user and clear persisted token. */
  logout: () => void;
  /**
   * Check if a persisted session token exists and is still valid.
   * Typically called once on app mount.
   */
  checkAuth: () => Promise<void>;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const TOKEN_KEY = "spotlight_auth_token";

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Login failed");
      }

      const { data } = await response.json();
      const { token, user } = data as { token: string; user: AuthUser };

      // Persist the token for subsequent requests
      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, token);
      }

      set({ user, isLoading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      set({ user: null, isLoading: false, error: message });
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
    set({ user: null, isLoading: false, error: null });
  },

  checkAuth: async () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ user: null, isLoading: false });
      return;
    }

    set({ isLoading: true });

    try {
      // Validate the existing token by calling a lightweight auth endpoint.
      const response = await fetch("/api/auth/login", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Token expired or invalid");
      }

      const { data } = await response.json();
      set({ user: data.user as AuthUser, isLoading: false, error: null });
    } catch {
      // Token is invalid — clear it.
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, isLoading: false, error: null });
    }
  },
}));

// -----------------------------------------------------------------------------
// Utility — get token for use in fetch headers
// -----------------------------------------------------------------------------

/**
 * Retrieve the stored auth token for use in API requests.
 * Returns null if no token is stored.
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
