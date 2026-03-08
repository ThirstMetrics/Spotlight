"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuthToken } from "@/lib/hooks/use-auth";

/**
 * Client hook that fetches the unread alert count for the header badge.
 * Polls every 60 seconds.
 */
export function useAlertCount() {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch("/api/alerts/count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setCount(body.data.count);
        }
      }
    } catch {
      // Silently ignore fetch errors for the badge
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  return { count, refresh: fetchCount };
}
