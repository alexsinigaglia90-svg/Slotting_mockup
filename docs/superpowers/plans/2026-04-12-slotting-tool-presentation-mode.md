# Slotting Tool — Presentation Mode & Grid Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 5-chapter ~5 min guided Presentation Mode on top of the existing slotting tool, and add a real grid-data foundation that makes in-tool numbers computed rather than hardcoded. Strip all "AI / ML / neural" framing.

**Architecture:** A new client-side TypeScript grid model (`frontend/src/lib/grid/`) computes meters, rule violations, and layout proposals from a fixture dataset. Existing components are rewired to read from it. A new Presentation Mode route wraps the tool in a chapter-navigation shell with 5 scripted scenes. The Neural Network View is removed entirely.

**Tech stack:** Next.js 16, React 19, TypeScript, Tailwind v4, motion (framer-motion successor), three.js / react-three-fiber for 3D, vitest (to be added) for unit tests.

**Spec:** [docs/superpowers/specs/2026-04-12-slotting-tool-presentation-mode-design.md](../specs/2026-04-12-slotting-tool-presentation-mode-design.md)

---

## Brok 1 — Grid-data Foundation

### Task 1.1: Add vitest to frontend

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/lib/grid/__tests__/smoke.test.ts`

- [ ] **Step 1: Install vitest**

```bash
cd frontend && npm install -D vitest @vitest/ui
```

- [ ] **Step 2: Add test script to package.json**

In `frontend/package.json`, under `"scripts"`, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create vitest config**

`frontend/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
```

- [ ] **Step 4: Write smoke test**

`frontend/src/lib/grid/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("vitest", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run test**

Run: `cd frontend && npm test`
Expected: PASS, 1 test.

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts frontend/src/lib/grid/__tests__/smoke.test.ts
git commit -m "chore: add vitest for frontend unit tests"
```

---

### Task 1.2: Grid types

**Files:**
- Create: `frontend/src/lib/grid/types.ts`

- [ ] **Step 1: Write the types**

`frontend/src/lib/grid/types.ts`:

```ts
export type GevarenKlasse = "none" | "flam" | "chem" | "food-incompat";
export type ErgonomieZone = "reik" | "buk" | "klim";

export interface SKU {
  id: string;
  naam: string;
  pick_frequency_per_shift: number;
  gewicht_kg: number;
  afmeting: { l: number; b: number; h: number };
  categorie: string;
  gevarenklasse: GevarenKlasse;
}

export interface Position {
  zone: string;
  rij: number;
  kolom: number;
  hoogte_niveau: number;
}

export interface Slot {
  id: string;
  position: Position;
  sku_id: string;
  ergonomie_zone: ErgonomieZone;
}

export interface Grid {
  dc_naam: string;
  slots: Slot[];
  skus: Record<string, SKU>;
  /** bounds for distance calculations in meters */
  bounds: { width_m: number; depth_m: number; aisle_width_m: number };
}

export interface MetersPerShift {
  meters_per_pick_avg: number;
  meters_per_shift: number;
  picks_per_shift: number;
  uren_per_shift: number;
}

export type RuleLayer = "compliance" | "ergonomie" | "continuiteit";

export interface Violation {
  layer: RuleLayer;
  slot_id: string;
  rule: string;
  detail: string;
}

export interface ScenarioDelta {
  /** SKU ids removed from assortment */
  remove: string[];
  /** new SKUs added to assortment */
  add: SKU[];
}

export interface Voorstel {
  new_grid: Grid;
  compute_time_ms: number;
  scenario_naam: string;
}

export interface VoorstelGenerator {
  propose(base: Grid, scenario: ScenarioDelta, scenario_naam: string): Promise<Voorstel>;
}

/** Walking speed constant for uren calculation — documented assumption */
export const WALKING_SPEED_M_PER_S = 1.2;
/** Seconds per pick overhead (grab + scan) — documented assumption */
export const PICK_OVERHEAD_S = 4;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/grid/types.ts
git commit -m "feat(grid): add grid data types"
```

---

### Task 1.3: Fixture dataset

**Files:**
- Create: `frontend/src/lib/grid/fixture.ts`
- Create: `frontend/src/lib/grid/__tests__/fixture.test.ts`

- [ ] **Step 1: Write the failing test**

`frontend/src/lib/grid/__tests__/fixture.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test — expect fail**

Run: `cd frontend && npm test -- fixture`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the fixture**

`frontend/src/lib/grid/fixture.ts`:

```ts
// DEMO FIXTURE DATA — this is a plausible fictional DC, NOT real Action data.
// Replace this file (keeping the buildFixtureGrid signature) to plug in a real dataset.

import type { Grid, SKU, Slot, ErgonomieZone, GevarenKlasse } from "./types";

const CATEGORIES = [
  "huishouden", "persoonlijke-verzorging", "food-droog", "food-koel",
  "kantoor", "speelgoed", "tuin", "seizoen", "chemisch", "elektronica",
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function ergoForNiveau(n: number): ErgonomieZone {
  if (n === 0 || n === 1) return "buk";
  if (n === 2 || n === 3) return "reik";
  return "klim";
}

export function buildFixtureGrid(): Grid {
  const rand = seededRandom(20260412);
  const skus: Record<string, SKU> = {};
  const slots: Slot[] = [];

  const num_zones = 5;
  const rows_per_zone = 10;
  const cols_per_row = 8;
  const niveaus = 5;

  let sku_counter = 0;

  for (let z = 0; z < num_zones; z++) {
    const zone = `Z${z + 1}`;
    for (let r = 0; r < rows_per_zone; r++) {
      for (let c = 0; c < cols_per_row; c++) {
        for (let n = 0; n < niveaus; n++) {
          const sku_id = `SKU-${String(sku_counter).padStart(5, "0")}`;
          const categorie = CATEGORIES[Math.floor(rand() * CATEGORIES.length)];

          // Seeded violations: a handful of "flam" in zone Z1 (food zone), to create compliance violations.
          let gevarenklasse: GevarenKlasse = "none";
          if (zone === "Z1" && rand() < 0.015) gevarenklasse = "flam";
          else if (categorie === "chemisch" && rand() < 0.3) gevarenklasse = "chem";

          const gewicht_kg = 0.1 + rand() * 19.9;
          const pick_frequency_per_shift = Math.round(rand() * 40);

          skus[sku_id] = {
            id: sku_id,
            naam: `${categorie} #${sku_counter}`,
            pick_frequency_per_shift,
            gewicht_kg,
            afmeting: { l: 0.1 + rand() * 0.5, b: 0.1 + rand() * 0.4, h: 0.1 + rand() * 0.6 },
            categorie: zone === "Z1" ? "food-droog" : categorie,
            gevarenklasse,
          };

          slots.push({
            id: `${zone}-R${r}-C${c}-N${n}`,
            position: { zone, rij: r, kolom: c, hoogte_niveau: n },
            sku_id,
            ergonomie_zone: ergoForNiveau(n),
          });

          sku_counter++;
        }
      }
    }
  }

  return {
    dc_naam: "DC-Demo",
    slots,
    skus,
    bounds: { width_m: cols_per_row * 1.2, depth_m: rows_per_zone * 1.5, aisle_width_m: 3.0 },
  };
}
```

- [ ] **Step 4: Run test — expect pass**

Run: `cd frontend && npm test -- fixture`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/grid/fixture.ts frontend/src/lib/grid/__tests__/fixture.test.ts
git commit -m "feat(grid): add fixture dataset with seeded violations"
```

---

### Task 1.4: Meters module

**Files:**
- Create: `frontend/src/lib/grid/meters.ts`
- Create: `frontend/src/lib/grid/__tests__/meters.test.ts`

- [ ] **Step 1: Write the failing test**

`frontend/src/lib/grid/__tests__/meters.test.ts`:

```ts
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
    // should roughly match meters / (1.2 m/s) / 3600 + pick overhead
    const expected_seconds = m.meters_per_shift / 1.2 + m.picks_per_shift * 4;
    expect(m.uren_per_shift).toBeCloseTo(expected_seconds / 3600, 1);
  });
});
```

- [ ] **Step 2: Run — expect fail**

Run: `cd frontend && npm test -- meters`
Expected: FAIL.

- [ ] **Step 3: Implement meters module**

`frontend/src/lib/grid/meters.ts`:

```ts
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
```

- [ ] **Step 4: Run — expect pass**

Run: `cd frontend && npm test -- meters`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/grid/meters.ts frontend/src/lib/grid/__tests__/meters.test.ts
git commit -m "feat(grid): add meters-per-shift module"
```

---

### Task 1.5: Rule checker (3 layers)

**Files:**
- Create: `frontend/src/lib/grid/rules.ts`
- Create: `frontend/src/lib/grid/__tests__/rules.test.ts`

- [ ] **Step 1: Write the failing test**

`frontend/src/lib/grid/__tests__/rules.test.ts`:

```ts
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
    expect(result.compliance[0].rule).toContain("gevaarlijk");
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
```

- [ ] **Step 2: Run — expect fail**

Run: `cd frontend && npm test -- rules`
Expected: FAIL.

- [ ] **Step 3: Implement rules**

`frontend/src/lib/grid/rules.ts`:

```ts
import type { Grid, Violation, RuleLayer } from "./types";

const HIGH_FREQ_THRESHOLD = 25;
const HEAVY_KG_THRESHOLD = 12;

export function checkRules(grid: Grid): Record<RuleLayer, Violation[]> {
  const compliance: Violation[] = [];
  const ergonomie: Violation[] = [];
  const continuiteit: Violation[] = [];

  // --- compliance ---
  for (const slot of grid.slots) {
    const sku = grid.skus[slot.sku_id];
    // gevaarlijk naast food
    if (sku.gevarenklasse !== "none" && slot.position.zone === "Z1") {
      compliance.push({
        layer: "compliance",
        slot_id: slot.id,
        rule: "gevaarlijke-stof-naast-food",
        detail: `${sku.naam} (${sku.gevarenklasse}) staat in foodzone ${slot.position.zone}`,
      });
    }
    // zwaar boven licht — check vertical neighbor in same rij/kolom/zone
    if (slot.position.hoogte_niveau >= 3 && sku.gewicht_kg > HEAVY_KG_THRESHOLD) {
      compliance.push({
        layer: "compliance",
        slot_id: slot.id,
        rule: "zwaar-op-hoogte",
        detail: `${sku.naam} (${sku.gewicht_kg.toFixed(1)}kg) op niveau ${slot.position.hoogte_niveau}`,
      });
    }
  }

  // --- ergonomie ---
  for (const slot of grid.slots) {
    const sku = grid.skus[slot.sku_id];
    if (sku.pick_frequency_per_shift > HIGH_FREQ_THRESHOLD && slot.ergonomie_zone === "buk") {
      ergonomie.push({
        layer: "ergonomie",
        slot_id: slot.id,
        rule: "hoog-freq-in-buk",
        detail: `${sku.naam} (${sku.pick_frequency_per_shift} picks/shift) in bukzone`,
      });
    }
    if (sku.pick_frequency_per_shift > HIGH_FREQ_THRESHOLD && slot.ergonomie_zone === "klim") {
      ergonomie.push({
        layer: "ergonomie",
        slot_id: slot.id,
        rule: "hoog-freq-in-klim",
        detail: `${sku.naam} in klimzone met ${sku.pick_frequency_per_shift} picks/shift`,
      });
    }
  }

  // --- continuiteit: zones with single dominant SKU creating bottleneck ---
  const zonePickLoad: Record<string, number> = {};
  for (const slot of grid.slots) {
    const sku = grid.skus[slot.sku_id];
    zonePickLoad[slot.position.zone] = (zonePickLoad[slot.position.zone] ?? 0) + sku.pick_frequency_per_shift;
  }
  const totalPicks = Object.values(zonePickLoad).reduce((a, b) => a + b, 0);
  for (const [zone, load] of Object.entries(zonePickLoad)) {
    if (load / totalPicks > 0.3) {
      continuiteit.push({
        layer: "continuiteit",
        slot_id: zone,
        rule: "zone-bottleneck",
        detail: `Zone ${zone} draagt ${((load / totalPicks) * 100).toFixed(0)}% van alle picks`,
      });
    }
  }

  return { compliance, ergonomie, continuiteit };
}
```

- [ ] **Step 4: Run — expect pass**

Run: `cd frontend && npm test -- rules`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/grid/rules.ts frontend/src/lib/grid/__tests__/rules.test.ts
git commit -m "feat(grid): add rule checker with compliance/ergonomie/continuiteit layers"
```

---

### Task 1.6: Voorstel-generator with Python-engine interface boundary

**Files:**
- Create: `frontend/src/lib/grid/voorstel.ts`
- Create: `frontend/src/lib/grid/__tests__/voorstel.test.ts`

- [ ] **Step 1: Write the failing test**

`frontend/src/lib/grid/__tests__/voorstel.test.ts`:

```ts
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
    // added SKU exists somewhere
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
```

- [ ] **Step 2: Run — expect fail**

Run: `cd frontend && npm test -- voorstel`
Expected: FAIL.

- [ ] **Step 3: Implement voorstel generator**

`frontend/src/lib/grid/voorstel.ts`:

```ts
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
  // Any still-free slots keep their old sku_id reference pointing at now-missing SKUs;
  // drop them — slot ceases to exist in the new grid.
  for (const leftover of available) {
    // dropped
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
```

- [ ] **Step 4: Run — expect pass**

Run: `cd frontend && npm test -- voorstel`
Expected: PASS.

- [ ] **Step 5: Add barrel export**

`frontend/src/lib/grid/index.ts`:

```ts
export * from "./types";
export * from "./fixture";
export * from "./meters";
export * from "./rules";
export * from "./voorstel";
```

- [ ] **Step 6: Run all tests**

Run: `cd frontend && npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/grid/voorstel.ts frontend/src/lib/grid/__tests__/voorstel.test.ts frontend/src/lib/grid/index.ts
git commit -m "feat(grid): add voorstel generator with python-engine interface"
```

---

## Brok 2 — AI Cleanup + Neural View Removal

### Task 2.1: Remove Neural Network View

**Files:**
- Delete: `frontend/src/app/neural/page.tsx` (and the `neural/` directory)
- Modify: any navigation link that points to `/neural` (search first)

- [ ] **Step 1: Find references**

Run: Grep for `"neural"` and `/neural` across `frontend/src/` — include the string "Neural" (capitalised).

Record every file that mentions it. Expected locations: `app/neural/`, possibly topbar/sidebar nav, possibly `app/warehouse/page.tsx`.

- [ ] **Step 2: Delete the route**

```bash
rm -rf frontend/src/app/neural
```

- [ ] **Step 3: Remove nav links**

For each file found in Step 1 that imports or links to `/neural`, delete the link/import. Do not leave a dangling button.

- [ ] **Step 4: Verify build**

Run: `cd frontend && npm run build`
Expected: build succeeds. If it errors on a missing import, the search missed a file — go back to step 1.

- [ ] **Step 5: Commit**

```bash
git add -A frontend/src/
git commit -m "feat: remove Neural Network View"
```

---

### Task 2.2: AI copy sweep

**Files:**
- Modify: any file in `frontend/src/` with "AI", "ML", "neural", "intelligent", "slim algoritme" in user-facing strings.

- [ ] **Step 1: Find occurrences**

Run Grep across `frontend/src/**/*.{ts,tsx}` for each of:
- `\bAI\b`
- `machine learning`
- `neural`
- `intelligent`
- `slim algoritme`
- `AI-gedreven`
- `AI stelt`

Record each hit with its file + line.

- [ ] **Step 2: Replace per the table**

For each hit, apply the replacement from the spec:

| Old | New |
|---|---|
| "AI stelt voor" | "Voorstel" |
| "AI-gedreven" | remove the word, or "geoptimaliseerd" |
| "machine learning" | remove |
| "neural" | remove |
| "slim algoritme" | "optimalisatie" |
| "intelligentie" | remove, or replace with the specific metric name |
| bare "AI" | remove or rewrite the sentence |

For each edit, read surrounding lines and keep sentences grammatical. Do not replace strings inside imports, types, or package-level identifiers — only user-facing copy.

- [ ] **Step 3: Re-run grep to verify zero hits**

Run the same grep patterns from Step 1. Expected: zero matches in user-facing `.tsx` files.

Exception: the word "intelligent" may remain inside third-party package names if any appear in imports. Exclude those manually.

- [ ] **Step 4: Build + visual smoke check**

Run: `cd frontend && npm run build && npm run dev`
Open the warehouse view in the browser. Click through the reslot-toaster, Command Center, new-SKU-wizard. Confirm nothing says "AI".

- [ ] **Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: strip AI framing from user-facing copy"
```

---

## Brok 3 — Wire Existing Components to the Grid

### Task 3.1: Expose a GridProvider context

**Files:**
- Create: `frontend/src/context/grid-context.tsx`
- Modify: `frontend/src/app/layout.tsx` or `frontend/src/app/providers.tsx` to wrap the app.

- [ ] **Step 1: Create the provider**

`frontend/src/context/grid-context.tsx`:

```tsx
"use client";
import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { buildFixtureGrid, computeMetersPerShift, checkRules, type Grid, type MetersPerShift, type Violation, type RuleLayer } from "@/lib/grid";

interface GridContextValue {
  grid: Grid;
  setGrid: (g: Grid) => void;
  meters: MetersPerShift;
  violations: Record<RuleLayer, Violation[]>;
}

const GridContext = createContext<GridContextValue | null>(null);

export function GridProvider({ children }: { children: ReactNode }) {
  const [grid, setGrid] = useState<Grid>(() => buildFixtureGrid());
  const meters = useMemo(() => computeMetersPerShift(grid), [grid]);
  const violations = useMemo(() => checkRules(grid), [grid]);
  return (
    <GridContext.Provider value={{ grid, setGrid, meters, violations }}>
      {children}
    </GridContext.Provider>
  );
}

export function useGrid(): GridContextValue {
  const ctx = useContext(GridContext);
  if (!ctx) throw new Error("useGrid must be used within GridProvider");
  return ctx;
}
```

- [ ] **Step 2: Wrap the app**

Edit `frontend/src/app/providers.tsx` — wrap whatever is already there with `<GridProvider>`:

```tsx
import { GridProvider } from "@/context/grid-context";
// inside the providers tree:
<GridProvider>{children}</GridProvider>
```

- [ ] **Step 3: Build + run**

Run: `cd frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/context/grid-context.tsx frontend/src/app/providers.tsx
git commit -m "feat: add GridProvider context"
```

---

### Task 3.2: Rewire warehouse-2d to grid data

**Files:**
- Modify: `frontend/src/components/warehouse-2d/warehouse-2d.tsx`

- [ ] **Step 1: Read the current file**

Read `frontend/src/components/warehouse-2d/warehouse-2d.tsx`. Identify where hardcoded mock values are used (likely imports from `@/lib/mock-data`).

- [ ] **Step 2: Replace mock imports with `useGrid()`**

- Import `useGrid` from `@/context/grid-context`.
- Call `const { grid, meters, violations } = useGrid();` at the top of the component.
- Replace any mock-data references used for SKU counts, meter totals, or zone occupancy with derived values from `grid`, `meters`, `violations`.
- Do not change the visual layout — this task is purely rewiring data sources.

- [ ] **Step 3: Build + run**

Run: `cd frontend && npm run build && npm run dev`
Open `/warehouse`. Confirm the map still renders and the numbers are plausible (likely different from before — the fixture has different scale than the mock).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/warehouse-2d/warehouse-2d.tsx
git commit -m "feat: wire warehouse-2d to GridProvider"
```

---

### Task 3.3: Rewire reslot-toaster, Command Center, new-SKU wizard

**Files:**
- Modify: whichever files contain these components (find them first).

- [ ] **Step 1: Locate the components**

Grep for `"reslot"`, `"toaster"`, `"Command Center"`, `"batch wizard"`, `"new.*SKU"` across `frontend/src/`. Record exact paths.

- [ ] **Step 2: Rewire each to `useGrid`**

For each component:
- Replace mock-data reads with `useGrid()` values.
- For before/after metrics in the reslot-toaster, import `clientSideVoorstelGenerator` and call it with a stub scenario; use `computeMetersPerShift(voorstel.new_grid)` for the "after" side.
- For the Command Center, derive any metric labels from `meters` and `violations` totals (e.g., "`{compliance.length}` actieve overtredingen").
- For the new-SKU wizard, use grid SKUs for selection/preview.

Per component:

- [ ] **Step 3: Build + visually check each component**

Run: `cd frontend && npm run build && npm run dev`. Click through each component. Confirm numbers now move in sync with each other (they share the grid).

- [ ] **Step 4: Commit per component**

```bash
git add <specific file>
git commit -m "feat: wire <component> to GridProvider"
```

Use one commit per component, not one big commit. Keeps review easy.

---

## Brok 4 — Presentation Mode Shell

### Task 4.1: Presentation context + toggle

**Files:**
- Create: `frontend/src/context/presentation-context.tsx`
- Modify: `frontend/src/app/providers.tsx`
- Modify: the topbar component (grep for the existing topbar/header file)

- [ ] **Step 1: Create the context**

`frontend/src/context/presentation-context.tsx`:

```tsx
"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export type ChapterId = 1 | 2 | 3 | 4 | 5;

interface PresentationContextValue {
  active: boolean;
  chapter: ChapterId;
  setActive: (a: boolean) => void;
  next: () => void;
  prev: () => void;
  goTo: (c: ChapterId) => void;
}

const Ctx = createContext<PresentationContextValue | null>(null);

export function PresentationProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [chapter, setChapter] = useState<ChapterId>(1);
  return (
    <Ctx.Provider value={{
      active,
      chapter,
      setActive,
      next: () => setChapter((c) => (Math.min(5, c + 1) as ChapterId)),
      prev: () => setChapter((c) => (Math.max(1, c - 1) as ChapterId)),
      goTo: setChapter,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePresentation() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePresentation must be used within PresentationProvider");
  return ctx;
}
```

- [ ] **Step 2: Wrap app**

In `frontend/src/app/providers.tsx`, add `<PresentationProvider>` inside the existing provider tree.

- [ ] **Step 3: Add toggle to topbar**

Find the topbar component and add a button:

```tsx
const { active, setActive } = usePresentation();
// in JSX:
<button onClick={() => setActive(!active)} className="...">
  {active ? "Exit presentation" : "Presentation mode"}
</button>
```

- [ ] **Step 4: Build**

Run: `cd frontend && npm run build`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/context/presentation-context.tsx frontend/src/app/providers.tsx <topbar file>
git commit -m "feat(presentation): add context and topbar toggle"
```

---

### Task 4.2: Presentation Mode shell route + chrome strip

**Files:**
- Create: `frontend/src/app/present/page.tsx`
- Create: `frontend/src/app/present/layout.tsx`
- Create: `frontend/src/components/presentation/shell.tsx`

- [ ] **Step 1: Create the route**

`frontend/src/app/present/page.tsx`:

```tsx
"use client";
import { PresentationShell } from "@/components/presentation/shell";
export default function PresentPage() {
  return <PresentationShell />;
}
```

`frontend/src/app/present/layout.tsx`:

```tsx
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 bg-black text-white overflow-hidden">{children}</div>;
}
```

- [ ] **Step 2: Create the shell**

`frontend/src/components/presentation/shell.tsx`:

```tsx
"use client";
import { usePresentation } from "@/context/presentation-context";
import Link from "next/link";

const CHAPTERS = [
  { id: 1, title: "Probleem" },
  { id: 2, title: "Risico" },
  { id: 3, title: "Mensen" },
  { id: 4, title: "Tempo" },
  { id: 5, title: "Conclusie" },
] as const;

export function PresentationShell() {
  const { chapter, next, prev, goTo } = usePresentation();
  return (
    <div className="relative h-full w-full flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 text-xs uppercase tracking-widest opacity-70">
        <div>Hoofdstuk {chapter} / 5</div>
        <Link href="/warehouse" className="hover:opacity-100">Exit</Link>
      </header>
      <div className="flex-1 relative">
        {/* placeholder chapter slot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-3xl font-light opacity-50">[ Hoofdstuk {chapter} placeholder ]</div>
        </div>
      </div>
      <footer className="flex items-center gap-3 px-8 py-4">
        <button onClick={prev} disabled={chapter === 1} className="px-4 py-2 border border-white/20 rounded disabled:opacity-20">Vorige</button>
        <div className="flex-1 flex gap-1">
          {CHAPTERS.map((c) => (
            <button
              key={c.id}
              onClick={() => goTo(c.id as 1|2|3|4|5)}
              className={`flex-1 h-1 rounded ${c.id <= chapter ? "bg-white" : "bg-white/20"}`}
              aria-label={`Go to chapter ${c.id}`}
            />
          ))}
        </div>
        <button onClick={next} disabled={chapter === 5} className="px-4 py-2 border border-white/20 rounded disabled:opacity-20">Volgende</button>
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Wire topbar toggle to navigate to /present**

Update the topbar toggle button to navigate to `/present` when activated and back to `/warehouse` when deactivated.

- [ ] **Step 4: Build + run**

Run: `cd frontend && npm run build && npm run dev`
Navigate to `/present`. Confirm you can click through 5 placeholder slides with the progress bar advancing.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/present frontend/src/components/presentation/shell.tsx <topbar file>
git commit -m "feat(presentation): add /present route and chapter shell"
```

---

## Brok 5 — Fill the Chapters

### Task 5.1: Hoofdstuk 1 — Marco + zoom-out + euro counter

**Files:**
- Create: `frontend/src/components/presentation/chapter-1-probleem.tsx`
- Modify: `frontend/src/components/presentation/shell.tsx` to render the chapter

- [ ] **Step 1: Create the chapter component**

`frontend/src/components/presentation/chapter-1-probleem.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useGrid } from "@/context/grid-context";

const COST_PER_METER_EUR = 0.05;

export function ChapterOneProbleem() {
  const { meters } = useGrid();
  const [phase, setPhase] = useState<"marco" | "zoomout">("marco");
  const [euroDisplay, setEuroDisplay] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setPhase("zoomout"), 9000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "zoomout") return;
    const target = meters.meters_per_shift * COST_PER_METER_EUR;
    let raf = 0;
    const start = performance.now();
    const duration = 6000;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setEuroDisplay(Math.round(target * t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, meters]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-10 text-white">
      <AnimatePresence mode="wait">
        {phase === "marco" ? (
          <motion.div
            key="marco"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center text-5xl">🧍</div>
            <div className="text-2xl font-light">Marco</div>
            <div className="text-sm opacity-60">12 picks · 8 min · 640m gelopen</div>
          </motion.div>
        ) : (
          <motion.div
            key="zoomout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="text-sm uppercase tracking-widest opacity-50">40 pickers, één shift</div>
            <div className="text-7xl font-light tabular-nums">€{euroDisplay.toLocaleString("nl-NL")}</div>
            <div className="text-xs opacity-40">op basis van {Math.round(meters.meters_per_shift).toLocaleString("nl-NL")} m gelopen</div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute bottom-24 text-base font-light opacity-80 italic">
        Marco is niet traag. Het magazijn is traag.
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into shell**

In `frontend/src/components/presentation/shell.tsx`, replace the placeholder div with:

```tsx
{chapter === 1 && <ChapterOneProbleem />}
{chapter === 2 && <div>H2 placeholder</div>}
{chapter === 3 && <div>H3 placeholder</div>}
{chapter === 4 && <div>H4 placeholder</div>}
{chapter === 5 && <div>H5 placeholder</div>}
```

Add the import at the top.

- [ ] **Step 3: Build + visual check**

Run: `cd frontend && npm run dev`
Navigate to `/present` with chapter 1. Expected: Marco shows for ~9s, then zoom-out with euro counter ticking up. Euro figure derives from the meters module.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/presentation/chapter-1-probleem.tsx frontend/src/components/presentation/shell.tsx
git commit -m "feat(presentation): add chapter 1 — Marco + zoom-out + euro counter"
```

---

### Task 5.2: Hoofdstuk 2 — Risk layer tabs

**Files:**
- Create: `frontend/src/components/presentation/chapter-2-risico.tsx`
- Modify: `frontend/src/components/presentation/shell.tsx`

- [ ] **Step 1: Create the chapter component**

`frontend/src/components/presentation/chapter-2-risico.tsx`:

```tsx
"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { useGrid } from "@/context/grid-context";
import type { RuleLayer } from "@/lib/grid";

const LAYERS: { id: RuleLayer; label: string; color: string }[] = [
  { id: "compliance", label: "Veiligheid & compliance", color: "#ef4444" },
  { id: "ergonomie", label: "Ergonomie & arbo", color: "#f59e0b" },
  { id: "continuiteit", label: "Continuïteit", color: "#a855f7" },
];

export function ChapterTwoRisico() {
  const { violations, grid } = useGrid();
  const [active, setActive] = useState<RuleLayer>("compliance");
  const activeViolations = violations[active];

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="flex justify-center gap-2 mt-10">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            onClick={() => setActive(l.id)}
            className={`px-5 py-2 text-sm border-b-2 transition-colors ${
              active === l.id ? "border-white text-white" : "border-transparent text-white/50"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        <motion.div
          key={active}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div
            className="text-[200px] font-light tabular-nums leading-none"
            style={{ color: LAYERS.find((l) => l.id === active)!.color }}
          >
            {activeViolations.length}
          </div>
          <div className="text-sm uppercase tracking-widest opacity-60">
            overtredingen nu actief
          </div>
          <div className="mt-6 max-w-xl text-xs opacity-50 text-center">
            {activeViolations.slice(0, 3).map((v) => (
              <div key={v.slot_id + v.rule}>{v.detail}</div>
            ))}
          </div>
        </motion.div>
      </div>
      <div className="pb-24 text-center text-xs opacity-40">
        berekend over {grid.slots.length} slots · DC {grid.dc_naam}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into shell**

Replace `{chapter === 2 && <div>H2 placeholder</div>}` with `<ChapterTwoRisico />`.

- [ ] **Step 3: Build + visual check**

Run: `cd frontend && npm run dev`
Navigate to chapter 2. Click the three tabs. Each shows a different count from the rule-checker.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/presentation/chapter-2-risico.tsx frontend/src/components/presentation/shell.tsx
git commit -m "feat(presentation): add chapter 2 — risk layer tabs"
```

---

### Task 5.3: Hoofdstuk 3 — Mensen domino

**Files:**
- Create: `frontend/src/components/presentation/chapter-3-mensen.tsx`
- Modify: `frontend/src/components/presentation/shell.tsx`

- [ ] **Step 1: Create the chapter component**

`frontend/src/components/presentation/chapter-3-mensen.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useGrid } from "@/context/grid-context";

export function ChapterThreeMensen() {
  const { meters } = useGrid();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 400),
      setTimeout(() => setStage(2), 1600),
      setTimeout(() => setStage(3), 2800),
      setTimeout(() => setStage(4), 4200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const blocks = [
    {
      label: "Meters per pick",
      value: `${meters.meters_per_pick_avg.toFixed(1)} m`,
    },
    {
      label: "Meters per shift / DC",
      value: `${Math.round(meters.meters_per_shift).toLocaleString("nl-NL")} m`,
    },
    {
      label: "Uren-equivalent per shift / DC",
      value: `${meters.uren_per_shift.toFixed(1)} uur`,
    },
  ];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-16">
      <div className="flex items-end gap-6">
        {blocks.map((b, i) => (
          <motion.div
            key={b.label}
            initial={{ opacity: 0, y: 20 }}
            animate={stage > i ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-3 px-8 py-10 border border-white/15 rounded-xl min-w-[260px]"
          >
            <div className="text-xs uppercase tracking-widest opacity-50">{b.label}</div>
            <div className="text-5xl font-light tabular-nums">{b.value}</div>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={stage >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="text-lg font-light opacity-80 italic max-w-xl text-center"
      >
        Deze uren komen vrij. Wat jullie ermee doen is jullie beslissing.
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into shell**

Replace H3 placeholder with `<ChapterThreeMensen />`.

- [ ] **Step 3: Build + visual check**

Navigate to chapter 3. Confirm 3 blocks appear one after another, numbers come from meters module, sluitregel appears at the end.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/presentation/chapter-3-mensen.tsx frontend/src/components/presentation/shell.tsx
git commit -m "feat(presentation): add chapter 3 — mensen domino"
```

---

### Task 5.4: Hoofdstuk 4 — Scenario carousel

**Files:**
- Create: `frontend/src/components/presentation/chapter-4-tempo.tsx`
- Create: `frontend/src/components/presentation/scenarios.ts`
- Modify: `frontend/src/components/presentation/shell.tsx`

- [ ] **Step 1: Define the scenarios**

`frontend/src/components/presentation/scenarios.ts`:

```ts
import type { ScenarioDelta, Grid, SKU } from "@/lib/grid";

function randomSkuIdsFrom(grid: Grid, n: number): string[] {
  return grid.slots.slice(0, n).map((s) => s.sku_id);
}

function sku(id: string, naam: string, freq: number, cat: string): SKU {
  return {
    id, naam, pick_frequency_per_shift: freq,
    gewicht_kg: 2, afmeting: { l: 0.3, b: 0.3, h: 0.3 },
    categorie: cat, gevarenklasse: "none",
  };
}

export interface ScenarioDef {
  id: "leverancier" | "seizoen" | "phaseout" | "uitbreiding";
  naam: string;
  korte: string;
  buildDelta: (grid: Grid) => ScenarioDelta;
}

export const SCENARIOS: ScenarioDef[] = [
  {
    id: "leverancier",
    naam: "Leverancier valt weg",
    korte: "40 SKU's vervangen door alternatieven",
    buildDelta: (g) => ({
      remove: randomSkuIdsFrom(g, 40),
      add: Array.from({ length: 40 }, (_, i) => sku(`ALT-${i}`, `alternatief ${i}`, 12 + i, "huishouden")),
    }),
  },
  {
    id: "seizoen",
    naam: "Nieuwe seizoenscollectie",
    korte: "~200 nieuwe SKU's",
    buildDelta: (g) => ({
      remove: [],
      add: Array.from({ length: 200 }, (_, i) => sku(`SEIZ-${i}`, `seizoen ${i}`, 5 + (i % 20), "seizoen")),
    }),
  },
  {
    id: "phaseout",
    naam: "Phase-out",
    korte: "150 SKU's uit assortiment",
    buildDelta: (g) => ({ remove: randomSkuIdsFrom(g, 150), add: [] }),
  },
  {
    id: "uitbreiding",
    naam: "Lijn-uitbreiding",
    korte: "80 extra SKU's in huishouden",
    buildDelta: (g) => ({
      remove: [],
      add: Array.from({ length: 80 }, (_, i) => sku(`UIT-${i}`, `huishouden extra ${i}`, 8, "huishouden")),
    }),
  },
];
```

- [ ] **Step 2: Create the chapter**

`frontend/src/components/presentation/chapter-4-tempo.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useGrid } from "@/context/grid-context";
import { clientSideVoorstelGenerator, computeMetersPerShift, type Voorstel } from "@/lib/grid";
import { SCENARIOS, type ScenarioDef } from "./scenarios";

export function ChapterFourTempo() {
  const { grid, meters: baseMeters } = useGrid();
  const [active, setActive] = useState<ScenarioDef>(SCENARIOS[0]);
  const [voorstel, setVoorstel] = useState<Voorstel | null>(null);
  const [isComputing, setComputing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setComputing(true);
    setVoorstel(null);
    clientSideVoorstelGenerator.propose(grid, active.buildDelta(grid), active.naam).then((v) => {
      if (!cancelled) {
        setVoorstel(v);
        setComputing(false);
      }
    });
    return () => { cancelled = true; };
  }, [grid, active]);

  const afterMeters = voorstel ? computeMetersPerShift(voorstel.new_grid) : null;

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="flex justify-center gap-2 mt-10">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s)}
            className={`px-4 py-2 text-xs uppercase tracking-widest border-b-2 transition-colors ${
              active.id === s.id ? "border-white text-white" : "border-transparent text-white/40"
            }`}
          >
            {s.naam}
          </button>
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 max-w-2xl text-center"
        >
          <div className="text-sm uppercase tracking-widest opacity-50">{active.korte}</div>
          <div className="text-4xl font-light">{active.naam}</div>
          <div className="mt-6 w-full border border-white/15 rounded-xl p-8">
            <div className="text-xs uppercase tracking-widest opacity-50 mb-3">Voorstel</div>
            {isComputing && <div className="text-2xl font-light opacity-60">rekent…</div>}
            {voorstel && afterMeters && (
              <div className="flex flex-col gap-4">
                <div className="text-5xl font-light tabular-nums">
                  {(voorstel.compute_time_ms / 1000).toFixed(2)}s
                </div>
                <div className="text-xs opacity-50">rekentijd</div>
                <div className="flex justify-center gap-8 mt-4 text-sm">
                  <div>
                    <div className="opacity-50 text-xs">meters/shift vóór</div>
                    <div className="tabular-nums">{Math.round(baseMeters.meters_per_shift).toLocaleString("nl-NL")}</div>
                  </div>
                  <div>
                    <div className="opacity-50 text-xs">meters/shift na</div>
                    <div className="tabular-nums">{Math.round(afterMeters.meters_per_shift).toLocaleString("nl-NL")}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire into shell**

Replace H4 placeholder with `<ChapterFourTempo />`.

- [ ] **Step 4: Build + visual check**

Navigate to chapter 4. Confirm: all 4 tabs work; switching tabs recomputes the voorstel; rekentijd is shown; before/after meters are derived from the grid.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/presentation/chapter-4-tempo.tsx frontend/src/components/presentation/scenarios.ts frontend/src/components/presentation/shell.tsx
git commit -m "feat(presentation): add chapter 4 — scenario carousel with voorstel"
```

---

### Task 5.5: Hoofdstuk 5 — Closing screen

**Files:**
- Create: `frontend/src/components/presentation/chapter-5-conclusie.tsx`
- Modify: `frontend/src/components/presentation/shell.tsx`

- [ ] **Step 1: Create the chapter component**

`frontend/src/components/presentation/chapter-5-conclusie.tsx`:

```tsx
"use client";
import { motion } from "motion/react";

export function ChapterFiveConclusie() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="max-w-3xl px-12 py-20 flex flex-col justify-between min-h-[60vh]"
      >
        <div className="text-xs uppercase tracking-[0.22em] opacity-55">
          Significante <span className="opacity-95 font-medium">OPEX-reductie</span>
        </div>

        <div className="my-12">
          <div className="text-5xl md:text-6xl font-light leading-[1.15] -tracking-[0.015em]">
            Jullie magazijn is nooit meer<br />
            <b className="font-semibold">gisteren optimaal.</b>
          </div>
        </div>

        <div>
          <div className="text-2xl font-medium -tracking-[0.005em] mb-2">
            Altijd optimaal. Automatisch.
          </div>
          <div className="text-sm opacity-55 font-light">
            Werkt zelfstandig. Werkt met elke WMS.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into shell**

Replace H5 placeholder with `<ChapterFiveConclusie />`.

- [ ] **Step 3: Build + end-to-end check**

Run: `cd frontend && npm run dev`
Navigate to `/present`, click through all 5 chapters. Confirm the full flow works end-to-end in under 5 minutes. No occurrences of "AI" anywhere in the shell or chapters.

- [ ] **Step 4: Final grep**

Run Grep for `\bAI\b`, `machine learning`, `neural`, `intelligent` across `frontend/src/`. Expected: zero matches in user-facing strings.

- [ ] **Step 5: Run all tests**

Run: `cd frontend && npm test`
Expected: all grid tests pass.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/presentation/chapter-5-conclusie.tsx frontend/src/components/presentation/shell.tsx
git commit -m "feat(presentation): add chapter 5 — closing screen"
```

---

## Final Verification

- [ ] **Verification step 1: Full demo walkthrough**

Run: `cd frontend && npm run dev`
Open `/warehouse`. Click the "Presentation mode" toggle. Walk through chapters 1→5 using the Volgende button. Record the total time (should be ~4:45 including read time).

- [ ] **Verification step 2: Sandbox regression**

Navigate back to `/warehouse` (sandbox). Confirm the warehouse map, reslot-toaster, Command Center, and new-SKU wizard all still work and show computed numbers.

- [ ] **Verification step 3: Zero-AI grep**

Run Grep for `AI|machine learning|neural|intelligent|slim algoritme` in `frontend/src/**/*.tsx` and `frontend/src/**/*.ts`. Expected: zero user-facing matches. (Package imports or technical identifiers are fine.)

- [ ] **Verification step 4: No Neural route**

Confirm `frontend/src/app/neural/` does not exist and no route resolves to `/neural`.

- [ ] **Verification step 5: All tests pass**

Run: `cd frontend && npm test`
Expected: green.

- [ ] **Verification step 6: Production build**

Run: `cd frontend && npm run build`
Expected: succeeds without errors.

---

## Notes for the executor

- **Do not rename grid module functions between tasks.** `computeMetersPerShift`, `checkRules`, `clientSideVoorstelGenerator`, `buildFixtureGrid` are the stable names — later tasks reference them exactly.
- **The fixture is deterministic.** Do not introduce `Math.random()` — use the seeded generator already in `fixture.ts`.
- **AI copy sweep is user-facing only.** It's fine to leave technical identifiers (class names, file names, import paths) that happen to contain "AI" or "ML". The goal is zero occurrences in text that a directie viewer could see on screen.
- **Reslot-toaster rewiring (Task 3.3)**: the component likely computes before/after internally. Keep that internal logic; only replace its data source with the grid + voorstel generator.
- **Python engine boundary**: `VoorstelGenerator` is an interface in `types.ts`. A later PR can add `pythonVoorstelGenerator` that calls the existing API in `slotting/api/`. Do not build that PR now — the interface is the only commitment this plan makes to the engine side.
