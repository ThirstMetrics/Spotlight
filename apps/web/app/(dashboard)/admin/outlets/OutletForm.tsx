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

interface OutletRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  managerName: string | null;
  phone: string | null;
  isActive: boolean;
  groupName: string | null;
  orderCount: number;
}

interface OutletFormProps {
  groups: { id: string; name: string }[];
  editOutlet?: OutletRow;
}

const OUTLET_TYPES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "bar", label: "Bar" },
  { value: "lounge", label: "Lounge" },
  { value: "pool", label: "Pool" },
  { value: "nightclub", label: "Nightclub" },
  { value: "cafe", label: "Cafe" },
  { value: "other", label: "Other" },
];

export function OutletForm({ groups, editOutlet }: OutletFormProps) {
  const router = useRouter();
  const isEditing = !!editOutlet;

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(editOutlet?.name ?? "");
  const [type, setType] = useState(editOutlet?.type ?? "restaurant");
  const [outletGroupId, setOutletGroupId] = useState("");
  const [managerName, setManagerName] = useState(editOutlet?.managerName ?? "");
  const [phone, setPhone] = useState(editOutlet?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    if (!isEditing) {
      setName("");
      setType("restaurant");
      setOutletGroupId("");
      setManagerName("");
      setPhone("");
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      notify.warning("Outlet name is required");
      return;
    }

    setSubmitting(true);

    if (isEditing) {
      const res = await apiClient("/api/admin/outlets", {
        method: "PATCH",
        body: JSON.stringify({
          id: editOutlet.id,
          name: name.trim(),
          type,
          outletGroupId: outletGroupId || null,
          managerName: managerName.trim() || null,
          phone: phone.trim() || null,
        }),
      });

      if (res.success) {
        notify.success("Outlet updated successfully");
        setOpen(false);
        router.refresh();
      } else {
        notify.error(res.error ?? "Failed to update outlet");
      }
    } else {
      const res = await apiClient("/api/admin/outlets", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          type,
          outletGroupId: outletGroupId || undefined,
          managerName: managerName.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      });

      if (res.success) {
        notify.success("Outlet created successfully");
        resetForm();
        setOpen(false);
        router.refresh();
      } else {
        notify.error(res.error ?? "Failed to create outlet");
      }
    }

    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#06113e] text-white hover:bg-[#06113e]/90">
          <Plus className="mr-2 h-4 w-4" />
          {isEditing ? "Edit Outlet" : "Add Outlet"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Outlet" : "New Outlet"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the outlet details below."
              : "Add a new venue to your property."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="outlet-name">Name</Label>
            <Input
              id="outlet-name"
              placeholder="e.g. Pool Bar & Grill"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="outlet-type">Type</Label>
            <select
              id="outlet-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {OUTLET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {groups.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="outlet-group">Outlet Group (optional)</Label>
              <select
                id="outlet-group"
                value={outletGroupId}
                onChange={(e) => setOutletGroupId(e.target.value)}
                className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">No group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="outlet-manager">Manager Name (optional)</Label>
            <Input
              id="outlet-manager"
              placeholder="e.g. John Smith"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="outlet-phone">Phone (optional)</Label>
            <Input
              id="outlet-phone"
              placeholder="e.g. (702) 555-0123"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : isEditing ? (
              "Update Outlet"
            ) : (
              "Create Outlet"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
