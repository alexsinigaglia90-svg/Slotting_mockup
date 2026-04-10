"""Slotting evaluator — score a slotting assignment by simulating pick routes."""

from slotting.engine.pick_route import PickRouteSolver
from slotting.engine.types import SlottingAssignment, SlottingScore
from slotting.models.order import Order
from slotting.models.warehouse import Warehouse
from slotting.warehouse_graph import WarehouseGraph


class SlottingEvaluator:
    """Evaluate a slotting assignment by computing average pick-route distance."""

    def __init__(self, warehouse: Warehouse, graph: WarehouseGraph,
                 heuristic: str = "largest_gap") -> None:
        self._warehouse = warehouse
        self._graph = graph
        self._solver = PickRouteSolver(warehouse, graph)
        self._heuristic = heuristic

    def score(self, assignment: SlottingAssignment, orders: list[Order],
              max_orders: int | None = None) -> SlottingScore:
        sku_to_location: dict[str, str] = {
            sku_id: loc_id for loc_id, sku_id in assignment.items()
        }
        eval_orders = orders[:max_orders] if max_orders and len(orders) > max_orders else orders

        total_distance = 0.0
        total_aisles = 0.0
        total_picks = 0.0
        scored_orders = 0

        route_fn = (
            self._solver.s_shape if self._heuristic == "s_shape"
            else self._solver.largest_gap
        )

        for order in eval_orders:
            pick_locations = [
                sku_to_location[line.sku_id]
                for line in order.lines
                if line.sku_id in sku_to_location
            ]
            if not pick_locations:
                continue

            result = route_fn(pick_locations)
            total_distance += result.total_distance
            total_aisles += result.aisles_visited
            total_picks += len(pick_locations)
            scored_orders += 1

        if scored_orders == 0:
            return SlottingScore(
                avg_distance_per_order=0.0, total_distance_sampled=0.0,
                num_orders_sampled=0, avg_aisles_per_order=0.0, avg_picks_per_order=0.0,
            )

        return SlottingScore(
            avg_distance_per_order=total_distance / scored_orders,
            total_distance_sampled=total_distance,
            num_orders_sampled=scored_orders,
            avg_aisles_per_order=total_aisles / scored_orders,
            avg_picks_per_order=total_picks / scored_orders,
        )
