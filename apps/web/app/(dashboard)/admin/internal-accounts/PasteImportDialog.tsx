"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  ClipboardPaste,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Upload,
} from "lucide-react";

interface PasteImportDialogProps {
  outlets: { id: string; name: string }[];
}

// Type alias mapping — handles common user inputs
const TYPE_ALIASES: Record<string, string> = {
  pos: "POS",
  "pos id": "POS",
  "pos number": "POS",
  "cost center": "COST_CENTER",
  "cost centre": "COST_CENTER",
  costcenter: "COST_CENTER",
  cc: "COST_CENTER",
  "gl code": "GL_CODE",
  "gl": "GL_CODE",
  "general ledger": "GL_CODE",
  glcode: "GL_CODE",
  purchasing: "PURCHASING_SYSTEM",
  "purchasing system": "PURCHASING_SYSTEM",
  inventory: "INVENTORY_SYSTEM",
  "inventory system": "INVENTORY_SYSTEM",
  other: "OTHER",
};

interface ParsedRow {
  outletName: string;
  typeRaw: string;
  typeResolved: string | null;
  value: string;
  matchedOutlet: { id: string; name: string } | null;
  valid: boolean;
  error?: string;
}

type Step = "paste" | "preview" | "results";

interface ImportResults {
  created: number;
  updated: number;
  skipped: number;
}

export function PasteImportDialog({ outlets }: PasteImportDialogProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("paste");
  const [rawText, setRawText] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResults | null>(null);

  // Build outlet lookup map (lowercase name → outlet)
  const outletMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const o of outlets) {
      map.set(o.name.toLowerCase(), o);
    }
    return map;
  }, [outlets]);

  function resolveType(raw: string): string | null {
    const key = raw.trim().toLowerCase();
    return TYPE_ALIASES[key] ?? null;
  }

  function parseInput() {
    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const rows: ParsedRow[] = lines.map((line) => {
      // Split by tab first, then fall back to comma
      let parts: string[];
      if (line.includes("\t")) {
        parts = line.split("\t").map((p) => p.trim());
      } else {
        parts = line.split(",").map((p) => p.trim());
      }

      if (parts.length < 3) {
        return {
          outletName: parts[0] ?? "",
          typeRaw: parts[1] ?? "",
          value: "",
          typeResolved: null,
          matchedOutlet: null,
          valid: false,
          error: "Not enough columns (need: Outlet, Type, Number)",
        };
      }

      const [outletName, typeRaw, value] = parts;
      const matchedOutlet = outletMap.get(outletName.toLowerCase()) ?? null;
      const typeResolved = resolveType(typeRaw);

      const valid = !!matchedOutlet && !!typeResolved && !!value;
      let error: string | undefined;
      if (!matchedOutlet) error = "Outlet not found";
      else if (!typeResolved) error = `Unknown type: "${typeRaw}"`;
      else if (!value) error = "No tracking number";

      return {
        outletName,
        typeRaw,
        typeResolved,
        value,
        matchedOutlet,
        valid,
        error,
      };
    });

    setParsedRows(rows);
    setStep("preview");
  }

  async function handleImport() {
    const validRows = parsedRows.filter((r) => r.valid);
    if (validRows.length === 0) {
      notify.warning("No valid rows to import");
      return;
    }

    setImporting(true);

    const items = validRows.map((r) => ({
      outletId: r.matchedOutlet!.id,
      type: r.typeResolved!,
      value: r.value,
    }));

    const res = await apiClient("/api/admin/internal-accounts", {
      method: "POST",
      body: JSON.stringify({ items }),
    });

    if (res.success) {
      const data = res.data as { created: number; updated: number; total: number };
      const skipped = parsedRows.length - validRows.length;
      setResults({
        created: data.created,
        updated: data.updated,
        skipped,
      });
      setStep("results");
      router.refresh();
    } else {
      notify.error(res.error ?? "Import failed");
    }

    setImporting(false);
  }

  function handleClose() {
    setOpen(false);
    // Reset after animation completes
    setTimeout(() => {
      setStep("paste");
      setRawText("");
      setParsedRows([]);
      setResults(null);
    }, 200);
  }

  const validCount = parsedRows.filter((r) => r.valid).length;
  const errorCount = parsedRows.length - validCount;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button className="bg-[#06113e] text-white hover:bg-[#06113e]/90">
          <ClipboardPaste className="mr-2 h-4 w-4" />
          Paste List
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        {/* ── Step 1: Paste ── */}
        {step === "paste" && (
          <>
            <DialogHeader>
              <DialogTitle>Paste Tracking Numbers</DialogTitle>
              <DialogDescription>
                Paste a tab- or comma-separated list with three columns:{" "}
                <span className="font-medium">Outlet Name</span>,{" "}
                <span className="font-medium">Type</span>,{" "}
                <span className="font-medium">Tracking Number</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Wally's Wine & Spirits\tPOS\tPOS-1001\nCrossroads Kitchen\tCost Center\tCC-2001\nZouk Nightclub\tGL Code\tGL-8001`}
                rows={10}
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm focus:border-[#5ad196] focus:outline-none focus:ring-1 focus:ring-[#5ad196]"
              />
              <p className="text-xs text-muted-foreground">
                Supported types: POS, Cost Center, GL Code, Purchasing, Inventory, Other
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={parseInput}
                disabled={!rawText.trim()}
                className="bg-[#06113e] text-white hover:bg-[#06113e]/90"
              >
                Preview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step 2: Preview ── */}
        {step === "preview" && (
          <>
            <DialogHeader>
              <DialogTitle>Preview Import</DialogTitle>
              <DialogDescription>
                {validCount} valid row{validCount !== 1 ? "s" : ""} ready to
                import
                {errorCount > 0 &&
                  `, ${errorCount} row${errorCount !== 1 ? "s" : ""} with errors`}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-80 overflow-y-auto py-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-3 py-2 text-left font-medium text-gray-600 w-8"></th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">
                      Outlet
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">
                      Number
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b ${
                        row.valid ? "" : "bg-red-50/50"
                      }`}
                    >
                      <td className="px-3 py-2">
                        {row.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-[#5ad196]" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            row.matchedOutlet
                              ? "font-medium text-[#06113e]"
                              : "text-red-600"
                          }
                        >
                          {row.outletName}
                        </span>
                        {!row.matchedOutlet && (
                          <span className="ml-1 text-xs text-red-500">
                            (not found)
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {row.typeResolved ? (
                          <Badge variant="secondary" className="text-xs">
                            {row.typeRaw}
                          </Badge>
                        ) : (
                          <span className="text-red-600 text-xs">
                            {row.typeRaw || "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {row.value ? (
                          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">
                            {row.value}
                          </code>
                        ) : (
                          <span className="text-xs text-red-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("paste")}
                disabled={importing}
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={validCount === 0 || importing}
                className="bg-[#06113e] text-white hover:bg-[#06113e]/90"
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import {validCount} Row{validCount !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step 3: Results ── */}
        {step === "results" && results && (
          <>
            <DialogHeader>
              <DialogTitle>Import Complete</DialogTitle>
              <DialogDescription>
                Your tracking numbers have been processed.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-3 py-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
                <div className="text-2xl font-bold text-emerald-700">
                  {results.created}
                </div>
                <p className="text-xs text-emerald-600 mt-1">Saved</p>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {results.updated}
                </div>
                <p className="text-xs text-blue-600 mt-1">Updated</p>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {results.skipped}
                </div>
                <p className="text-xs text-gray-500 mt-1">Skipped</p>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleClose}
                className="bg-[#06113e] text-white hover:bg-[#06113e]/90"
              >
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
