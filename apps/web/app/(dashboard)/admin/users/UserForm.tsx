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

interface UserFormProps {
  outlets: { id: string; name: string }[];
  distributors: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
}

const ROLES = [
  { value: "DIRECTOR", label: "Director" },
  { value: "ADMIN", label: "Admin" },
  { value: "ROOM_MANAGER", label: "Room Manager" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "SUPPLIER", label: "Supplier" },
];

export function UserForm({ outlets, distributors, suppliers }: UserFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [outletId, setOutletId] = useState("");
  const [distributorId, setDistributorId] = useState("");
  const [supplierId, setSupplierId] = useState("");

  function resetForm() {
    setName("");
    setEmail("");
    setRole("ADMIN");
    setOutletId("");
    setDistributorId("");
    setSupplierId("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const body: Record<string, string> = { name, email, role };

    if (role === "ROOM_MANAGER" && outletId) {
      body.outletId = outletId;
    }
    if (role === "DISTRIBUTOR" && distributorId) {
      body.distributorId = distributorId;
    }
    if (role === "SUPPLIER" && supplierId) {
      body.supplierId = supplierId;
    }

    const res = await apiClient("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error ?? "Failed to create user");
      return;
    }

    resetForm();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-[#06113e] text-white hover:bg-[#06113e]/90">
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. Default password is &quot;spotlight123&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>

            {/* Role */}
            <div className="grid gap-2">
              <Label htmlFor="user-role">Role</Label>
              <select
                id="user-role"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setOutletId("");
                  setDistributorId("");
                  setSupplierId("");
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Conditional scope fields */}
            {role === "ROOM_MANAGER" && (
              <div className="grid gap-2">
                <Label htmlFor="user-outlet">Outlet</Label>
                <select
                  id="user-outlet"
                  value={outletId}
                  onChange={(e) => setOutletId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select an outlet...</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {role === "DISTRIBUTOR" && (
              <div className="grid gap-2">
                <Label htmlFor="user-distributor">Distributor</Label>
                <select
                  id="user-distributor"
                  value={distributorId}
                  onChange={(e) => setDistributorId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select a distributor...</option>
                  {distributors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {role === "SUPPLIER" && (
              <div className="grid gap-2">
                <Label htmlFor="user-supplier">Supplier</Label>
                <select
                  id="user-supplier"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select a supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Error message */}
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#06113e] text-white hover:bg-[#06113e]/90"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
