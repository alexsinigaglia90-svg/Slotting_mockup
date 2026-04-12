import { describe, it, expect } from "vitest";
import { buildFixtureGrid } from "../fixture";
import { clientSideVoorstelGenerator } from "../voorstel";
import { EMPTY_SKU_ID } from "../types";
import type { ScenarioDelta, SKU } from "../types";

function makeSku(id: string, freq: number): SKU {
  return {
    id, naam: id, pick_frequency_per_shift: freq,
    gewicht_kg: 2, afmeting: { l: 0.2, b: 0.2, h: 0.2 },
    categorie: "huishouden", gevarenklasse: "none",
  };
}

describe("clientSideVoorstelGenerator", () => {
  it("produces a new grid with the scenario applied (balanced)", async () => {
    const base = buildFixtureGrid();
    const delta: ScenarioDelta = { remove: [base.slots[0].sku_id], add: [makeSku("NEW-001", 10)] };
    const voorstel = await clientSideVoorstelGenerator.propose(base, delta, "test-scenario");
    expect(voorstel.scenario_naam).toBe("test-scenario");
    expect(voorstel.new_grid.slots.length).toBe(base.slots.length);
    expect(voorstel.compute_time_ms).toBeGreaterThanOrEqual(0);
    const hasNew = voorstel.new_grid.slots.some((s) => s.sku_id === "NEW-001");
    expect(hasNew).toBe(true);
    expect(voorstel.displaced).toEqual([]);
  });

  it("removed SKU is gone from both the slot map and the SKU catalog", async () => {
    const base = buildFixtureGrid();
    const targetSku = base.slots[0].sku_id;
    const delta: ScenarioDelta = { remove: [targetSku], add: [] };
    const voorstel = await clientSideVoorstelGenerator.propose(base, delta, "t");
    expect(voorstel.new_grid.skus[targetSku]).toBeUndefined();
    expect(voorstel.new_grid.slots.every((s) => s.sku_id !== targetSku)).toBe(true);
  });

  it("slot count is preserved even with unbalanced remove (phase-out)", async () => {
    const base = buildFixtureGrid();
    const toRemove = base.slots.slice(0, 150).map((s) => s.sku_id);
    const voorstel = await clientSideVoorstelGenerator.propose(
      base, { remove: toRemove, add: [] }, "phase-out",
    );
    expect(voorstel.new_grid.slots.length).toBe(base.slots.length);
    const emptyCount = voorstel.new_grid.slots.filter((s) => s.sku_id === EMPTY_SKU_ID).length;
    expect(emptyCount).toBe(150);
  });

  it("adding more SKUs than free slots does not silently drop them", async () => {
    const base = buildFixtureGrid();
    const adds = Array.from({ length: 250 }, (_, i) => makeSku(`ADD-${i}`, 30));
    const voorstel = await clientSideVoorstelGenerator.propose(
      base, { remove: [], add: adds }, "seizoen",
    );
    // Slot count preserved
    expect(voorstel.new_grid.slots.length).toBe(base.slots.length);
    // Every added SKU is either placed in a slot OR reported as displaced.
    const placedIds = new Set(voorstel.new_grid.slots.map((s) => s.sku_id));
    const displacedIds = new Set(voorstel.displaced.map((s) => s.id));
    for (const sku of adds) {
      const placed = placedIds.has(sku.id);
      const bumped = displacedIds.has(sku.id);
      expect(placed || bumped).toBe(true);
    }
  });

  it("every SKU in new_grid.skus is referenced by at least one slot (invariant)", async () => {
    const base = buildFixtureGrid();
    const delta: ScenarioDelta = {
      remove: base.slots.slice(0, 10).map((s) => s.sku_id),
      add: Array.from({ length: 5 }, (_, i) => makeSku(`INV-${i}`, 5)),
    };
    const voorstel = await clientSideVoorstelGenerator.propose(base, delta, "inv");
    const referenced = new Set(voorstel.new_grid.slots.map((s) => s.sku_id));
    for (const skuId of Object.keys(voorstel.new_grid.skus)) {
      expect(referenced.has(skuId)).toBe(true);
    }
  });
});
