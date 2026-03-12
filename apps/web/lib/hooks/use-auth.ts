"use client";

import { create } from "zustand";
import { UserRoleType } from "@spotlight/shared";

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

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const TOKEN_KEY = "spotlight_auth_token";

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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Login failed");
      }

      const { token, user } = result.data as { token: string; user: AuthUser };

      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, token);
      }

      set({ user, isLoading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      set({ user: null, isLoading: false, error: message });
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Best-effort cookie clear
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
    set({ user: null, isLoading: false, error: null });
    window.location.href = "/login";
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
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Token expired or invalid");
      }

      const { data } = await response.json();
      set({ user: data.user as AuthUser, isLoading: false, error: null });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, isLoading: false, error: null });
    }
  },
}));

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
