"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const WarehouseScene = dynamic(
  () => import("@/components/warehouse-3d/warehouse-scene"),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[var(--background)]">
      <p className="text-[var(--muted-foreground)]">Loading 3D scene...</p>
    </div>
  )}
);

const Warehouse2D = dynamic(
  () => import("@/components/warehouse-2d/warehouse-2d"),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[var(--background)]">
      <p className="text-[var(--muted-foreground)]">Loading 2D view...</p>
    </div>
  )}
);

const LEGEND_ITEMS = [
  { color: "#ef4444", label: "A-class (fast movers)" },
  { color: "#eab308", label: "B-class" },
  { color: "#60a5fa", label: "C-class" },
  { color: "#3b82f6", label: "D-class (slow movers)" },
];

export default function WarehousePage() {
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");

  return (
    <div className="h-screen relative">
      {viewMode === "3d" ? <WarehouseScene /> : <Warehouse2D />}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setViewMode("3d")}
          className={`px-3 py-1.5 text-xs border border-[var(--border)] rounded-md transition-colors ${
            viewMode === "3d"
              ? "bg-[var(--primary)] text-white"
              : "bg-[var(--card)] hover:bg-[var(--muted)]"
          }`}
        >
          3D View
        </button>
        <button
          onClick={() => setViewMode("2d")}
          className={`px-3 py-1.5 text-xs border border-[var(--border)] rounded-md transition-colors ${
            viewMode === "2d"
              ? "bg-[var(--primary)] text-white"
              : "bg-[var(--card)] hover:bg-[var(--muted)]"
          }`}
        >
          2D Top-Down
        </button>
      </div>
      {/* Velocity color legend */}
      <div className="absolute bottom-4 left-4 bg-[var(--card)]/90 backdrop-blur-sm border border-[var(--border)] rounded-lg p-3">
        <p className="text-xs font-semibold text-[var(--foreground)] mb-2">Velocity Class</p>
        <div className="flex flex-col gap-1.5">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.color} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-[var(--muted-foreground)]">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
