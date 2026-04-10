"""Shared type definitions for the optimization engine."""

from dataclasses import dataclass
from typing import TypeAlias

# A slotting assignment: location_id → sku_id.
# Location is frozen, so we store the mapping externally.
SlottingAssignment: TypeAlias = dict[str, str]

# A pick route: ordered list of location_ids representing the sequence of stops.
PickRoute: TypeAlias = list[str]


@dataclass
class SlottingScore:
    """Score of a slotting assignment — lower is better for distances."""

    avg_distance_per_order: float
    total_distance_sampled: float
    num_orders_sampled: int
    avg_aisles_per_order: float
    avg_picks_per_order: float

    @property
    def distance_per_pick(self) -> float:
        if self.avg_picks_per_order == 0:
            return 0.0
        return self.avg_distance_per_order / self.avg_picks_per_order


@dataclass
class SlottingResult:
    """Complete result of a slotting optimization run."""

    assignment: SlottingAssignment
    score_before: SlottingScore
    score_after: SlottingScore
    iterations: int
    improvement_pct: float

    @property
    def improved(self) -> bool:
        return self.improvement_pct > 0.0


@dataclass
class PickRouteResult:
    """Result of a pick-route calculation."""

    route: PickRoute
    waypoints: list[str]
    total_distance: float
    aisles_visited: int
    heuristic: str
