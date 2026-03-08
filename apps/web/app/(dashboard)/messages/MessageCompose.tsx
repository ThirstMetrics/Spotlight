"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { notify } from "@/lib/hooks/use-notify";
import { MessageSquarePlus, Loader2 } from "lucide-react";

interface Outlet {
  id: string;
  name: string;
}

export function MessageCompose({ outlets }: { outlets: Outlet[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [outletId, setOutletId] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      notify.warning("Subject and message body are required");
      return;
    }

    setSending(true);
    const res = await apiClient("/api/messages", {
      method: "POST",
      body: JSON.stringify({
        subject: subject.trim(),
        body: body.trim(),
        outletId: outletId || undefined,
      }),
    });

    if (res.success) {
      notify.success("Message sent successfully");
      setSubject("");
      setBody("");
      setOutletId("");
      setOpen(false);
      router.refresh();
    } else {
      notify.error(res.error ?? "Failed to send message");
    }
    setSending(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#06113e] text-white hover:bg-[#06113e]/90">
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Compose Message
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Flash Message</DialogTitle>
          <DialogDescription>
            Send a message to outlet managers or your team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Message subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {outlets.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="outlet">Outlet (optional)</Label>
              <select
                id="outlet"
                value={outletId}
                onChange={(e) => setOutletId(e.target.value)}
                className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">All outlets</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Write your message..."
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending}
            className="bg-[#06113e] text-white hover:bg-[#06113e]/90"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Message"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
