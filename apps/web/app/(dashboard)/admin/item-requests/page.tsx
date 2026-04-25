"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getAuthToken } from "@/lib/hooks/use-auth";

interface SetupRequest {
  id: string;
  rwlvDescription: string;
  category: string;
  vendor: string;
  vendorProductNum: string;
  vendorDescription: string;
  vendorPack: string;
  mfg: string;
  mfgNum: string;
  storageType: string;
  caseSplittable: string;
  stockedStatus: string;
  leadTime: string;
  vendorCost: string;
  canSplitCase: string;
  orderBy: string;
  priceBy: string;
  status: string;
  reviewNote: string | null;
  createdAt: string;
  distributor: { name: string };
  submitter: { name: string; email: string };
  reviewer: { name: string } | null;
}

const STATUS_OPTIONS = ["ALL", "PENDING", "APPROVED", "REJECTED", "NEEDS_INFO"] as const;

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  NEEDS_INFO: "bg-blue-100 text-blue-800",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  NEEDS_INFO: "Needs Info",
};

export default function ItemRequestsPage() {
  const [requests, setRequests] = useState<SetupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch("/api/admin/item-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setRequests(json.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/admin/item-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status, reviewNote: reviewNote || null }),
      });
      const json = await res.json();
      if (json.success) {
        setExpandedId(null);
        setReviewNote("");
        fetchRequests();
      }
    } catch {
      // silently fail
    } finally {
      setUpdating(null);
    }
  };

  const filtered = requests.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.rwlvDescription.toLowerCase().includes(q) ||
        r.vendor.toLowerCase().includes(q) ||
        r.mfg.toLowerCase().includes(q) ||
        r.distributor.name.toLowerCase().includes(q) ||
        r.submitter.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#06113e]">Item Setup Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve new product setup requests from distributors.
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              {pendingCount} pending
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((s) => {
            const count = s === "ALL" ? requests.length : requests.filter((r) => r.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === s
                    ? "bg-[#06113e] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "ALL" ? "All" : STATUS_LABEL[s]} ({count})
              </button>
            );
          })}
        </div>
        <Input
          placeholder="Search requests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Requests list */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading requests...</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No item setup requests found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <Card key={req.id} className={expandedId === req.id ? "ring-2 ring-[#06113e]/20" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">{req.rwlvDescription}</CardTitle>
                      <Badge className={`text-[10px] ${STATUS_BADGE[req.status] ?? ""}`}>
                        {STATUS_LABEL[req.status] ?? req.status}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">
                      Submitted by {req.submitter.name} ({req.distributor.name}) on{" "}
                      {new Date(req.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </CardDescription>
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                    className="text-xs font-medium text-[#06113e] hover:underline ml-4 shrink-0"
                  >
                    {expandedId === req.id ? "Collapse" : "Review"}
                  </button>
                </div>
              </CardHeader>

              {/* Summary row always visible */}
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  <span><strong>Category:</strong> {req.category || "—"}</span>
                  <span><strong>Vendor:</strong> {req.vendor}</span>
                  <span><strong>Vendor #:</strong> {req.vendorProductNum || "—"}</span>
                  <span><strong>MFG:</strong> {req.mfg || "—"}</span>
                  <span><strong>Pack:</strong> {req.vendorPack || "—"}</span>
                  <span><strong>Cost:</strong> {req.vendorCost ? `$${req.vendorCost}` : "—"}</span>
                  <span><strong>Storage:</strong> {req.storageType}</span>
                  <span><strong>Stocked:</strong> {req.stockedStatus}</span>
                </div>

                {/* Expanded detail + action panel */}
                {expandedId === req.id && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    {/* Full RWLV detail grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 uppercase">RWLV Description</p>
                        <p>{req.rwlvDescription}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 uppercase">Category</p>
                        <p>{req.category || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 uppercase">Vendor</p>
                        <p>{req.vendor}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 uppercase">Vendor Product #</p>
                        <p>{req.vendorProductNum || "—"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] font-medium text-gray-500 uppercase">Vendor Description</p>
                        <p>{req.vendorDescription || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 uppercase">Vendor Pack</p>
                        <p>{req.vendorPack || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 uppercase">MFG</p>
                        <p>{req.mfg || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 uppercase">MFG #</p>
                        <p>{req.mfgNum || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 uppercase">Storage Type</p>
                        <p>{req.storageType}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 uppercase">Case Splittable</p>
                        <p>{req.caseSplittable}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 uppercase">Stocked Status</p>
                        <p>{req.stockedStatus}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 uppercase">Lead Time</p>
                        <p>{req.leadTime}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 uppercase">Vendor Cost</p>
                        <p>{req.vendorCost ? `$${req.vendorCost}` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 uppercase">Can Split Case</p>
                        <p>{req.canSplitCase}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 uppercase">Order By</p>
                        <p>{req.orderBy}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500 uppercase">Price By</p>
                        <p>{req.priceBy}</p>
                      </div>
                    </div>

                    {/* Previous review note */}
                    {req.reviewNote && (
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-[10px] font-medium text-gray-500 uppercase mb-1">Review Note</p>
                        <p className="text-sm">{req.reviewNote}</p>
                        {req.reviewer && (
                          <p className="text-xs text-muted-foreground mt-1">— {req.reviewer.name}</p>
                        )}
                      </div>
                    )}

                    {/* Action panel */}
                    <div className="rounded-md border p-4 bg-gray-50/50">
                      <p className="text-sm font-medium text-[#06113e] mb-2">Take Action</p>
                      <div className="mb-3">
                        <label className="text-xs text-gray-500">Review Note (optional)</label>
                        <Input
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          placeholder="Add a note for the distributor..."
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleAction(req.id, "APPROVED")}
                          disabled={updating === req.id}
                          className="px-4 py-2 text-sm font-medium text-white rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "NEEDS_INFO")}
                          disabled={updating === req.id}
                          className="px-4 py-2 text-sm font-medium text-white rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          Needs Info
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "REJECTED")}
                          disabled={updating === req.id}
                          className="px-4 py-2 text-sm font-medium text-white rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        {req.status !== "PENDING" && (
                          <button
                            onClick={() => handleAction(req.id, "PENDING")}
                            disabled={updating === req.id}
                            className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md border hover:bg-gray-100 disabled:opacity-50"
                          >
                            Reset to Pending
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
