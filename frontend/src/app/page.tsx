"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { OptimizeResponse } from "@/lib/types";

export default function DashboardPage() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizeResponse | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("optimizeResult");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);

  async function runOptimization() {
    setIsOptimizing(true);
    setError(null);
    try {
      const res = await api.optimize({ num_orders: 500, max_iterations: 20 });
      setResult(res);
      localStorage.setItem("optimizeResult", JSON.stringify(res));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Optimization failed");
    } finally {
      setIsOptimizing(false);
    }
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Action Warehouse Slotting Module</h2>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted-foreground)] mb-1">Warehouse</p>
          <p className="text-2xl font-bold">15 aisles</p>
          <p className="text-sm text-[var(--muted-foreground)]">3,000 locations</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted-foreground)] mb-1">SKU Catalog</p>
          <p className="text-2xl font-bold">10,000 SKUs</p>
          <p className="text-sm text-[var(--muted-foreground)]">9 categories</p>
        </div>
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)]">
          <p className="text-sm text-[var(--muted-foreground)] mb-1">Optimization</p>
          {result ? (
            <>
              <p className="text-2xl font-bold text-green-400">-{result.improvement_pct.toFixed(1)}%</p>
              <p className="text-sm text-[var(--muted-foreground)]">distance reduced</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-green-400">Ready</p>
              <p className="text-sm text-[var(--muted-foreground)]">No run yet</p>
            </>
          )}
        </div>
      </div>

      {/* Optimization Results */}
      {result && (
        <div className="bg-[var(--card)] rounded-lg p-6 border border-[var(--border)] mb-8">
          <h3 className="text-lg font-semibold mb-4">Optimization Results</h3>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-[var(--muted-foreground)] mb-1">Before (avg dist/order)</p>
              <p className="text-xl font-bold text-red-400">{result.score_before.avg_distance_per_order.toFixed(1)} m</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted-foreground)] mb-1">After (avg dist/order)</p>
              <p className="text-xl font-bold text-green-400">{result.score_after.avg_distance_per_order.toFixed(1)} m</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted-foreground)] mb-1">Improvement</p>
              <p className="text-xl font-bold text-green-400">{result.improvement_pct.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted-foreground)] mb-1">Iterations</p>
              <p className="text-xl font-bold">{result.iterations}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-4 pt-4 border-t border-[var(--border)]">
            <div>
              <p className="text-sm text-[var(--muted-foreground)] mb-1">SKUs Assigned</p>
              <p className="text-lg font-semibold">{result.num_skus_assigned.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted-foreground)] mb-1">Total Locations</p>
              <p className="text-lg font-semibold">{result.num_locations_total.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted-foreground)] mb-1">Avg Picks / Order</p>
              <p className="text-lg font-semibold">{result.score_after.avg_picks_per_order.toFixed(1)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-8">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={runOptimization}
          disabled={isOptimizing}
          className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOptimizing ? "Optimizing..." : "Run Optimization"}
        </button>
        <a href="/warehouse" className="px-6 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg font-medium hover:bg-[var(--muted)] transition-colors">
          View Warehouse 3D
        </a>
        <a href="/opex" className="px-6 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg font-medium hover:bg-[var(--muted)] transition-colors">
          Opex Dashboard
        </a>
      </div>
    </div>
  );
}
