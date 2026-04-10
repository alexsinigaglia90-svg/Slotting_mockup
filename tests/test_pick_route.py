"""Tests for pick-route solver — S-shape and largest gap heuristics."""

import pytest
from slotting.models.warehouse import Warehouse, Aisle, Rack, Location, SizeClass
from slotting.warehouse_graph import WarehouseGraph
from slotting.engine.pick_route import PickRouteSolver


def _make_warehouse() -> Warehouse:
    """3-aisle warehouse, 10 racks per aisle side, 3 levels, aisle length 20m."""
    aisles = []
    for aisle_idx in range(3):
        aisle_id = f"A{aisle_idx + 1:02d}"
        x_pos = aisle_idx * 5.0
        racks = []
        for side in ["left", "right"]:
            for pos in range(1, 11):
                rack_id = f"{aisle_id}-{side[0].upper()}{pos:02d}"
                locs = []
                for level in range(1, 4):
                    locs.append(Location(
                        id=f"{rack_id}-L{level}", aisle_id=aisle_id,
                        rack_id=rack_id, position=pos, level=level,
                        size=SizeClass.MEDIUM, max_weight_kg=25.0,
                    ))
                racks.append(Rack(
                    id=rack_id, aisle_id=aisle_id, position=pos,
                    side=side, levels=3, locations=locs,
                ))
        aisles.append(Aisle(
            id=aisle_id, x_position=x_pos, length_m=20.0,
            width_m=3.0, racks=racks,
        ))
    return Warehouse(
        id="WH-TEST", name="Test WH", aisles=aisles, zones=[],
        depot_position=(0.0, 0.0), cross_aisle_positions=[0.0, 20.0],
    )


@pytest.fixture
def warehouse():
    return _make_warehouse()

@pytest.fixture
def graph(warehouse):
    return WarehouseGraph(warehouse)

@pytest.fixture
def solver(warehouse, graph):
    return PickRouteSolver(warehouse, graph)


class TestSShape:
    def test_empty_picks_returns_zero(self, solver):
        result = solver.s_shape([])
        assert result.total_distance == pytest.approx(0.0)
        assert result.aisles_visited == 0
        assert result.heuristic == "s_shape"

    def test_single_aisle_picks(self, solver):
        pick_locs = ["A01-L01-L1", "A01-L05-L2"]
        result = solver.s_shape(pick_locs)
        assert result.total_distance > 0.0
        assert result.aisles_visited == 1

    def test_multi_aisle_picks(self, solver):
        pick_locs = ["A01-L01-L1", "A02-L05-L2", "A03-L10-L3"]
        result = solver.s_shape(pick_locs)
        assert result.aisles_visited == 3
        assert result.total_distance > 0.0

    def test_route_starts_and_ends_at_depot(self, solver):
        pick_locs = ["A01-L01-L1", "A02-L05-L2"]
        result = solver.s_shape(pick_locs)
        assert result.waypoints[0] == "depot"
        assert result.waypoints[-1] == "depot"


class TestLargestGap:
    def test_empty_picks_returns_zero(self, solver):
        result = solver.largest_gap([])
        assert result.total_distance == pytest.approx(0.0)
        assert result.aisles_visited == 0
        assert result.heuristic == "largest_gap"

    def test_single_aisle_pick(self, solver):
        pick_locs = ["A01-L01-L1"]
        result = solver.largest_gap(pick_locs)
        assert result.total_distance > 0.0
        assert result.aisles_visited == 1

    def test_largest_gap_shorter_than_sshape(self, solver):
        pick_locs = ["A01-L01-L1", "A03-L02-L1"]
        s_result = solver.s_shape(pick_locs)
        lg_result = solver.largest_gap(pick_locs)
        assert lg_result.total_distance <= s_result.total_distance + 0.01

    def test_route_starts_and_ends_at_depot(self, solver):
        pick_locs = ["A01-L01-L1", "A02-L05-L2"]
        result = solver.largest_gap(pick_locs)
        assert result.waypoints[0] == "depot"
        assert result.waypoints[-1] == "depot"

    def test_dense_picks_similar_to_sshape(self, solver):
        pick_locs = [
            "A01-L01-L1", "A01-L05-L2", "A01-R10-L1",
            "A02-L01-L1", "A02-L05-L2", "A02-R10-L1",
            "A03-L01-L1", "A03-L05-L2", "A03-R10-L1",
        ]
        s_result = solver.s_shape(pick_locs)
        lg_result = solver.largest_gap(pick_locs)
        ratio = lg_result.total_distance / s_result.total_distance
        assert 0.7 <= ratio <= 1.05
