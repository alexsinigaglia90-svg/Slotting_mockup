"""Tests for slotting evaluator — scoring a slotting assignment."""

import pytest
from datetime import date

from slotting.models.warehouse import Warehouse, Aisle, Rack, Location, SizeClass
from slotting.models.order import Order, OrderLine
from slotting.warehouse_graph import WarehouseGraph
from slotting.engine.evaluator import SlottingEvaluator
from slotting.engine.types import SlottingAssignment, SlottingScore


def _make_warehouse() -> Warehouse:
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
                racks.append(Rack(id=rack_id, aisle_id=aisle_id, position=pos,
                                  side=side, levels=2, locations=locs))
        aisles.append(Aisle(id=aisle_id, x_position=x_pos, length_m=20.0,
                            width_m=3.0, racks=racks))
    return Warehouse(id="WH-TEST", name="Test", aisles=aisles, zones=[],
                     depot_position=(0.0, 0.0), cross_aisle_positions=[0.0, 20.0])


def _make_orders(assignment: SlottingAssignment) -> list[Order]:
    sku_ids = list(assignment.values())
    orders = []
    for i in range(20):
        lines = [
            OrderLine(sku_id=sku_ids[i % len(sku_ids)], quantity=1),
            OrderLine(sku_id=sku_ids[(i + 1) % len(sku_ids)], quantity=1),
        ]
        orders.append(Order(id=f"ORD-{i:04d}", date=date(2026, 4, 1),
                            store_id="S-001", lines=lines))
    return orders


class TestSlottingEvaluator:
    def test_score_returns_slotting_score(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        all_locs = [loc.id for aisle in wh.aisles for rack in aisle.racks for loc in rack.locations]
        assignment: SlottingAssignment = {all_locs[0]: "SKU-001", all_locs[1]: "SKU-002", all_locs[2]: "SKU-003"}
        orders = _make_orders(assignment)
        evaluator = SlottingEvaluator(wh, graph)
        score = evaluator.score(assignment, orders)
        assert isinstance(score, SlottingScore)
        assert score.avg_distance_per_order > 0.0
        assert score.num_orders_sampled == len(orders)

    def test_nearby_assignment_scores_better(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        all_locs = [loc.id for aisle in wh.aisles for rack in aisle.racks for loc in rack.locations]
        good_assignment: SlottingAssignment = {all_locs[0]: "SKU-001", all_locs[1]: "SKU-002"}
        bad_assignment: SlottingAssignment = {all_locs[0]: "SKU-001", all_locs[-1]: "SKU-002"}
        orders_good = _make_orders(good_assignment)
        orders_bad = _make_orders(bad_assignment)
        evaluator = SlottingEvaluator(wh, graph)
        score_good = evaluator.score(good_assignment, orders_good)
        score_bad = evaluator.score(bad_assignment, orders_bad)
        assert score_good.avg_distance_per_order < score_bad.avg_distance_per_order

    def test_score_counts_aisles(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        all_locs = [loc.id for aisle in wh.aisles for rack in aisle.racks for loc in rack.locations]
        assignment: SlottingAssignment = {all_locs[0]: "SKU-001", all_locs[1]: "SKU-002"}
        orders = _make_orders(assignment)
        evaluator = SlottingEvaluator(wh, graph)
        score = evaluator.score(assignment, orders)
        assert score.avg_aisles_per_order >= 1.0
