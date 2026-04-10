"""API route definitions for the slotting engine."""

from fastapi import APIRouter, HTTPException

from slotting.api.schemas import (
    HealthResponse, OptimizeRequest, OptimizeResponse,
    PickRouteRequest, PickRouteResponse, ScoreResponse,
)
from slotting.engine.optimizer import SlottingOptimizer
from slotting.engine.pick_route import PickRouteSolver
from slotting.engine.types import SlottingAssignment
from slotting.generators.order_generator import OrderGenConfig, generate_orders
from slotting.generators.sku_generator import generate_skus
from slotting.generators.warehouse_generator import generate_warehouse
from slotting.warehouse_graph import WarehouseGraph

router = APIRouter()

_state: dict = {"assignment": None, "warehouse": None, "graph": None}


@router.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse()


@router.post("/optimize", response_model=OptimizeResponse)
def optimize(request: OptimizeRequest):
    warehouse = generate_warehouse(seed=request.warehouse_seed)
    skus = generate_skus(seed=request.sku_seed)
    orders = generate_orders(
        skus,
        config=OrderGenConfig(orders_per_day=request.num_orders, num_days=request.num_days),
        seed=request.order_seed,
    )

    graph = WarehouseGraph(warehouse)
    optimizer = SlottingOptimizer(warehouse, graph)
    result = optimizer.optimize(skus=skus, orders=orders, max_iterations=request.max_iterations)

    _state["assignment"] = result.assignment
    _state["warehouse"] = warehouse
    _state["graph"] = graph

    def _score(s):
        return ScoreResponse(
            avg_distance_per_order=s.avg_distance_per_order,
            total_distance_sampled=s.total_distance_sampled,
            num_orders_sampled=s.num_orders_sampled,
            avg_aisles_per_order=s.avg_aisles_per_order,
            avg_picks_per_order=s.avg_picks_per_order,
            distance_per_pick=s.distance_per_pick,
        )

    return OptimizeResponse(
        score_before=_score(result.score_before),
        score_after=_score(result.score_after),
        improvement_pct=result.improvement_pct,
        iterations=result.iterations,
        num_skus_assigned=len(result.assignment),
        num_locations_total=warehouse.total_locations,
    )


@router.post("/pick-route", response_model=PickRouteResponse)
def pick_route(request: PickRouteRequest):
    assignment: SlottingAssignment | None = _state.get("assignment")
    warehouse = _state.get("warehouse")
    graph = _state.get("graph")

    if assignment is None or warehouse is None or graph is None:
        raise HTTPException(status_code=404, detail="No optimization has been run yet.")

    sku_to_loc = {sku_id: loc_id for loc_id, sku_id in assignment.items()}
    pick_locations = [sku_to_loc[sid] for sid in request.sku_ids if sid in sku_to_loc]

    if not pick_locations:
        raise HTTPException(status_code=404, detail="None of the requested SKUs are assigned.")

    solver = PickRouteSolver(warehouse, graph)
    result = solver.s_shape(pick_locations) if request.heuristic == "s_shape" else solver.largest_gap(pick_locations)

    return PickRouteResponse(
        waypoints=result.waypoints,
        total_distance=result.total_distance,
        aisles_visited=result.aisles_visited,
        heuristic=result.heuristic,
    )
