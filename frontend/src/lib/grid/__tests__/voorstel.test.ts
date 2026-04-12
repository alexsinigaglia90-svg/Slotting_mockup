import { describe, it, expect } from "vitest";
import { buildFixtureGrid } from "../fixture";
import { clientSideVoorstelGenerator } from "../voorstel";
import type { ScenarioDelta, SKU } from "../types";

function sampleAdd(): SKU[] {
  return [{
    id: "NEW-001",
    naam: "nieuw product",
    pick_frequency_per_shift: 10,
    gewicht_kg: 2,
    afmeting: { l: 0.2, b: 0.2, h: 0.2 },
    categorie: "huishouden",
    gevarenklasse: "none",
  }];
}

describe("clientSideVoorstelGenerator", () => {
  it("produces a new grid with the scenario applied", async () => {
    const base = buildFixtureGrid();
    const delta: ScenarioDelta = { remove: [base.slots[0].sku_id], add: sampleAdd() };
    const voorstel = await clientSideVoorstelGenerator.propose(base, delta, "test-scenario");
    expect(voorstel.scenario_naam).toBe("test-scenario");
    expect(voorstel.new_grid.slots.length).toBe(base.slots.length);
    expect(voorstel.compute_time_ms).toBeGreaterThanOrEqual(0);
    const hasNew = voorstel.new_grid.slots.some((s) => s.sku_id === "NEW-001");
    expect(hasNew).toBe(true);
  });

  it("removed SKU no longer occupies its original slot", async () => {
    const base = buildFixtureGrid();
    const targetSku = base.slots[0].sku_id;
    const delta: ScenarioDelta = { remove: [targetSku], add: [] };
    const voorstel = await clientSideVoorstelGenerator.propose(base, delta, "t");
    const stillPresent = voorstel.new_grid.slots.find((s) => s.sku_id === targetSku);
    expect(stillPresent).toBeUndefined();
  });
});
