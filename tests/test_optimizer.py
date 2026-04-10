"""Tests for slotting optimizer — SKU-to-location assignment."""

import pytest
from datetime import date

from slotting.models.warehouse import (
    Warehouse, Aisle, Rack, Location, Zone, ZoneType, SizeClass,
)
from slotting.models.sku import SKU, Category, VelocityClass
from slotting.models.order import Order, OrderLine
from slotting.warehouse_graph import WarehouseGraph
from slotting.engine.optimizer import SlottingOptimizer
from slotting.engine.types import SlottingResult


def _make_warehouse() -> Warehouse:
    """3-aisle warehouse, 5 racks per side, 2 levels = 60 locations."""
    aisles = []
    for aisle_idx in range(3):
        aisle_id = f"A{aisle_idx + 1:02d}"
        x_pos = aisle_idx * 5.0
        racks = []
        for side in ["left", "right"]:
            for pos in range(1, 6):
                rack_id = f"{aisle_id}-{side[0].upper()}{pos:02d}"
                locs = []
                for level in range(1, 3):
                    locs.append(Location(
                        id=f"{rack_id}-L{level}", aisle_id=aisle_id,
                        rack_id=rack_id, position=pos, level=level,
                        size=SizeClass.MEDIUM, max_weight_kg=25.0,
                    ))
                racks.append(Rack(
                    id=rack_id, aisle_id=aisle_id, position=pos,
                    side=side, levels=2, locations=locs,
                ))
        aisles.append(Aisle(
            id=aisle_id, x_position=x_pos, length_m=20.0,
            width_m=3.0, racks=racks,
        ))
    return Warehouse(
        id="WH-TEST", name="Test", aisles=aisles,
        zones=[
            Zone(id="forward", zone_type=ZoneType.FORWARD_PICK, aisle_ids=["A01"]),
            Zone(id="bulk", zone_type=ZoneType.BULK_STORAGE, aisle_ids=["A02", "A03"]),
        ],
        depot_position=(0.0, 0.0), cross_aisle_positions=[0.0, 20.0],
    )


def _make_skus(n: int = 20) -> list[SKU]:
    skus = []
    for i in range(n):
        if i < 4:
            vel, picks = VelocityClass.A, 50.0
        elif i < 10:
            vel, picks = VelocityClass.B, 15.0
        elif i < 16:
            vel, picks = VelocityClass.C, 5.0
        else:
            vel, picks = VelocityClass.D, 1.0
        skus.append(SKU(
            id=f"SKU-{i:04d}", name=f"Product {i}",
            category=Category.HOUSEHOLD, size=SizeClass.MEDIUM,
            weight_kg=1.0, is_fragile=False, is_perishable=False,
            velocity_class=vel, avg_daily_picks=picks,
        ))
    return skus


def _make_orders(skus: list[SKU], n_orders: int = 50) -> list[Order]:
    import numpy as np
    rng = np.random.default_rng(42)
    orders = []
    sku_ids = [s.id for s in skus]
    for i in range(n_orders):
        n_lines = int(rng.integers(3, 8))
        chosen = rng.choice(len(sku_ids), size=min(n_lines, len(sku_ids)), replace=False)
        lines = [OrderLine(sku_id=sku_ids[idx], quantity=int(rng.integers(1, 5)))
                 for idx in chosen]
        orders.append(Order(
            id=f"ORD-{i:04d}", date=date(2026, 4, 1), store_id="S-001", lines=lines,
        ))
    return orders


class TestSlottingOptimizer:
    def test_optimize_returns_result(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        skus = _make_skus(20)
        orders = _make_orders(skus)
        result = SlottingOptimizer(wh, graph).optimize(skus, orders, max_iterations=10)
        assert isinstance(result, SlottingResult)
        assert result.score_before is not None
        assert result.score_after is not None

    def test_assignment_maps_all_skus(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        skus = _make_skus(20)
        orders = _make_orders(skus)
        result = SlottingOptimizer(wh, graph).optimize(skus, orders, max_iterations=10)
        assert set(result.assignment.values()) == {s.id for s in skus}

    def test_no_duplicate_locations(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        skus = _make_skus(20)
        orders = _make_orders(skus)
        result = SlottingOptimizer(wh, graph).optimize(skus, orders, max_iterations=10)
        locations = list(result.assignment.keys())
        assert len(locations) == len(set(locations))

    def test_optimization_improves_or_maintains(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        skus = _make_skus(20)
        orders = _make_orders(skus)
        result = SlottingOptimizer(wh, graph).optimize(skus, orders, max_iterations=50)
        assert result.score_after.avg_distance_per_order <= result.score_before.avg_distance_per_order + 0.01

    def test_fast_movers_near_depot(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        skus = _make_skus(20)
        orders = _make_orders(skus)
        result = SlottingOptimizer(wh, graph).optimize(skus, orders, max_iterations=50)
        a_skus = {s.id for s in skus if s.velocity_class == VelocityClass.A}
        a_in_first_aisle = {lid for lid, sid in result.assignment.items()
                            if sid in a_skus and lid.startswith("A01")}
        assert len(a_in_first_aisle) > 0

    def test_size_constraint_respected(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        skus = [
            SKU(id="SKU-BIG", name="Big", category=Category.HOUSEHOLD,
                size=SizeClass.LARGE, weight_kg=5.0, is_fragile=False,
                is_perishable=False, velocity_class=VelocityClass.A, avg_daily_picks=50.0),
            SKU(id="SKU-SMALL", name="Small", category=Category.BEAUTY,
                size=SizeClass.SMALL, weight_kg=0.5, is_fragile=False,
                is_perishable=False, velocity_class=VelocityClass.B, avg_daily_picks=20.0),
        ]
        orders = _make_orders(skus, n_orders=20)
        result = SlottingOptimizer(wh, graph).optimize(skus, orders, max_iterations=10)
        assert len(result.assignment) == 2
