from slotting.generators.warehouse_generator import generate_warehouse, WarehouseConfig
from slotting.models.warehouse import ZoneType


def test_default_warehouse():
    wh = generate_warehouse()
    assert wh.id is not None
    assert len(wh.aisles) == 15
    assert wh.total_locations > 0


def test_custom_config():
    config = WarehouseConfig(
        num_aisles=5, racks_per_aisle=10, levels_per_rack=4,
        aisle_length_m=25.0, aisle_spacing_m=4.0, aisle_width_m=3.0,
    )
    wh = generate_warehouse(config=config, warehouse_id="WH-CUSTOM")
    assert wh.id == "WH-CUSTOM"
    assert len(wh.aisles) == 5
    # 5 aisles × 10 racks × 2 sides × 4 levels = 400 locations
    assert wh.total_locations == 400


def test_zones_created():
    wh = generate_warehouse()
    zone_types = {z.zone_type for z in wh.zones}
    assert ZoneType.FORWARD_PICK in zone_types
    assert ZoneType.BULK_STORAGE in zone_types


def test_reproducible_with_seed():
    wh1 = generate_warehouse(seed=42)
    wh2 = generate_warehouse(seed=42)
    assert wh1.total_locations == wh2.total_locations
    assert len(wh1.aisles) == len(wh2.aisles)


def test_cross_aisles():
    wh = generate_warehouse()
    assert len(wh.cross_aisle_positions) >= 2
