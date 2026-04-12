import { describe, it, expect } from "vitest";
import { buildFixtureGrid } from "../fixture";
import { checkRules } from "../rules";

describe("checkRules", () => {
  it("returns violations grouped by layer", () => {
    const grid = buildFixtureGrid();
    const result = checkRules(grid);
    expect(result.compliance).toBeDefined();
    expect(result.ergonomie).toBeDefined();
    expect(result.continuiteit).toBeDefined();
  });

  it("detects compliance violations from seeded flam-in-food", () => {
    const grid = buildFixtureGrid();
    const result = checkRules(grid);
    expect(result.compliance.length).toBeGreaterThan(0);
    expect(result.compliance.some((v) => v.rule.includes("gevaarlijk"))).toBe(true);
  });

  it("produces non-empty ergonomie violations", () => {
    const grid = buildFixtureGrid();
    const result = checkRules(grid);
    expect(result.ergonomie.length).toBeGreaterThan(0);
  });

  it("produces continuiteit violations", () => {
    const grid = buildFixtureGrid();
    const result = checkRules(grid);
    expect(result.continuiteit.length).toBeGreaterThan(0);
  });
});
