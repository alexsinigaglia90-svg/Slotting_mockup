import { DEFAULT_WAREHOUSE_CONFIG, type WarehouseConfig } from "./types";

export interface RackPosition3D {
  locationId: string;
  aisleIndex: number;
  rackPosition: number;
  side: "left" | "right";
  level: number;
  worldX: number;
  worldY: number;
  worldZ: number;
}

export const RACK_WIDTH = 0.8;
export const RACK_HEIGHT = 0.45;
export const RACK_DEPTH = 1.8;
const SIDE_OFFSET = 1.0;

export function generateAllPositions(config: WarehouseConfig = DEFAULT_WAREHOUSE_CONFIG): RackPosition3D[] {
  const positions: RackPosition3D[] = [];
  const rackSpacing = config.aisleLengthM / config.racksPerAisle;
  for (let a = 0; a < config.numAisles; a++) {
    const aisleX = a * config.aisleSpacingM;
    for (const side of ["left", "right"] as const) {
      const xOffset = side === "left" ? -SIDE_OFFSET : SIDE_OFFSET;
      for (let r = 1; r <= config.racksPerAisle; r++) {
        const z = r * rackSpacing;
        for (let l = 1; l <= config.levelsPerRack; l++) {
          const ap = String(a + 1).padStart(2, "0");
          const sc = side === "left" ? "L" : "R";
          const rp = String(r).padStart(2, "0");
          positions.push({
            locationId: `A${ap}-${sc}${rp}-L${l}`,
            aisleIndex: a, rackPosition: r, side, level: l,
            worldX: aisleX + xOffset,
            worldY: (l - 1) * RACK_HEIGHT + RACK_HEIGHT / 2,
            worldZ: z,
          });
        }
      }
    }
  }
  return positions;
}

export function getWarehouseCenter(config = DEFAULT_WAREHOUSE_CONFIG) {
  return {
    x: ((config.numAisles - 1) * config.aisleSpacingM) / 2,
    y: 1.25,
    z: config.aisleLengthM / 2,
  };
}
