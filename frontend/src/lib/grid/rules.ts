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

  // --- continuiteit: zones with single dominant share of pick load ---
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
