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

interface CostGoalRow {
  id: string;
  outletName: string;
  category: string | null;
  targetCostPercentage: number;
  effectiveDate: Date | string;
  createdBy: string;
}

interface CostGoalFormProps {
  outlets: { id: string; name: string }[];
  editGoal?: CostGoalRow;
}

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "BEER", label: "Beer" },
  { value: "WINE", label: "Wine" },
  { value: "SPIRITS", label: "Spirits" },
  { value: "SAKE", label: "Sake" },
  { value: "NON_ALCOHOLIC", label: "Non-Alcoholic" },
];

export function CostGoalForm({ outlets, editGoal }: CostGoalFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [outletId, setOutletId] = useState(editGoal?.outletName ? "" : "");
  const [category, setCategory] = useState(editGoal?.category ?? "");
  const [targetCostPercentage, setTargetCostPercentage] = useState(
    editGoal?.targetCostPercentage?.toString() ?? "",
  );
  const [effectiveDate, setEffectiveDate] = useState(
    editGoal?.effectiveDate
      ? new Date(editGoal.effectiveDate).toISOString().split("T")[0]
      : "",
  );
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!editGoal;

  async function handleSubmit() {
    if (!isEdit && !outletId) {
      notify.warning("Please select an outlet");
      return;
    }

    const pct = parseFloat(targetCostPercentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      notify.warning("Target percentage must be between 0 and 100");
      return;
    }

    if (!effectiveDate) {
      notify.warning("Effective date is required");
      return;
    }

    setSubmitting(true);

    const res = isEdit
      ? await apiClient("/api/admin/cost-goals", {
          method: "PATCH",
          body: JSON.stringify({
            id: editGoal.id,
            targetCostPercentage: pct,
            effectiveDate,
          }),
        })
      : await apiClient("/api/admin/cost-goals", {
          method: "POST",
          body: JSON.stringify({
            outletId,
            category: category || null,
            targetCostPercentage: pct,
            effectiveDate,
          }),
        });

    if (res.success) {
      notify.success(isEdit ? "Cost goal updated" : "Cost goal created");
      setOutletId("");
      setCategory("");
      setTargetCostPercentage("");
      setEffectiveDate("");
      setOpen(false);
      router.refresh();
    } else {
      notify.error(res.error ?? "Failed to save cost goal");
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#06113e] text-white hover:bg-[#06113e]/90">
          <Plus className="mr-2 h-4 w-4" />
          {isEdit ? "Edit Goal" : "New Goal"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Cost Goal" : "Create Cost Goal"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the target cost percentage or effective date."
              : "Set a cost percentage target for an outlet and optional category."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Outlet */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="goal-outlet">Outlet</Label>
              <select
                id="goal-outlet"
                value={outletId}
                onChange={(e) => setOutletId(e.target.value)}
                className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select outlet...</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="goal-category">Category (optional)</Label>
              <select
                id="goal-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Target % */}
          <div className="space-y-1.5">
            <Label htmlFor="goal-target">Target Cost %</Label>
            <Input
              id="goal-target"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="e.g. 22.5"
              value={targetCostPercentage}
              onChange={(e) => setTargetCostPercentage(e.target.value)}
            />
          </div>

          {/* Effective Date */}
          <div className="space-y-1.5">
            <Label htmlFor="goal-date">Effective Date</Label>
            <Input
              id="goal-date"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
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
              "Update Goal"
            ) : (
              "Create Goal"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
