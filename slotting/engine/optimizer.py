"""Slotting optimizer — assign SKUs to warehouse locations to minimize pick distance.

Strategy:
1. Greedy initial assignment: rank SKUs by velocity, rank locations by depot distance.
2. Local search improvement: swap pairs and keep improvements.
"""

import numpy as np

from slotting.engine.evaluator import SlottingEvaluator
from slotting.engine.types import SlottingAssignment, SlottingResult
from slotting.engine.velocity import VelocityClassifier
from slotting.models.order import Order
from slotting.models.sku import SKU, VelocityClass
from slotting.models.warehouse import Location, SizeClass, Warehouse
from slotting.warehouse_graph import WarehouseGraph

_VELOCITY_PRIORITY = {
    VelocityClass.A: 0,
    VelocityClass.B: 1,
    VelocityClass.C: 2,
    VelocityClass.D: 3,
}

_SIZE_ORDER = {SizeClass.SMALL: 0, SizeClass.MEDIUM: 1, SizeClass.LARGE: 2}


def _size_fits(sku_size: SizeClass, loc_size: SizeClass) -> bool:
    # Allow placement in same or larger location. For practical purposes,
    # a LARGE SKU can fit in a MEDIUM location (it just takes more space).
    # Only block LARGE in SMALL.
    if sku_size == SizeClass.LARGE and loc_size == SizeClass.SMALL:
        return False
    return True


class SlottingOptimizer:
    """Optimize SKU-to-location assignment for minimum pick distance."""

    def __init__(self, warehouse: Warehouse, graph: WarehouseGraph) -> None:
        self._warehouse = warehouse
        self._graph = graph
        self._evaluator = SlottingEvaluator(warehouse, graph)
        self._locations: list[Location] = []
        self._loc_depot_dist: dict[str, float] = {}
        for aisle in warehouse.aisles:
            front_dist = graph.distance("depot", f"{aisle.id}_front")
            max_pos = max((r.position for r in aisle.racks), default=1)
            for rack in aisle.racks:
                for loc in rack.locations:
                    self._locations.append(loc)
                    pos_frac = rack.position / max_pos
                    self._loc_depot_dist[loc.id] = front_dist + pos_frac * aisle.length_m

    def optimize(self, skus: list[SKU], orders: list[Order],
                 max_iterations: int = 100, seed: int = 42) -> SlottingResult:
        rng = np.random.default_rng(seed)

        classifier = VelocityClassifier(skus, orders)
        velocity_map = classifier.classify()

        before_assignment = self._random_assignment(skus, rng)
        score_before = self._evaluator.score(before_assignment, orders, max_orders=200)

        assignment = self._greedy_assignment(skus, velocity_map)
        assignment, iterations = self._local_search(assignment, orders, max_iterations, rng)

        score_after = self._evaluator.score(assignment, orders, max_orders=200)

        improvement = 0.0
        if score_before.avg_distance_per_order > 0:
            improvement = (
                (score_before.avg_distance_per_order - score_after.avg_distance_per_order)
                / score_before.avg_distance_per_order * 100.0
            )

        return SlottingResult(
            assignment=assignment,
            score_before=score_before,
            score_after=score_after,
            iterations=iterations,
            improvement_pct=improvement,
        )

    def _random_assignment(self, skus: list[SKU], rng: np.random.Generator) -> SlottingAssignment:
        available = list(self._locations)
        rng.shuffle(available)  # type: ignore[arg-type]
        assignment: SlottingAssignment = {}
        for i, sku in enumerate(skus):
            if i < len(available):
                assignment[available[i].id] = sku.id
        return assignment

    def _greedy_assignment(self, skus: list[SKU],
                           velocity_map: dict[str, VelocityClass]) -> SlottingAssignment:
        sorted_skus = sorted(
            skus,
            key=lambda s: (
                _VELOCITY_PRIORITY.get(velocity_map.get(s.id, s.velocity_class), 3),
                -s.avg_daily_picks,
            ),
        )
        sorted_locs = sorted(
            self._locations,
            key=lambda loc: (self._loc_depot_dist[loc.id], loc.level),
        )

        assignment: SlottingAssignment = {}
        used_locs: set[str] = set()

        for sku in sorted_skus:
            for loc in sorted_locs:
                if loc.id in used_locs:
                    continue
                if not _size_fits(sku.size, loc.size):
                    continue
                if sku.weight_kg > loc.max_weight_kg:
                    continue
                assignment[loc.id] = sku.id
                used_locs.add(loc.id)
                break

        return assignment

    def _local_search(self, assignment: SlottingAssignment, orders: list[Order],
                      max_iterations: int, rng: np.random.Generator
                      ) -> tuple[SlottingAssignment, int]:
        if len(assignment) < 2:
            return assignment, 0

        current_score = self._evaluator.score(assignment, orders, max_orders=100)
        best_distance = current_score.avg_distance_per_order
        loc_ids = list(assignment.keys())

        for iteration in range(max_iterations):
            idx_a, idx_b = rng.choice(len(loc_ids), size=2, replace=False)
            loc_a, loc_b = loc_ids[idx_a], loc_ids[idx_b]

            candidate = dict(assignment)
            candidate[loc_a] = assignment[loc_b]
            candidate[loc_b] = assignment[loc_a]

            candidate_score = self._evaluator.score(candidate, orders, max_orders=100)
            if candidate_score.avg_distance_per_order < best_distance:
                assignment = candidate
                best_distance = candidate_score.avg_distance_per_order

        return assignment, max_iterations
