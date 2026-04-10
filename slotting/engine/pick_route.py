"""Pick-route solver — S-shape and largest gap heuristics."""

from collections import defaultdict
from slotting.engine.types import PickRouteResult
from slotting.models.warehouse import Warehouse, Location
from slotting.warehouse_graph import WarehouseGraph


class PickRouteSolver:
    """Compute pick routes using S-shape and largest gap heuristics."""

    def __init__(self, warehouse: Warehouse, graph: WarehouseGraph) -> None:
        self._warehouse = warehouse
        self._graph = graph
        self._loc_map: dict[str, Location] = {}
        self._loc_position: dict[str, float] = {}
        for aisle in warehouse.aisles:
            max_pos = max((r.position for r in aisle.racks), default=1)
            for rack in aisle.racks:
                for loc in rack.locations:
                    self._loc_map[loc.id] = loc
                    self._loc_position[loc.id] = (rack.position / max_pos) * aisle.length_m

    def _group_by_aisle(self, location_ids: list[str]) -> dict[str, list[tuple[str, float]]]:
        aisle_locs: dict[str, list[tuple[str, float]]] = defaultdict(list)
        for loc_id in location_ids:
            loc = self._loc_map.get(loc_id)
            if loc is None:
                continue
            pos = self._loc_position[loc_id]
            aisle_locs[loc.aisle_id].append((loc_id, pos))
        for aisle_id in aisle_locs:
            aisle_locs[aisle_id].sort(key=lambda x: x[1])
        return dict(aisle_locs)

    def s_shape(self, location_ids: list[str]) -> PickRouteResult:
        if not location_ids:
            return PickRouteResult(route=[], waypoints=["depot", "depot"],
                                   total_distance=0.0, aisles_visited=0, heuristic="s_shape")

        aisle_locs = self._group_by_aisle(location_ids)
        sorted_aisles = sorted(aisle_locs.keys())
        waypoints = ["depot"]
        route: list[str] = []
        total_distance = 0.0
        current_node = "depot"
        at_front = True

        for aisle_id in sorted_aisles:
            front = f"{aisle_id}_front"
            back = f"{aisle_id}_back"
            if at_front:
                enter, exit_ = front, back
            else:
                enter, exit_ = back, front
            total_distance += self._graph.distance(current_node, enter)
            waypoints.append(enter)
            locs_in_aisle = aisle_locs[aisle_id]
            if not at_front:
                locs_in_aisle = list(reversed(locs_in_aisle))
            for loc_id, _ in locs_in_aisle:
                route.append(loc_id)
            total_distance += self._graph.distance(enter, exit_)
            waypoints.append(exit_)
            current_node = exit_
            at_front = not at_front

        total_distance += self._graph.distance(current_node, "depot")
        waypoints.append("depot")
        return PickRouteResult(route=route, waypoints=waypoints,
                               total_distance=total_distance,
                               aisles_visited=len(sorted_aisles), heuristic="s_shape")

    def largest_gap(self, location_ids: list[str]) -> PickRouteResult:
        if not location_ids:
            return PickRouteResult(route=[], waypoints=["depot", "depot"],
                                   total_distance=0.0, aisles_visited=0, heuristic="largest_gap")

        aisle_locs = self._group_by_aisle(location_ids)
        sorted_aisles = sorted(aisle_locs.keys())

        # Classify each aisle: "front_return", "back_return", or "traverse"
        # traverse aisles will be S-shape routed; return aisles use return routing.
        aisle_class: dict[str, str] = {}
        aisle_depth: dict[str, float] = {}
        aisle_ordered: dict[str, list[str]] = {}

        for aisle_id in sorted_aisles:
            locs = aisle_locs[aisle_id]
            positions = [pos for _, pos in locs]
            aisle_length = self._get_aisle_length(aisle_id)
            strategy = self._compute_gap_strategy(positions, aisle_length)
            stype = strategy["type"]
            all_loc_ids = [lid for lid, _ in locs]
            if stype == "front_only":
                depth = strategy["depth"]
                if depth >= aisle_length:
                    aisle_class[aisle_id] = "traverse"
                    aisle_depth[aisle_id] = aisle_length
                    aisle_ordered[aisle_id] = all_loc_ids
                else:
                    aisle_class[aisle_id] = "front_return"
                    aisle_depth[aisle_id] = depth
                    aisle_ordered[aisle_id] = all_loc_ids
            elif stype == "back_only":
                depth = strategy["depth"]
                if depth >= aisle_length:
                    aisle_class[aisle_id] = "traverse"
                    aisle_depth[aisle_id] = aisle_length
                    aisle_ordered[aisle_id] = all_loc_ids
                else:
                    aisle_class[aisle_id] = "back_return"
                    aisle_depth[aisle_id] = depth
                    aisle_ordered[aisle_id] = list(reversed(all_loc_ids))
            else:
                # "both": picks on both sides of the largest gap — use front_return
                # with the deepest front pick (saves back penetration).
                aisle_class[aisle_id] = "front_return"
                aisle_depth[aisle_id] = strategy["front_depth"]
                aisle_ordered[aisle_id] = all_loc_ids

        # Separate traverse from return aisles.
        traverse_ids = sorted(a for a in sorted_aisles if aisle_class[a] == "traverse")
        front_ret_ids = sorted(a for a in sorted_aisles if aisle_class[a] == "front_return")
        back_ret_ids = sorted(a for a in sorted_aisles if aisle_class[a] == "back_return")

        waypoints = ["depot"]
        route: list[str] = []
        total_distance = 0.0
        current_node = "depot"

        # Route traverse aisles with S-shape alternation.
        at_front = True
        for aisle_id in traverse_ids:
            front = f"{aisle_id}_front"
            back = f"{aisle_id}_back"
            if at_front:
                enter, exit_ = front, back
                locs_ordered = aisle_ordered[aisle_id]
            else:
                enter, exit_ = back, front
                locs_ordered = list(reversed(aisle_ordered[aisle_id]))
            total_distance += self._graph.distance(current_node, enter)
            waypoints.append(enter)
            route.extend(locs_ordered)
            total_distance += aisle_depth[aisle_id]
            waypoints.append(exit_)
            current_node = exit_
            at_front = not at_front

        # Route front-return aisles (enter from front, return to front).
        for aisle_id in front_ret_ids:
            front = f"{aisle_id}_front"
            total_distance += self._graph.distance(current_node, front)
            waypoints.append(front)
            route.extend(aisle_ordered[aisle_id])
            total_distance += 2 * aisle_depth[aisle_id]
            current_node = front

        # Route back-return aisles (enter from back, return to back).
        if back_ret_ids:
            rightmost_id = max(back_ret_ids)
            cross_back = f"{rightmost_id}_back"
            total_distance += self._graph.distance(current_node, cross_back)
            waypoints.append(cross_back)
            current_node = cross_back
            for aisle_id in sorted(back_ret_ids, reverse=True):
                back = f"{aisle_id}_back"
                total_distance += self._graph.distance(current_node, back)
                waypoints.append(back)
                route.extend(aisle_ordered[aisle_id])
                total_distance += 2 * aisle_depth[aisle_id]
                current_node = back

        total_distance += self._graph.distance(current_node, "depot")
        waypoints.append("depot")
        return PickRouteResult(route=route, waypoints=waypoints,
                               total_distance=total_distance,
                               aisles_visited=len(sorted_aisles), heuristic="largest_gap")

    def _get_aisle_length(self, aisle_id: str) -> float:
        for aisle in self._warehouse.aisles:
            if aisle.id == aisle_id:
                return aisle.length_m
        return 0.0

    @staticmethod
    def _compute_gap_strategy(positions: list[float], aisle_length: float) -> dict:
        if not positions:
            return {"type": "front_only", "depth": 0.0}
        gaps: list[tuple[str, int, float]] = []
        gaps.append(("front", -1, positions[0]))
        for i in range(len(positions) - 1):
            gaps.append(("interior", i, positions[i + 1] - positions[i]))
        gaps.append(("back", len(positions), aisle_length - positions[-1]))
        largest = max(gaps, key=lambda g: g[2])
        gap_type, gap_index, _ = largest
        if gap_type == "front":
            return {"type": "back_only", "depth": aisle_length - positions[0]}
        elif gap_type == "back":
            return {"type": "front_only", "depth": positions[-1]}
        else:
            front_depth = positions[gap_index]
            back_depth = aisle_length - positions[gap_index + 1]
            # Collapse degenerate splits where one side has no picks beyond the gap.
            if back_depth <= 0.0:
                return {"type": "front_only", "depth": positions[-1]}
            if front_depth <= 0.0:
                return {"type": "back_only", "depth": aisle_length - positions[0]}
            return {"type": "both", "split_index": gap_index,
                    "front_depth": front_depth,
                    "back_depth": back_depth}
