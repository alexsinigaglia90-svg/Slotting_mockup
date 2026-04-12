import { describe, it, expect } from "vitest";
import { buildFixtureGrid } from "../fixture";
import { computeMetersPerShift, distanceBetween } from "../meters";

describe("distanceBetween", () => {
  it("returns 0 for same position", () => {
    const p = { zone: "Z1", rij: 0, kolom: 0, hoogte_niveau: 0 };
    expect(distanceBetween(p, p)).toBe(0);
  });

  it("uses Manhattan on different positions", () => {
    const a = { zone: "Z1", rij: 0, kolom: 0, hoogte_niveau: 0 };
    const b = { zone: "Z1", rij: 0, kolom: 3, hoogte_niveau: 0 };
    expect(distanceBetween(a, b)).toBeGreaterThan(0);
  });
});

describe("computeMetersPerShift", () => {
  it("produces positive numbers on the fixture", () => {
    const grid = buildFixtureGrid();
    const m = computeMetersPerShift(grid);
    expect(m.picks_per_shift).toBeGreaterThan(0);
    expect(m.meters_per_shift).toBeGreaterThan(0);
    expect(m.uren_per_shift).toBeGreaterThan(0);
    expect(m.meters_per_pick_avg).toBeGreaterThan(0);
  });

  it("uren derive from meters and walking speed", () => {
    const grid = buildFixtureGrid();
    const m = computeMetersPerShift(grid);
    const expected_seconds = m.meters_per_shift / 1.2 + m.picks_per_shift * 4;
    expect(m.uren_per_shift).toBeCloseTo(expected_seconds / 3600, 1);
  });
});
