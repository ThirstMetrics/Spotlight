export const dynamic = "force-dynamic";

import { MetricCard } from "@/components/dashboard/MetricCard";
import { getMessageOverview } from "@/lib/queries/messages";
import { getServerUser } from "@/lib/auth";
import { prisma } from "@spotlight/db";
import { MessageCompose } from "./MessageCompose";
import { MessageList } from "./MessageList";

export default async function MessagesPage() {
  const user = await getServerUser();
  const organizationId = user?.organizationId;

  const [overview, outlets] = await Promise.all([
    getMessageOverview(organizationId),
    prisma.outlet.findMany({
      where: {
        isActive: true,
        ...(organizationId ? { organizationId } : {}),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Messages
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Flash messages between directors and outlet managers.
          </p>
          <MessageCompose outlets={outlets} />
        </div>
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

      {/* Message List with Polling */}
      <MessageList />
    </div>
  );
}
