"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/hooks/use-auth";

/**
 * Restores the authenticated user from localStorage on page load/refresh.
 * Without this, the zustand store resets to null on every navigation.
 */
export function AuthInitializer() {
  const { user, checkAuth } = useAuth();

  useEffect(() => {
    if (!user) {
      checkAuth();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
