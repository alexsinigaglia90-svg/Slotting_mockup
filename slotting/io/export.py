"""Export warehouse data to JSON/CSV for interchange and real data import compatibility."""

import csv
import json
from pathlib import Path

from slotting.models.warehouse import Warehouse
from slotting.models.sku import SKU
from slotting.models.order import Order


def export_warehouse_json(warehouse: Warehouse, path: Path) -> None:
    data = {
        "id": warehouse.id,
        "name": warehouse.name,
        "depot_position": list(warehouse.depot_position),
        "cross_aisle_positions": warehouse.cross_aisle_positions,
        "aisles": [
            {
                "id": aisle.id,
                "x_position": aisle.x_position,
                "length_m": aisle.length_m,
                "width_m": aisle.width_m,
                "racks": [
                    {
                        "id": rack.id, "position": rack.position,
                        "side": rack.side, "levels": rack.levels,
                        "locations": [
                            {"id": loc.id, "position": loc.position,
                             "level": loc.level, "size": loc.size.value,
                             "max_weight_kg": loc.max_weight_kg, "sku_id": loc.sku_id}
                            for loc in rack.locations
                        ],
                    }
                    for rack in aisle.racks
                ],
            }
            for aisle in warehouse.aisles
        ],
        "zones": [
            {"id": zone.id, "zone_type": zone.zone_type.value, "aisle_ids": zone.aisle_ids}
            for zone in warehouse.zones
        ],
    }
    path.write_text(json.dumps(data, indent=2))


def export_skus_csv(skus: list[SKU], path: Path) -> None:
    fieldnames = ["id", "name", "category", "size", "weight_kg", "is_fragile",
                  "is_perishable", "velocity_class", "avg_daily_picks",
                  "seasonal_peak_months", "peak_multiplier"]
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for sku in skus:
            writer.writerow({
                "id": sku.id, "name": sku.name, "category": sku.category.value,
                "size": sku.size.value, "weight_kg": sku.weight_kg,
                "is_fragile": sku.is_fragile, "is_perishable": sku.is_perishable,
                "velocity_class": sku.velocity_class.value,
                "avg_daily_picks": sku.avg_daily_picks,
                "seasonal_peak_months": ",".join(str(m) for m in sku.seasonal_peak_months),
                "peak_multiplier": sku.peak_multiplier,
            })


def export_orders_csv(orders: list[Order], path: Path) -> None:
    fieldnames = ["order_id", "date", "store_id", "sku_id", "quantity", "location_id"]
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for order in orders:
            for line in order.lines:
                writer.writerow({
                    "order_id": order.id, "date": order.date.isoformat(),
                    "store_id": order.store_id, "sku_id": line.sku_id,
                    "quantity": line.quantity, "location_id": line.location_id or "",
                })
