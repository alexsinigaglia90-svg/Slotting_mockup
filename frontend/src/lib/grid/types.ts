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
  /** SKUs that had nowhere to be placed (e.g. too many adds, not enough slots) */
  displaced: SKU[];
}

export interface VoorstelGenerator {
  propose(base: Grid, scenario: ScenarioDelta, scenario_naam: string): Promise<Voorstel>;
}

/** Sentinel value for physically present but currently unoccupied slots */
export const EMPTY_SKU_ID = "__EMPTY__";

/** Walking speed constant for uren calculation — documented assumption */
export const WALKING_SPEED_M_PER_S = 1.2;
/** Seconds per pick overhead (grab + scan) — documented assumption */
export const PICK_OVERHEAD_S = 4;

/**
 * Batch efficiency factor. The naive formula sums meters as if every pick were a solo round-trip
 * from the dock. Real pickers chain 8-12 picks per route, which reduces actual walked distance
 * by roughly 6x. This calibration factor (0.16 ≈ 1/6) converts the naive sum to a realistic
 * shift total. Documented as a demo-calibration constant; replace with a real pick-route model
 * (slotting/engine/) to remove this approximation.
 */
export const BATCH_EFFICIENCY = 0.16;

/** Active pickers in one shift. Used to derive per-picker figures when needed. */
export const PICKERS_PER_SHIFT = 40;
