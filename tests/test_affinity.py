"""Tests for SKU affinity analysis — co-occurrence matrix and clustering."""

import pytest
from datetime import date

from slotting.models.order import Order, OrderLine
from slotting.engine.affinity import SKUAffinityAnalyzer


def _make_orders() -> list[Order]:
    """Create orders where SKU-001 and SKU-002 frequently co-occur."""
    orders = []
    for i in range(100):
        lines = [
            OrderLine(sku_id="SKU-001", quantity=1),
            OrderLine(sku_id="SKU-002", quantity=2),
        ]
        if i % 3 == 0:
            lines.append(OrderLine(sku_id="SKU-003", quantity=1))
        if i % 5 == 0:
            lines.append(OrderLine(sku_id="SKU-004", quantity=1))
        orders.append(Order(id=f"ORD-{i:04d}", date=date(2026, 4, 1),
                            store_id="S-001", lines=lines))
    for i in range(100, 130):
        orders.append(Order(id=f"ORD-{i:04d}", date=date(2026, 4, 1),
                            store_id="S-001", lines=[
                                OrderLine(sku_id="SKU-003", quantity=1),
                                OrderLine(sku_id="SKU-004", quantity=1),
                            ]))
    return orders


class TestCoOccurrenceMatrix:
    def test_build_matrix(self):
        analyzer = SKUAffinityAnalyzer(_make_orders())
        matrix = analyzer.co_occurrence_matrix()
        assert matrix["SKU-001"]["SKU-002"] == 100
        assert matrix["SKU-002"]["SKU-001"] == 100

    def test_matrix_is_symmetric(self):
        analyzer = SKUAffinityAnalyzer(_make_orders())
        matrix = analyzer.co_occurrence_matrix()
        for a in matrix:
            for b in matrix[a]:
                assert matrix[a][b] == matrix[b][a]

    def test_co_occurrence_003_004(self):
        analyzer = SKUAffinityAnalyzer(_make_orders())
        matrix = analyzer.co_occurrence_matrix()
        expected_015 = len([i for i in range(100) if i % 15 == 0])
        expected_total = expected_015 + 30
        assert matrix["SKU-003"]["SKU-004"] == expected_total

    def test_diagonal_is_zero(self):
        analyzer = SKUAffinityAnalyzer(_make_orders())
        matrix = analyzer.co_occurrence_matrix()
        for sku_id in matrix:
            assert matrix[sku_id].get(sku_id, 0) == 0

    def test_jaccard_similarity(self):
        analyzer = SKUAffinityAnalyzer(_make_orders())
        similarities = analyzer.jaccard_similarities()
        assert similarities["SKU-001"]["SKU-002"] == pytest.approx(1.0)

    def test_jaccard_partial_overlap(self):
        analyzer = SKUAffinityAnalyzer(_make_orders())
        similarities = analyzer.jaccard_similarities()
        sim = similarities["SKU-001"]["SKU-003"]
        assert sim > 0.0
        assert sim < 1.0


class TestAffinityClusters:
    def test_cluster_returns_dict(self):
        analyzer = SKUAffinityAnalyzer(_make_orders())
        clusters = analyzer.affinity_clusters(min_jaccard=0.1)
        assert isinstance(clusters, dict)
        assert "SKU-001" in clusters
        assert "SKU-002" in clusters

    def test_highly_correlated_same_cluster(self):
        analyzer = SKUAffinityAnalyzer(_make_orders())
        clusters = analyzer.affinity_clusters(min_jaccard=0.5)
        assert clusters["SKU-001"] == clusters["SKU-002"]

    def test_min_jaccard_filters_weak_edges(self):
        analyzer = SKUAffinityAnalyzer(_make_orders())
        clusters_loose = analyzer.affinity_clusters(min_jaccard=0.01)
        clusters_tight = analyzer.affinity_clusters(min_jaccard=0.9)
        n_clusters_loose = len(set(clusters_loose.values()))
        n_clusters_tight = len(set(clusters_tight.values()))
        assert n_clusters_tight >= n_clusters_loose
