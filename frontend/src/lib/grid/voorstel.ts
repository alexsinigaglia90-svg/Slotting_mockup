import type { Grid, Slot, ScenarioDelta, Voorstel, VoorstelGenerator, SKU } from "./types";
import { computeMetersPerShift } from "./meters";

/**
 * Produces a new Grid with the scenario delta applied.
 * Placement heuristic: high-frequency SKUs → low-level slots near the dock (Z1 row 0).
 * This is a demo heuristic — the interface is designed so a Python-engine-backed
 * implementation (slotting/engine/) can replace it without any UI changes.
 */
function applyScenario(base: Grid, delta: ScenarioDelta): Grid {
  const newSkus: Record<string, SKU> = { ...base.skus };
  for (const removed of delta.remove) delete newSkus[removed];
  for (const added of delta.add) newSkus[added.id] = added;

  // Identify slots freed by removal; re-pool all slots that currently hold removed SKUs.
  const freedSlots: Slot[] = [];
  const keptSlots: Slot[] = [];
  for (const slot of base.slots) {
    if (delta.remove.includes(slot.sku_id)) {
      freedSlots.push({ ...slot, sku_id: "__FREE__" });
    } else {
      keptSlots.push(slot);
    }
  }

  // Distance-from-dock score per slot; lower = better.
  const slotScore = (s: Slot) =>
    (parseInt(s.position.zone.replace(/\D/g, ""), 10) || 0) * 10
    + s.position.rij * 1.5
    + s.position.kolom * 1.2
    + Math.abs(s.position.hoogte_niveau - 2) * 0.5; // mid-level preferred

  // Assign added SKUs to best freed slots (if any), else bump low-freq SKUs out.
  const addedList = [...delta.add].sort(
    (a, b) => b.pick_frequency_per_shift - a.pick_frequency_per_shift,
  );
  const available = [...freedSlots].sort((a, b) => slotScore(a) - slotScore(b));

  const finalSlots: Slot[] = [...keptSlots];
  for (const sku of addedList) {
    const target = available.shift();
    if (target) {
      finalSlots.push({ ...target, sku_id: sku.id });
    }
  }
  // Any still-free slots are dropped from the new grid.
  for (const leftover of available) {
    void leftover;
  }

  return { ...base, slots: finalSlots, skus: newSkus };
}

export const clientSideVoorstelGenerator: VoorstelGenerator = {
  async propose(base, scenario, scenario_naam): Promise<Voorstel> {
    const t0 = performance.now();
    const new_grid = applyScenario(base, scenario);
    // Touch meters to keep the computation honest (and slightly more realistic timing).
    computeMetersPerShift(new_grid);
    const t1 = performance.now();
    return { new_grid, compute_time_ms: Math.round(t1 - t0), scenario_naam };
  },
};
