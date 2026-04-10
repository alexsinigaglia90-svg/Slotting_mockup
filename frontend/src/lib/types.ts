// Mirrors slotting/api/schemas.py

export interface ScoreResponse {
  avg_distance_per_order: number;
  total_distance_sampled: number;
  num_orders_sampled: number;
  avg_aisles_per_order: number;
  avg_picks_per_order: number;
  distance_per_pick: number;
}

export interface OptimizeResponse {
  score_before: ScoreResponse;
  score_after: ScoreResponse;
  improvement_pct: number;
  iterations: number;
  num_skus_assigned: number;
  num_locations_total: number;
}

export interface OptimizeRequest {
  warehouse_seed?: number;
  sku_seed?: number;
  order_seed?: number;
  num_orders?: number;
  num_days?: number;
  max_iterations?: number;
}

export interface PickRouteRequest {
  sku_ids: string[];
  heuristic?: "s_shape" | "largest_gap";
}

export interface PickRouteResponse {
  waypoints: string[];
  total_distance: number;
  aisles_visited: number;
  heuristic: string;
}

export interface HealthResponse {
  status: string;
  version: string;
}

// Frontend-specific types

export interface WarehouseConfig {
  numAisles: number;
  racksPerAisle: number;
  levelsPerRack: number;
  aisleLengthM: number;
  aisleSpacingM: number;
  aisleWidthM: number;
}

export const DEFAULT_WAREHOUSE_CONFIG: WarehouseConfig = {
  numAisles: 15,
  racksPerAisle: 20,
  levelsPerRack: 5,
  aisleLengthM: 40,
  aisleSpacingM: 4.5,
  aisleWidthM: 3.0,
};

export type VelocityClass = "A" | "B" | "C" | "D";
export type ColorMode = "velocity" | "zone" | "category";
export type ViewMode = "3d" | "2d";
