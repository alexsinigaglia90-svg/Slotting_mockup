// DEMO FIXTURE DATA — this is a plausible fictional DC, NOT real Action data.
// Replace this file (keeping the buildFixtureGrid signature) to plug in a real dataset.

import type { Grid, SKU, Slot, ErgonomieZone, GevarenKlasse } from "./types";
import { EMPTY_SKU_ID } from "./types";

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

          // ~10% empty slots for realistic headroom. Deterministic via seeded rand.
          const isEmpty = rand() < 0.1;
          if (isEmpty) {
            slots.push({
              id: `${zone}-R${r}-C${c}-N${n}`,
              position: { zone, rij: r, kolom: c, hoogte_niveau: n },
              sku_id: EMPTY_SKU_ID,
              ergonomie_zone: ergoForNiveau(n),
            });
            sku_counter++;
            continue;
          }

          const categorie = CATEGORIES[Math.floor(rand() * CATEGORIES.length)];

          // Seeded violations: a handful of "flam" in zone Z1 (food zone), to create compliance violations.
          let gevarenklasse: GevarenKlasse = "none";
          if (zone === "Z1" && rand() < 0.015) gevarenklasse = "flam";
          else if (categorie === "chemisch" && rand() < 0.3) gevarenklasse = "chem";

          const gewicht_kg = 0.1 + rand() * 19.9;
          const zone_freq_multiplier = zone === "Z3" ? 2.5 : 1.0;
          const pick_frequency_per_shift = Math.round(rand() * 40 * zone_freq_multiplier);

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
