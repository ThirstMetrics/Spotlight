"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

interface MessageCountResponse {
  data: Array<{ isRead: boolean }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useMessageCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      const res = await apiClient<MessageCountResponse>("/api/messages?pageSize=1");
      if (res.success && res.data) {
        const unread = res.data.data.filter((m) => !m.isRead).length;
        setUnreadCount(unread);
      }
    }

    fetchCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return unreadCount;
}
