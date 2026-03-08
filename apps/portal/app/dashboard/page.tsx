"use client";

import { useEffect, useState } from "react";
import { portalFetch, getStoredUser } from "@/lib/auth";

interface DashboardMetrics {
  totalVolume: number;
  totalRevenue: number;
  // Distributor-specific
  outletsServed?: number;
  productsCarried?: number;
  // Supplier-specific
  distributorCount?: number;
  outletsReached?: number;
}

interface RecentOrder {
  id: string;
  outletName: string;
  productName: string;
  productSku: string;
  category: string;
  distributorName?: string;
  quantity: number;
  totalCost: number;
  orderDate: string;
  orderType: string;
}

interface DashboardData {
  role: string;
  metrics: DashboardMetrics;
  recentOrders: RecentOrder[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = getStoredUser();

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await portalFetch("/api/dashboard");
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error || "Failed to load dashboard data");
          return;
        }
        setData(json.data);
      } catch {
        setError("Unable to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#06113e]">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Loading your data...</p>
        </div>
        {/* Skeleton cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse"
            >
              <div className="h-4 w-24 bg-gray-200 rounded mb-3"></div>
              <div className="h-8 w-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        {/* Skeleton table */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse">
          <div className="h-5 w-40 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 w-full bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#06113e]">Dashboard</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isDistributor = data.role === "DISTRIBUTOR";

  // Build metric cards based on role
  const metricCards = isDistributor
    ? [
        {
          label: "Total Order Volume",
          value: formatNumber(data.metrics.totalVolume),
          subtitle: "units ordered",
        },
        {
          label: "Total Revenue",
          value: formatCurrency(data.metrics.totalRevenue),
          subtitle: "all time",
        },
        {
          label: "Outlets Served",
          value: String(data.metrics.outletsServed ?? 0),
          subtitle: "active outlets",
        },
        {
          label: "Products Carried",
          value: String(data.metrics.productsCarried ?? 0),
          subtitle: "in catalog",
        },
      ]
    : [
        {
          label: "Total Order Volume",
          value: formatNumber(data.metrics.totalVolume),
          subtitle: "units ordered",
        },
        {
          label: "Total Revenue",
          value: formatCurrency(data.metrics.totalRevenue),
          subtitle: "all time",
        },
        {
          label: "Distributors",
          value: String(data.metrics.distributorCount ?? 0),
          subtitle: "carrying your products",
        },
        {
          label: "Outlets Reached",
          value: String(data.metrics.outletsReached ?? 0),
          subtitle: "across all distributors",
        },
      ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#06113e]">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {user?.name ?? "Partner"}. Here is your overview.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-[#06113e]">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-gray-400">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Recent orders table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-[#06113e]">
            Recent Orders
          </h2>
        </div>
        {data.recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">No orders found yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Outlet
                  </th>
                  {!isDistributor && (
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Distributor
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.productName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {order.productSku}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                      {order.outletName}
                    </td>
                    {!isDistributor && (
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                        {order.distributorName}
                      </td>
                    )}
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        {order.category}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatNumber(order.quantity)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(order.totalCost)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.orderDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
