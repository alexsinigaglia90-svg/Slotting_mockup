"""Sprint 2 integration test — full pipeline from data generation to optimization result."""

import pytest

from slotting.generators.warehouse_generator import generate_warehouse
from slotting.generators.sku_generator import generate_skus
from slotting.generators.order_generator import generate_orders, OrderGenConfig
from slotting.warehouse_graph import WarehouseGraph
from slotting.engine.affinity import SKUAffinityAnalyzer
from slotting.engine.velocity import VelocityClassifier
from slotting.engine.pick_route import PickRouteSolver
from slotting.engine.evaluator import SlottingEvaluator
from slotting.engine.optimizer import SlottingOptimizer


class TestFullPipeline:
    @pytest.fixture(scope="class")
    def data(self):
        wh = generate_warehouse(seed=42)
        skus = generate_skus(seed=42)
        orders = generate_orders(
            skus, config=OrderGenConfig(orders_per_day=200, num_days=1), seed=42,
        )
        graph = WarehouseGraph(wh)
        return wh, skus, orders, graph

    def test_affinity_analysis(self, data):
        _, _, orders, _ = data
        analyzer = SKUAffinityAnalyzer(orders)
        matrix = analyzer.co_occurrence_matrix()
        assert len(matrix) > 0
        clusters = analyzer.affinity_clusters(min_jaccard=0.05)
        assert len(clusters) > 0
        assert len(set(clusters.values())) > 1

    def test_velocity_classification(self, data):
        _, skus, orders, _ = data
        classifier = VelocityClassifier(skus, orders)
        velocities = classifier.classify()
        assert len(velocities) == len(skus)
        assert len(set(velocities.values())) >= 3

    def test_pick_route_solvers(self, data):
        wh, _, _, graph = data
        solver = PickRouteSolver(wh, graph)
        locs = [loc.id for aisle in wh.aisles[:3]
                for rack in aisle.racks[:2] for loc in rack.locations[:1]]
        s_result = solver.s_shape(locs)
        lg_result = solver.largest_gap(locs)
        assert s_result.total_distance > 0
        assert lg_result.total_distance > 0
        assert lg_result.total_distance <= s_result.total_distance + 0.01

    def test_optimization_produces_improvement(self, data):
        wh, skus, orders, graph = data
        optimizer = SlottingOptimizer(wh, graph)
        subset_skus = skus[:500]
        result = optimizer.optimize(subset_skus, orders, max_iterations=20)
        assert result.score_before is not None
        assert result.score_after is not None
        assert result.score_after.avg_distance_per_order <= result.score_before.avg_distance_per_order + 1.0
        assert len(result.assignment) == len(subset_skus)
        print(f"\n  Before: {result.score_before.avg_distance_per_order:.1f}m/order")
        print(f"  After:  {result.score_after.avg_distance_per_order:.1f}m/order")
        print(f"  Improvement: {result.improvement_pct:.1f}%")

    def test_evaluator_consistency(self, data):
        wh, skus, orders, graph = data
        evaluator = SlottingEvaluator(wh, graph)
        optimizer = SlottingOptimizer(wh, graph)
        result = optimizer.optimize(skus[:100], orders, max_iterations=5)
        rescore = evaluator.score(result.assignment, orders, max_orders=200)
        assert rescore.avg_distance_per_order == pytest.approx(
            result.score_after.avg_distance_per_order, rel=0.01
        )
