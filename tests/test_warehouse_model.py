from slotting.models.warehouse import (
    Location, Rack, Aisle, Zone, ZoneType, Warehouse, SizeClass,
)


def test_location_creation():
    loc = Location(
        id="A01-01-1", aisle_id="A01", rack_id="A01-01",
        position=1, level=1, size=SizeClass.MEDIUM, max_weight_kg=25.0,
    )
    assert loc.id == "A01-01-1"
    assert loc.level == 1
    assert loc.is_ground_level


def test_location_not_ground_level():
    loc = Location(
        id="A01-01-4", aisle_id="A01", rack_id="A01-01",
        position=1, level=4, size=SizeClass.MEDIUM, max_weight_kg=25.0,
    )
    assert not loc.is_ground_level


def test_rack_creation():
    rack = Rack(
        id="A01-01", aisle_id="A01", position=1, side="left", levels=4, locations=[],
    )
    assert rack.id == "A01-01"
    assert rack.side == "left"


def test_aisle_creation():
    aisle = Aisle(id="A01", x_position=0.0, length_m=30.0, width_m=3.0, racks=[])
    assert aisle.id == "A01"
    assert aisle.length_m == 30.0


def test_zone_creation():
    zone = Zone(id="forward-pick", zone_type=ZoneType.FORWARD_PICK, aisle_ids=["A01", "A02", "A03"])
    assert zone.zone_type == ZoneType.FORWARD_PICK
    assert len(zone.aisle_ids) == 3


def test_warehouse_creation():
    wh = Warehouse(
        id="WH-NL-01", name="Action DC Echt", aisles=[], zones=[],
        depot_position=(0.0, 0.0), cross_aisle_positions=[0.0, 30.0],
    )
    assert wh.id == "WH-NL-01"
    assert wh.depot_position == (0.0, 0.0)


def test_warehouse_location_count():
    loc1 = Location(id="A01-01-1", aisle_id="A01", rack_id="A01-01",
                    position=1, level=1, size=SizeClass.SMALL, max_weight_kg=10.0)
    loc2 = Location(id="A01-01-2", aisle_id="A01", rack_id="A01-01",
                    position=1, level=2, size=SizeClass.SMALL, max_weight_kg=10.0)
    rack = Rack(id="A01-01", aisle_id="A01", position=1, side="left", levels=2, locations=[loc1, loc2])
    aisle = Aisle(id="A01", x_position=0.0, length_m=30.0, width_m=3.0, racks=[rack])
    wh = Warehouse(id="WH-01", name="Test", aisles=[aisle], zones=[],
                   depot_position=(0.0, 0.0), cross_aisle_positions=[0.0, 30.0])
    assert wh.total_locations == 2
