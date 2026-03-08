"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { notify } from "@/lib/hooks/use-notify";
import { Upload, FileUp, CheckCircle, XCircle, Loader2 } from "lucide-react";

const UPLOAD_TYPES = [
  { value: "warehouse_transfer", label: "Warehouse Transfer" },
  { value: "direct_order", label: "Direct Order" },
  { value: "sales_data", label: "Sales Data" },
  { value: "distributor_chart", label: "Distributor Chart" },
];

const SOURCES = [
  { value: "birchstreet", label: "BirchStreet" },
  { value: "stratton_warren", label: "Stratton Warren" },
  { value: "oracle", label: "Oracle" },
  { value: "micros", label: "Micros" },
  { value: "agilysys", label: "Agilysys" },
  { value: "toast", label: "Toast POS" },
  { value: "other", label: "Other" },
];

const ACCEPTED_TYPES = ".csv,.xlsx,.xls";

type UploadState = "idle" | "uploading" | "success" | "error";

interface UploadResult {
  uploadId: string;
  status: string;
  recordsProcessed: number;
  recordsFailed: number;
}

export function FileUploader() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState(UPLOAD_TYPES[0].value);
  const [source, setSource] = useState(SOURCES[0].value);
  const [state, setState] = useState<UploadState>("idle");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext ?? "")) {
      notify.error("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      notify.error("File exceeds 50MB limit");
      return;
    }
    setFile(f);
    setState("idle");
    setResult(null);
    setErrorMsg("");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  async function handleUpload() {
    if (!file) return;

    setState("uploading");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadType", uploadType);
    formData.append("source", source);

    const res = await apiClient<UploadResult>("/api/uploads", {
      method: "POST",
      body: formData,
    });

    if (res.success && res.data) {
      setState("success");
      setResult(res.data);
      notify.success(
        `${res.data.recordsProcessed} records processed${res.data.recordsFailed > 0 ? `, ${res.data.recordsFailed} failed` : ""}`,
        "Upload Complete"
      );
      router.refresh();
    } else {
      setState("error");
      setErrorMsg(res.error ?? "Upload failed");
      notify.error(res.error ?? "Upload failed");
    }
  }

  function handleReset() {
    setFile(null);
    setState("idle");
    setResult(null);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => state !== "uploading" && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
          dragOver
            ? "border-[#5ad196] bg-[#5ad196]/5"
            : file
              ? "border-[#5ad196]/50 bg-[#5ad196]/5"
              : "border-gray-300 hover:border-[#5ad196]/50 hover:bg-gray-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {state === "uploading" ? (
          <>
            <Loader2 className="h-10 w-10 text-[#5ad196] animate-spin mb-2" />
            <p className="text-sm text-muted-foreground">Processing file...</p>
          </>
        ) : state === "success" && result ? (
          <>
            <CheckCircle className="h-10 w-10 text-[#5ad196] mb-2" />
            <p className="text-sm font-medium text-[#06113e]">Upload Complete</p>
            <p className="text-xs text-muted-foreground">
              {result.recordsProcessed} records processed
              {result.recordsFailed > 0 && (
                <span className="text-red-500"> · {result.recordsFailed} failed</span>
              )}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
            >
              Upload Another File
            </Button>
          </>
        ) : state === "error" ? (
          <>
            <XCircle className="h-10 w-10 text-red-500 mb-2" />
            <p className="text-sm font-medium text-red-600">Upload Failed</p>
            <p className="text-xs text-muted-foreground">{errorMsg}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
            >
              Try Again
            </Button>
          </>
        ) : file ? (
          <>
            <FileUp className="h-10 w-10 text-[#5ad196] mb-2" />
            <p className="text-sm font-medium text-[#06113e]">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(0)} KB · Click to change file
            </p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-[#06113e]">
              Drop your file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports CSV, XLSX, and XLS (max 50MB)
            </p>
          </>
        )}
      </div>

      {/* Controls */}
      {file && state !== "success" && (
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="uploadType">Upload Type</Label>
            <select
              id="uploadType"
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value)}
              className="rounded border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {UPLOAD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="source">Source System</Label>
            <select
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="rounded border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleUpload}
            disabled={state === "uploading"}
            className="bg-[#06113e] text-white hover:bg-[#06113e]/90"
          >
            {state === "uploading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload & Process
              </>
            )}
          </Button>

          <Button variant="outline" onClick={handleReset} disabled={state === "uploading"}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
