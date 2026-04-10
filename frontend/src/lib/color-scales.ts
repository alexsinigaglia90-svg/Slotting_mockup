import type { VelocityClass } from "./types";

export const VELOCITY_COLORS: Record<VelocityClass | "default", string> = {
  A: "#ef4444",
  B: "#eab308",
  C: "#60a5fa",
  D: "#3b82f6",
  default: "#374151",
};

export const ZONE_COLORS: Record<string, string> = {
  forward_pick: "#22c55e",
  bulk_storage: "#64748b",
  seasonal: "#a855f7",
  default: "#374151",
};

export function getVelocityClass(aisleIndex: number, level: number, totalAisles: number): VelocityClass {
  // Simulate: closer to depot (low aisleIndex) + lower level = faster movers
  const distanceScore = aisleIndex / totalAisles;
  const levelScore = (level - 1) / 4;
  const combined = (distanceScore + levelScore) / 2;
  if (combined < 0.2) return "A";
  if (combined < 0.45) return "B";
  if (combined < 0.7) return "C";
  return "D";
}
