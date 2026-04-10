"""SKU affinity analysis — co-occurrence matrices and clustering."""

from collections import defaultdict

import networkx as nx

from slotting.models.order import Order


class SKUAffinityAnalyzer:
    """Analyze SKU co-occurrence patterns from order history."""

    def __init__(self, orders: list[Order]) -> None:
        self._orders = orders
        self._sku_order_sets: dict[str, set[str]] | None = None
        self._co_occurrence: dict[str, dict[str, int]] | None = None

    def _build_sku_order_sets(self) -> dict[str, set[str]]:
        if self._sku_order_sets is None:
            sku_orders: dict[str, set[str]] = defaultdict(set)
            for order in self._orders:
                for line in order.lines:
                    sku_orders[line.sku_id].add(order.id)
            self._sku_order_sets = dict(sku_orders)
        return self._sku_order_sets

    def co_occurrence_matrix(self) -> dict[str, dict[str, int]]:
        if self._co_occurrence is not None:
            return self._co_occurrence
        matrix: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
        for order in self._orders:
            sku_ids = sorted({line.sku_id for line in order.lines})
            for i in range(len(sku_ids)):
                for j in range(i + 1, len(sku_ids)):
                    matrix[sku_ids[i]][sku_ids[j]] += 1
                    matrix[sku_ids[j]][sku_ids[i]] += 1
        self._co_occurrence = {k: dict(v) for k, v in matrix.items()}
        return self._co_occurrence

    def jaccard_similarities(self) -> dict[str, dict[str, float]]:
        sku_orders = self._build_sku_order_sets()
        co_occ = self.co_occurrence_matrix()
        similarities: dict[str, dict[str, float]] = defaultdict(dict)
        for sku_a, neighbors in co_occ.items():
            for sku_b, count in neighbors.items():
                union_size = len(sku_orders[sku_a] | sku_orders[sku_b])
                similarities[sku_a][sku_b] = count / union_size if union_size > 0 else 0.0
        return dict(similarities)

    def affinity_clusters(self, min_jaccard: float = 0.1) -> dict[str, int]:
        similarities = self.jaccard_similarities()
        graph = nx.Graph()
        all_skus = set()
        for order in self._orders:
            for line in order.lines:
                all_skus.add(line.sku_id)
        graph.add_nodes_from(all_skus)
        for sku_a, neighbors in similarities.items():
            for sku_b, sim in neighbors.items():
                if sim >= min_jaccard and sku_a < sku_b:
                    graph.add_edge(sku_a, sku_b, weight=sim)
        communities = nx.community.louvain_communities(graph, weight="weight", seed=42)
        cluster_map: dict[str, int] = {}
        for cluster_id, community in enumerate(communities):
            for sku_id in community:
                cluster_map[sku_id] = cluster_id
        return cluster_map
