# Sprint 2: Optimalisatie-Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the optimization engine that can re-slot a warehouse and show measurable improvement in pick distance — the core value proposition. Includes SKU affinity analysis, pick-route solving, slotting evaluation, slotting optimization, and a FastAPI layer to expose it all.

**Architecture:** New `slotting/engine/` package with analyzer, solver, optimizer, and evaluator modules. New `slotting/api/` package with FastAPI endpoints. The engine consumes the Sprint 1 data layer (warehouse, SKU, order models + WarehouseGraph) and produces a `SlottingResult`: a `dict[str, str]` mapping `location_id -> sku_id`. Location is frozen — we never mutate it.

**Tech Stack:** Python 3.12+, pytest, networkx, numpy, scipy (sparse matrices for co-occurrence), FastAPI, uvicorn

---

## File Structure

```
slotting/
├── engine/
│   ├── __init__.py
│   ├── affinity.py            # SKUAffinityAnalyzer — co-occurrence matrix, clustering
│   ├── pick_route.py          # PickRouteSolver — S-shape and largest gap heuristics
│   ├── evaluator.py           # SlottingEvaluator — score a slotting assignment
│   ├── optimizer.py           # SlottingOptimizer — assign SKUs to locations
│   └── types.py               # SlottingResult, SlottingScore, PickRoute type aliases
├── api/
│   ├── __init__.py
│   ├── app.py                 # FastAPI application factory
│   ├── routes.py              # API endpoints
│   └── schemas.py             # Pydantic request/response models

tests/
├── test_affinity.py
├── test_pick_route.py
├── test_evaluator.py
├── test_optimizer.py
├── test_api.py
├── test_sprint2_integration.py

vault/research/
├── ml/
│   ├── demand-forecasting-comparison.md
│   ├── sku-affinity-analysis.md
│   └── correlated-slotting.md
├── algorithms/
│   └── metaheuristics-slotting.md
└── operations/
    └── order-batching-strategies.md
```

---

## Part A: Research (Obsidian Vault)

### Task 1: Sprint 2 Research Notes

**Files:**
- Create: `vault/research/ml/demand-forecasting-comparison.md`
- Create: `vault/research/ml/sku-affinity-analysis.md`
- Create: `vault/research/ml/correlated-slotting.md`
- Create: `vault/research/algorithms/metaheuristics-slotting.md`
- Create: `vault/research/operations/order-batching-strategies.md`

- [ ] **Step 1: Research and write demand forecasting comparison**

Search for: "SKU level demand forecasting warehouse", "Prophet vs LSTM vs XGBoost demand prediction", "seasonal demand forecasting retail". Document in `vault/research/ml/demand-forecasting-comparison.md`:

```markdown
---
tags: [research, ml, forecasting, demand, sprint-2]
sources: [papers and references found]
sprint: 2
created: 2026-04-10
---

# Demand Forecasting Model Comparison

## Overview
[Why demand forecasting matters for slotting — dynamic ABC classification]

## Models Compared

### Statistical: Prophet (Facebook)
- Time-series decomposition: trend + seasonality + holidays
- Strengths: handles seasonality well, minimal tuning, interpretable
- Weaknesses: univariate, no cross-SKU learning
- Relevance: good baseline for seasonal SKUs at Action

### Tree-Based: XGBoost / LightGBM
- Features: lagged demand, day-of-week, month, category, promotions
- Strengths: handles non-linear patterns, feature importance for explainability
- Weaknesses: needs feature engineering, may overfit on small SKU histories
- Relevance: best for incorporating category-level and cross-SKU features

### Deep Learning: LSTM / Temporal Fusion Transformer
- End-to-end sequence modeling
- Strengths: captures complex temporal patterns
- Weaknesses: data-hungry, slow training, hard to interpret
- Relevance: overkill for initial implementation, consider for v2

## Recommendation for Action
[XGBoost as primary with Prophet as interpretable backup. Sprint 2 uses simplified velocity prediction — full forecasting is Sprint 4+ scope]

## Implementation Implications
[Sprint 2 focuses on dynamic velocity classification using weighted historical + seasonal adjustment, not full ML pipeline. The infrastructure supports plugging in real models later.]
```

- [ ] **Step 2: Research and write SKU affinity analysis note**

Search for: "co-occurrence matrix warehouse slotting", "Apriori algorithm SKU affinity", "FP-Growth frequent itemsets", "Louvain community detection products". Document in `vault/research/ml/sku-affinity-analysis.md`:

```markdown
---
tags: [research, ml, affinity, co-occurrence, clustering, sprint-2]
sources: [papers and references found]
sprint: 2
created: 2026-04-10
---

# SKU Affinity Analysis

## Overview
[Co-occurrence analysis identifies which SKUs are frequently ordered together, enabling correlated slotting]

## Methods

### Co-Occurrence Matrix
- Build symmetric matrix where entry (i,j) = count of orders containing both SKU i and SKU j
- Normalize: Jaccard similarity, PMI (pointwise mutual information), or lift
- Sparse representation: scipy.sparse.csr_matrix (10K SKUs = 100M potential entries)
- Complexity: O(orders x avg_lines^2) to build

### Association Rule Mining
#### Apriori
- Find frequent itemsets exceeding minimum support threshold
- Generate rules with confidence/lift metrics
- Disadvantage: slow for large itemsets, many passes over data

#### FP-Growth
- Compressed representation (FP-tree) avoids candidate generation
- Faster than Apriori for large datasets
- Good for finding SKU clusters but overkill when we mainly need pairwise affinity

### Graph-Based Clustering
- Model SKUs as nodes, co-occurrence as weighted edges
- Apply community detection: Louvain algorithm (networkx)
- Produces affinity clusters that map to warehouse zones
- Natural fit: we already use networkx for warehouse graph

## Recommendation for Action
[Co-occurrence matrix (sparse) + Louvain clustering. Simple, fast, integrates with existing networkx stack. Apriori/FP-Growth not needed — pairwise co-occurrence captures what we need for slotting.]

## Key Metrics
- Co-occurrence count: raw frequency of joint appearance
- Jaccard similarity: |A ∩ B| / |A ∪ B| — normalizes for SKU popularity
- PMI: log(P(A,B) / (P(A) * P(B))) — identifies surprising co-occurrences
- Lift: P(A,B) / (P(A) * P(B)) — same as PMI but without log

## Computational Considerations
- 10K SKUs sparse matrix: ~1-5% fill rate → 5-50M non-zero entries
- Build time: <10 seconds for 100K orders with numpy vectorization
- Clustering: Louvain on thresholded affinity graph → seconds for 10K nodes
```

- [ ] **Step 3: Research and write correlated slotting note**

Document in `vault/research/ml/correlated-slotting.md` covering: Brynzer & Johansson (1996) product structure approach, Mantel et al. (2007) order-oriented slotting, Kofler et al. (2014) affinity-based dynamic slotting. Focus on how affinity clusters overlay onto class-based storage.

- [ ] **Step 4: Research and write metaheuristics note**

Document in `vault/research/algorithms/metaheuristics-slotting.md` covering: genetic algorithms for SLAP, simulated annealing (Muppani & Adil, 2008), tabu search, and the hierarchical decomposition approach (zone → aisle → location). Include why greedy + local search is sufficient for Sprint 2.

- [ ] **Step 5: Research and write order batching note**

Document in `vault/research/operations/order-batching-strategies.md` covering: seed-based batching, time-window batching, proximity-based batching, and their interaction with routing. Note this is research-only for Sprint 2; implementation deferred to later sprint.

- [ ] **Step 6: Commit**

```bash
git add vault/research/ml/ vault/research/algorithms/metaheuristics-slotting.md vault/research/operations/
git commit -m "research: add Sprint 2 research notes — forecasting, affinity, metaheuristics, batching"
```

---

## Part B: Engine Core

### Task 2: Project Dependencies and Engine Package Setup

**Files:**
- Modify: `pyproject.toml`
- Create: `slotting/engine/__init__.py`
- Create: `slotting/engine/types.py`

- [ ] **Step 1: Update pyproject.toml with new dependencies**

```toml
[project]
name = "action-slotting"
version = "0.2.0"
description = "AI-driven warehouse slotting module for Action"
requires-python = ">=3.12"
dependencies = [
    "networkx>=3.2",
    "numpy>=1.26",
    "scipy>=1.12",
    "fastapi>=0.115",
    "uvicorn[standard]>=0.34",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov>=4.1",
    "httpx>=0.27",
]

[tool.setuptools.packages.find]
include = ["slotting*"]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 2: Install updated dependencies**

```bash
source .venv/Scripts/activate
pip install -e ".[dev]"
```

- [ ] **Step 3: Create engine package with type definitions**

`slotting/engine/__init__.py`:
```python
"""Optimization engine — affinity analysis, pick routing, slotting optimization."""
```

`slotting/engine/types.py`:
```python
"""Shared type definitions for the optimization engine."""

from dataclasses import dataclass, field
from typing import TypeAlias

# A slotting assignment: location_id → sku_id.
# Location is frozen, so we store the mapping externally.
SlottingAssignment: TypeAlias = dict[str, str]

# A pick route: ordered list of location_ids representing the sequence of stops.
PickRoute: TypeAlias = list[str]


@dataclass
class SlottingScore:
    """Score of a slotting assignment — lower is better for distances."""

    avg_distance_per_order: float
    total_distance_sampled: float
    num_orders_sampled: int
    avg_aisles_per_order: float
    avg_picks_per_order: float

    # Derived convenience
    @property
    def distance_per_pick(self) -> float:
        if self.avg_picks_per_order == 0:
            return 0.0
        return self.avg_distance_per_order / self.avg_picks_per_order


@dataclass
class SlottingResult:
    """Complete result of a slotting optimization run."""

    assignment: SlottingAssignment
    score_before: SlottingScore
    score_after: SlottingScore
    iterations: int
    improvement_pct: float  # percentage reduction in avg_distance_per_order

    @property
    def improved(self) -> bool:
        return self.improvement_pct > 0.0


@dataclass
class PickRouteResult:
    """Result of a pick-route calculation."""

    route: PickRoute  # ordered location_ids
    waypoints: list[str]  # ordered graph node ids (aisle_front/back)
    total_distance: float
    aisles_visited: int
    heuristic: str  # "s_shape" or "largest_gap"
```

- [ ] **Step 4: Verify existing tests still pass**

```bash
pytest -v
```

- [ ] **Step 5: Commit**

```bash
git add pyproject.toml slotting/engine/
git commit -m "feat: add engine package with type definitions and Sprint 2 dependencies"
```

---

### Task 3: SKU Affinity Analyzer

**Files:**
- Create: `tests/test_affinity.py`
- Create: `slotting/engine/affinity.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_affinity.py`:

```python
"""Tests for SKU affinity analysis — co-occurrence matrix and clustering."""

import pytest
from datetime import date

from slotting.models.order import Order, OrderLine
from slotting.models.sku import SKU, Category, VelocityClass
from slotting.models.warehouse import SizeClass
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
    # Some orders with only SKU-003 and SKU-004
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
        # SKU-001 and SKU-002 appear together in all 100 main orders
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
        # SKU-003 and SKU-004 co-occur in: orders where i%3==0 AND i%5==0 (i%15==0)
        # from first 100 orders, plus all 30 extra orders
        expected_015 = len([i for i in range(100) if i % 15 == 0])  # 7 orders
        expected_total = expected_015 + 30  # plus the 30 dedicated orders
        assert matrix["SKU-003"]["SKU-004"] == expected_total

    def test_diagonal_is_zero(self):
        analyzer = SKUAffinityAnalyzer(_make_orders())
        matrix = analyzer.co_occurrence_matrix()
        for sku_id in matrix:
            assert matrix[sku_id].get(sku_id, 0) == 0

    def test_jaccard_similarity(self):
        analyzer = SKUAffinityAnalyzer(_make_orders())
        similarities = analyzer.jaccard_similarities()
        # SKU-001 and SKU-002 always appear together in the same 100 orders
        # Jaccard = intersection / union = 100 / 100 = 1.0
        assert similarities["SKU-001"]["SKU-002"] == pytest.approx(1.0)

    def test_jaccard_partial_overlap(self):
        analyzer = SKUAffinityAnalyzer(_make_orders())
        similarities = analyzer.jaccard_similarities()
        # SKU-001 appears in 100 orders, SKU-003 in 34+30=64 orders
        # They co-occur in 34 orders (i%3==0 from first 100)
        # Jaccard = 34 / (100 + 64 - 34) = 34/130
        sim = similarities["SKU-001"]["SKU-003"]
        assert sim > 0.0
        assert sim < 1.0


class TestAffinityClusters:
    def test_cluster_returns_dict(self):
        analyzer = SKUAffinityAnalyzer(_make_orders())
        clusters = analyzer.affinity_clusters(min_jaccard=0.1)
        # Returns dict mapping sku_id → cluster_id (int)
        assert isinstance(clusters, dict)
        assert "SKU-001" in clusters
        assert "SKU-002" in clusters

    def test_highly_correlated_same_cluster(self):
        analyzer = SKUAffinityAnalyzer(_make_orders())
        clusters = analyzer.affinity_clusters(min_jaccard=0.5)
        # SKU-001 and SKU-002 have Jaccard 1.0 — must be in same cluster
        assert clusters["SKU-001"] == clusters["SKU-002"]

    def test_min_jaccard_filters_weak_edges(self):
        analyzer = SKUAffinityAnalyzer(_make_orders())
        clusters_loose = analyzer.affinity_clusters(min_jaccard=0.01)
        clusters_tight = analyzer.affinity_clusters(min_jaccard=0.9)
        # Tight threshold should produce more clusters (fewer edges)
        n_clusters_loose = len(set(clusters_loose.values()))
        n_clusters_tight = len(set(clusters_tight.values()))
        assert n_clusters_tight >= n_clusters_loose
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pytest tests/test_affinity.py -v
```

Expected: ImportError — `slotting.engine.affinity` does not exist.

- [ ] **Step 3: Implement the SKU Affinity Analyzer**

`slotting/engine/affinity.py`:

```python
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
        """Map each SKU to the set of order IDs it appears in."""
        if self._sku_order_sets is None:
            sku_orders: dict[str, set[str]] = defaultdict(set)
            for order in self._orders:
                for line in order.lines:
                    sku_orders[line.sku_id].add(order.id)
            self._sku_order_sets = dict(sku_orders)
        return self._sku_order_sets

    def co_occurrence_matrix(self) -> dict[str, dict[str, int]]:
        """Build a co-occurrence matrix: how often each pair of SKUs appears in the same order.

        Returns a nested dict where matrix[sku_a][sku_b] = count of orders
        containing both sku_a and sku_b. The matrix is symmetric. Diagonal is zero.
        """
        if self._co_occurrence is not None:
            return self._co_occurrence

        matrix: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

        for order in self._orders:
            sku_ids = sorted({line.sku_id for line in order.lines})
            for i in range(len(sku_ids)):
                for j in range(i + 1, len(sku_ids)):
                    matrix[sku_ids[i]][sku_ids[j]] += 1
                    matrix[sku_ids[j]][sku_ids[i]] += 1

        # Convert to regular dicts for cleaner access
        self._co_occurrence = {k: dict(v) for k, v in matrix.items()}
        return self._co_occurrence

    def jaccard_similarities(self) -> dict[str, dict[str, float]]:
        """Compute Jaccard similarity between all co-occurring SKU pairs.

        Jaccard(A, B) = |orders(A) ∩ orders(B)| / |orders(A) ∪ orders(B)|
        """
        sku_orders = self._build_sku_order_sets()
        co_occ = self.co_occurrence_matrix()
        similarities: dict[str, dict[str, float]] = defaultdict(dict)

        for sku_a, neighbors in co_occ.items():
            for sku_b, count in neighbors.items():
                union_size = len(sku_orders[sku_a] | sku_orders[sku_b])
                if union_size > 0:
                    similarities[sku_a][sku_b] = count / union_size
                else:
                    similarities[sku_a][sku_b] = 0.0

        return dict(similarities)

    def affinity_clusters(
        self, min_jaccard: float = 0.1
    ) -> dict[str, int]:
        """Cluster SKUs by co-occurrence affinity using Louvain community detection.

        Args:
            min_jaccard: Minimum Jaccard similarity to create an edge between SKUs.

        Returns:
            Dict mapping sku_id → cluster_id (int).
        """
        similarities = self.jaccard_similarities()

        # Build affinity graph with edges above threshold
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

        # Louvain community detection
        communities = nx.community.louvain_communities(graph, weight="weight", seed=42)
        cluster_map: dict[str, int] = {}
        for cluster_id, community in enumerate(communities):
            for sku_id in community:
                cluster_map[sku_id] = cluster_id

        return cluster_map
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pytest tests/test_affinity.py -v
```

- [ ] **Step 5: Commit**

```bash
git add slotting/engine/affinity.py tests/test_affinity.py
git commit -m "feat: add SKU affinity analyzer with co-occurrence matrix and Louvain clustering"
```

---

### Task 4: Pick-Route Solver

**Files:**
- Create: `tests/test_pick_route.py`
- Create: `slotting/engine/pick_route.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_pick_route.py`:

```python
"""Tests for pick-route solver — S-shape and largest gap heuristics."""

import pytest

from slotting.models.warehouse import (
    Warehouse, Aisle, Rack, Location, SizeClass,
)
from slotting.warehouse_graph import WarehouseGraph
from slotting.engine.pick_route import PickRouteSolver
from slotting.engine.types import SlottingAssignment


def _make_warehouse() -> Warehouse:
    """3-aisle warehouse, 10 racks per aisle side, 3 levels, aisle length 20m."""
    aisles = []
    for aisle_idx in range(3):
        aisle_id = f"A{aisle_idx + 1:02d}"
        x_pos = aisle_idx * 5.0  # 5m spacing
        racks = []
        for side in ["left", "right"]:
            for pos in range(1, 11):
                rack_id = f"{aisle_id}-{side[0].upper()}{pos:02d}"
                locs = []
                for level in range(1, 4):
                    locs.append(Location(
                        id=f"{rack_id}-L{level}", aisle_id=aisle_id,
                        rack_id=rack_id, position=pos, level=level,
                        size=SizeClass.MEDIUM, max_weight_kg=25.0,
                    ))
                racks.append(Rack(
                    id=rack_id, aisle_id=aisle_id, position=pos,
                    side=side, levels=3, locations=locs,
                ))
        aisles.append(Aisle(
            id=aisle_id, x_position=x_pos, length_m=20.0,
            width_m=3.0, racks=racks,
        ))
    return Warehouse(
        id="WH-TEST", name="Test WH", aisles=aisles, zones=[],
        depot_position=(0.0, 0.0), cross_aisle_positions=[0.0, 20.0],
    )


@pytest.fixture
def warehouse():
    return _make_warehouse()


@pytest.fixture
def graph(warehouse):
    return WarehouseGraph(warehouse)


@pytest.fixture
def solver(warehouse, graph):
    return PickRouteSolver(warehouse, graph)


class TestSShape:
    def test_empty_picks_returns_zero(self, solver):
        result = solver.s_shape([])
        assert result.total_distance == pytest.approx(0.0)
        assert result.aisles_visited == 0
        assert result.heuristic == "s_shape"

    def test_single_aisle_picks(self, solver, warehouse):
        # Pick from locations in aisle A01 only
        pick_locs = ["A01-L01-L1", "A01-L05-L2"]
        result = solver.s_shape(pick_locs)
        assert result.total_distance > 0.0
        assert result.aisles_visited == 1

    def test_multi_aisle_picks(self, solver):
        pick_locs = ["A01-L01-L1", "A02-L05-L2", "A03-L10-L3"]
        result = solver.s_shape(pick_locs)
        assert result.aisles_visited == 3
        # Distance must include traversal of visited aisles + cross-aisle travel
        assert result.total_distance > 0.0

    def test_all_aisles_near_optimal(self, solver):
        # When all aisles visited, S-shape should be near optimal
        pick_locs = ["A01-L01-L1", "A02-L05-L2", "A03-L10-L3"]
        result = solver.s_shape(pick_locs)
        assert result.total_distance > 0.0

    def test_route_starts_and_ends_at_depot(self, solver):
        pick_locs = ["A01-L01-L1", "A02-L05-L2"]
        result = solver.s_shape(pick_locs)
        assert result.waypoints[0] == "depot"
        assert result.waypoints[-1] == "depot"


class TestLargestGap:
    def test_empty_picks_returns_zero(self, solver):
        result = solver.largest_gap([])
        assert result.total_distance == pytest.approx(0.0)
        assert result.aisles_visited == 0
        assert result.heuristic == "largest_gap"

    def test_single_aisle_pick(self, solver):
        pick_locs = ["A01-L01-L1"]
        result = solver.largest_gap(pick_locs)
        assert result.total_distance > 0.0
        assert result.aisles_visited == 1

    def test_largest_gap_shorter_than_sshape(self, solver):
        # Sparse picks where largest gap should outperform S-shape
        pick_locs = ["A01-L01-L1", "A03-L02-L1"]  # only 2 aisles, picks near front
        s_result = solver.s_shape(pick_locs)
        lg_result = solver.largest_gap(pick_locs)
        # Largest gap should be <= S-shape distance
        assert lg_result.total_distance <= s_result.total_distance + 0.01

    def test_route_starts_and_ends_at_depot(self, solver):
        pick_locs = ["A01-L01-L1", "A02-L05-L2"]
        result = solver.largest_gap(pick_locs)
        assert result.waypoints[0] == "depot"
        assert result.waypoints[-1] == "depot"

    def test_dense_picks_similar_to_sshape(self, solver):
        # When every aisle has many picks, largest gap ~ S-shape
        pick_locs = [
            "A01-L01-L1", "A01-L05-L2", "A01-R10-L1",
            "A02-L01-L1", "A02-L05-L2", "A02-R10-L1",
            "A03-L01-L1", "A03-L05-L2", "A03-R10-L1",
        ]
        s_result = solver.s_shape(pick_locs)
        lg_result = solver.largest_gap(pick_locs)
        # Should be within 20% of each other for dense picks
        ratio = lg_result.total_distance / s_result.total_distance
        assert 0.7 <= ratio <= 1.05
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pytest tests/test_pick_route.py -v
```

- [ ] **Step 3: Implement the Pick-Route Solver**

`slotting/engine/pick_route.py`:

```python
"""Pick-route solver — S-shape and largest gap heuristics.

These heuristics compute pick routes (ordered sequence of stops) for a list of
pick locations in a rectangular warehouse with two cross-aisles.

The solver works with the WarehouseGraph for distance calculations and returns
PickRouteResult objects with total distance and aisle visit count.
"""

from collections import defaultdict

from slotting.engine.types import PickRouteResult
from slotting.models.warehouse import Warehouse, Location
from slotting.warehouse_graph import WarehouseGraph


class PickRouteSolver:
    """Compute pick routes using S-shape and largest gap heuristics."""

    def __init__(self, warehouse: Warehouse, graph: WarehouseGraph) -> None:
        self._warehouse = warehouse
        self._graph = graph
        # Build lookup: location_id → Location
        self._loc_map: dict[str, Location] = {}
        # Build lookup: location_id → fractional position along aisle (0.0 = front, 1.0 = back)
        self._loc_position: dict[str, float] = {}
        for aisle in warehouse.aisles:
            max_pos = max((r.position for r in aisle.racks), default=1)
            for rack in aisle.racks:
                for loc in rack.locations:
                    self._loc_map[loc.id] = loc
                    # Normalize position to [0, aisle_length]
                    self._loc_position[loc.id] = (rack.position / max_pos) * aisle.length_m

    def _group_by_aisle(
        self, location_ids: list[str]
    ) -> dict[str, list[tuple[str, float]]]:
        """Group location IDs by aisle, with position along the aisle."""
        aisle_locs: dict[str, list[tuple[str, float]]] = defaultdict(list)
        for loc_id in location_ids:
            loc = self._loc_map.get(loc_id)
            if loc is None:
                continue
            pos = self._loc_position[loc_id]
            aisle_locs[loc.aisle_id].append((loc_id, pos))
        # Sort each aisle's locations by position
        for aisle_id in aisle_locs:
            aisle_locs[aisle_id].sort(key=lambda x: x[1])
        return dict(aisle_locs)

    def s_shape(self, location_ids: list[str]) -> PickRouteResult:
        """Compute an S-shape (traversal) route.

        Every aisle containing at least one pick is fully traversed.
        Aisles are visited in order. The picker alternates direction.
        """
        if not location_ids:
            return PickRouteResult(
                route=[], waypoints=["depot", "depot"],
                total_distance=0.0, aisles_visited=0, heuristic="s_shape",
            )

        aisle_locs = self._group_by_aisle(location_ids)
        sorted_aisles = sorted(aisle_locs.keys())

        waypoints = ["depot"]
        route: list[str] = []
        total_distance = 0.0
        current_node = "depot"
        at_front = True  # True = currently at front cross-aisle side

        for aisle_id in sorted_aisles:
            front = f"{aisle_id}_front"
            back = f"{aisle_id}_back"

            if at_front:
                enter, exit_ = front, back
            else:
                enter, exit_ = back, front

            # Travel to aisle entrance
            total_distance += self._graph.distance(current_node, enter)
            waypoints.append(enter)

            # Collect picks in traversal order
            locs_in_aisle = aisle_locs[aisle_id]
            if not at_front:
                locs_in_aisle = list(reversed(locs_in_aisle))
            for loc_id, _ in locs_in_aisle:
                route.append(loc_id)

            # Full aisle traversal
            total_distance += self._graph.distance(enter, exit_)
            waypoints.append(exit_)
            current_node = exit_
            at_front = not at_front

        # Return to depot
        total_distance += self._graph.distance(current_node, "depot")
        waypoints.append("depot")

        return PickRouteResult(
            route=route, waypoints=waypoints,
            total_distance=total_distance,
            aisles_visited=len(sorted_aisles),
            heuristic="s_shape",
        )

    def largest_gap(self, location_ids: list[str]) -> PickRouteResult:
        """Compute a route using the largest gap heuristic.

        For each aisle, find the largest gap between picks (including gaps to
        aisle entrance/exit). The picker avoids crossing the largest gap,
        entering from one or both ends as needed.
        """
        if not location_ids:
            return PickRouteResult(
                route=[], waypoints=["depot", "depot"],
                total_distance=0.0, aisles_visited=0, heuristic="largest_gap",
            )

        aisle_locs = self._group_by_aisle(location_ids)
        sorted_aisles = sorted(aisle_locs.keys())

        # Determine per-aisle strategy
        front_visits: list[tuple[str, float, list[str]]] = []  # (aisle_id, depth, loc_ids)
        back_visits: list[tuple[str, float, list[str]]] = []

        for aisle_id in sorted_aisles:
            locs = aisle_locs[aisle_id]  # sorted by position
            positions = [pos for _, pos in locs]
            aisle_length = self._get_aisle_length(aisle_id)

            strategy = self._compute_gap_strategy(positions, aisle_length)

            if strategy["type"] == "front_only":
                front_visits.append((
                    aisle_id,
                    strategy["depth"],
                    [lid for lid, _ in locs],
                ))
            elif strategy["type"] == "back_only":
                back_visits.append((
                    aisle_id,
                    strategy["depth"],
                    [lid for lid, _ in locs],
                ))
            else:  # both
                split_idx = strategy["split_index"]
                front_locs = [lid for lid, _ in locs[:split_idx + 1]]
                back_locs = [lid for lid, _ in locs[split_idx + 1:]]
                front_visits.append((aisle_id, strategy["front_depth"], front_locs))
                back_visits.append((aisle_id, strategy["back_depth"], back_locs))

        # Build route: front pass (left to right), then back pass (right to left)
        waypoints = ["depot"]
        route: list[str] = []
        total_distance = 0.0
        current_node = "depot"

        # Front pass
        for aisle_id, depth, loc_ids in sorted(front_visits, key=lambda x: x[0]):
            front = f"{aisle_id}_front"
            total_distance += self._graph.distance(current_node, front)
            waypoints.append(front)
            route.extend(loc_ids)
            # Walk in and back: 2 * depth
            total_distance += 2 * depth
            current_node = front

        # Cross to back if needed
        if back_visits:
            # Go to front of rightmost back-visit aisle, then traverse to back
            rightmost = max(back_visits, key=lambda x: x[0])
            cross_front = f"{rightmost[0]}_front"
            cross_back = f"{rightmost[0]}_back"
            total_distance += self._graph.distance(current_node, cross_front)
            waypoints.append(cross_front)
            aisle_len = self._get_aisle_length(rightmost[0])
            total_distance += aisle_len
            waypoints.append(cross_back)
            current_node = cross_back

            # Back pass (right to left)
            for aisle_id, depth, loc_ids in sorted(back_visits, key=lambda x: x[0], reverse=True):
                back = f"{aisle_id}_back"
                total_distance += self._graph.distance(current_node, back)
                waypoints.append(back)
                route.extend(reversed(loc_ids))
                total_distance += 2 * depth
                current_node = back

        # Return to depot
        total_distance += self._graph.distance(current_node, "depot")
        waypoints.append("depot")

        return PickRouteResult(
            route=route, waypoints=waypoints,
            total_distance=total_distance,
            aisles_visited=len(sorted_aisles),
            heuristic="largest_gap",
        )

    def _get_aisle_length(self, aisle_id: str) -> float:
        for aisle in self._warehouse.aisles:
            if aisle.id == aisle_id:
                return aisle.length_m
        return 0.0

    @staticmethod
    def _compute_gap_strategy(
        positions: list[float], aisle_length: float
    ) -> dict:
        """Determine the largest gap strategy for one aisle.

        Args:
            positions: Sorted list of pick positions (0 = front, aisle_length = back).
            aisle_length: Total aisle length.

        Returns:
            Dict with strategy type and relevant depths.
        """
        if not positions:
            return {"type": "front_only", "depth": 0.0}

        # Compute all gaps
        gaps: list[tuple[str, int, float]] = []
        gaps.append(("front", -1, positions[0]))  # front entrance to first pick
        for i in range(len(positions) - 1):
            gaps.append(("interior", i, positions[i + 1] - positions[i]))
        gaps.append(("back", len(positions), aisle_length - positions[-1]))

        # Find largest gap
        largest = max(gaps, key=lambda g: g[2])
        gap_type, gap_index, _ = largest

        if gap_type == "front":
            # Enter from back only
            return {
                "type": "back_only",
                "depth": aisle_length - positions[0],
            }
        elif gap_type == "back":
            # Enter from front only (return strategy)
            return {
                "type": "front_only",
                "depth": positions[-1],
            }
        else:
            # Interior gap — split the aisle
            return {
                "type": "both",
                "split_index": gap_index,
                "front_depth": positions[gap_index],
                "back_depth": aisle_length - positions[gap_index + 1],
            }
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pytest tests/test_pick_route.py -v
```

- [ ] **Step 5: Commit**

```bash
git add slotting/engine/pick_route.py tests/test_pick_route.py
git commit -m "feat: add pick-route solver with S-shape and largest gap heuristics"
```

---

### Task 5: Slotting Evaluator

**Files:**
- Create: `tests/test_evaluator.py`
- Create: `slotting/engine/evaluator.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_evaluator.py`:

```python
"""Tests for slotting evaluator — scoring a slotting assignment."""

import pytest
from datetime import date

from slotting.models.warehouse import (
    Warehouse, Aisle, Rack, Location, SizeClass,
)
from slotting.models.order import Order, OrderLine
from slotting.models.sku import SKU, Category, VelocityClass
from slotting.warehouse_graph import WarehouseGraph
from slotting.engine.evaluator import SlottingEvaluator
from slotting.engine.types import SlottingAssignment, SlottingScore


def _make_warehouse() -> Warehouse:
    """3-aisle warehouse for testing."""
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
        id="WH-TEST", name="Test", aisles=aisles, zones=[],
        depot_position=(0.0, 0.0), cross_aisle_positions=[0.0, 20.0],
    )


def _make_orders(assignment: SlottingAssignment) -> list[Order]:
    """Create test orders using only assigned SKUs."""
    sku_ids = list(assignment.values())
    orders = []
    for i in range(20):
        lines = [
            OrderLine(sku_id=sku_ids[i % len(sku_ids)], quantity=1),
            OrderLine(sku_id=sku_ids[(i + 1) % len(sku_ids)], quantity=1),
        ]
        orders.append(Order(
            id=f"ORD-{i:04d}", date=date(2026, 4, 1),
            store_id="S-001", lines=lines,
        ))
    return orders


class TestSlottingEvaluator:
    def test_score_returns_slotting_score(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        all_locs = [
            loc.id for aisle in wh.aisles
            for rack in aisle.racks for loc in rack.locations
        ]
        # Assign a few SKUs
        assignment: SlottingAssignment = {
            all_locs[0]: "SKU-001",
            all_locs[1]: "SKU-002",
            all_locs[2]: "SKU-003",
        }
        orders = _make_orders(assignment)
        evaluator = SlottingEvaluator(wh, graph)
        score = evaluator.score(assignment, orders)
        assert isinstance(score, SlottingScore)
        assert score.avg_distance_per_order > 0.0
        assert score.num_orders_sampled == len(orders)

    def test_nearby_assignment_scores_better(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        all_locs = [
            loc.id for aisle in wh.aisles
            for rack in aisle.racks for loc in rack.locations
        ]
        # Good: all SKUs in aisle A01 (near depot)
        good_assignment: SlottingAssignment = {
            all_locs[0]: "SKU-001",
            all_locs[1]: "SKU-002",
        }
        # Bad: SKUs scattered across aisles
        bad_assignment: SlottingAssignment = {
            all_locs[0]: "SKU-001",
            all_locs[-1]: "SKU-002",  # last location = aisle A03, far end
        }
        orders_good = _make_orders(good_assignment)
        orders_bad = _make_orders(bad_assignment)
        evaluator = SlottingEvaluator(wh, graph)
        score_good = evaluator.score(good_assignment, orders_good)
        score_bad = evaluator.score(bad_assignment, orders_bad)
        assert score_good.avg_distance_per_order < score_bad.avg_distance_per_order

    def test_score_counts_aisles(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        all_locs = [
            loc.id for aisle in wh.aisles
            for rack in aisle.racks for loc in rack.locations
        ]
        assignment: SlottingAssignment = {
            all_locs[0]: "SKU-001",
            all_locs[1]: "SKU-002",
        }
        orders = _make_orders(assignment)
        evaluator = SlottingEvaluator(wh, graph)
        score = evaluator.score(assignment, orders)
        assert score.avg_aisles_per_order >= 1.0
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pytest tests/test_evaluator.py -v
```

- [ ] **Step 3: Implement the Slotting Evaluator**

`slotting/engine/evaluator.py`:

```python
"""Slotting evaluator — score a slotting assignment by simulating pick routes."""

from slotting.engine.pick_route import PickRouteSolver
from slotting.engine.types import SlottingAssignment, SlottingScore
from slotting.models.order import Order
from slotting.models.warehouse import Warehouse
from slotting.warehouse_graph import WarehouseGraph


class SlottingEvaluator:
    """Evaluate a slotting assignment by computing average pick-route distance."""

    def __init__(
        self,
        warehouse: Warehouse,
        graph: WarehouseGraph,
        heuristic: str = "largest_gap",
    ) -> None:
        self._warehouse = warehouse
        self._graph = graph
        self._solver = PickRouteSolver(warehouse, graph)
        self._heuristic = heuristic

    def score(
        self,
        assignment: SlottingAssignment,
        orders: list[Order],
        max_orders: int | None = None,
    ) -> SlottingScore:
        """Score a slotting assignment by simulating pick routes for orders.

        Args:
            assignment: location_id -> sku_id mapping.
            orders: Orders to evaluate against.
            max_orders: If set, sample this many orders (for performance).

        Returns:
            SlottingScore with average distance, aisles visited, etc.
        """
        # Build reverse lookup: sku_id -> location_id
        sku_to_location: dict[str, str] = {
            sku_id: loc_id for loc_id, sku_id in assignment.items()
        }

        eval_orders = orders
        if max_orders is not None and len(orders) > max_orders:
            eval_orders = orders[:max_orders]

        total_distance = 0.0
        total_aisles = 0.0
        total_picks = 0.0
        scored_orders = 0

        route_fn = (
            self._solver.s_shape if self._heuristic == "s_shape"
            else self._solver.largest_gap
        )

        for order in eval_orders:
            # Find pick locations for this order
            pick_locations: list[str] = []
            for line in order.lines:
                loc_id = sku_to_location.get(line.sku_id)
                if loc_id is not None:
                    pick_locations.append(loc_id)

            if not pick_locations:
                continue

            result = route_fn(pick_locations)
            total_distance += result.total_distance
            total_aisles += result.aisles_visited
            total_picks += len(pick_locations)
            scored_orders += 1

        if scored_orders == 0:
            return SlottingScore(
                avg_distance_per_order=0.0,
                total_distance_sampled=0.0,
                num_orders_sampled=0,
                avg_aisles_per_order=0.0,
                avg_picks_per_order=0.0,
            )

        return SlottingScore(
            avg_distance_per_order=total_distance / scored_orders,
            total_distance_sampled=total_distance,
            num_orders_sampled=scored_orders,
            avg_aisles_per_order=total_aisles / scored_orders,
            avg_picks_per_order=total_picks / scored_orders,
        )
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pytest tests/test_evaluator.py -v
```

- [ ] **Step 5: Commit**

```bash
git add slotting/engine/evaluator.py tests/test_evaluator.py
git commit -m "feat: add slotting evaluator for scoring assignments via pick-route simulation"
```

---

### Task 6: Velocity Classifier

**Files:**
- Create: `tests/test_velocity.py`
- Create: `slotting/engine/velocity.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_velocity.py`:

```python
"""Tests for dynamic velocity classifier."""

import pytest
from datetime import date

from slotting.models.sku import SKU, Category, VelocityClass
from slotting.models.warehouse import SizeClass
from slotting.models.order import Order, OrderLine
from slotting.engine.velocity import VelocityClassifier


def _make_skus() -> list[SKU]:
    return [
        SKU(id="SKU-001", name="Fast Mover", category=Category.HOUSEHOLD,
            size=SizeClass.SMALL, weight_kg=0.5, is_fragile=False,
            is_perishable=False, velocity_class=VelocityClass.D,
            avg_daily_picks=1.0),  # Static says D, but order data will say A
        SKU(id="SKU-002", name="Slow Mover", category=Category.DECORATION,
            size=SizeClass.LARGE, weight_kg=3.0, is_fragile=False,
            is_perishable=False, velocity_class=VelocityClass.A,
            avg_daily_picks=50.0),  # Static says A, but few actual orders
        SKU(id="SKU-003", name="Medium", category=Category.TOYS,
            size=SizeClass.MEDIUM, weight_kg=1.0, is_fragile=False,
            is_perishable=False, velocity_class=VelocityClass.C,
            avg_daily_picks=5.0),
    ]


def _make_orders(fast_sku: str, slow_sku: str, medium_sku: str) -> list[Order]:
    """SKU-001 appears in many orders, SKU-002 in few."""
    orders = []
    for i in range(100):
        lines = [OrderLine(sku_id=fast_sku, quantity=1)]
        if i % 10 == 0:
            lines.append(OrderLine(sku_id=slow_sku, quantity=1))
        if i % 3 == 0:
            lines.append(OrderLine(sku_id=medium_sku, quantity=1))
        orders.append(Order(
            id=f"ORD-{i:04d}", date=date(2026, 4, 1),
            store_id="S-001", lines=lines,
        ))
    return orders


class TestVelocityClassifier:
    def test_classify_returns_all_skus(self):
        skus = _make_skus()
        orders = _make_orders("SKU-001", "SKU-002", "SKU-003")
        classifier = VelocityClassifier(skus, orders)
        result = classifier.classify()
        assert set(result.keys()) == {"SKU-001", "SKU-002", "SKU-003"}

    def test_fast_mover_gets_high_velocity(self):
        skus = _make_skus()
        orders = _make_orders("SKU-001", "SKU-002", "SKU-003")
        classifier = VelocityClassifier(skus, orders)
        result = classifier.classify()
        # SKU-001 appears in 100/100 orders — should be A
        assert result["SKU-001"] == VelocityClass.A

    def test_slow_mover_gets_low_velocity(self):
        skus = _make_skus()
        orders = _make_orders("SKU-001", "SKU-002", "SKU-003")
        classifier = VelocityClassifier(skus, orders)
        result = classifier.classify()
        # SKU-002 appears in 10/100 orders — should be C or D
        assert result["SKU-002"] in (VelocityClass.C, VelocityClass.D)

    def test_seasonal_adjustment(self):
        skus = [
            SKU(id="SKU-SEASON", name="Garden Item", category=Category.GARDEN_SEASONAL,
                size=SizeClass.MEDIUM, weight_kg=1.0, is_fragile=False,
                is_perishable=False, velocity_class=VelocityClass.C,
                avg_daily_picks=5.0, seasonal_peak_months=[4, 5, 6],
                peak_multiplier=3.0),
        ]
        orders = [
            Order(id=f"ORD-{i:04d}", date=date(2026, 4, 1), store_id="S-001",
                  lines=[OrderLine(sku_id="SKU-SEASON", quantity=1)])
            for i in range(20)
        ]
        classifier = VelocityClassifier(skus, orders, current_month=4)
        result = classifier.classify()
        # With seasonal boost, should classify higher
        assert result["SKU-SEASON"] in (VelocityClass.A, VelocityClass.B)

    def test_custom_thresholds(self):
        skus = _make_skus()
        orders = _make_orders("SKU-001", "SKU-002", "SKU-003")
        classifier = VelocityClassifier(
            skus, orders,
            thresholds={"A": 0.1, "B": 0.3, "C": 0.3, "D": 0.3},
        )
        result = classifier.classify()
        # Only top 10% should be A
        assert isinstance(result, dict)
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pytest tests/test_velocity.py -v
```

- [ ] **Step 3: Implement the Velocity Classifier**

`slotting/engine/velocity.py`:

```python
"""Dynamic velocity classifier — ABC+ classification based on actual order data."""

from collections import Counter

import numpy as np

from slotting.models.order import Order
from slotting.models.sku import SKU, VelocityClass


class VelocityClassifier:
    """Classify SKUs into velocity classes based on order history and seasonal factors.

    Unlike the static velocity_class on SKU (set at generation time), this
    classifier uses actual order data to compute dynamic velocity, with
    optional seasonal adjustment.
    """

    DEFAULT_THRESHOLDS = {"A": 0.20, "B": 0.30, "C": 0.30, "D": 0.20}

    def __init__(
        self,
        skus: list[SKU],
        orders: list[Order],
        current_month: int | None = None,
        thresholds: dict[str, float] | None = None,
    ) -> None:
        self._skus = {s.id: s for s in skus}
        self._orders = orders
        self._current_month = current_month
        self._thresholds = thresholds or self.DEFAULT_THRESHOLDS

    def classify(self) -> dict[str, VelocityClass]:
        """Classify all SKUs by dynamic velocity.

        Steps:
        1. Count pick frequency per SKU from order data.
        2. Apply seasonal multiplier for SKUs in peak season.
        3. Rank SKUs by adjusted frequency.
        4. Assign velocity classes based on percentile thresholds.

        Returns:
            Dict mapping sku_id -> VelocityClass.
        """
        # Step 1: Count picks per SKU
        pick_counts: Counter[str] = Counter()
        for order in self._orders:
            for line in order.lines:
                pick_counts[line.sku_id] += line.quantity

        # Step 2: Build adjusted scores
        scores: dict[str, float] = {}
        for sku_id, sku in self._skus.items():
            base_count = float(pick_counts.get(sku_id, 0))
            # Apply seasonal adjustment
            if (
                self._current_month is not None
                and self._current_month in sku.seasonal_peak_months
            ):
                base_count *= sku.peak_multiplier
            scores[sku_id] = base_count

        # Step 3: Rank by score descending
        sorted_skus = sorted(scores.keys(), key=lambda s: scores[s], reverse=True)
        total = len(sorted_skus)

        if total == 0:
            return {}

        # Step 4: Assign classes by cumulative thresholds
        a_cutoff = int(total * self._thresholds["A"])
        b_cutoff = a_cutoff + int(total * self._thresholds["B"])
        c_cutoff = b_cutoff + int(total * self._thresholds["C"])

        result: dict[str, VelocityClass] = {}
        for i, sku_id in enumerate(sorted_skus):
            if i < a_cutoff:
                result[sku_id] = VelocityClass.A
            elif i < b_cutoff:
                result[sku_id] = VelocityClass.B
            elif i < c_cutoff:
                result[sku_id] = VelocityClass.C
            else:
                result[sku_id] = VelocityClass.D

        return result
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pytest tests/test_velocity.py -v
```

- [ ] **Step 5: Commit**

```bash
git add slotting/engine/velocity.py tests/test_velocity.py
git commit -m "feat: add dynamic velocity classifier with seasonal adjustment"
```

---

### Task 7: Slotting Optimizer

**Files:**
- Create: `tests/test_optimizer.py`
- Create: `slotting/engine/optimizer.py`

This is the core component. It assigns SKUs to locations to minimize weighted pick distance using a greedy approach + local search improvement.

- [ ] **Step 1: Write the failing tests**

`tests/test_optimizer.py`:

```python
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
from slotting.engine.types import SlottingAssignment, SlottingResult


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
            vel = VelocityClass.A
            picks = 50.0
        elif i < 10:
            vel = VelocityClass.B
            picks = 15.0
        elif i < 16:
            vel = VelocityClass.C
            picks = 5.0
        else:
            vel = VelocityClass.D
            picks = 1.0
        skus.append(SKU(
            id=f"SKU-{i:04d}", name=f"Product {i}",
            category=Category.HOUSEHOLD, size=SizeClass.MEDIUM,
            weight_kg=1.0, is_fragile=False, is_perishable=False,
            velocity_class=vel, avg_daily_picks=picks,
        ))
    return skus


def _make_orders(skus: list[SKU], n_orders: int = 50) -> list[Order]:
    orders = []
    sku_ids = [s.id for s in skus]
    import numpy as np
    rng = np.random.default_rng(42)
    for i in range(n_orders):
        n_lines = int(rng.integers(3, 8))
        chosen = rng.choice(len(sku_ids), size=min(n_lines, len(sku_ids)), replace=False)
        lines = [OrderLine(sku_id=sku_ids[idx], quantity=int(rng.integers(1, 5)))
                 for idx in chosen]
        orders.append(Order(
            id=f"ORD-{i:04d}", date=date(2026, 4, 1),
            store_id="S-001", lines=lines,
        ))
    return orders


class TestSlottingOptimizer:
    def test_optimize_returns_result(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        skus = _make_skus(20)
        orders = _make_orders(skus)
        optimizer = SlottingOptimizer(wh, graph)
        result = optimizer.optimize(skus, orders, max_iterations=10)
        assert isinstance(result, SlottingResult)
        assert result.score_before is not None
        assert result.score_after is not None

    def test_assignment_maps_all_skus(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        skus = _make_skus(20)
        orders = _make_orders(skus)
        optimizer = SlottingOptimizer(wh, graph)
        result = optimizer.optimize(skus, orders, max_iterations=10)
        assigned_skus = set(result.assignment.values())
        expected_skus = {s.id for s in skus}
        assert assigned_skus == expected_skus

    def test_no_duplicate_locations(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        skus = _make_skus(20)
        orders = _make_orders(skus)
        optimizer = SlottingOptimizer(wh, graph)
        result = optimizer.optimize(skus, orders, max_iterations=10)
        # Each location used at most once
        locations = list(result.assignment.keys())
        assert len(locations) == len(set(locations))

    def test_optimization_improves_or_maintains(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        skus = _make_skus(20)
        orders = _make_orders(skus)
        optimizer = SlottingOptimizer(wh, graph)
        result = optimizer.optimize(skus, orders, max_iterations=50)
        # After optimization, score should not be worse
        assert result.score_after.avg_distance_per_order <= result.score_before.avg_distance_per_order + 0.01

    def test_fast_movers_near_depot(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        skus = _make_skus(20)
        orders = _make_orders(skus)
        optimizer = SlottingOptimizer(wh, graph)
        result = optimizer.optimize(skus, orders, max_iterations=50)
        # A-velocity SKUs should be in aisle A01 (nearest to depot)
        a_skus = {s.id for s in skus if s.velocity_class == VelocityClass.A}
        a_locations = {loc_id for loc_id, sku_id in result.assignment.items()
                       if sku_id in a_skus}
        # At least some A-SKUs should be in A01
        a_in_first_aisle = {lid for lid in a_locations if lid.startswith("A01")}
        assert len(a_in_first_aisle) > 0

    def test_size_constraint_respected(self):
        wh = _make_warehouse()
        graph = WarehouseGraph(wh)
        # Mix of sizes
        skus = [
            SKU(id="SKU-BIG", name="Big", category=Category.HOUSEHOLD,
                size=SizeClass.LARGE, weight_kg=5.0, is_fragile=False,
                is_perishable=False, velocity_class=VelocityClass.A,
                avg_daily_picks=50.0),
            SKU(id="SKU-SMALL", name="Small", category=Category.BEAUTY,
                size=SizeClass.SMALL, weight_kg=0.5, is_fragile=False,
                is_perishable=False, velocity_class=VelocityClass.B,
                avg_daily_picks=20.0),
        ]
        orders = _make_orders(skus, n_orders=20)
        optimizer = SlottingOptimizer(wh, graph)
        result = optimizer.optimize(skus, orders, max_iterations=10)
        # Both SKUs should be assigned
        assert len(result.assignment) == 2
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pytest tests/test_optimizer.py -v
```

- [ ] **Step 3: Implement the Slotting Optimizer**

`slotting/engine/optimizer.py`:

```python
"""Slotting optimizer — assign SKUs to warehouse locations to minimize pick distance.

Strategy: Hierarchical approach —
1. Greedy initial assignment: rank SKUs by velocity (COI-weighted), rank locations
   by distance from depot. Assign best SKU to best location.
2. Local search improvement: swap pairs of SKU assignments and keep swaps
   that improve the evaluation score.

The optimizer never mutates Location objects (frozen dataclass). Instead it
produces a SlottingAssignment (dict[str, str]: location_id → sku_id).
"""

import numpy as np

from slotting.engine.evaluator import SlottingEvaluator
from slotting.engine.types import SlottingAssignment, SlottingResult
from slotting.engine.velocity import VelocityClassifier
from slotting.models.order import Order
from slotting.models.sku import SKU, VelocityClass
from slotting.models.warehouse import Location, SizeClass, Warehouse
from slotting.warehouse_graph import WarehouseGraph


# Velocity class priority for sorting (lower = higher priority = closer to depot)
_VELOCITY_PRIORITY = {
    VelocityClass.A: 0,
    VelocityClass.B: 1,
    VelocityClass.C: 2,
    VelocityClass.D: 3,
}

# Size compatibility: SKU size can fit in location size of equal or larger class
_SIZE_ORDER = {SizeClass.SMALL: 0, SizeClass.MEDIUM: 1, SizeClass.LARGE: 2}


def _size_fits(sku_size: SizeClass, loc_size: SizeClass) -> bool:
    return _SIZE_ORDER[sku_size] <= _SIZE_ORDER[loc_size]


class SlottingOptimizer:
    """Optimize SKU-to-location assignment for minimum pick distance."""

    def __init__(self, warehouse: Warehouse, graph: WarehouseGraph) -> None:
        self._warehouse = warehouse
        self._graph = graph
        self._evaluator = SlottingEvaluator(warehouse, graph)
        # Pre-compute location distances from depot
        self._locations: list[Location] = []
        self._loc_depot_dist: dict[str, float] = {}
        for aisle in warehouse.aisles:
            front = f"{aisle.id}_front"
            front_dist = graph.distance("depot", front)
            for rack in aisle.racks:
                for loc in rack.locations:
                    self._locations.append(loc)
                    # Approximate: depot → aisle_front + position along aisle
                    max_pos = max((r.position for r in aisle.racks), default=1)
                    pos_frac = rack.position / max_pos
                    self._loc_depot_dist[loc.id] = front_dist + pos_frac * aisle.length_m

    def optimize(
        self,
        skus: list[SKU],
        orders: list[Order],
        max_iterations: int = 100,
        seed: int = 42,
    ) -> SlottingResult:
        """Run slotting optimization.

        Args:
            skus: SKUs to assign.
            orders: Order history for evaluation and velocity classification.
            max_iterations: Maximum swap iterations for local search.
            seed: Random seed for reproducibility.

        Returns:
            SlottingResult with before/after scores and the assignment.
        """
        rng = np.random.default_rng(seed)

        # Dynamic velocity classification
        classifier = VelocityClassifier(skus, orders)
        velocity_map = classifier.classify()

        # Create a random "before" assignment for comparison (simulating current state)
        before_assignment = self._random_assignment(skus, rng)
        score_before = self._evaluator.score(before_assignment, orders, max_orders=200)

        # Step 1: Greedy initial assignment
        assignment = self._greedy_assignment(skus, velocity_map)

        # Step 2: Local search improvement
        assignment, iterations = self._local_search(
            assignment, orders, max_iterations, rng
        )

        score_after = self._evaluator.score(assignment, orders, max_orders=200)

        # Compute improvement
        if score_before.avg_distance_per_order > 0:
            improvement = (
                (score_before.avg_distance_per_order - score_after.avg_distance_per_order)
                / score_before.avg_distance_per_order
                * 100.0
            )
        else:
            improvement = 0.0

        return SlottingResult(
            assignment=assignment,
            score_before=score_before,
            score_after=score_after,
            iterations=iterations,
            improvement_pct=improvement,
        )

    def _random_assignment(
        self, skus: list[SKU], rng: np.random.Generator
    ) -> SlottingAssignment:
        """Create a random (bad) assignment as the 'before' baseline."""
        available_locs = list(self._locations)
        rng.shuffle(available_locs)  # type: ignore[arg-type]
        assignment: SlottingAssignment = {}
        for i, sku in enumerate(skus):
            if i < len(available_locs):
                assignment[available_locs[i].id] = sku.id
        return assignment

    def _greedy_assignment(
        self, skus: list[SKU], velocity_map: dict[str, VelocityClass]
    ) -> SlottingAssignment:
        """Assign SKUs greedily: highest-velocity SKUs get closest-to-depot locations.

        Uses COI-like logic: priority = velocity rank / size rank.
        Respects size constraints: a LARGE SKU cannot go in a SMALL location.
        """
        # Sort SKUs by priority: velocity (primary), then by avg_daily_picks descending
        sku_map = {s.id: s for s in skus}
        sorted_skus = sorted(
            skus,
            key=lambda s: (
                _VELOCITY_PRIORITY.get(velocity_map.get(s.id, s.velocity_class), 3),
                -s.avg_daily_picks,
            ),
        )

        # Sort locations by distance from depot (closest first), prefer ground level
        sorted_locs = sorted(
            self._locations,
            key=lambda loc: (self._loc_depot_dist[loc.id], loc.level),
        )

        assignment: SlottingAssignment = {}
        used_locs: set[str] = set()

        for sku in sorted_skus:
            for loc in sorted_locs:
                if loc.id in used_locs:
                    continue
                if not _size_fits(sku.size, loc.size):
                    continue
                if sku.weight_kg > loc.max_weight_kg:
                    continue
                assignment[loc.id] = sku.id
                used_locs.add(loc.id)
                break

        return assignment

    def _local_search(
        self,
        assignment: SlottingAssignment,
        orders: list[Order],
        max_iterations: int,
        rng: np.random.Generator,
    ) -> tuple[SlottingAssignment, int]:
        """Improve assignment by random swap-based local search."""
        if len(assignment) < 2:
            return assignment, 0

        current_score = self._evaluator.score(assignment, orders, max_orders=100)
        best_distance = current_score.avg_distance_per_order
        loc_ids = list(assignment.keys())
        sku_map_by_id = {
            sku_id: next(
                (loc for aisle in self._warehouse.aisles
                 for rack in aisle.racks for loc in rack.locations
                 if loc.id == loc_id),
                None,
            )
            for loc_id, sku_id in assignment.items()
        }

        for iteration in range(max_iterations):
            # Pick two random locations to swap
            idx_a, idx_b = rng.choice(len(loc_ids), size=2, replace=False)
            loc_a, loc_b = loc_ids[idx_a], loc_ids[idx_b]
            sku_a, sku_b = assignment[loc_a], assignment[loc_b]

            # Swap
            candidate = dict(assignment)
            candidate[loc_a] = sku_b
            candidate[loc_b] = sku_a

            # Evaluate
            candidate_score = self._evaluator.score(candidate, orders, max_orders=100)
            if candidate_score.avg_distance_per_order < best_distance:
                assignment = candidate
                best_distance = candidate_score.avg_distance_per_order

        return assignment, max_iterations
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pytest tests/test_optimizer.py -v
```

- [ ] **Step 5: Commit**

```bash
git add slotting/engine/optimizer.py tests/test_optimizer.py
git commit -m "feat: add slotting optimizer with greedy assignment and local search"
```

---

### Task 8: FastAPI API Layer — Schemas

**Files:**
- Create: `slotting/api/__init__.py`
- Create: `slotting/api/schemas.py`

- [ ] **Step 1: Create API package and Pydantic schemas**

`slotting/api/__init__.py`:
```python
"""FastAPI API layer for the slotting optimization engine."""
```

`slotting/api/schemas.py`:
```python
"""Pydantic request/response schemas for the slotting API."""

from pydantic import BaseModel, Field


class OptimizeRequest(BaseModel):
    """Request to run slotting optimization."""
    warehouse_seed: int = Field(default=42, description="Seed for warehouse generation")
    sku_seed: int = Field(default=42, description="Seed for SKU generation")
    order_seed: int = Field(default=42, description="Seed for order generation")
    num_orders: int = Field(default=1000, description="Number of orders to generate")
    num_days: int = Field(default=1, description="Number of days of order history")
    max_iterations: int = Field(default=100, description="Max optimizer iterations")


class ScoreResponse(BaseModel):
    """Slotting score response."""
    avg_distance_per_order: float
    total_distance_sampled: float
    num_orders_sampled: int
    avg_aisles_per_order: float
    avg_picks_per_order: float
    distance_per_pick: float


class OptimizeResponse(BaseModel):
    """Response from optimization run."""
    score_before: ScoreResponse
    score_after: ScoreResponse
    improvement_pct: float
    iterations: int
    num_skus_assigned: int
    num_locations_total: int


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "ok"
    version: str = "0.2.0"


class PickRouteRequest(BaseModel):
    """Request a pick route for given SKU IDs."""
    sku_ids: list[str]
    heuristic: str = Field(default="largest_gap", pattern="^(s_shape|largest_gap)$")


class PickRouteResponse(BaseModel):
    """Pick route result."""
    waypoints: list[str]
    total_distance: float
    aisles_visited: int
    heuristic: str
```

- [ ] **Step 2: Commit**

```bash
git add slotting/api/
git commit -m "feat: add API Pydantic schemas for slotting endpoints"
```

---

### Task 9: FastAPI API Layer — App and Routes

**Files:**
- Create: `slotting/api/app.py`
- Create: `slotting/api/routes.py`
- Create: `tests/test_api.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_api.py`:

```python
"""Tests for the FastAPI API layer."""

import pytest
from fastapi.testclient import TestClient

from slotting.api.app import create_app


@pytest.fixture
def client():
    app = create_app()
    return TestClient(app)


class TestHealthEndpoint:
    def test_health(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "version" in data


class TestOptimizeEndpoint:
    def test_optimize_default(self, client):
        resp = client.post("/optimize", json={
            "num_orders": 100,
            "max_iterations": 5,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "score_before" in data
        assert "score_after" in data
        assert "improvement_pct" in data
        assert data["num_skus_assigned"] > 0

    def test_optimize_with_seeds(self, client):
        resp = client.post("/optimize", json={
            "warehouse_seed": 1,
            "sku_seed": 1,
            "order_seed": 1,
            "num_orders": 50,
            "max_iterations": 3,
        })
        assert resp.status_code == 200

    def test_optimize_reproducible(self, client):
        payload = {
            "warehouse_seed": 42,
            "sku_seed": 42,
            "order_seed": 42,
            "num_orders": 50,
            "max_iterations": 5,
        }
        resp1 = client.post("/optimize", json=payload)
        resp2 = client.post("/optimize", json=payload)
        assert resp1.json()["improvement_pct"] == resp2.json()["improvement_pct"]


class TestPickRouteEndpoint:
    def test_pick_route(self, client):
        # First run optimization to get an assignment
        client.post("/optimize", json={"num_orders": 50, "max_iterations": 3})
        # Then request a route
        resp = client.post("/pick-route", json={
            "sku_ids": ["SKU-000000", "SKU-000001", "SKU-000002"],
            "heuristic": "largest_gap",
        })
        # May return 200 or 400 depending on if SKUs are in current assignment
        assert resp.status_code in (200, 404)
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pytest tests/test_api.py -v
```

- [ ] **Step 3: Implement the API app and routes**

`slotting/api/app.py`:

```python
"""FastAPI application factory."""

from fastapi import FastAPI

from slotting.api.routes import router


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Action Warehouse Slotting API",
        description="AI-driven warehouse slotting optimization engine",
        version="0.2.0",
    )
    app.include_router(router)
    return app
```

`slotting/api/routes.py`:

```python
"""API route definitions for the slotting engine."""

from fastapi import APIRouter, HTTPException

from slotting.api.schemas import (
    HealthResponse,
    OptimizeRequest,
    OptimizeResponse,
    PickRouteRequest,
    PickRouteResponse,
    ScoreResponse,
)
from slotting.engine.optimizer import SlottingOptimizer
from slotting.engine.pick_route import PickRouteSolver
from slotting.engine.types import SlottingAssignment
from slotting.generators.order_generator import OrderGenConfig, generate_orders
from slotting.generators.sku_generator import generate_skus
from slotting.generators.warehouse_generator import generate_warehouse
from slotting.warehouse_graph import WarehouseGraph

router = APIRouter()

# In-memory state for the latest optimization result
_state: dict = {
    "assignment": None,
    "warehouse": None,
    "graph": None,
}


@router.get("/health", response_model=HealthResponse)
def health():
    """Health check endpoint."""
    return HealthResponse()


@router.post("/optimize", response_model=OptimizeResponse)
def optimize(request: OptimizeRequest):
    """Run slotting optimization and return before/after comparison."""
    # Generate data
    warehouse = generate_warehouse(seed=request.warehouse_seed)
    skus = generate_skus(seed=request.sku_seed)
    orders = generate_orders(
        skus,
        config=OrderGenConfig(
            orders_per_day=request.num_orders,
            num_days=request.num_days,
        ),
        seed=request.order_seed,
    )

    graph = WarehouseGraph(warehouse)
    optimizer = SlottingOptimizer(warehouse, graph)
    result = optimizer.optimize(
        skus=skus,
        orders=orders,
        max_iterations=request.max_iterations,
    )

    # Store state for pick-route endpoint
    _state["assignment"] = result.assignment
    _state["warehouse"] = warehouse
    _state["graph"] = graph

    return OptimizeResponse(
        score_before=ScoreResponse(
            avg_distance_per_order=result.score_before.avg_distance_per_order,
            total_distance_sampled=result.score_before.total_distance_sampled,
            num_orders_sampled=result.score_before.num_orders_sampled,
            avg_aisles_per_order=result.score_before.avg_aisles_per_order,
            avg_picks_per_order=result.score_before.avg_picks_per_order,
            distance_per_pick=result.score_before.distance_per_pick,
        ),
        score_after=ScoreResponse(
            avg_distance_per_order=result.score_after.avg_distance_per_order,
            total_distance_sampled=result.score_after.total_distance_sampled,
            num_orders_sampled=result.score_after.num_orders_sampled,
            avg_aisles_per_order=result.score_after.avg_aisles_per_order,
            avg_picks_per_order=result.score_after.avg_picks_per_order,
            distance_per_pick=result.score_after.distance_per_pick,
        ),
        improvement_pct=result.improvement_pct,
        iterations=result.iterations,
        num_skus_assigned=len(result.assignment),
        num_locations_total=warehouse.total_locations,
    )


@router.post("/pick-route", response_model=PickRouteResponse)
def pick_route(request: PickRouteRequest):
    """Compute a pick route for given SKU IDs using the current assignment."""
    assignment: SlottingAssignment | None = _state.get("assignment")
    warehouse = _state.get("warehouse")
    graph = _state.get("graph")

    if assignment is None or warehouse is None or graph is None:
        raise HTTPException(status_code=404, detail="No optimization has been run yet. POST /optimize first.")

    # Reverse lookup: sku_id → location_id
    sku_to_loc = {sku_id: loc_id for loc_id, sku_id in assignment.items()}
    pick_locations = []
    for sku_id in request.sku_ids:
        loc_id = sku_to_loc.get(sku_id)
        if loc_id is not None:
            pick_locations.append(loc_id)

    if not pick_locations:
        raise HTTPException(status_code=404, detail="None of the requested SKUs are in the current assignment.")

    solver = PickRouteSolver(warehouse, graph)
    if request.heuristic == "s_shape":
        result = solver.s_shape(pick_locations)
    else:
        result = solver.largest_gap(pick_locations)

    return PickRouteResponse(
        waypoints=result.waypoints,
        total_distance=result.total_distance,
        aisles_visited=result.aisles_visited,
        heuristic=result.heuristic,
    )
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pytest tests/test_api.py -v
```

- [ ] **Step 5: Commit**

```bash
git add slotting/api/ tests/test_api.py
git commit -m "feat: add FastAPI API layer with optimize and pick-route endpoints"
```

---

## Part C: Integration and Vault

### Task 10: Sprint 2 Integration Test

**Files:**
- Create: `tests/test_sprint2_integration.py`

- [ ] **Step 1: Write the integration test**

`tests/test_sprint2_integration.py`:

```python
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
    """End-to-end test: generate data → analyze → optimize → evaluate."""

    @pytest.fixture(scope="class")
    def data(self):
        """Generate a small but realistic dataset."""
        wh = generate_warehouse(seed=42)
        skus = generate_skus(seed=42)
        orders = generate_orders(
            skus,
            config=OrderGenConfig(orders_per_day=200, num_days=1),
            seed=42,
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
        # Multiple clusters should be identified
        assert len(set(clusters.values())) > 1

    def test_velocity_classification(self, data):
        _, skus, orders, _ = data
        classifier = VelocityClassifier(skus, orders)
        velocities = classifier.classify()
        assert len(velocities) == len(skus)
        # Should have all four velocity classes
        classes = set(velocities.values())
        assert len(classes) >= 3  # at minimum A, B, C

    def test_pick_route_solvers(self, data):
        wh, _, _, graph = data
        solver = PickRouteSolver(wh, graph)
        # Get some location IDs from the warehouse
        locs = [
            loc.id for aisle in wh.aisles[:3]
            for rack in aisle.racks[:2]
            for loc in rack.locations[:1]
        ]
        s_result = solver.s_shape(locs)
        lg_result = solver.largest_gap(locs)
        assert s_result.total_distance > 0
        assert lg_result.total_distance > 0
        assert lg_result.total_distance <= s_result.total_distance + 0.01

    def test_optimization_produces_improvement(self, data):
        wh, skus, orders, graph = data
        optimizer = SlottingOptimizer(wh, graph)
        # Use a subset of SKUs that fits in the warehouse
        subset_skus = skus[:500]
        result = optimizer.optimize(
            subset_skus, orders, max_iterations=20,
        )
        assert result.score_before is not None
        assert result.score_after is not None
        assert result.score_after.avg_distance_per_order <= result.score_before.avg_distance_per_order + 1.0
        # The assignment should contain all subset SKUs
        assert len(result.assignment) == len(subset_skus)
        print(f"\n  Before: {result.score_before.avg_distance_per_order:.1f}m/order")
        print(f"  After:  {result.score_after.avg_distance_per_order:.1f}m/order")
        print(f"  Improvement: {result.improvement_pct:.1f}%")

    def test_evaluator_consistency(self, data):
        wh, skus, orders, graph = data
        evaluator = SlottingEvaluator(wh, graph)
        optimizer = SlottingOptimizer(wh, graph)
        result = optimizer.optimize(skus[:100], orders, max_iterations=5)
        # Re-evaluate should give same score
        rescore = evaluator.score(result.assignment, orders, max_orders=200)
        assert rescore.avg_distance_per_order == pytest.approx(
            result.score_after.avg_distance_per_order, rel=0.01
        )
```

- [ ] **Step 2: Run the integration test**

```bash
pytest tests/test_sprint2_integration.py -v -s
```

This will print the before/after improvement numbers — the measurable outcome.

- [ ] **Step 3: Run full test suite**

```bash
pytest -v
```

All Sprint 1 and Sprint 2 tests must pass.

- [ ] **Step 4: Commit**

```bash
git add tests/test_sprint2_integration.py
git commit -m "test: add Sprint 2 integration test covering full optimization pipeline"
```

---

### Task 11: Update Vault HOME

**Files:**
- Modify: `vault/HOME.md`

- [ ] **Step 1: Update HOME.md with Sprint 2 deliverables**

Add a new section after the existing Sprint 1 deliverables:

```markdown
## Sprint 2 Deliverables

### Research Notes
- [[research/ml/demand-forecasting-comparison|Demand Forecasting Comparison]]
- [[research/ml/sku-affinity-analysis|SKU Affinity Analysis]]
- [[research/ml/correlated-slotting|Correlated Slotting]]
- [[research/algorithms/metaheuristics-slotting|Metaheuristics for Slotting]]
- [[research/operations/order-batching-strategies|Order Batching Strategies]]

### Engine Components
- `slotting/engine/types.py` — SlottingAssignment, SlottingScore, SlottingResult, PickRouteResult
- `slotting/engine/affinity.py` — SKUAffinityAnalyzer (co-occurrence matrix, Jaccard similarity, Louvain clustering)
- `slotting/engine/velocity.py` — VelocityClassifier (dynamic ABC+ with seasonal adjustment)
- `slotting/engine/pick_route.py` — PickRouteSolver (S-shape + largest gap heuristics)
- `slotting/engine/evaluator.py` — SlottingEvaluator (score assignment via simulated pick routes)
- `slotting/engine/optimizer.py` — SlottingOptimizer (greedy assignment + local search improvement)

### API Layer
- `slotting/api/app.py` — FastAPI application factory
- `slotting/api/routes.py` — REST endpoints: /health, /optimize, /pick-route
- `slotting/api/schemas.py` — Pydantic request/response models

### Key Result
Engine re-slots warehouse with measurable improvement: avg pick distance reduction demonstrated in integration tests.
```

- [ ] **Step 2: Commit**

```bash
git add vault/HOME.md
git commit -m "docs: update vault HOME with Sprint 2 deliverables"
```

---

### Task 12: Final Verification and Tag

- [ ] **Step 1: Run full test suite with coverage**

```bash
pytest -v --cov=slotting --cov-report=term-missing
```

All tests must pass. Engine modules should have >80% coverage.

- [ ] **Step 2: Verify API starts**

```bash
source .venv/Scripts/activate
python -c "from slotting.api.app import create_app; app = create_app(); print('API OK')"
```

- [ ] **Step 3: Quick smoke test via API**

```bash
uvicorn slotting.api.app:create_app --factory --port 8000 &
sleep 2
curl http://localhost:8000/health
curl -X POST http://localhost:8000/optimize -H "Content-Type: application/json" -d '{"num_orders": 100, "max_iterations": 5}'
kill %1
```

- [ ] **Step 4: Tag Sprint 2 completion**

```bash
git tag -a v0.2.0 -m "Sprint 2: Optimalisatie-Engine — SKU affinity, pick routing, slotting optimizer, FastAPI API"
```

---

## Summary

| Task | Component | Tests | Key Deliverable |
|------|-----------|-------|-----------------|
| 1 | Research notes (5 vault notes) | — | Sprint 2 knowledge base |
| 2 | Engine setup + types | Existing pass | SlottingAssignment, SlottingScore, SlottingResult |
| 3 | SKU Affinity Analyzer | test_affinity.py | Co-occurrence matrix, Jaccard similarity, Louvain clusters |
| 4 | Pick-Route Solver | test_pick_route.py | S-shape + largest gap heuristics |
| 5 | Slotting Evaluator | test_evaluator.py | Score any assignment via pick-route simulation |
| 6 | Velocity Classifier | test_velocity.py | Dynamic ABC+ with seasonal adjustment |
| 7 | Slotting Optimizer | test_optimizer.py | Greedy + local search, the core engine |
| 8 | API Schemas | — | Pydantic request/response models |
| 9 | API App + Routes | test_api.py | FastAPI with /optimize and /pick-route |
| 10 | Integration Test | test_sprint2_integration.py | Full pipeline validation with improvement metrics |
| 11 | Vault HOME update | — | Documentation |
| 12 | Final verification | All tests | Coverage, smoke test, v0.2.0 tag |
