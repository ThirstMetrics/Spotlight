import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const recentSessions = [
  {
    user: "Southern Glazer's (Distributor)",
    action: "Viewed sales report",
    duration: "12 min",
    time: "1 hour ago",
  },
  {
    user: "Diageo (Supplier)",
    action: "Exported product placement data",
    duration: "8 min",
    time: "3 hours ago",
  },
  {
    user: "Republic National (Distributor)",
    action: "Downloaded volume report",
    duration: "5 min",
    time: "5 hours ago",
  },
  {
    user: "LVMH / Moet Hennessy (Supplier)",
    action: "Viewed outlet map",
    duration: "15 min",
    time: "1 day ago",
  },
  {
    user: "Bacardi Limited (Supplier)",
    action: "Viewed YoY comparison",
    duration: "10 min",
    time: "1 day ago",
  },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Portal Analytics
        </h1>
        <p className="text-muted-foreground">
          Track partner portal usage — who is logging in, what they are viewing,
          and export activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Logins This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +15% vs last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Reports Viewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Exports Downloaded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              Excel and CSV files
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Login Trends</CardTitle>
            <CardDescription>
              Partner portal login frequency over the past 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">
                Recharts line chart will render here
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Viewed Pages</CardTitle>
            <CardDescription>
              Top pages accessed by partner portal users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">
                Recharts horizontal bar chart will render here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest partner portal interactions and actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((session, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-3 font-medium">{session.user}</td>
                    <td className="px-4 py-3">{session.action}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="secondary">{session.duration}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {session.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
