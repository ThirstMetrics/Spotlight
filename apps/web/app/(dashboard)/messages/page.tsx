export const dynamic = "force-dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { getMessageOverview, getMessages } from "@/lib/queries/messages";

export default async function MessagesPage() {
  const [overview, messages] = await Promise.all([
    getMessageOverview(),
    getMessages(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Messages
        </h1>
        <p className="text-muted-foreground">
          Flash messages between directors and outlet managers.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Total Messages"
          value={overview.total}
          subtitle="All time"
        />
        <MetricCard
          label="Unread"
          value={overview.unread}
          trend={overview.unread > 0 ? "up" : undefined}
          trendValue="pending review"
        />
        <MetricCard
          label="Sent This Week"
          value={overview.sentThisWeek}
          subtitle="Last 7 days"
        />
      </div>

      {/* Message List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Messages</CardTitle>
          <CardDescription>
            {messages.length > 0
              ? `${messages.length} messages — ${overview.unread} unread`
              : "No messages yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No messages yet. Directors and room managers can send flash
              messages through this system.
            </p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 rounded-lg border p-4 ${
                    !msg.isRead ? "bg-blue-50/30 border-blue-200" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!msg.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                      <span className="text-sm font-medium text-[#06113e]">
                        {msg.subject}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {msg.body}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>From: {msg.sender.name}</span>
                      {msg.outlet && (
                        <Badge variant="secondary" className="text-xs">
                          {msg.outlet.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(msg.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
