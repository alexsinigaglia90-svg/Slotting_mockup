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

// Rack dimensions — scaled for visibility
export const RACK_WIDTH = 1.6;    // width along aisle direction (x)
export const RACK_HEIGHT = 0.8;   // height per level
export const RACK_DEPTH = 1.6;    // depth along z
const SIDE_OFFSET = 2.0;          // offset from aisle center line

export function generateAllPositions(config: WarehouseConfig = DEFAULT_WAREHOUSE_CONFIG): RackPosition3D[] {
  const positions: RackPosition3D[] = [];
  const rackSpacing = config.aisleLengthM / config.racksPerAisle; // 2.0m

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
            aisleIndex: a,
            rackPosition: r,
            side,
            level: l,
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
  const totalWidth = (config.numAisles - 1) * config.aisleSpacingM;
  return {
    x: totalWidth / 2,
    y: (config.levelsPerRack * RACK_HEIGHT) / 2,
    z: config.aisleLengthM / 2,
  };
}

export function getWarehouseBounds(config = DEFAULT_WAREHOUSE_CONFIG) {
  const totalWidth = (config.numAisles - 1) * config.aisleSpacingM + SIDE_OFFSET * 2 + RACK_WIDTH;
  return {
    width: totalWidth,
    depth: config.aisleLengthM + 4,
    height: config.levelsPerRack * RACK_HEIGHT,
  };
}
