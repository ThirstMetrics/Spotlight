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

interface TrackingNumberFormProps {
  outlets: { id: string; name: string }[];
}

const TRACKING_TYPES = [
  { value: "POS", label: "POS ID" },
  { value: "COST_CENTER", label: "Cost Center" },
  { value: "GL_CODE", label: "GL Code" },
  { value: "PURCHASING_SYSTEM", label: "Purchasing System" },
  { value: "INVENTORY_SYSTEM", label: "Inventory System" },
  { value: "OTHER", label: "Other" },
];

export function TrackingNumberForm({ outlets }: TrackingNumberFormProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [outletId, setOutletId] = useState("");
  const [type, setType] = useState("POS");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setOutletId("");
    setType("POS");
    setValue("");
    setNotes("");
  }

  async function handleSubmit() {
    if (!outletId) {
      notify.warning("Please select an outlet");
      return;
    }
    if (!value.trim()) {
      notify.warning("Tracking number is required");
      return;
    }

    setSubmitting(true);

    const res = await apiClient("/api/admin/internal-accounts", {
      method: "POST",
      body: JSON.stringify({
        outletId,
        type,
        value: value.trim(),
        notes: notes.trim() || undefined,
      }),
    });

    if (res.success) {
      notify.success("Tracking number added");
      resetForm();
      setOpen(false);
      router.refresh();
    } else {
      notify.error(res.error ?? "Failed to add tracking number");
    }

    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-[#06113e] text-[#06113e] hover:bg-[#06113e]/5"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Tracking Number</DialogTitle>
          <DialogDescription>
            Assign an internal tracking number (POS ID, cost center, GL code,
            etc.) to an outlet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="tn-outlet">Outlet</Label>
            <select
              id="tn-outlet"
              value={outletId}
              onChange={(e) => setOutletId(e.target.value)}
              className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select an outlet...</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tn-type">Type</Label>
            <select
              id="tn-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {TRACKING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tn-value">Tracking Number</Label>
            <Input
              id="tn-value"
              placeholder="e.g. POS-1001, CC-5500, GL-8001"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tn-notes">Notes (optional)</Label>
            <Input
              id="tn-notes"
              placeholder="e.g. Main POS terminal"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
                Adding...
              </>
            ) : (
              "Add Account"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
