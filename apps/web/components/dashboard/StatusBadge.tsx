"use client";

interface StatusBadgeProps {
  status: "success" | "warning" | "danger" | "info" | "new" | "neutral";
  label: string;
  size?: "sm" | "md";
}

const colorMap = {
  success: "bg-[#5ad196]/10 text-[#2e9961] border-[#5ad196]/30",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  new: "bg-[#5ad196] text-white border-[#5ad196]",
  neutral: "bg-gray-100 text-gray-600 border-gray-200",
};

export function StatusBadge({ status, label, size = "sm" }: StatusBadgeProps) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${colorMap[status]} ${sizeClass}`}>
      {label}
    </span>
  );
}
