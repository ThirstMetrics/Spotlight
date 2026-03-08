"use client";

import { useEffect, useRef, useState } from "react";

interface OutletPin {
  id: string;
  name: string;
  slug: string;
  type: string;
  orderCount: number;
  salesCount: number;
  productCount: number;
  position: [number, number];
}

const OUTLET_TYPE_COLORS: Record<string, string> = {
  "Fine Dining": "#06113e",
  "Restaurant": "#1e40af",
  "Wine Bar": "#7c3aed",
  "Cocktail Bar": "#db2777",
  "Rooftop Bar": "#ea580c",
  "Food Hall": "#ca8a04",
  "Bar & Grill": "#16a34a",
  "Lounge": "#5ad196",
  "Nightlife": "#9333ea",
  "Pool": "#0891b2",
};

function getOutletColor(type: string): string {
  return OUTLET_TYPE_COLORS[type] ?? "#6b7280";
}

export default function OutletMap({ outlets }: { outlets: OutletPin[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Inject Leaflet CSS if not already present
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      link.integrity =
        "sha512-Zcn6bjR/8RZbLEpLIeOwNtzREBAJnUKESxces60Mpoj+2okopSAcSUIUOseddDm0cxnGQzxIR7vJgsLZbdLE3w==";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    // Dynamically import Leaflet (avoids SSR issues since Leaflet requires window)
    import("leaflet")
      .then((L) => {
        if (!mapRef.current) return;

        // Fix the default icon path issue that occurs with bundlers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        // Initialize map centered on Resorts World Las Vegas
        const map = L.map(mapRef.current, {
          center: [36.1372, -115.1689],
          zoom: 17,
          scrollWheelZoom: true,
        });

        mapInstanceRef.current = map;

        // Use OpenStreetMap tiles (free, no API key required)
        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }
        ).addTo(map);

        // Compute the max order count for relative sizing
        const maxOrders = Math.max(
          ...outlets.map((o) => o.orderCount),
          1
        );

        // Add circle markers for each outlet
        for (const outlet of outlets) {
          const color = getOutletColor(outlet.type);

          // Scale radius: min 8, max 20, based on relative order volume
          const radius = 8 + (outlet.orderCount / maxOrders) * 12;

          const circle = L.circleMarker(outlet.position, {
            radius,
            fillColor: color,
            color: "#06113e",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7,
          }).addTo(map);

          // Build popup HTML
          const popupContent = `
            <div style="min-width:200px;font-family:system-ui,-apple-system,sans-serif">
              <div style="font-weight:700;font-size:14px;color:#06113e;margin-bottom:2px">
                ${outlet.name}
              </div>
              <div style="color:#666;font-size:12px;margin-bottom:8px">
                ${outlet.type}
              </div>
              <hr style="margin:0 0 8px 0;border:none;border-top:1px solid #e5e7eb"/>
              <div style="font-size:12px;line-height:1.6">
                <div style="display:flex;justify-content:space-between">
                  <span style="color:#666">Orders</span>
                  <strong style="color:#06113e">${outlet.orderCount.toLocaleString()}</strong>
                </div>
                <div style="display:flex;justify-content:space-between">
                  <span style="color:#666">Products</span>
                  <strong style="color:#06113e">${outlet.productCount.toLocaleString()}</strong>
                </div>
                <div style="display:flex;justify-content:space-between">
                  <span style="color:#666">Sales Records</span>
                  <strong style="color:#06113e">${outlet.salesCount.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          `;

          circle.bindPopup(popupContent, {
            closeButton: true,
            className: "spotlight-popup",
          });

          // Add a text label below each marker
          const label = L.tooltip({
            permanent: true,
            direction: "bottom",
            offset: [0, radius + 2],
            className: "outlet-label",
          }).setContent(
            `<span style="font-size:10px;font-weight:600;color:#06113e;background:rgba(255,255,255,0.85);padding:1px 4px;border-radius:3px;white-space:nowrap">${outlet.name}</span>`
          );
          circle.bindTooltip(label);
        }

        // Fit map bounds to all markers with some padding
        if (outlets.length > 0) {
          const bounds = L.latLngBounds(
            outlets.map((o) => o.position)
          );
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
        }

        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load Leaflet:", err);
        setError(
          "Failed to load map library. Make sure the leaflet package is installed."
        );
        setIsLoading(false);
      });

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [outlets]);

  // Collect unique outlet types for the legend
  const uniqueTypes = Array.from(new Set(outlets.map((o) => o.type)));

  return (
    <div>
      {/* Map container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md border bg-gray-50">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#06113e]" />
              <p className="text-sm text-muted-foreground">
                Loading map...
              </p>
            </div>
          </div>
        )}
        {error && (
          <div className="flex h-[500px] items-center justify-center rounded-md border border-dashed border-red-300 bg-red-50">
            <div className="text-center">
              <p className="text-sm font-medium text-red-700">{error}</p>
              <p className="mt-1 text-xs text-red-500">
                Run: pnpm add leaflet @types/leaflet --filter @spotlight/web
              </p>
            </div>
          </div>
        )}
        <div
          ref={mapRef}
          className="h-[500px] rounded-md border"
          style={{ display: error ? "none" : "block" }}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Outlet Types:
        </span>
        {uniqueTypes.map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full border border-[#06113e]/30"
              style={{ backgroundColor: getOutletColor(type) }}
            />
            <span className="text-xs text-gray-700">{type}</span>
          </div>
        ))}
      </div>

      {/* Summary table below the map */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-[#06113e]">
          Outlet Summary
        </h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-2 text-left font-medium text-gray-600">
                  Outlet
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">
                  Type
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">
                  Orders
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">
                  Products
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">
                  Sales Records
                </th>
              </tr>
            </thead>
            <tbody>
              {outlets
                .sort((a, b) => b.orderCount - a.orderCount)
                .map((outlet) => (
                  <tr
                    key={outlet.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-2 font-medium text-[#06113e]">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: getOutletColor(outlet.type),
                          }}
                        />
                        {outlet.name}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{outlet.type}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {outlet.orderCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {outlet.productCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {outlet.salesCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
