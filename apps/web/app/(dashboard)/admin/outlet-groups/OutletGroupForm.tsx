"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Loader2 } from "lucide-react";

interface OutletGroupFormProps {
  editGroup?: { id: string; name: string };
}

export function OutletGroupForm({ editGroup }: OutletGroupFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(editGroup?.name ?? "");
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!editGroup;

  async function handleSubmit() {
    if (!name.trim()) {
      notify.warning("Group name is required");
      return;
    }

    setSubmitting(true);

    const res = isEdit
      ? await apiClient("/api/admin/outlet-groups", {
          method: "PATCH",
          body: JSON.stringify({ id: editGroup.id, name: name.trim() }),
        })
      : await apiClient("/api/admin/outlet-groups", {
          method: "POST",
          body: JSON.stringify({ name: name.trim() }),
        });

    if (res.success) {
      notify.success(
        isEdit ? "Outlet group updated" : "Outlet group created",
      );
      setName("");
      setOpen(false);
      router.refresh();
    } else {
      notify.error(res.error ?? "Failed to save outlet group");
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#06113e] text-white hover:bg-[#06113e]/90">
          <Plus className="mr-2 h-4 w-4" />
          {isEdit ? "Edit Group" : "New Group"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Outlet Group" : "Create Outlet Group"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the name of this outlet group."
              : "Create a new segment to group outlets for reporting."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="e.g. Fine Dining, Casual, Poolside"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#06113e] text-white hover:bg-[#06113e]/90"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              "Update Group"
            ) : (
              "Create Group"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
