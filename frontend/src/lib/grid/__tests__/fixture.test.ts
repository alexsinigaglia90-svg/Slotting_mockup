import { describe, it, expect } from "vitest";
import { buildFixtureGrid } from "../fixture";
import { EMPTY_SKU_ID } from "../types";

describe("buildFixtureGrid", () => {
  it("produces ~2000 slots", () => {
    const grid = buildFixtureGrid();
    expect(grid.slots.length).toBeGreaterThanOrEqual(1800);
    expect(grid.slots.length).toBeLessThanOrEqual(2200);
  });

  it("has ~10% empty slots (physical headroom)", () => {
    const grid = buildFixtureGrid();
    const empty = grid.slots.filter((s) => s.sku_id === EMPTY_SKU_ID).length;
    const total = grid.slots.length;
    const share = empty / total;
    expect(share).toBeGreaterThan(0.07);
    expect(share).toBeLessThan(0.13);
  });

  it("every non-empty slot has a matching SKU", () => {
    const grid = buildFixtureGrid();
    for (const slot of grid.slots) {
      if (slot.sku_id === EMPTY_SKU_ID) continue;
      expect(grid.skus[slot.sku_id]).toBeDefined();
    }
  });

  it("contains at least one compliance violation seed", () => {
    const grid = buildFixtureGrid();
    const hasFlamNearFood = grid.slots.some((s) => {
      if (s.sku_id === EMPTY_SKU_ID) return false;
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
