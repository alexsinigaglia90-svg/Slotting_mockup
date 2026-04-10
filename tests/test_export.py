import json
from pathlib import Path
from slotting.io.export import export_warehouse_json, export_skus_csv, export_orders_csv
from slotting.generators.warehouse_generator import generate_warehouse, WarehouseConfig
from slotting.generators.sku_generator import generate_skus, SKUConfig


def test_export_warehouse_json(tmp_path: Path):
    config = WarehouseConfig(num_aisles=2, racks_per_aisle=3, levels_per_rack=2)
    wh = generate_warehouse(config=config)
    path = tmp_path / "warehouse.json"
    export_warehouse_json(wh, path)
    assert path.exists()
    data = json.loads(path.read_text())
    assert data["id"] == wh.id
    assert len(data["aisles"]) == 2


def test_export_skus_csv(tmp_path: Path):
    skus = generate_skus(config=SKUConfig(total_skus=50), seed=42)
    path = tmp_path / "skus.csv"
    export_skus_csv(skus, path)
    assert path.exists()
    lines = path.read_text().strip().split("\n")
    assert len(lines) == 51  # header + 50 rows


def test_export_orders_csv(tmp_path: Path):
    from datetime import date
    from slotting.models.order import Order, OrderLine
    orders = [
        Order(id="ORD-001", date=date(2026, 4, 10), store_id="STORE-001",
              lines=[OrderLine(sku_id="SKU-00001", quantity=5),
                     OrderLine(sku_id="SKU-00002", quantity=3)])
    ]
    path = tmp_path / "orders.csv"
    export_orders_csv(orders, path)
    assert path.exists()
    lines = path.read_text().strip().split("\n")
    assert len(lines) == 3  # header + 2 order lines
