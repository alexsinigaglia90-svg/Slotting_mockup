"""Pydantic request/response schemas for the slotting API."""

from pydantic import BaseModel, Field


class OptimizeRequest(BaseModel):
    warehouse_seed: int = Field(default=42, description="Seed for warehouse generation")
    sku_seed: int = Field(default=42, description="Seed for SKU generation")
    order_seed: int = Field(default=42, description="Seed for order generation")
    num_orders: int = Field(default=1000, description="Number of orders to generate")
    num_days: int = Field(default=1, description="Number of days of order history")
    max_iterations: int = Field(default=100, description="Max optimizer iterations")


class ScoreResponse(BaseModel):
    avg_distance_per_order: float
    total_distance_sampled: float
    num_orders_sampled: int
    avg_aisles_per_order: float
    avg_picks_per_order: float
    distance_per_pick: float


class OptimizeResponse(BaseModel):
    score_before: ScoreResponse
    score_after: ScoreResponse
    improvement_pct: float
    iterations: int
    num_skus_assigned: int
    num_locations_total: int


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.2.0"


class PickRouteRequest(BaseModel):
    sku_ids: list[str]
    heuristic: str = Field(default="largest_gap", pattern="^(s_shape|largest_gap)$")


class PickRouteResponse(BaseModel):
    waypoints: list[str]
    total_distance: float
    aisles_visited: int
    heuristic: str
