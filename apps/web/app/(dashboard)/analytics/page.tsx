export const dynamic = "force-dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  getAnalyticsOverview,
  getRecentSessions,
  getTopPages,
} from "@/lib/queries/analytics";
import { getServerUser } from "@/lib/auth";

export default async function AnalyticsPage() {
  const user = await getServerUser();
  const organizationId = user?.organizationId;

  const [overview, sessions, topPages] = await Promise.all([
    getAnalyticsOverview(organizationId),
    getRecentSessions(20, organizationId),
    getTopPages(10, organizationId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#06113e]">
          Portal Analytics
        </h1>
        <p className="text-muted-foreground">
          Track portal usage, login activity, and report engagement.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Active Sessions"
          value={overview.activeSessions}
          subtitle="Last 24 hours"
        />
        <MetricCard
          label="Logins This Week"
          value={overview.loginsThisWeek}
          subtitle="Last 7 days"
        />
        <MetricCard
          label="Page Views (30d)"
          value={overview.totalInteractions30d}
          subtitle="Total interactions"
        />
        <MetricCard
          label="Exports (30d)"
          value={overview.exportCount30d}
          subtitle="Reports downloaded"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Viewed Pages</CardTitle>
            <CardDescription>Top pages in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No page view data yet.
              </p>
            ) : (
              <div className="space-y-3">
                {topPages.map((page, i) => (
                  <div
                    key={page.pagePath}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-5">
                        {i + 1}.
                      </span>
                      <span className="text-sm font-mono text-[#06113e]">
                        {page.pagePath}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {page.views} views
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Logins</CardTitle>
            <CardDescription>
              Latest portal sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No login sessions recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 10).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#06113e]">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.user.email}
                        {session.user.userRoles[0] && (
                          <span className="ml-1 text-gray-400">
                            ({session.user.userRoles[0].role.name})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.loginAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.loginAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
