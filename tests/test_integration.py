"""Integration test: generate a full Action-profile dataset and verify consistency."""

from slotting.generators.warehouse_generator import generate_warehouse
from slotting.generators.sku_generator import generate_skus
from slotting.generators.order_generator import generate_orders, OrderGenConfig
from slotting.warehouse_graph import WarehouseGraph


def test_full_pipeline():
    # Generate warehouse — default config: 15 aisles × 20 racks × 2 sides × 5 levels = 3000 locations
    wh = generate_warehouse(seed=42)
    assert wh.total_locations > 2500

    # Generate SKUs — default config: 10 000 SKUs
    skus = generate_skus(seed=42)
    assert len(skus) > 8000

    # Generate orders referencing valid SKUs
    sku_ids = {s.id for s in skus}
    config = OrderGenConfig(orders_per_day=100, num_days=2)
    orders = generate_orders(skus=skus, config=config, seed=42)
    assert len(orders) > 0
    for order in orders:
        for line in order.lines:
            assert line.sku_id in sku_ids

    # Build warehouse graph
    graph = WarehouseGraph(wh)
    assert graph.node_count > 0

    # Verify distances are computable between depot and all aisle entrances
    for aisle in wh.aisles:
        d = graph.distance("depot", f"{aisle.id}_front")
        assert d >= 0.0
