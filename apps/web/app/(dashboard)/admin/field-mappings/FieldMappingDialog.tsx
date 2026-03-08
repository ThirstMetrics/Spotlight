"use client";

import { useState, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { notify } from "@/lib/hooks/use-notify";
import {
  Plus,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Tag,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCE_OPTIONS = [
  { value: "BIRCHSTREET", label: "BirchStreet" },
  { value: "STRATTON_WARREN", label: "Stratton Warren" },
  { value: "ORACLE", label: "Oracle" },
  { value: "MICROS", label: "Micros POS" },
  { value: "AGILYSYS", label: "Agilysys POS" },
  { value: "TOAST", label: "Toast POS" },
  { value: "OTHER", label: "Other / Custom" },
];

const UPLOAD_TYPE_OPTIONS = [
  { value: "WAREHOUSE_TRANSFER", label: "Warehouse Transfer" },
  { value: "DIRECT_ORDER", label: "Direct Order" },
  { value: "SALES_DATA", label: "Sales Data" },
  { value: "DISTRIBUTOR_CHART", label: "Distributor Chart" },
];

/**
 * Target schema fields available per upload type.
 * Mirrors the REQUIRED_FIELDS in the data-validator plus common optional fields.
 */
const TARGET_FIELDS_BY_TYPE: Record<string, { field: string; label: string; required: boolean }[]> = {
  WAREHOUSE_TRANSFER: [
    { field: "product_id", label: "Product ID / SKU", required: true },
    { field: "product_name", label: "Product Name", required: false },
    { field: "outlet_id", label: "Outlet ID / Cost Center", required: true },
    { field: "outlet_name", label: "Outlet Name", required: false },
    { field: "quantity", label: "Quantity", required: true },
    { field: "transfer_date", label: "Transfer Date", required: true },
    { field: "unit_cost", label: "Unit Cost", required: false },
    { field: "total_cost", label: "Total Cost", required: false },
    { field: "unit", label: "Unit of Measure", required: false },
    { field: "category", label: "Category", required: false },
    { field: "subcategory", label: "Subcategory", required: false },
    { field: "order_number", label: "Reference / PO Number", required: false },
    { field: "warehouse_name", label: "Warehouse Name", required: false },
    { field: "notes", label: "Notes", required: false },
  ],
  DIRECT_ORDER: [
    { field: "product_id", label: "Product ID / SKU", required: true },
    { field: "product_name", label: "Product Name", required: false },
    { field: "outlet_id", label: "Outlet ID / Cost Center", required: true },
    { field: "outlet_name", label: "Outlet Name", required: false },
    { field: "quantity", label: "Quantity", required: true },
    { field: "order_date", label: "Order Date", required: true },
    { field: "distributor_id", label: "Distributor ID", required: true },
    { field: "distributor_name", label: "Distributor Name", required: false },
    { field: "supplier_id", label: "Supplier ID", required: false },
    { field: "supplier_name", label: "Supplier Name", required: false },
    { field: "unit_cost", label: "Unit Cost", required: false },
    { field: "total_cost", label: "Total Cost", required: false },
    { field: "unit", label: "Unit of Measure", required: false },
    { field: "category", label: "Category", required: false },
    { field: "received_date", label: "Received Date", required: false },
    { field: "order_number", label: "Reference / PO Number", required: false },
  ],
  SALES_DATA: [
    { field: "product_id", label: "Product ID / Menu Item Number", required: true },
    { field: "product_name", label: "Product / Menu Item Name", required: false },
    { field: "outlet_id", label: "Outlet ID / Revenue Center", required: true },
    { field: "outlet_name", label: "Outlet / Revenue Center Name", required: false },
    { field: "quantity_sold", label: "Quantity Sold", required: true },
    { field: "revenue", label: "Net Revenue / Sales", required: true },
    { field: "sale_date", label: "Sale / Business Date", required: true },
    { field: "gross_revenue", label: "Gross Revenue", required: false },
    { field: "discount_amount", label: "Discount Amount", required: false },
    { field: "tax_amount", label: "Tax Amount", required: false },
    { field: "category", label: "Category / Major Group", required: false },
    { field: "subcategory", label: "Subcategory / Family Group", required: false },
    { field: "check_number", label: "Check Number", required: false },
    { field: "server_name", label: "Server Name", required: false },
    { field: "order_type", label: "Order Type", required: false },
  ],
  DISTRIBUTOR_CHART: [
    { field: "product_id", label: "Product ID / SKU", required: true },
    { field: "product_name", label: "Product Name", required: true },
    { field: "distributor_id", label: "Distributor ID", required: false },
    { field: "distributor_name", label: "Distributor Name", required: false },
    { field: "supplier_id", label: "Supplier ID", required: false },
    { field: "supplier_name", label: "Supplier Name", required: false },
    { field: "unit_cost", label: "Unit Cost", required: true },
    { field: "unit", label: "Unit of Measure", required: false },
    { field: "pack_size", label: "Pack Size", required: false },
    { field: "category", label: "Category", required: false },
    { field: "subcategory", label: "Subcategory", required: false },
    { field: "effective_date", label: "Effective Date", required: false },
  ],
};

// ---------------------------------------------------------------------------
// Suggestion engine (mirrors field-mapper.ts getSuggestedMappings logic)
// ---------------------------------------------------------------------------

function getSuggestion(
  header: string,
  targetFields: { field: string; label: string; required: boolean }[]
): string {
  const normalized = header.toLowerCase().trim().replace(/[\s_\-\.]+/g, "_");

  // Common alias map — source header substring → target field
  const ALIASES: [RegExp, string][] = [
    [/\b(item_?num|item_?no|sku|item_?code|stock_?code|item_?id|menu_?item_?num|mi_?num|mi_?no|plu)\b/, "product_id"],
    [/\b(item_?desc|item_?name|stock_?desc|description|product|menu_?item_?name|mi_?name|item_?description)\b/, "product_name"],
    [/\b(vendor_?num|vendor_?id|supplier_?code|dist_?id|distributor_?id|vendor_?code)\b/, "distributor_id"],
    [/\b(vendor|vendor_?name|supplier_?name|distributor_?name)\b/, "distributor_name"],
    [/\b(cost_?centre|cost_?center|outlet_?id|location_?code|rvc_?num|outlet_?code|dept_?id|ship_?to_?location_?code)\b/, "outlet_id"],
    [/\b(location|revenue_?center|rvc|outlet_?name|outlet|department|dept|ship_?to_?location)\b/, "outlet_name"],
    [/\b(qty|quantity|order_?qty|req_?qty|transfer_?qty|ordered_?quantity|shipped_?quantity)\b/, "quantity"],
    [/\b(qty_?sold|quantity_?sold|count|units_?sold)\b/, "quantity_sold"],
    [/\b(unit_?price|unit_?cost|cost_?price|cost|price|list_?price)\b/, "unit_cost"],
    [/\b(extended_?price|total_?cost|value|amount|total|extended)\b/, "total_cost"],
    [/\b(net_?sales|net_?revenue|sales_?amount|revenue|sales|net)\b/, "revenue"],
    [/\b(gross_?sales|gross_?amount|gross_?revenue|gross)\b/, "gross_revenue"],
    [/\b(discount|discount_?amount|discounts)\b/, "discount_amount"],
    [/\b(tax|tax_?amount)\b/, "tax_amount"],
    [/\b(po_?date|order_?date|req_?date|creation_?date|po_?date|created_?date|date)\b/, "order_date"],
    [/\b(transfer_?date|issue_?date|transaction_?date)\b/, "transfer_date"],
    [/\b(business_?date|sale_?date|trans_?date|transaction_?date)\b/, "sale_date"],
    [/\b(delivery_?date|received_?date|promised_?date)\b/, "received_date"],
    [/\b(uom|unit_?of_?measure|unit_?meas|unit)\b/, "unit"],
    [/\b(pack_?size|pack)\b/, "pack_size"],
    [/\b(major_?group|category|group|category_?segment1)\b/, "category"],
    [/\b(family_?group|sub_?category|sub_?dept|sub_?department|subcategory|category_?segment2)\b/, "subcategory"],
    [/\b(po_?num|po_?number|order_?num|order_?number|ref|reference|req_?no|req_?num|check_?num|check_?number|check)\b/, "order_number"],
    [/\b(warehouse|subinventory|warehouse_?name)\b/, "warehouse_name"],
    [/\b(server|cashier|server_?name)\b/, "server_name"],
    [/\b(order_?type|tender|tender_?type)\b/, "order_type"],
  ];

  for (const [pattern, targetField] of ALIASES) {
    if (pattern.test(normalized)) {
      const match = targetFields.find((t) => t.field === targetField);
      if (match) return targetField;
    }
  }

  // Fallback: substring match against field names and labels
  for (const { field, label } of targetFields) {
    const normalizedField = field.replace(/_/g, "_");
    const normalizedLabel = label.toLowerCase().replace(/[\s\/]+/g, "_");
    if (normalized === normalizedField || normalized.includes(normalizedField) || normalizedField.includes(normalized)) {
      return field;
    }
    if (normalizedLabel.includes(normalized) || normalized.includes(normalizedLabel)) {
      return field;
    }
  }

  return "";
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 1 | 2 | 3;

interface FieldMappingDialogProps {
  /** Called after a successful save so the parent can refresh */
  onSaved?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FieldMappingDialog({ onSaved }: FieldMappingDialogProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 state
  const [profileName, setProfileName] = useState("");
  const [source, setSource] = useState("");
  const [uploadType, setUploadType] = useState("");

  // Step 2 state — column header input
  const [headerInput, setHeaderInput] = useState("");
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [fileError, setFileError] = useState("");

  // Step 3 state — column-to-field mappings: { sourceColumn: targetField }
  const [mappings, setMappings] = useState<Record<string, string>>({});

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function resetAll() {
    setStep(1);
    setProfileName("");
    setSource("");
    setUploadType("");
    setHeaderInput("");
    setParsedHeaders([]);
    setFileError("");
    setMappings({});
  }

  function handleClose(val: boolean) {
    if (!val) {
      resetAll();
    }
    setOpen(val);
  }

  // Parse comma / tab / newline separated header text into individual column names
  function parseHeaderText(text: string): string[] {
    return text
      .split(/[\n\r,\t]+/)
      .map((h) => h.trim())
      .filter((h) => h.length > 0);
  }

  // Parse the first row of an uploaded CSV/TSV file as headers
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFileError("");
      const file = e.target.files?.[0];
      if (!file) return;

      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!["csv", "tsv", "txt"].includes(extension ?? "")) {
        setFileError("Please upload a CSV or TSV file to extract headers.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const firstLine = text.split(/[\n\r]+/)[0] ?? "";
        const delimiter = firstLine.includes("\t") ? "\t" : ",";
        const headers = firstLine
          .split(delimiter)
          .map((h) => h.trim().replace(/^["']|["']$/g, ""))
          .filter((h) => h.length > 0);

        if (headers.length === 0) {
          setFileError("Could not parse headers from the uploaded file.");
          return;
        }
        setParsedHeaders(headers);
        setHeaderInput(headers.join(", "));
      };
      reader.readAsText(file);
    },
    []
  );

  // Auto-apply suggestions to all headers
  function applyAutoSuggestions(headers: string[]) {
    const targetFields = TARGET_FIELDS_BY_TYPE[uploadType] ?? [];
    const newMappings: Record<string, string> = {};
    for (const header of headers) {
      const suggestion = getSuggestion(header, targetFields);
      if (suggestion) {
        newMappings[header] = suggestion;
      }
    }
    setMappings(newMappings);
  }

  // Move from Step 2 → Step 3
  function handleProceedToMapping() {
    const headers = parseHeaderText(headerInput);
    if (headers.length === 0) {
      setFileError("Please enter at least one column header before continuing.");
      return;
    }
    setParsedHeaders(headers);
    applyAutoSuggestions(headers);
    setStep(3);
  }

  // -------------------------------------------------------------------------
  // Step 1 validation and navigation
  // -------------------------------------------------------------------------

  function handleStep1Next() {
    if (!profileName.trim()) {
      notify.warning("Please enter a profile name");
      return;
    }
    if (!source) {
      notify.warning("Please select a source system");
      return;
    }
    if (!uploadType) {
      notify.warning("Please select an upload type");
      return;
    }
    setStep(2);
  }

  // -------------------------------------------------------------------------
  // Save
  // -------------------------------------------------------------------------

  async function handleSave() {
    const activeMapping: Record<string, string> = {};
    for (const [src, tgt] of Object.entries(mappings)) {
      if (tgt) activeMapping[src] = tgt;
    }

    if (Object.keys(activeMapping).length === 0) {
      notify.warning("Map at least one column before saving");
      return;
    }

    setSubmitting(true);

    const res = await apiClient<unknown>("/api/admin/field-mappings", {
      method: "POST",
      body: JSON.stringify({
        name: profileName.trim(),
        source,
        uploadType,
        mappings: activeMapping,
      }),
    });

    setSubmitting(false);

    if (res.success) {
      notify.success("Mapping profile saved", profileName.trim());
      setOpen(false);
      resetAll();
      onSaved?.();
      router.refresh();
    } else {
      notify.error(res.error ?? "Failed to save mapping profile");
    }
  }

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const targetFields = TARGET_FIELDS_BY_TYPE[uploadType] ?? [];
  const mappedCount = Object.values(mappings).filter(Boolean).length;
  const requiredFields = targetFields.filter((f) => f.required).map((f) => f.field);
  const missingRequired = requiredFields.filter(
    (rf) => !Object.values(mappings).includes(rf)
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="bg-[#06113e] text-white hover:bg-[#06113e]/90">
          <Plus className="mr-2 h-4 w-4" />
          New Mapping Profile
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="text-[#06113e]">New Field Mapping Profile</DialogTitle>
          <DialogDescription>
            Define how source file columns map to Spotlight schema fields. Saved profiles are
            applied automatically during future uploads from the same source.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  step === s
                    ? "bg-[#06113e] text-white"
                    : step > s
                    ? "bg-[#5ad196] text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              <span
                className={`text-xs ${
                  step === s ? "font-semibold text-[#06113e]" : "text-gray-400"
                }`}
              >
                {s === 1 ? "Profile details" : s === 2 ? "Column headers" : "Map fields"}
              </span>
              {s < 3 && <ArrowRight className="h-3 w-3 text-gray-300" />}
            </div>
          ))}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* STEP 1 — Profile name, source, upload type                          */}
        {/* ------------------------------------------------------------------ */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="fm-name">Profile Name</Label>
              <Input
                id="fm-name"
                placeholder='e.g. "BirchStreet Warehouse Transfer v2"'
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStep1Next()}
              />
              <p className="text-xs text-muted-foreground">
                Choose a descriptive name that identifies the source and format.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fm-source">Source System</Label>
              <select
                id="fm-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#06113e]/20"
              >
                <option value="">Select a source system...</option>
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fm-type">Upload Type</Label>
              <select
                id="fm-type"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#06113e]/20"
              >
                <option value="">Select an upload type...</option>
                {UPLOAD_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                This determines which target schema fields are available for mapping.
              </p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 2 — Paste column headers or upload sample file                */}
        {/* ------------------------------------------------------------------ */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              Provide the column headers from your source file. You can upload a sample
              CSV to extract them automatically, or paste them manually.
            </p>

            {/* File upload option */}
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-center hover:border-[#06113e]/30 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <Label
                htmlFor="fm-sample-file"
                className="cursor-pointer text-sm font-medium text-[#06113e] hover:underline"
              >
                Upload a sample CSV/TSV file
              </Label>
              <input
                id="fm-sample-file"
                type="file"
                accept=".csv,.tsv,.txt"
                className="sr-only"
                onChange={handleFileUpload}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only the first row (headers) will be read — no data is stored.
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-xs text-gray-400 uppercase tracking-wider">or paste headers</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fm-headers">Column Headers</Label>
              <textarea
                id="fm-headers"
                value={headerInput}
                onChange={(e) => setHeaderInput(e.target.value)}
                placeholder={"Item Number, Item Description, Vendor, Quantity, Unit Price, PO Date, Location Code..."}
                rows={4}
                className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#06113e]/20 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Separate headers with commas, tabs, or newlines. Copy from the first row of your source file.
              </p>
            </div>

            {fileError && (
              <p className="text-sm text-red-500">{fileError}</p>
            )}

            {parsedHeaders.length > 0 && (
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs font-medium text-gray-500 mb-1.5">
                  Detected {parsedHeaders.length} columns:
                </p>
                <div className="flex flex-wrap gap-1">
                  {parsedHeaders.map((h) => (
                    <Badge key={h} variant="secondary" className="text-xs font-mono">
                      {h}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 3 — Map source columns → target fields                        */}
        {/* ------------------------------------------------------------------ */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            {/* Summary row */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <div className="text-sm">
                <span className="font-semibold text-[#06113e]">{mappedCount}</span>
                <span className="text-gray-500"> of {parsedHeaders.length} columns mapped</span>
              </div>
              {missingRequired.length > 0 ? (
                <div className="text-xs text-amber-600">
                  Missing required: {missingRequired.join(", ")}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-[#5ad196]">
                  <CheckCircle2 className="h-3 w-3" />
                  All required fields covered
                </div>
              )}
            </div>

            {/* Column mapping rows */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {parsedHeaders.map((header) => (
                <div key={header} className="flex items-center gap-3">
                  {/* Source column name */}
                  <div className="w-2/5 shrink-0">
                    <code className="block truncate rounded bg-gray-100 px-2 py-1.5 text-xs font-mono text-gray-700">
                      {header}
                    </code>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="h-3 w-3 shrink-0 text-gray-300" />

                  {/* Target field selector */}
                  <select
                    value={mappings[header] ?? ""}
                    onChange={(e) =>
                      setMappings((prev) => ({ ...prev, [header]: e.target.value }))
                    }
                    className={`flex-1 rounded border px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#06113e]/30 ${
                      mappings[header]
                        ? "border-[#5ad196] bg-[#5ad196]/5"
                        : "border-gray-200 bg-white text-gray-400"
                    }`}
                  >
                    <option value="">— skip this column —</option>
                    {targetFields.map(({ field, label, required }) => (
                      <option key={field} value={field}>
                        {label}{required ? " *" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Fields marked with <span className="text-red-400 font-semibold">*</span> are required for successful import.
              Columns set to &quot;skip&quot; will be ignored during processing.
            </p>
          </div>
        )}

        {/* Footer actions */}
        <DialogFooter className="flex justify-between gap-2">
          <div>
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => (s - 1) as Step)}
                disabled={submitting}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={submitting}
            >
              Cancel
            </Button>

            {step === 1 && (
              <Button
                className="bg-[#06113e] text-white hover:bg-[#06113e]/90"
                onClick={handleStep1Next}
              >
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}

            {step === 2 && (
              <Button
                className="bg-[#06113e] text-white hover:bg-[#06113e]/90"
                onClick={handleProceedToMapping}
              >
                Map Fields
                <Tag className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step === 3 && (
              <Button
                className="bg-[#06113e] text-white hover:bg-[#06113e]/90"
                onClick={handleSave}
                disabled={submitting || mappedCount === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>Save Profile</>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
