"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuthToken } from "@/lib/hooks/use-auth";
import { notify } from "@/lib/hooks/use-notify";
import { Download, Loader2, FileSpreadsheet, FileText } from "lucide-react";

interface ExportButtonProps {
  reportType: string;
  label?: string;
}

export function ExportButton({
  reportType,
  label = "Export",
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport(format: "XLSX" | "CSV") {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ format, reportType }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Export failed" }));
        notify.error(err.error ?? "Export failed");
        setLoading(false);
        return;
      }

      // Get the file as blob and trigger download
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const fileNameMatch = disposition?.match(/filename="?([^"]+)"?/);
      const fileName =
        fileNameMatch?.[1] ??
        `${reportType}_export.${format === "XLSX" ? "xlsx" : "csv"}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notify.success(`${fileName} downloaded`);
    } catch {
      notify.error("Export failed");
    }
    setLoading(false);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("XLSX")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("CSV")}>
          <FileText className="mr-2 h-4 w-4" />
          Export as CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
