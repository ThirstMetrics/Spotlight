import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sampleMessages = [
  {
    from: "Director - F&B",
    to: "Carversteak",
    subject: "Wine list update for March event",
    preview: "Please review the updated wine selections for the upcoming...",
    time: "2 hours ago",
    unread: true,
  },
  {
    from: "Pool Bar & Grill",
    to: "Director - F&B",
    subject: "Corona stock running low",
    preview: "We are down to 3 cases of Corona Extra and need a reorder...",
    time: "5 hours ago",
    unread: true,
  },
  {
    from: "Director - F&B",
    to: "All Outlets",
    subject: "New mandate items effective March 1",
    preview: "Please note the following new mandate items have been added...",
    time: "1 day ago",
    unread: false,
  },
  {
    from: "Bar Zazu",
    to: "Director - F&B",
    subject: "Cocktail menu rotation proposal",
    preview: "Attached is our proposed spring cocktail menu with cost...",
    time: "2 days ago",
    unread: false,
  },
];

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Flash Messages</h1>
        <p className="text-muted-foreground">
          Direct communication between directors and outlet managers.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Messages requiring attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Sent This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              From all directors
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Threads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">
              Open conversations
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Message Inbox</CardTitle>
          <CardDescription>
            Recent flash messages between directors and outlet managers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sampleMessages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start justify-between rounded-lg border p-4 ${
                  message.unread ? "bg-accent/30" : ""
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{message.subject}</p>
                    {message.unread && (
                      <Badge variant="default">New</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {message.from} &rarr; {message.to}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {message.preview}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {message.time}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center rounded-md border border-dashed p-4">
            <p className="text-sm text-muted-foreground">
              Supabase Realtime messaging interface will render here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
