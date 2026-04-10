import pytest
from slotting.models.warehouse import (
    Warehouse, Aisle, Rack, Location, Zone, ZoneType, SizeClass,
)
from slotting.warehouse_graph import WarehouseGraph


def _make_simple_warehouse() -> Warehouse:
    """2-aisle warehouse, 2 racks per aisle, 2 levels, aisle length 20m."""
    racks_all = []
    for aisle_idx, aisle_id in enumerate(["A01", "A02"]):
        aisle_racks = []
        for pos in range(1, 3):
            rack_id = f"{aisle_id}-{pos:02d}"
            rack_locs = []
            for level in range(1, 3):
                loc = Location(
                    id=f"{rack_id}-{level}", aisle_id=aisle_id, rack_id=rack_id,
                    position=pos, level=level, size=SizeClass.MEDIUM, max_weight_kg=25.0,
                )
                rack_locs.append(loc)
            rack = Rack(id=rack_id, aisle_id=aisle_id, position=pos, side="left",
                        levels=2, locations=rack_locs)
            aisle_racks.append(rack)
        racks_all.extend(aisle_racks)

    aisles = [
        Aisle(id="A01", x_position=0.0, length_m=20.0, width_m=3.0,
              racks=[r for r in racks_all if r.aisle_id == "A01"]),
        Aisle(id="A02", x_position=5.0, length_m=20.0, width_m=3.0,
              racks=[r for r in racks_all if r.aisle_id == "A02"]),
    ]
    return Warehouse(
        id="WH-TEST", name="Test Warehouse", aisles=aisles, zones=[],
        depot_position=(0.0, 0.0), cross_aisle_positions=[0.0, 20.0],
    )


def test_graph_construction():
    graph = WarehouseGraph(_make_simple_warehouse())
    assert graph.node_count > 0
    assert graph.edge_count > 0


def test_graph_has_depot():
    graph = WarehouseGraph(_make_simple_warehouse())
    assert graph.has_node("depot")


def test_graph_has_aisle_entrances():
    graph = WarehouseGraph(_make_simple_warehouse())
    for name in ["A01_front", "A01_back", "A02_front", "A02_back"]:
        assert graph.has_node(name)


def test_distance_same_aisle():
    graph = WarehouseGraph(_make_simple_warehouse())
    assert graph.distance("A01_front", "A01_back") == pytest.approx(20.0)


def test_distance_cross_aisle():
    graph = WarehouseGraph(_make_simple_warehouse())
    assert graph.distance("A01_front", "A02_front") == pytest.approx(5.0)


def test_distance_depot_to_aisle():
    graph = WarehouseGraph(_make_simple_warehouse())
    assert graph.distance("depot", "A01_front") == pytest.approx(0.0)


def test_distance_matrix():
    graph = WarehouseGraph(_make_simple_warehouse())
    nodes = ["depot", "A01_front", "A02_front"]
    matrix = graph.distance_matrix(nodes)
    assert matrix["depot"]["A01_front"] == pytest.approx(0.0)
    assert matrix["A01_front"]["A02_front"] == pytest.approx(5.0)
    assert matrix["A02_front"]["A01_front"] == pytest.approx(5.0)
