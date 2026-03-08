"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { notify } from "@/lib/hooks/use-notify";
import { AlertCircle, Loader2 } from "lucide-react";

interface Message {
  id: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    name: string;
    email: string;
  };
  outlet: {
    name: string;
    slug: string;
  } | null;
}

interface MessageListResponse {
  data: Message[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function getPriorityBadge(subject: string) {
  const upperSubject = subject.toUpperCase();
  if (upperSubject.includes("URGENT")) {
    return <Badge className="bg-red-500 text-white text-xs">URGENT</Badge>;
  } else if (upperSubject.includes("HIGH")) {
    return <Badge className="bg-amber-500 text-white text-xs">HIGH</Badge>;
  } else if (upperSubject.includes("LOW")) {
    return <Badge variant="secondary" className="text-xs">LOW</Badge>;
  }
  return <Badge variant="outline" className="text-xs">NORMAL</Badge>;
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return then.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageList() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await apiClient<MessageListResponse>("/api/messages");
      if (res.success && res.data) {
        setMessages(res.data.data);
        setUnreadCount(res.data.data.filter((m) => !m.isRead).length);
        setError(null);
      } else {
        setError(res.error ?? "Failed to fetch messages");
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setError("Network error while fetching messages");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Polling every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const markAsRead = async (id: string) => {
    const res = await apiClient("/api/messages", {
      method: "PATCH",
      body: JSON.stringify({ messageId: id }),
    });

    if (res.success) {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isRead: true } : m))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } else {
      notify.error(res.error ?? "Failed to mark message as read");
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Messages</CardTitle>
            <CardDescription>
              {loading ? (
                "Loading messages..."
              ) : messages.length > 0 ? (
                <>
                  {messages.length} messages — {unreadCount} unread{" "}
                  <span className="text-xs text-gray-400">(polling every 30s)</span>
                </>
              ) : (
                "No messages yet"
              )}
            </CardDescription>
          </div>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
        </div>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No messages yet. Directors and room managers can send flash messages
            through this system.
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  toggleExpanded(msg.id);
                  if (!msg.isRead) {
                    markAsRead(msg.id);
                  }
                }}
                className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                  !msg.isRead
                    ? "bg-blue-50/30 border-blue-200 hover:bg-blue-50/50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!msg.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                      <span className="text-sm font-medium text-[#06113e]">
                        {msg.subject}
                      </span>
                    </div>
                    <p className={`text-sm ${!msg.isRead ? "text-gray-700" : "text-muted-foreground"}`}>
                      {expandedIds.has(msg.id) ? msg.body : msg.body.split('\n')[0]}
                    </p>
                    {!expandedIds.has(msg.id) && msg.body.length > 60 && (
                      <p className="text-xs text-gray-400 mt-1">Click to expand...</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {getPriorityBadge(msg.subject)}
                  </div>
                </div>

                {/* Expanded body */}
                {expandedIds.has(msg.id) && (
                  <div className="mt-3 pt-3 border-t text-sm text-gray-700 whitespace-pre-wrap">
                    {msg.body}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>From: {msg.sender.name}</span>
                  {msg.outlet && (
                    <Badge variant="secondary" className="text-xs">
                      {msg.outlet.name}
                    </Badge>
                  )}
                  <span className="ml-auto">{formatTimeAgo(msg.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
