"use client";

import dynamic from "next/dynamic";

const WarehouseScene = dynamic(
  () => import("@/components/warehouse-3d/warehouse-scene"),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[var(--background)]">
      <p className="text-[var(--muted-foreground)]">Loading 3D scene...</p>
    </div>
  )}
);

export default function WarehousePage() {
  return (
    <div className="h-screen relative">
      <WarehouseScene />
      <div className="absolute top-4 right-4 flex gap-2">
        <button className="px-3 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
          Isometric
        </button>
        <button className="px-3 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
          Top Down
        </button>
        <button className="px-3 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
          Aisle View
        </button>
      </div>
    </div>
  );
}
