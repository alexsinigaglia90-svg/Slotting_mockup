import type { Grid, MetersPerShift, Position } from "./types";
import { WALKING_SPEED_M_PER_S, PICK_OVERHEAD_S } from "./types";

const ZONE_SPACING_M = 15;
const COLUMN_SPACING_M = 1.2;
const ROW_SPACING_M = 1.5;
const LEVEL_SPACING_M = 0.4;

function zoneOffset(zone: string): number {
  const idx = parseInt(zone.replace(/\D/g, ""), 10) || 0;
  return idx * ZONE_SPACING_M;
}

export function distanceBetween(a: Position, b: Position): number {
  const dx = Math.abs(zoneOffset(a.zone) - zoneOffset(b.zone))
    + Math.abs(a.kolom - b.kolom) * COLUMN_SPACING_M;
  const dy = Math.abs(a.rij - b.rij) * ROW_SPACING_M;
  const dz = Math.abs(a.hoogte_niveau - b.hoogte_niveau) * LEVEL_SPACING_M;
  return dx + dy + dz;
}

/**
 * Approximates meters walked per shift by summing weighted round-trip distances
 * from a fixed dock origin to every slot, weighted by pick frequency.
 * This is a demo approximation — good enough for an honest "computed from the grid" number.
 */
export function computeMetersPerShift(grid: Grid): MetersPerShift {
  const origin: Position = { zone: "Z1", rij: 0, kolom: 0, hoogte_niveau: 0 };
  let meters_total = 0;
  let picks_total = 0;

  for (const slot of grid.slots) {
    const sku = grid.skus[slot.sku_id];
    if (!sku) continue; // empty or missing-SKU slot — skip
    const freq = sku.pick_frequency_per_shift;
    if (freq <= 0) continue;
    const d = distanceBetween(origin, slot.position) * 2; // round trip
    meters_total += d * freq;
    picks_total += freq;
  }

  const meters_per_pick_avg = picks_total > 0 ? meters_total / picks_total : 0;
  const seconds_walking = meters_total / WALKING_SPEED_M_PER_S;
  const seconds_overhead = picks_total * PICK_OVERHEAD_S;
  const uren_per_shift = (seconds_walking + seconds_overhead) / 3600;

  return {
    meters_per_pick_avg,
    meters_per_shift: meters_total,
    picks_per_shift: picks_total,
    uren_per_shift,
  };
}
