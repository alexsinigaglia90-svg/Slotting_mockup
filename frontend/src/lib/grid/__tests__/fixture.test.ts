import { describe, it, expect } from "vitest";
import { buildFixtureGrid } from "../fixture";

describe("buildFixtureGrid", () => {
  it("produces ~2000 slots", () => {
    const grid = buildFixtureGrid();
    expect(grid.slots.length).toBeGreaterThanOrEqual(1800);
    expect(grid.slots.length).toBeLessThanOrEqual(2200);
  });

  it("every slot has a matching SKU", () => {
    const grid = buildFixtureGrid();
    for (const slot of grid.slots) {
      expect(grid.skus[slot.sku_id]).toBeDefined();
    }
  });

  it("contains at least one compliance violation seed", () => {
    const grid = buildFixtureGrid();
    const hasFlamNearFood = grid.slots.some((s) => {
      const sku = grid.skus[s.sku_id];
      return sku.gevarenklasse === "flam";
    });
    expect(hasFlamNearFood).toBe(true);
  });

  it("is deterministic (same seed → same grid)", () => {
    const a = buildFixtureGrid();
    const b = buildFixtureGrid();
    expect(a.slots.length).toBe(b.slots.length);
    expect(a.slots[0].sku_id).toBe(b.slots[0].sku_id);
  });
});
