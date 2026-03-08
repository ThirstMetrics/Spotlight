"use client";

import { useState } from "react";
import { portalFetch } from "@/lib/auth";

interface Report {
  id: "orders" | "products" | "volume";
  title: string;
  description: string;
  icon: React.ReactNode;
}

const REPORTS: Report[] = [
  {
    id: "orders",
    title: "Order History Export",
    description:
      "Download a full export of your order history, including dates, outlets, quantities, and costs.",
    icon: (
      <svg
        className="h-8 w-8 text-[#06113e]"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
        />
      </svg>
    ),
  },
  {
    id: "products",
    title: "Product Catalog",
    description:
      "Export your complete product catalog with SKUs, categories, sizes, and current pricing.",
    icon: (
      <svg
        className="h-8 w-8 text-[#06113e]"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
        />
      </svg>
    ),
  },
  {
    id: "volume",
    title: "Volume Summary",
    description:
      "Monthly and quarterly volume summaries broken down by outlet, category, and product.",
    icon: (
      <svg
        className="h-8 w-8 text-[#06113e]"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
        />
      </svg>
    ),
  },
];

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ReportsPage() {
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [format, setFormat] = useState<"csv" | "xlsx">("xlsx");
  const [loadingReport, setLoadingReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleDownload(reportId: "orders" | "products" | "volume") {
    setLoadingReport(reportId);
    setError(null);
    setSuccess(null);

    try {
      const params = new URLSearchParams({
        type: reportId,
        format,
      });

      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const res = await portalFetch(`/api/reports?${params.toString()}`);

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to generate report");
      }

      // Get the filename from Content-Disposition header
      const contentDisposition = res.headers.get("content-disposition") || "";
      const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      const fileName = fileNameMatch ? fileNameMatch[1] : `${reportId}.${format}`;

      // Download the file
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(`${reportId} report downloaded successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to download report";
      setError(message);
      console.error("Download error:", err);
    } finally {
      setLoadingReport(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#06113e]">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Download reports and data exports for your records.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Report cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {REPORTS.map((report) => (
          <div
            key={report.id}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col"
          >
            <div className="mb-4">{report.icon}</div>
            <h3 className="text-lg font-semibold text-[#06113e] mb-2">
              {report.title}
            </h3>
            <p className="text-sm text-gray-500 mb-6 flex-1">
              {report.description}
            </p>

            {/* Expandable options */}
            {expandedReport === report.id && (
              <div className="mb-4 space-y-3 pb-4 border-t border-gray-100 pt-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#06113e] focus:outline-none focus:ring-1 focus:ring-[#06113e]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded border border-gray-300 px-2.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#06113e] focus:outline-none focus:ring-1 focus:ring-[#06113e]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as "csv" | "xlsx")}
                    className="w-full rounded border border-gray-300 px-2.5 py-2 text-sm text-gray-900 focus:border-[#06113e] focus:outline-none focus:ring-1 focus:ring-[#06113e]"
                  >
                    <option value="xlsx">Excel (.xlsx)</option>
                    <option value="csv">CSV (.csv)</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setExpandedReport(
                    expandedReport === report.id ? null : report.id
                  )
                }
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {expandedReport === report.id ? "Hide" : "Options"}
              </button>
              <button
                onClick={() => handleDownload(report.id)}
                disabled={loadingReport === report.id}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#06113e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#06113e]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingReport === report.id ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                    Download
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info message */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-700">
          All exports are filtered to show only data for your organization. Date
          filters are optional.
        </p>
      </div>
    </div>
  );
}
