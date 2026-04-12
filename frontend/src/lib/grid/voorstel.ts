import type { Grid, Slot, ScenarioDelta, Voorstel, VoorstelGenerator, SKU } from "./types";
import { EMPTY_SKU_ID } from "./types";
import { computeMetersPerShift } from "./meters";

/**
 * Produces a new Grid with the scenario delta applied.
 *
 * Invariants:
 * - Slots are physical: the slot count never changes between base and new_grid.
 * - Every SKU in `new_grid.skus` is referenced by exactly one slot.
 * - Unoccupied slots have sku_id === EMPTY_SKU_ID.
 * - If more SKUs are added than can fit, the overflow is returned in `displaced` — never silently dropped.
 *
 * Placement heuristic: high-frequency SKUs → slots with the lowest distance-from-dock score.
 * This is a demo heuristic; the VoorstelGenerator interface allows a Python-engine-backed
 * implementation (slotting/engine/) to replace it without any UI changes.
 */
function slotScore(s: Slot): number {
  return (parseInt(s.position.zone.replace(/\D/g, ""), 10) || 0) * 10
    + s.position.rij * 1.5
    + s.position.kolom * 1.2
    + Math.abs(s.position.hoogte_niveau - 2) * 0.5; // mid-level preferred
}

function applyScenario(base: Grid, delta: ScenarioDelta): { grid: Grid; displaced: SKU[] } {
  const newSkus: Record<string, SKU> = { ...base.skus };
  for (const removed of delta.remove) delete newSkus[removed];
  for (const added of delta.add) newSkus[added.id] = added;

  // Clone slots — never drop, never create.
  const slotsCopy: Slot[] = base.slots.map((s) => ({ ...s }));

  // Phase 1: empty out removed SKUs' slots.
  const toRemove = new Set(delta.remove);
  for (const slot of slotsCopy) {
    if (toRemove.has(slot.sku_id)) slot.sku_id = EMPTY_SKU_ID;
  }

  // Phase 2: place added SKUs, highest-frequency first.
  const addedList = [...delta.add].sort(
    (a, b) => b.pick_frequency_per_shift - a.pick_frequency_per_shift,
  );
  const displaced: SKU[] = [];

  for (const sku of addedList) {
    // Find best empty slot (lowest score = closest to dock).
    let bestEmptyIdx = -1;
    let bestEmptyScore = Infinity;
    for (let i = 0; i < slotsCopy.length; i++) {
      if (slotsCopy[i].sku_id !== EMPTY_SKU_ID) continue;
      const score = slotScore(slotsCopy[i]);
      if (score < bestEmptyScore) {
        bestEmptyScore = score;
        bestEmptyIdx = i;
      }
    }
    if (bestEmptyIdx >= 0) {
      slotsCopy[bestEmptyIdx].sku_id = sku.id;
      continue;
    }

    // No empty slot: bump the kept SKU with the lowest pick_frequency
    // (prefer bumping from slots furthest from dock among ties).
    let bumpIdx = -1;
    let bumpFreq = Infinity;
    let bumpScore = -Infinity;
    for (let i = 0; i < slotsCopy.length; i++) {
      const occupantId = slotsCopy[i].sku_id;
      if (occupantId === EMPTY_SKU_ID) continue;
      const occupant = newSkus[occupantId];
      if (!occupant) continue; // defensive; shouldn't happen
      const freq = occupant.pick_frequency_per_shift;
      const score = slotScore(slotsCopy[i]);
      if (freq < bumpFreq || (freq === bumpFreq && score > bumpScore)) {
        bumpFreq = freq;
        bumpScore = score;
        bumpIdx = i;
      }
    }

    if (bumpIdx >= 0) {
      const bumpedId = slotsCopy[bumpIdx].sku_id;
      const bumped = newSkus[bumpedId];
      slotsCopy[bumpIdx].sku_id = sku.id;
      // The bumped SKU is now homeless — track and remove from catalog.
      displaced.push(bumped);
      delete newSkus[bumpedId];
    } else {
      // Grid is completely empty of placeable slots; this SKU is displaced too.
      displaced.push(sku);
      delete newSkus[sku.id];
    }
  }

  return {
    grid: { ...base, slots: slotsCopy, skus: newSkus },
    displaced,
  };
}

export const clientSideVoorstelGenerator: VoorstelGenerator = {
  async propose(base, scenario, scenario_naam): Promise<Voorstel> {
    const t0 = performance.now();
    const { grid: new_grid, displaced } = applyScenario(base, scenario);
    // Touch meters to keep the measured compute_time_ms realistic.
    computeMetersPerShift(new_grid);
    const t1 = performance.now();
    return { new_grid, compute_time_ms: Math.round(t1 - t0), scenario_naam, displaced };
  },
};
