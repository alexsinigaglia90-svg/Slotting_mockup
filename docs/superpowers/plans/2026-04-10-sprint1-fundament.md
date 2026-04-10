# Sprint 1: Fundament — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the scientific knowledge base and Python data layer that powers the entire slotting module — warehouse model, SKU master, synthetic order generator, all grounded in research.

**Architecture:** Python package `slotting/` with domain models (dataclasses), a synthetic data generator, and a warehouse graph model. Research is documented in `vault/research/` as Obsidian notes. The data layer exposes clean interfaces that Sprint 2's optimization engine will consume.

**Tech Stack:** Python 3.12+, pytest, networkx (warehouse graph), numpy (data generation)

---

## File Structure

```
slotting/
├── __init__.py
├── models/
│   ├── __init__.py
│   ├── warehouse.py          # Warehouse, Aisle, Rack, Location, Zone
│   ├── sku.py                # SKU, Category, SizeClass, SKUMaster
│   └── order.py              # Order, OrderLine, OrderHistory
├── warehouse_graph.py        # NetworkX graph model for distance/routing
├── generators/
│   ├── __init__.py
│   ├── warehouse_generator.py  # Generate warehouse layouts
│   ├── sku_generator.py        # Generate Action-profile SKU catalogs
│   └── order_generator.py      # Generate realistic order histories
└── io/
    ├── __init__.py
    └── export.py              # Export to CSV/JSON, import interface stub

tests/
├── __init__.py
├── test_warehouse_model.py
├── test_sku_model.py
├── test_order_model.py
├── test_warehouse_graph.py
├── test_warehouse_generator.py
├── test_sku_generator.py
├── test_order_generator.py
└── test_export.py

vault/research/
├── papers/
│   ├── slotting-taxonomy.md
│   ├── tsp-warehouse-routing.md
│   └── pick-route-heuristics.md
├── algorithms/
│   ├── warehouse-graph-model.md
│   ├── distance-metrics.md
│   ├── s-shape-heuristic.md
│   ├── largest-gap-heuristic.md
│   └── pick-route-comparison.md
└── benchmarks/
    └── heuristic-benchmark.md
```

---

## Part A: Research (Obsidian Vault)

### Task 1: Slotting Problem Taxonomy Research

**Files:**
- Create: `vault/research/papers/slotting-taxonomy.md`

Research and document the classification of warehouse slotting problems from scientific literature.

- [ ] **Step 1: Research slotting variants**

Search Google Scholar and web for key papers on warehouse slotting classification. Key search terms: "warehouse slotting problem classification", "storage location assignment problem", "dedicated vs shared storage policy". Document findings covering:
- Dedicated storage vs. shared (random) storage vs. class-based storage
- Full turnover-based vs. COI (cube-per-order index) based
- Correlated slotting (affinity-based placement)
- Within-aisle vs. across-aisle optimization

- [ ] **Step 2: Write vault note**

Write `vault/research/papers/slotting-taxonomy.md` with this structure:

```markdown
---
tags: [research, slotting, taxonomy]
sources: [list of papers/URLs]
sprint: 1
---

# Slotting Problem Taxonomy

## Overview
[High-level classification of slotting approaches]

## Storage Policies
### Dedicated Storage
[Description, when to use, pros/cons]

### Shared (Random) Storage
[Description, when to use, pros/cons]

### Class-Based Storage
[Description — this is our primary approach for Action]

## Assignment Criteria
### Turnover-Based
[Frequency of picks drives placement]

### COI (Cube-per-Order Index)
[Ratio of space needed to order frequency]

### Correlation-Based
[Products ordered together are placed together]

## Relevance for Action
[Which approach fits Action's profile and why]

## Implementation Implications
[What this means for our data model and optimizer design]
```

- [ ] **Step 3: Commit**

```bash
git add vault/research/papers/slotting-taxonomy.md
git commit -m "research: add slotting problem taxonomy note"
```

---

### Task 2: TSP & Warehouse Routing Research

**Files:**
- Create: `vault/research/papers/tsp-warehouse-routing.md`

- [ ] **Step 1: Research TSP variants for warehouse routing**

Search for: "traveling salesman problem warehouse", "order picker routing problem", "Steiner TSP warehouse". Key papers to find:
- Ratliff & Rosenthal (1983) — optimal picker routing in rectangular warehouses
- De Koster et al. (2007) — design and control of warehouse order picking
- Theys et al. (2010) — using TSP heuristics for order picking

Document: problem formulation, complexity (NP-hard for general case, polynomial for single-aisle), exact vs. heuristic approaches, relevance of cross-aisles.

- [ ] **Step 2: Write vault note**

Write `vault/research/papers/tsp-warehouse-routing.md`:

```markdown
---
tags: [research, tsp, routing, pick-path]
sources: [papers found]
sprint: 1
---

# TSP & Warehouse Routing

## Problem Formulation
[The order picker routing problem as a TSP variant]

## Complexity Analysis
- General warehouse: NP-hard
- Rectangular single-block: polynomial (Ratliff & Rosenthal)
- Multi-block: NP-hard, heuristics required

## Exact Methods
[Dynamic programming for small orders, branch-and-bound]

## Heuristic Methods
[Overview — detailed in separate algorithm notes]

## Key Insight: Warehouse Structure Matters
[Rectangular warehouses with parallel aisles allow exploiting structure]

## Relevance for Action
[Man-to-goods, rectangular layout → can use structure-exploiting algorithms]

## Implementation Implications
[Graph model choice, when to use exact vs. heuristic]
```

- [ ] **Step 3: Commit**

```bash
git add vault/research/papers/tsp-warehouse-routing.md
git commit -m "research: add TSP and warehouse routing note"
```

---

### Task 3: Pick-Route Heuristics Research

**Files:**
- Create: `vault/research/papers/pick-route-heuristics.md`
- Create: `vault/research/algorithms/s-shape-heuristic.md`
- Create: `vault/research/algorithms/largest-gap-heuristic.md`
- Create: `vault/research/algorithms/pick-route-comparison.md`

- [ ] **Step 1: Research pick-route heuristics**

Search for: "S-shape heuristic warehouse", "largest gap heuristic order picking", "midpoint return heuristic picking", "combined heuristic warehouse". Key reference: De Koster et al. (2007) comparison of routing methods. Document each heuristic: how it works, when it's optimal, typical performance vs. optimal.

- [ ] **Step 2: Write overview note**

Write `vault/research/papers/pick-route-heuristics.md`:

```markdown
---
tags: [research, routing, heuristics]
sources: [papers found]
sprint: 1
---

# Pick-Route Heuristics Overview

## S-Shape (Traversal)
- Traverse every aisle that contains a pick, skip empty aisles
- Simplest, most common in practice
- Performance: typically 5-20% longer than optimal

## Return
- Enter and exit each aisle from the same end
- Good when picks are clustered near aisle entrance
- Performance: can be worse than S-shape for scattered picks

## Midpoint
- Divide each aisle at midpoint; approach from nearest end
- Good balance for evenly distributed picks
- Performance: typically between S-shape and optimal

## Largest Gap
- Like midpoint but uses the largest gap between picks as split point
- Consistently good performance across scenarios
- Performance: typically 2-10% longer than optimal

## Combined
- Per-aisle decision: traverse or return based on pick locations
- Near-optimal for rectangular warehouses
- Performance: typically 1-5% longer than optimal

## Comparison Matrix
[Table: heuristic × scenario → relative performance]

## Recommendation for Action
[Start with S-shape (baseline) + largest gap (primary), combined for advanced mode]
```

- [ ] **Step 3: Write individual algorithm notes**

Write `vault/research/algorithms/s-shape-heuristic.md`:

```markdown
---
tags: [algorithm, routing, heuristic]
complexity: O(n log n) where n = number of picks
sprint: 1
---

# S-Shape (Traversal) Heuristic

## Algorithm
1. Sort aisles containing picks by aisle number
2. Starting from depot, visit aisles in order
3. Traverse each visited aisle completely (alternating direction)
4. Skip aisles with no picks
5. Return to depot

## Pseudocode
```python
def s_shape_route(warehouse, pick_locations, depot):
    aisles_with_picks = group_by_aisle(pick_locations)
    sorted_aisles = sort(aisles_with_picks.keys())
    route = [depot]
    direction = "front_to_back"
    for aisle in sorted_aisles:
        if direction == "front_to_back":
            route.append(aisle.front_entrance)
            route.append(aisle.back_entrance)
        else:
            route.append(aisle.back_entrance)
            route.append(aisle.front_entrance)
        direction = flip(direction)
    route.append(depot)
    return route
`` `

## When To Use
- Baseline comparison for all other heuristics
- Simple to implement and explain
- Good enough for many practical scenarios

## Limitations
- Traverses entire aisle even for one pick at the entrance
- No aisle-level optimization
```

Write `vault/research/algorithms/largest-gap-heuristic.md`:

```markdown
---
tags: [algorithm, routing, heuristic]
complexity: O(n log n) where n = number of picks
sprint: 1
---

# Largest Gap Heuristic

## Algorithm
1. For each aisle with picks, find the largest gap between consecutive picks (including gaps to aisle entrance/exit)
2. If the largest gap is between two interior picks: enter from front, pick items before gap; enter from back, pick items after gap
3. If the largest gap is at front or back: enter from opposite end, pick all, return
4. This effectively "cuts" each aisle at the largest gap to minimize backtracking

## Pseudocode
```python
def largest_gap_route(warehouse, pick_locations, depot):
    route = [depot]
    aisles = group_by_aisle(pick_locations)
    for aisle_id in sorted(aisles.keys()):
        picks = sorted(aisles[aisle_id], key=lambda p: p.position)
        gaps = compute_gaps(picks, aisle)  # includes entrance/exit gaps
        largest = max(gaps, key=lambda g: g.size)
        if largest.is_at_front:
            route += enter_from_back(aisle, picks)
        elif largest.is_at_back:
            route += enter_from_front(aisle, picks)
        else:
            route += enter_from_both_ends(aisle, picks, largest)
    route.append(depot)
    return route
`` `

## When To Use
- Primary heuristic for Action: consistently good performance
- Especially effective when picks are clustered within aisles

## Performance
- Typically 2-10% above optimal
- Dominates S-shape in nearly all scenarios
```

- [ ] **Step 4: Write comparison note**

Write `vault/research/algorithms/pick-route-comparison.md`:

```markdown
---
tags: [algorithm, routing, benchmark, comparison]
sprint: 1
---

# Pick-Route Heuristic Comparison

## Performance Summary (% above optimal route length)

| Heuristic  | Few picks (1-5) | Medium (6-15) | Many (16+) | Overall |
|------------|----------------|---------------|------------|---------|
| S-Shape    | 15-30%         | 10-20%        | 5-15%      | 10-20%  |
| Return     | 5-10%          | 15-25%        | 20-40%     | 15-25%  |
| Midpoint   | 10-20%         | 8-15%         | 5-12%      | 8-15%   |
| Largest Gap| 5-15%          | 3-10%         | 2-8%       | 3-10%   |
| Combined   | 3-8%           | 2-5%          | 1-4%       | 2-5%    |
| Optimal    | 0%             | 0%            | 0%         | 0%      |

*Ranges based on De Koster et al. (2007) and Theys et al. (2010)*

## Recommendation for Action
1. **Baseline:** S-shape (simple, explainable, current industry standard)
2. **Primary:** Largest gap (best cost/complexity tradeoff)
3. **Advanced:** Combined (near-optimal, more complex)
4. **Benchmark:** Exact solver for small orders (<10 picks) to measure heuristic quality

## Implementation Order
Sprint 1: implement S-shape and largest gap in warehouse graph model
Sprint 2: add combined heuristic, exact solver for benchmarking
```

- [ ] **Step 5: Commit**

```bash
git add vault/research/papers/pick-route-heuristics.md vault/research/algorithms/
git commit -m "research: add pick-route heuristics and comparison notes"
```

---

### Task 4: Distance Metrics & Warehouse Graph Research

**Files:**
- Create: `vault/research/algorithms/warehouse-graph-model.md`
- Create: `vault/research/algorithms/distance-metrics.md`

- [ ] **Step 1: Research warehouse distance calculation and graph modeling**

Search for: "warehouse distance calculation rectilinear", "warehouse graph model networkx", "aisle distance warehouse picking". Key concepts:
- Rectilinear (Manhattan) distance in warehouses
- Graph-based models: nodes at aisle intersections, edges weighted by walking distance
- Cross-aisle impact on distances
- Chebyshev distance (when vertical movement matters — e.g., picking from height levels)

- [ ] **Step 2: Write warehouse graph model note**

Write `vault/research/algorithms/warehouse-graph-model.md`:

```markdown
---
tags: [algorithm, graph, warehouse, modeling]
sprint: 1
---

# Warehouse Graph Model

## Why a Graph?
A warehouse is not an open floor — pickers must walk through aisles and cross-aisles. 
A graph model captures the real walking paths, not straight-line approximations.

## Graph Structure
- **Nodes:** Aisle entrance/exit points, cross-aisle intersections, depot, pick locations
- **Edges:** Walking paths with distance weights (meters)
- **Properties:** Bidirectional (pickers can walk both ways), weighted

## Node Types
1. **Depot node** — start/end of every route
2. **Aisle-entrance nodes** — front and back of each aisle
3. **Pick-location nodes** — positions within aisles where SKUs are stored
4. **Cross-aisle nodes** — intersections of aisles with cross-aisles

## Edge Types
1. **Within-aisle edges** — walking along an aisle (weight = rack position distance)
2. **Cross-aisle edges** — walking along a cross-aisle between aisle entrances
3. **Depot edges** — from depot to nearest cross-aisle

## Implementation: NetworkX
```python
import networkx as nx

G = nx.Graph()
# Add aisle entrance nodes
for aisle in warehouse.aisles:
    G.add_node(f"aisle_{aisle.id}_front", pos=(aisle.x, 0))
    G.add_node(f"aisle_{aisle.id}_back", pos=(aisle.x, aisle.length))
    # Within-aisle edge
    G.add_edge(f"aisle_{aisle.id}_front", f"aisle_{aisle.id}_back", 
               weight=aisle.length)
# Add cross-aisle edges
for i, aisle in enumerate(warehouse.aisles[:-1]):
    next_aisle = warehouse.aisles[i + 1]
    spacing = next_aisle.x - aisle.x
    G.add_edge(f"aisle_{aisle.id}_front", f"aisle_{next_aisle.id}_front",
               weight=spacing)
    G.add_edge(f"aisle_{aisle.id}_back", f"aisle_{next_aisle.id}_back",
               weight=spacing)
`` `

## Shortest Path
Use `nx.shortest_path_length(G, source, target, weight='weight')` for pairwise distances.
Precompute distance matrix for frequently accessed location pairs.

## Relevance for Action
Rectangular warehouses with parallel aisles → clean graph structure.
Cross-aisles at front and back. Height levels modeled as attributes on location nodes (same x,y position, different level — only affects pick time, not walking distance).
```

- [ ] **Step 3: Write distance metrics note**

Write `vault/research/algorithms/distance-metrics.md`:

```markdown
---
tags: [algorithm, distance, metrics]
sprint: 1
---

# Distance Metrics in Warehouse Context

## Rectilinear (Manhattan) Distance
- d(a, b) = |x_a - x_b| + |y_a - y_b|
- Good approximation for open-floor warehouses
- Underestimates in aisle-based warehouses (ignores aisle constraint)
- Use case: quick estimation, clustering, initial placement heuristics

## Graph-Based Distance
- Shortest path through the actual warehouse graph
- Accurate: reflects real walking paths through aisles and cross-aisles
- More expensive to compute but can be precomputed
- Use case: pick-route optimization, precise slotting evaluation

## Chebyshev Distance
- d(a, b) = max(|x_a - x_b|, |y_a - y_b|)
- Not directly useful for walking distance
- Could model vertical pick time (reaching up/down) but we model this separately

## Height-Adjusted Pick Time
- Walking distance is horizontal only (graph-based)
- Pick time adds vertical component: ground level = fast, level 4+ = slow (needs equipment)
- Total pick cost = walk_time(distance) + pick_time(height_level)

## Recommendation
- **Primary:** Graph-based distance for all optimization (accurate)
- **Secondary:** Rectilinear for fast heuristics and initial clustering
- **Pick cost model:** graph_distance × walk_speed + height_penalty[level]
```

- [ ] **Step 4: Commit**

```bash
git add vault/research/algorithms/warehouse-graph-model.md vault/research/algorithms/distance-metrics.md
git commit -m "research: add warehouse graph model and distance metrics notes"
```

---

## Part B: Python Data Layer

### Task 5: Project Setup

**Files:**
- Create: `pyproject.toml`
- Create: `slotting/__init__.py`
- Create: `slotting/models/__init__.py`
- Create: `tests/__init__.py`

- [ ] **Step 1: Create pyproject.toml**

```toml
[project]
name = "action-slotting"
version = "0.1.0"
description = "AI-driven warehouse slotting module for Action"
requires-python = ">=3.12"
dependencies = [
    "networkx>=3.2",
    "numpy>=1.26",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov>=4.1",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 2: Create package init files**

`slotting/__init__.py`:
```python
"""Action Warehouse Slotting Module — AI-driven pick optimization."""
```

`slotting/models/__init__.py`:
```python
"""Domain models for warehouse, SKU, and order data."""
```

`tests/__init__.py`:
```python
```

- [ ] **Step 3: Set up virtual environment and install**

```bash
python -m venv .venv
source .venv/Scripts/activate  # Windows Git Bash
pip install -e ".[dev]"
```

- [ ] **Step 4: Verify pytest runs**

```bash
pytest --co
```

Expected: "no tests ran" (empty collection, no errors)

- [ ] **Step 5: Commit**

```bash
git add pyproject.toml slotting/ tests/
git commit -m "feat: initialize Python project with dependencies"
```

---

### Task 6: Warehouse Domain Model

**Files:**
- Create: `slotting/models/warehouse.py`
- Create: `tests/test_warehouse_model.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_warehouse_model.py`:

```python
from slotting.models.warehouse import (
    Location,
    Rack,
    Aisle,
    Zone,
    ZoneType,
    Warehouse,
    SizeClass,
)


def test_location_creation():
    loc = Location(
        id="A01-01-1",
        aisle_id="A01",
        rack_id="A01-01",
        position=1,
        level=1,
        size=SizeClass.MEDIUM,
        max_weight_kg=25.0,
    )
    assert loc.id == "A01-01-1"
    assert loc.level == 1
    assert loc.is_ground_level


def test_location_not_ground_level():
    loc = Location(
        id="A01-01-4",
        aisle_id="A01",
        rack_id="A01-01",
        position=1,
        level=4,
        size=SizeClass.MEDIUM,
        max_weight_kg=25.0,
    )
    assert not loc.is_ground_level


def test_rack_creation():
    rack = Rack(
        id="A01-01",
        aisle_id="A01",
        position=1,
        side="left",
        levels=4,
        locations=[],
    )
    assert rack.id == "A01-01"
    assert rack.side == "left"


def test_aisle_creation():
    aisle = Aisle(
        id="A01",
        x_position=0.0,
        length_m=30.0,
        width_m=3.0,
        racks=[],
    )
    assert aisle.id == "A01"
    assert aisle.length_m == 30.0


def test_zone_creation():
    zone = Zone(
        id="forward-pick",
        zone_type=ZoneType.FORWARD_PICK,
        aisle_ids=["A01", "A02", "A03"],
    )
    assert zone.zone_type == ZoneType.FORWARD_PICK
    assert len(zone.aisle_ids) == 3


def test_warehouse_creation():
    wh = Warehouse(
        id="WH-NL-01",
        name="Action DC Echt",
        aisles=[],
        zones=[],
        depot_position=(0.0, 0.0),
        cross_aisle_positions=[0.0, 30.0],
    )
    assert wh.id == "WH-NL-01"
    assert wh.depot_position == (0.0, 0.0)


def test_warehouse_location_count():
    loc1 = Location(id="A01-01-1", aisle_id="A01", rack_id="A01-01",
                    position=1, level=1, size=SizeClass.SMALL, max_weight_kg=10.0)
    loc2 = Location(id="A01-01-2", aisle_id="A01", rack_id="A01-01",
                    position=1, level=2, size=SizeClass.SMALL, max_weight_kg=10.0)
    rack = Rack(id="A01-01", aisle_id="A01", position=1, side="left",
                levels=2, locations=[loc1, loc2])
    aisle = Aisle(id="A01", x_position=0.0, length_m=30.0, width_m=3.0,
                  racks=[rack])
    wh = Warehouse(id="WH-01", name="Test", aisles=[aisle], zones=[],
                   depot_position=(0.0, 0.0), cross_aisle_positions=[0.0, 30.0])
    assert wh.total_locations == 2
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_warehouse_model.py -v
```

Expected: ImportError — `slotting.models.warehouse` does not exist yet.

- [ ] **Step 3: Write the implementation**

`slotting/models/warehouse.py`:

```python
"""Warehouse domain models — layout, aisles, racks, locations, zones."""

from dataclasses import dataclass, field
from enum import Enum


class SizeClass(Enum):
    SMALL = "S"
    MEDIUM = "M"
    LARGE = "L"


class ZoneType(Enum):
    FORWARD_PICK = "forward_pick"
    BULK_STORAGE = "bulk_storage"
    SEASONAL = "seasonal"


@dataclass(frozen=True)
class Location:
    id: str
    aisle_id: str
    rack_id: str
    position: int          # position along the aisle (rack slot)
    level: int             # height level (1 = ground)
    size: SizeClass
    max_weight_kg: float
    sku_id: str | None = None  # assigned SKU (None = empty)

    @property
    def is_ground_level(self) -> bool:
        return self.level <= 2


@dataclass
class Rack:
    id: str
    aisle_id: str
    position: int          # position along the aisle
    side: str              # "left" or "right"
    levels: int
    locations: list[Location] = field(default_factory=list)


@dataclass
class Aisle:
    id: str
    x_position: float      # horizontal position in warehouse (meters from left wall)
    length_m: float        # aisle length in meters
    width_m: float         # aisle width in meters
    racks: list[Rack] = field(default_factory=list)


@dataclass
class Zone:
    id: str
    zone_type: ZoneType
    aisle_ids: list[str] = field(default_factory=list)


@dataclass
class Warehouse:
    id: str
    name: str
    aisles: list[Aisle] = field(default_factory=list)
    zones: list[Zone] = field(default_factory=list)
    depot_position: tuple[float, float] = (0.0, 0.0)
    cross_aisle_positions: list[float] = field(default_factory=list)

    @property
    def total_locations(self) -> int:
        return sum(
            len(rack.locations)
            for aisle in self.aisles
            for rack in aisle.racks
        )
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_warehouse_model.py -v
```

Expected: all 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add slotting/models/warehouse.py tests/test_warehouse_model.py
git commit -m "feat: add warehouse domain model with locations, racks, aisles, zones"
```

---

### Task 7: SKU Domain Model

**Files:**
- Create: `slotting/models/sku.py`
- Create: `tests/test_sku_model.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_sku_model.py`:

```python
from slotting.models.sku import SKU, Category, VelocityClass
from slotting.models.warehouse import SizeClass


def test_sku_creation():
    sku = SKU(
        id="SKU-00001",
        name="Afwasmiddel 500ml",
        category=Category.HOUSEHOLD,
        size=SizeClass.SMALL,
        weight_kg=0.6,
        is_fragile=False,
        is_perishable=False,
        velocity_class=VelocityClass.A,
        avg_daily_picks=45.0,
    )
    assert sku.id == "SKU-00001"
    assert sku.category == Category.HOUSEHOLD
    assert sku.velocity_class == VelocityClass.A


def test_sku_seasonal():
    sku = SKU(
        id="SKU-10001",
        name="BBQ Houtskool 3kg",
        category=Category.GARDEN_SEASONAL,
        size=SizeClass.LARGE,
        weight_kg=3.2,
        is_fragile=False,
        is_perishable=False,
        velocity_class=VelocityClass.B,
        avg_daily_picks=12.0,
        seasonal_peak_months=[4, 5, 6, 7, 8],
        peak_multiplier=3.5,
    )
    assert sku.is_seasonal
    assert 6 in sku.seasonal_peak_months
    assert sku.peak_multiplier == 3.5


def test_sku_not_seasonal():
    sku = SKU(
        id="SKU-00002",
        name="Toiletpapier 8-pack",
        category=Category.HOUSEHOLD,
        size=SizeClass.MEDIUM,
        weight_kg=1.2,
        is_fragile=False,
        is_perishable=False,
        velocity_class=VelocityClass.A,
        avg_daily_picks=80.0,
    )
    assert not sku.is_seasonal


def test_all_categories_exist():
    expected = [
        "HOUSEHOLD", "BEAUTY", "TOYS", "FOOD_SNACKS",
        "GARDEN_SEASONAL", "CLOTHING_ACCESSORIES", "OFFICE",
        "PET", "DECORATION",
    ]
    for name in expected:
        assert hasattr(Category, name)


def test_velocity_classes():
    assert VelocityClass.A.value == "A"
    assert VelocityClass.B.value == "B"
    assert VelocityClass.C.value == "C"
    assert VelocityClass.D.value == "D"
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_sku_model.py -v
```

Expected: ImportError.

- [ ] **Step 3: Write the implementation**

`slotting/models/sku.py`:

```python
"""SKU domain models — products, categories, velocity classification."""

from dataclasses import dataclass, field
from enum import Enum

from slotting.models.warehouse import SizeClass


class Category(Enum):
    HOUSEHOLD = "household"
    BEAUTY = "beauty"
    TOYS = "toys"
    FOOD_SNACKS = "food_snacks"
    GARDEN_SEASONAL = "garden_seasonal"
    CLOTHING_ACCESSORIES = "clothing_accessories"
    OFFICE = "office"
    PET = "pet"
    DECORATION = "decoration"


class VelocityClass(Enum):
    A = "A"  # top 20% — fast movers
    B = "B"  # next 30%
    C = "C"  # next 30%
    D = "D"  # bottom 20% — slow movers


@dataclass(frozen=True)
class SKU:
    id: str
    name: str
    category: Category
    size: SizeClass
    weight_kg: float
    is_fragile: bool
    is_perishable: bool
    velocity_class: VelocityClass
    avg_daily_picks: float
    seasonal_peak_months: list[int] = field(default_factory=list)
    peak_multiplier: float = 1.0

    @property
    def is_seasonal(self) -> bool:
        return len(self.seasonal_peak_months) > 0
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_sku_model.py -v
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add slotting/models/sku.py tests/test_sku_model.py
git commit -m "feat: add SKU domain model with categories and velocity classes"
```

---

### Task 8: Order Domain Model

**Files:**
- Create: `slotting/models/order.py`
- Create: `tests/test_order_model.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_order_model.py`:

```python
from datetime import date
from slotting.models.order import Order, OrderLine


def test_order_line_creation():
    line = OrderLine(
        sku_id="SKU-00001",
        quantity=6,
        location_id="A01-01-1",
    )
    assert line.sku_id == "SKU-00001"
    assert line.quantity == 6


def test_order_creation():
    lines = [
        OrderLine(sku_id="SKU-00001", quantity=6),
        OrderLine(sku_id="SKU-00042", quantity=2),
        OrderLine(sku_id="SKU-00099", quantity=12),
    ]
    order = Order(
        id="ORD-2026-04-10-0001",
        date=date(2026, 4, 10),
        store_id="STORE-NL-042",
        lines=lines,
    )
    assert order.id == "ORD-2026-04-10-0001"
    assert order.num_lines == 3
    assert order.total_units == 20


def test_order_sku_ids():
    lines = [
        OrderLine(sku_id="SKU-00001", quantity=6),
        OrderLine(sku_id="SKU-00042", quantity=2),
    ]
    order = Order(
        id="ORD-001",
        date=date(2026, 4, 10),
        store_id="STORE-001",
        lines=lines,
    )
    assert order.sku_ids == {"SKU-00001", "SKU-00042"}


def test_empty_order():
    order = Order(
        id="ORD-EMPTY",
        date=date(2026, 4, 10),
        store_id="STORE-001",
        lines=[],
    )
    assert order.num_lines == 0
    assert order.total_units == 0
    assert order.sku_ids == set()
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_order_model.py -v
```

Expected: ImportError.

- [ ] **Step 3: Write the implementation**

`slotting/models/order.py`:

```python
"""Order domain models — orders and order lines for store replenishment."""

from dataclasses import dataclass, field
from datetime import date


@dataclass(frozen=True)
class OrderLine:
    sku_id: str
    quantity: int
    location_id: str | None = None  # assigned pick location (None before slotting)


@dataclass
class Order:
    id: str
    date: date
    store_id: str
    lines: list[OrderLine] = field(default_factory=list)

    @property
    def num_lines(self) -> int:
        return len(self.lines)

    @property
    def total_units(self) -> int:
        return sum(line.quantity for line in self.lines)

    @property
    def sku_ids(self) -> set[str]:
        return {line.sku_id for line in self.lines}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_order_model.py -v
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add slotting/models/order.py tests/test_order_model.py
git commit -m "feat: add order domain model with lines and computed properties"
```

---

### Task 9: Warehouse Graph Model

**Files:**
- Create: `slotting/warehouse_graph.py`
- Create: `tests/test_warehouse_graph.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_warehouse_graph.py`:

```python
import pytest
from slotting.models.warehouse import (
    Warehouse, Aisle, Rack, Location, Zone, ZoneType, SizeClass,
)
from slotting.warehouse_graph import WarehouseGraph


def _make_simple_warehouse() -> Warehouse:
    """2-aisle warehouse, 2 racks per aisle, 2 levels, aisle length 20m."""
    locations = []
    racks = []
    for aisle_idx, aisle_id in enumerate(["A01", "A02"]):
        aisle_racks = []
        for pos in range(1, 3):  # 2 rack positions per aisle
            rack_id = f"{aisle_id}-{pos:02d}"
            rack_locs = []
            for level in range(1, 3):  # 2 levels
                loc = Location(
                    id=f"{rack_id}-{level}",
                    aisle_id=aisle_id,
                    rack_id=rack_id,
                    position=pos,
                    level=level,
                    size=SizeClass.MEDIUM,
                    max_weight_kg=25.0,
                )
                rack_locs.append(loc)
            rack = Rack(
                id=rack_id,
                aisle_id=aisle_id,
                position=pos,
                side="left",
                levels=2,
                locations=rack_locs,
            )
            aisle_racks.append(rack)
        racks.extend(aisle_racks)
        locations.extend(
            loc for rack in aisle_racks for loc in rack.locations
        )

    aisles = [
        Aisle(id="A01", x_position=0.0, length_m=20.0, width_m=3.0,
              racks=[r for r in racks if r.aisle_id == "A01"]),
        Aisle(id="A02", x_position=5.0, length_m=20.0, width_m=3.0,
              racks=[r for r in racks if r.aisle_id == "A02"]),
    ]
    return Warehouse(
        id="WH-TEST",
        name="Test Warehouse",
        aisles=aisles,
        zones=[],
        depot_position=(0.0, 0.0),
        cross_aisle_positions=[0.0, 20.0],
    )


def test_graph_construction():
    wh = _make_simple_warehouse()
    graph = WarehouseGraph(wh)
    assert graph.node_count > 0
    assert graph.edge_count > 0


def test_graph_has_depot():
    wh = _make_simple_warehouse()
    graph = WarehouseGraph(wh)
    assert graph.has_node("depot")


def test_graph_has_aisle_entrances():
    wh = _make_simple_warehouse()
    graph = WarehouseGraph(wh)
    assert graph.has_node("A01_front")
    assert graph.has_node("A01_back")
    assert graph.has_node("A02_front")
    assert graph.has_node("A02_back")


def test_distance_same_aisle():
    wh = _make_simple_warehouse()
    graph = WarehouseGraph(wh)
    # Front to back of same aisle = aisle length
    d = graph.distance("A01_front", "A01_back")
    assert d == pytest.approx(20.0)


def test_distance_cross_aisle():
    wh = _make_simple_warehouse()
    graph = WarehouseGraph(wh)
    # Front of A01 to front of A02 = aisle spacing (5m)
    d = graph.distance("A01_front", "A02_front")
    assert d == pytest.approx(5.0)


def test_distance_depot_to_aisle():
    wh = _make_simple_warehouse()
    graph = WarehouseGraph(wh)
    # Depot at (0,0), A01 front at (0,0) — should be 0
    d = graph.distance("depot", "A01_front")
    assert d == pytest.approx(0.0)


def test_distance_matrix():
    wh = _make_simple_warehouse()
    graph = WarehouseGraph(wh)
    nodes = ["depot", "A01_front", "A02_front"]
    matrix = graph.distance_matrix(nodes)
    assert matrix["depot"]["A01_front"] == pytest.approx(0.0)
    assert matrix["A01_front"]["A02_front"] == pytest.approx(5.0)
    # Symmetric
    assert matrix["A02_front"]["A01_front"] == pytest.approx(5.0)
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_warehouse_graph.py -v
```

Expected: ImportError.

- [ ] **Step 3: Write the implementation**

`slotting/warehouse_graph.py`:

```python
"""Warehouse graph model — NetworkX graph for distance and routing calculations."""

import networkx as nx

from slotting.models.warehouse import Warehouse


class WarehouseGraph:
    """Graph representation of a warehouse for shortest-path calculations.

    Nodes: depot, aisle entrances (front/back), pick-location positions.
    Edges: walking paths weighted by distance in meters.
    """

    def __init__(self, warehouse: Warehouse) -> None:
        self._warehouse = warehouse
        self._graph = nx.Graph()
        self._build_graph()

    def _build_graph(self) -> None:
        wh = self._warehouse

        # Add depot
        self._graph.add_node("depot", pos=wh.depot_position)

        # Add aisle entrance/exit nodes and within-aisle edges
        for aisle in wh.aisles:
            front_id = f"{aisle.id}_front"
            back_id = f"{aisle.id}_back"
            front_pos = (aisle.x_position, wh.cross_aisle_positions[0])
            back_pos = (aisle.x_position, wh.cross_aisle_positions[-1])

            self._graph.add_node(front_id, pos=front_pos)
            self._graph.add_node(back_id, pos=back_pos)

            # Within-aisle edge
            self._graph.add_edge(front_id, back_id, weight=aisle.length_m)

        # Add cross-aisle edges between adjacent aisles
        sorted_aisles = sorted(wh.aisles, key=lambda a: a.x_position)
        for i in range(len(sorted_aisles) - 1):
            a1 = sorted_aisles[i]
            a2 = sorted_aisles[i + 1]
            spacing = abs(a2.x_position - a1.x_position)

            # Connect fronts and backs
            self._graph.add_edge(
                f"{a1.id}_front", f"{a2.id}_front", weight=spacing
            )
            self._graph.add_edge(
                f"{a1.id}_back", f"{a2.id}_back", weight=spacing
            )

        # Connect depot to nearest aisle entrance
        depot_x, depot_y = wh.depot_position
        for aisle in wh.aisles:
            front_id = f"{aisle.id}_front"
            front_pos = self._graph.nodes[front_id]["pos"]
            dist = abs(depot_x - front_pos[0]) + abs(depot_y - front_pos[1])
            self._graph.add_edge("depot", front_id, weight=dist)

    @property
    def node_count(self) -> int:
        return self._graph.number_of_nodes()

    @property
    def edge_count(self) -> int:
        return self._graph.number_of_edges()

    def has_node(self, node_id: str) -> bool:
        return self._graph.has_node(node_id)

    def distance(self, from_node: str, to_node: str) -> float:
        return nx.shortest_path_length(
            self._graph, from_node, to_node, weight="weight"
        )

    def shortest_path(self, from_node: str, to_node: str) -> list[str]:
        return nx.shortest_path(
            self._graph, from_node, to_node, weight="weight"
        )

    def distance_matrix(self, nodes: list[str]) -> dict[str, dict[str, float]]:
        matrix: dict[str, dict[str, float]] = {}
        for src in nodes:
            matrix[src] = {}
            for dst in nodes:
                if src == dst:
                    matrix[src][dst] = 0.0
                else:
                    matrix[src][dst] = self.distance(src, dst)
        return matrix
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_warehouse_graph.py -v
```

Expected: all 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add slotting/warehouse_graph.py tests/test_warehouse_graph.py
git commit -m "feat: add NetworkX-based warehouse graph model with distance calculations"
```

---

### Task 10: Warehouse Generator

**Files:**
- Create: `slotting/generators/__init__.py`
- Create: `slotting/generators/warehouse_generator.py`
- Create: `tests/test_warehouse_generator.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_warehouse_generator.py`:

```python
from slotting.generators.warehouse_generator import generate_warehouse, WarehouseConfig
from slotting.models.warehouse import ZoneType


def test_default_warehouse():
    wh = generate_warehouse()
    assert wh.id is not None
    assert len(wh.aisles) == 15  # default
    assert wh.total_locations > 0


def test_custom_config():
    config = WarehouseConfig(
        num_aisles=5,
        racks_per_aisle=10,
        levels_per_rack=4,
        aisle_length_m=25.0,
        aisle_spacing_m=4.0,
        aisle_width_m=3.0,
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
    assert len(wh.cross_aisle_positions) >= 2  # front and back at minimum
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_warehouse_generator.py -v
```

Expected: ImportError.

- [ ] **Step 3: Write the implementation**

`slotting/generators/__init__.py`:
```python
"""Synthetic data generators for warehouse simulation."""
```

`slotting/generators/warehouse_generator.py`:

```python
"""Generate realistic warehouse layouts matching Action's profile."""

from dataclasses import dataclass

from slotting.models.warehouse import (
    Warehouse,
    Aisle,
    Rack,
    Location,
    Zone,
    ZoneType,
    SizeClass,
)


@dataclass
class WarehouseConfig:
    num_aisles: int = 15
    racks_per_aisle: int = 20
    levels_per_rack: int = 5
    aisle_length_m: float = 40.0
    aisle_spacing_m: float = 4.5
    aisle_width_m: float = 3.0
    forward_pick_aisles: int = 4  # first N aisles are forward pick zone


def generate_warehouse(
    config: WarehouseConfig | None = None,
    warehouse_id: str = "WH-NL-01",
    seed: int | None = None,
) -> Warehouse:
    if config is None:
        config = WarehouseConfig()

    aisles = []
    for aisle_idx in range(config.num_aisles):
        aisle_id = f"A{aisle_idx + 1:02d}"
        x_pos = aisle_idx * config.aisle_spacing_m
        rack_spacing = config.aisle_length_m / config.racks_per_aisle

        aisle_racks = []
        for side in ["left", "right"]:
            for rack_pos in range(1, config.racks_per_aisle + 1):
                rack_id = f"{aisle_id}-{side[0].upper()}{rack_pos:02d}"
                locations = []
                for level in range(1, config.levels_per_rack + 1):
                    size = _size_for_level(level, config.levels_per_rack)
                    loc = Location(
                        id=f"{rack_id}-L{level}",
                        aisle_id=aisle_id,
                        rack_id=rack_id,
                        position=rack_pos,
                        level=level,
                        size=size,
                        max_weight_kg=_weight_for_level(level),
                    )
                    locations.append(loc)
                rack = Rack(
                    id=rack_id,
                    aisle_id=aisle_id,
                    position=rack_pos,
                    side=side,
                    levels=config.levels_per_rack,
                    locations=locations,
                )
                aisle_racks.append(rack)

        aisle = Aisle(
            id=aisle_id,
            x_position=x_pos,
            length_m=config.aisle_length_m,
            width_m=config.aisle_width_m,
            racks=aisle_racks,
        )
        aisles.append(aisle)

    # Zones
    zones = [
        Zone(
            id="forward-pick",
            zone_type=ZoneType.FORWARD_PICK,
            aisle_ids=[
                a.id for a in aisles[: config.forward_pick_aisles]
            ],
        ),
        Zone(
            id="bulk-storage",
            zone_type=ZoneType.BULK_STORAGE,
            aisle_ids=[
                a.id for a in aisles[config.forward_pick_aisles:]
            ],
        ),
    ]

    # Cross-aisles at front and back
    cross_aisles = [0.0, config.aisle_length_m]

    return Warehouse(
        id=warehouse_id,
        name=f"Action DC {warehouse_id}",
        aisles=aisles,
        zones=zones,
        depot_position=(0.0, 0.0),
        cross_aisle_positions=cross_aisles,
    )


def _size_for_level(level: int, max_levels: int) -> SizeClass:
    if level <= 2:
        return SizeClass.SMALL
    elif level <= max_levels - 1:
        return SizeClass.MEDIUM
    else:
        return SizeClass.LARGE


def _weight_for_level(level: int) -> float:
    if level <= 2:
        return 30.0  # ground level: heavier items OK
    elif level <= 4:
        return 20.0
    else:
        return 10.0  # top levels: light items only
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_warehouse_generator.py -v
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add slotting/generators/ tests/test_warehouse_generator.py
git commit -m "feat: add warehouse layout generator with configurable Action profile"
```

---

### Task 11: SKU Generator

**Files:**
- Create: `slotting/generators/sku_generator.py`
- Create: `tests/test_sku_generator.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_sku_generator.py`:

```python
from slotting.generators.sku_generator import generate_skus, SKUConfig
from slotting.models.sku import Category, VelocityClass


def test_default_sku_count():
    skus = generate_skus(seed=42)
    assert 8000 <= len(skus) <= 12000


def test_custom_count():
    config = SKUConfig(total_skus=100)
    skus = generate_skus(config=config, seed=42)
    assert len(skus) == 100


def test_pareto_distribution():
    """Top 20% of SKUs should have velocity class A."""
    config = SKUConfig(total_skus=1000)
    skus = generate_skus(config=config, seed=42)
    a_count = sum(1 for s in skus if s.velocity_class == VelocityClass.A)
    # A-class should be roughly 20% (±5% tolerance for randomness)
    assert 150 <= a_count <= 250


def test_all_categories_represented():
    skus = generate_skus(seed=42)
    categories = {s.category for s in skus}
    for cat in Category:
        assert cat in categories


def test_seasonal_skus_exist():
    skus = generate_skus(seed=42)
    seasonal = [s for s in skus if s.is_seasonal]
    assert len(seasonal) > 0


def test_reproducible():
    skus1 = generate_skus(seed=99)
    skus2 = generate_skus(seed=99)
    assert len(skus1) == len(skus2)
    assert skus1[0].id == skus2[0].id
    assert skus1[0].name == skus2[0].name


def test_unique_ids():
    config = SKUConfig(total_skus=500)
    skus = generate_skus(config=config, seed=42)
    ids = [s.id for s in skus]
    assert len(ids) == len(set(ids))
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_sku_generator.py -v
```

Expected: ImportError.

- [ ] **Step 3: Write the implementation**

`slotting/generators/sku_generator.py`:

```python
"""Generate realistic SKU catalogs matching Action's discount retail profile."""

from dataclasses import dataclass, field
import numpy as np

from slotting.models.sku import SKU, Category, VelocityClass
from slotting.models.warehouse import SizeClass


# Action product name templates per category
_PRODUCT_NAMES: dict[Category, list[str]] = {
    Category.HOUSEHOLD: [
        "Afwasmiddel {}ml", "Allesreiniger {}ml", "Waspoeder {}g",
        "Vuilniszakken {}L", "Schoonmaakdoekjes {}st", "WC-reiniger {}ml",
        "Handzeep {}ml", "Vaatwasmiddel tabs {}st", "Stofzuigerzakken {}st",
        "Luchtverfrissier {}ml",
    ],
    Category.BEAUTY: [
        "Shampoo {}ml", "Douchegel {}ml", "Tandpasta {}ml",
        "Deodorant {}ml", "Handcrème {}ml", "Bodylotion {}ml",
        "Haarlak {}ml", "Scheermesjes {}st", "Wattenschijfjes {}st",
        "Nagellak {}ml",
    ],
    Category.TOYS: [
        "Puzzel {}st", "Kleurpotloden {}st", "Speelgoedauto {}cm",
        "Knuffel {}cm", "Bouwblokken {}st", "Kaartspel {}st",
        "Waterpistool {}cm", "Bellenblaas {}ml", "Springtouw {}m",
        "Bal {}cm",
    ],
    Category.FOOD_SNACKS: [
        "Chips {}g", "Chocoladereep {}g", "Koekjes {}g",
        "Snoepzak {}g", "Nootjes {}g", "Popcorn {}g",
        "Energiereep {}g", "Kauwgom {}st", "Dropjes {}g",
        "Crackers {}g",
    ],
    Category.GARDEN_SEASONAL: [
        "BBQ Houtskool {}kg", "Tuinkaars {}cm", "Plantenpot {}cm",
        "Tuinhandschoenen maat {}", "Zaadjes {}", "Gieter {}L",
        "Buitenverlichting {}st", "Tuinkussen {}cm", "Zwembad {}cm",
        "Zonnebrandcrème SPF{}",
    ],
    Category.CLOTHING_ACCESSORIES: [
        "Sokken maat {}", "T-shirt maat {}", "Cap {}",
        "Sjaal {}cm", "Portemonnee {}", "Zonnebril model {}",
        "Riem {}cm", "Haarband {}st", "Armband {}",
        "Sleutelhanger {}",
    ],
    Category.OFFICE: [
        "Balpen {}st", "Notitieboek A{}", "Plakband {}m",
        "Schaar {}cm", "Markeerstiften {}st", "Paperclips {}st",
        "Printpapier A{}", "Enveloppen {}st", "Liniaal {}cm",
        "Gum {}st",
    ],
    Category.PET: [
        "Hondenvoer {}g", "Kattenvoer {}g", "Kattenbak vulling {}L",
        "Hondensnoepjes {}g", "Kattenspeeltje {}", "Hondenriem {}m",
        "Voerbak {}ml", "Aquariumvoer {}g", "Knaagdiervoer {}g",
        "Hondenshampoo {}ml",
    ],
    Category.DECORATION: [
        "Kaars {}cm", "Fotolijst {}cm", "Vaas {}cm",
        "Kussen {}cm", "Kunstbloem {}cm", "Spiegel {}cm",
        "Klok {}cm", "Opbergdoos {}L", "Theelichthouder {}st",
        "Muursticker {}cm",
    ],
}

# Category distribution weights (approximate Action profile)
_CATEGORY_WEIGHTS: dict[Category, float] = {
    Category.HOUSEHOLD: 0.18,
    Category.BEAUTY: 0.12,
    Category.TOYS: 0.10,
    Category.FOOD_SNACKS: 0.12,
    Category.GARDEN_SEASONAL: 0.10,
    Category.CLOTHING_ACCESSORIES: 0.08,
    Category.OFFICE: 0.08,
    Category.PET: 0.07,
    Category.DECORATION: 0.15,
}

_SEASONAL_CATEGORIES = {
    Category.GARDEN_SEASONAL: ([4, 5, 6, 7, 8], 3.5),
    Category.DECORATION: ([10, 11, 12], 2.5),
    Category.TOYS: ([10, 11, 12], 3.0),
}


@dataclass
class SKUConfig:
    total_skus: int = 10000
    a_pct: float = 0.20
    b_pct: float = 0.30
    c_pct: float = 0.30
    d_pct: float = 0.20


def generate_skus(
    config: SKUConfig | None = None,
    seed: int | None = None,
) -> list[SKU]:
    if config is None:
        config = SKUConfig()

    rng = np.random.default_rng(seed)

    # Distribute SKUs across categories
    categories = list(_CATEGORY_WEIGHTS.keys())
    weights = np.array([_CATEGORY_WEIGHTS[c] for c in categories])
    weights /= weights.sum()
    cat_counts = rng.multinomial(config.total_skus, weights)

    # Assign velocity classes using Pareto-like distribution
    velocity_boundaries = np.cumsum([config.a_pct, config.b_pct, config.c_pct])

    skus: list[SKU] = []
    sku_counter = 0

    for cat, count in zip(categories, cat_counts):
        names = _PRODUCT_NAMES[cat]
        for i in range(count):
            sku_counter += 1
            name_template = names[i % len(names)]
            variant = rng.integers(1, 100)
            name = name_template.format(variant)

            # Velocity class based on random percentile
            pct = rng.random()
            if pct < velocity_boundaries[0]:
                vel = VelocityClass.A
                avg_picks = float(rng.uniform(30, 100))
            elif pct < velocity_boundaries[1]:
                vel = VelocityClass.B
                avg_picks = float(rng.uniform(10, 30))
            elif pct < velocity_boundaries[2]:
                vel = VelocityClass.C
                avg_picks = float(rng.uniform(3, 10))
            else:
                vel = VelocityClass.D
                avg_picks = float(rng.uniform(0.1, 3))

            size = rng.choice(
                [SizeClass.SMALL, SizeClass.MEDIUM, SizeClass.LARGE],
                p=[0.5, 0.35, 0.15],
            )
            weight = float(rng.uniform(0.05, 5.0))
            if size == SizeClass.LARGE:
                weight = float(rng.uniform(2.0, 15.0))

            # Seasonal properties
            seasonal_months: list[int] = []
            peak_mult = 1.0
            if cat in _SEASONAL_CATEGORIES:
                months, mult = _SEASONAL_CATEGORIES[cat]
                seasonal_months = months
                peak_mult = mult

            sku = SKU(
                id=f"SKU-{sku_counter:05d}",
                name=name,
                category=cat,
                size=size,
                weight_kg=round(weight, 2),
                is_fragile=bool(rng.random() < 0.08),
                is_perishable=cat == Category.FOOD_SNACKS,
                velocity_class=vel,
                avg_daily_picks=round(avg_picks, 1),
                seasonal_peak_months=seasonal_months,
                peak_multiplier=peak_mult,
            )
            skus.append(sku)

    return skus
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_sku_generator.py -v
```

Expected: all 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add slotting/generators/sku_generator.py tests/test_sku_generator.py
git commit -m "feat: add SKU generator with Action retail profile and Pareto velocity distribution"
```

---

### Task 12: Order Generator

**Files:**
- Create: `slotting/generators/order_generator.py`
- Create: `tests/test_order_generator.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_order_generator.py`:

```python
from datetime import date
from slotting.generators.order_generator import generate_orders, OrderGenConfig
from slotting.generators.sku_generator import generate_skus, SKUConfig


def _make_skus():
    return generate_skus(config=SKUConfig(total_skus=200), seed=42)


def test_default_order_count():
    skus = _make_skus()
    orders = generate_orders(skus=skus, seed=42)
    assert 2000 <= len(orders) <= 5000


def test_custom_config():
    skus = _make_skus()
    config = OrderGenConfig(orders_per_day=50, num_days=3)
    orders = generate_orders(skus=skus, config=config, seed=42)
    assert 100 <= len(orders) <= 200  # ~50/day × 3 days, with variance


def test_order_lines_in_range():
    skus = _make_skus()
    config = OrderGenConfig(orders_per_day=100, num_days=1)
    orders = generate_orders(skus=skus, config=config, seed=42)
    for order in orders:
        assert 1 <= order.num_lines <= 60


def test_orders_have_dates():
    skus = _make_skus()
    config = OrderGenConfig(
        orders_per_day=50,
        num_days=5,
        start_date=date(2026, 4, 1),
    )
    orders = generate_orders(skus=skus, config=config, seed=42)
    dates = {o.date for o in orders}
    assert date(2026, 4, 1) in dates


def test_higher_velocity_skus_picked_more():
    skus = _make_skus()
    config = OrderGenConfig(orders_per_day=200, num_days=5)
    orders = generate_orders(skus=skus, config=config, seed=42)
    pick_counts: dict[str, int] = {}
    for order in orders:
        for line in order.lines:
            pick_counts[line.sku_id] = pick_counts.get(line.sku_id, 0) + 1
    # A-class SKUs should appear more often on average
    a_skus = [s for s in skus if s.velocity_class.value == "A"]
    d_skus = [s for s in skus if s.velocity_class.value == "D"]
    if a_skus and d_skus:
        avg_a = sum(pick_counts.get(s.id, 0) for s in a_skus) / len(a_skus)
        avg_d = sum(pick_counts.get(s.id, 0) for s in d_skus) / len(d_skus)
        assert avg_a > avg_d


def test_reproducible():
    skus = _make_skus()
    config = OrderGenConfig(orders_per_day=50, num_days=2)
    o1 = generate_orders(skus=skus, config=config, seed=77)
    o2 = generate_orders(skus=skus, config=config, seed=77)
    assert len(o1) == len(o2)
    assert o1[0].id == o2[0].id
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_order_generator.py -v
```

Expected: ImportError.

- [ ] **Step 3: Write the implementation**

`slotting/generators/order_generator.py`:

```python
"""Generate realistic order histories matching Action's store replenishment patterns."""

from dataclasses import dataclass
from datetime import date, timedelta

import numpy as np

from slotting.models.order import Order, OrderLine
from slotting.models.sku import SKU, VelocityClass


# Weekday multipliers: Mon=0..Sun=6. Mon/Tue heavier (after weekend sales)
_WEEKDAY_MULTIPLIER = [1.4, 1.3, 1.0, 1.0, 0.9, 0.7, 0.7]


@dataclass
class OrderGenConfig:
    orders_per_day: int = 3500
    num_days: int = 1
    start_date: date = date(2026, 4, 1)
    min_lines: int = 15
    max_lines: int = 40
    day_variance: float = 0.15  # ±15% daily volume variance


def generate_orders(
    skus: list[SKU],
    config: OrderGenConfig | None = None,
    seed: int | None = None,
) -> list[Order]:
    if config is None:
        config = OrderGenConfig()

    rng = np.random.default_rng(seed)

    # Build pick probability weights based on velocity
    velocity_weights = {
        VelocityClass.A: 4.0,
        VelocityClass.B: 2.0,
        VelocityClass.C: 1.0,
        VelocityClass.D: 0.3,
    }
    sku_weights = np.array([velocity_weights[s.velocity_class] for s in skus])
    sku_weights /= sku_weights.sum()

    orders: list[Order] = []
    order_counter = 0

    for day_offset in range(config.num_days):
        current_date = config.start_date + timedelta(days=day_offset)
        weekday = current_date.weekday()
        weekday_mult = _WEEKDAY_MULTIPLIER[weekday]

        # Apply seasonal adjustment to SKU weights for this day's month
        month = current_date.month
        seasonal_weights = _apply_seasonal_weights(skus, sku_weights, month)

        # Daily order count with variance and weekday effect
        base_count = int(config.orders_per_day * weekday_mult)
        daily_count = int(
            rng.normal(base_count, base_count * config.day_variance)
        )
        daily_count = max(1, daily_count)

        # Generate store IDs (simulate ~300 stores)
        store_ids = [f"STORE-NL-{i:03d}" for i in range(1, 301)]

        for _ in range(daily_count):
            order_counter += 1
            num_lines = int(rng.integers(config.min_lines, config.max_lines + 1))

            # Select SKUs for this order (weighted, no duplicates)
            selected_indices = rng.choice(
                len(skus),
                size=min(num_lines, len(skus)),
                replace=False,
                p=seasonal_weights,
            )

            lines = []
            for idx in selected_indices:
                sku = skus[idx]
                quantity = int(rng.integers(1, 24))
                lines.append(OrderLine(sku_id=sku.id, quantity=quantity))

            order = Order(
                id=f"ORD-{current_date.isoformat()}-{order_counter:06d}",
                date=current_date,
                store_id=str(rng.choice(store_ids)),
                lines=lines,
            )
            orders.append(order)

    return orders


def _apply_seasonal_weights(
    skus: list[SKU],
    base_weights: np.ndarray,
    month: int,
) -> np.ndarray:
    adjusted = base_weights.copy()
    for i, sku in enumerate(skus):
        if sku.is_seasonal and month in sku.seasonal_peak_months:
            adjusted[i] *= sku.peak_multiplier
    # Renormalize
    total = adjusted.sum()
    if total > 0:
        adjusted /= total
    return adjusted
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_order_generator.py -v
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add slotting/generators/order_generator.py tests/test_order_generator.py
git commit -m "feat: add order generator with seasonal patterns and velocity-weighted SKU selection"
```

---

### Task 13: Data Export & Import Interface

**Files:**
- Create: `slotting/io/__init__.py`
- Create: `slotting/io/export.py`
- Create: `tests/test_export.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_export.py`:

```python
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
        Order(
            id="ORD-001",
            date=date(2026, 4, 10),
            store_id="STORE-001",
            lines=[
                OrderLine(sku_id="SKU-00001", quantity=5),
                OrderLine(sku_id="SKU-00002", quantity=3),
            ],
        )
    ]
    path = tmp_path / "orders.csv"
    export_orders_csv(orders, path)
    assert path.exists()
    lines = path.read_text().strip().split("\n")
    assert len(lines) == 3  # header + 2 order lines
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_export.py -v
```

Expected: ImportError.

- [ ] **Step 3: Write the implementation**

`slotting/io/__init__.py`:
```python
"""Data import/export for warehouse, SKU, and order data."""
```

`slotting/io/export.py`:

```python
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
                        "id": rack.id,
                        "position": rack.position,
                        "side": rack.side,
                        "levels": rack.levels,
                        "locations": [
                            {
                                "id": loc.id,
                                "position": loc.position,
                                "level": loc.level,
                                "size": loc.size.value,
                                "max_weight_kg": loc.max_weight_kg,
                                "sku_id": loc.sku_id,
                            }
                            for loc in rack.locations
                        ],
                    }
                    for rack in aisle.racks
                ],
            }
            for aisle in warehouse.aisles
        ],
        "zones": [
            {
                "id": zone.id,
                "zone_type": zone.zone_type.value,
                "aisle_ids": zone.aisle_ids,
            }
            for zone in warehouse.zones
        ],
    }
    path.write_text(json.dumps(data, indent=2))


def export_skus_csv(skus: list[SKU], path: Path) -> None:
    fieldnames = [
        "id", "name", "category", "size", "weight_kg",
        "is_fragile", "is_perishable", "velocity_class",
        "avg_daily_picks", "seasonal_peak_months", "peak_multiplier",
    ]
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for sku in skus:
            writer.writerow({
                "id": sku.id,
                "name": sku.name,
                "category": sku.category.value,
                "size": sku.size.value,
                "weight_kg": sku.weight_kg,
                "is_fragile": sku.is_fragile,
                "is_perishable": sku.is_perishable,
                "velocity_class": sku.velocity_class.value,
                "avg_daily_picks": sku.avg_daily_picks,
                "seasonal_peak_months": ",".join(
                    str(m) for m in sku.seasonal_peak_months
                ),
                "peak_multiplier": sku.peak_multiplier,
            })


def export_orders_csv(orders: list[Order], path: Path) -> None:
    fieldnames = [
        "order_id", "date", "store_id", "sku_id", "quantity", "location_id",
    ]
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for order in orders:
            for line in order.lines:
                writer.writerow({
                    "order_id": order.id,
                    "date": order.date.isoformat(),
                    "store_id": order.store_id,
                    "sku_id": line.sku_id,
                    "quantity": line.quantity,
                    "location_id": line.location_id or "",
                })
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_export.py -v
```

Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add slotting/io/ tests/test_export.py
git commit -m "feat: add JSON/CSV export for warehouse, SKU, and order data"
```

---

### Task 14: Integration Test — Full Data Pipeline

**Files:**
- Create: `tests/test_integration.py`

- [ ] **Step 1: Write the integration test**

`tests/test_integration.py`:

```python
"""Integration test: generate a full Action-profile dataset and verify consistency."""

from slotting.generators.warehouse_generator import generate_warehouse
from slotting.generators.sku_generator import generate_skus
from slotting.generators.order_generator import generate_orders, OrderGenConfig
from slotting.warehouse_graph import WarehouseGraph


def test_full_pipeline():
    # Generate warehouse
    wh = generate_warehouse(seed=42)
    assert wh.total_locations > 5000

    # Generate SKUs
    skus = generate_skus(seed=42)
    assert len(skus) > 8000

    # SKUs should fit in warehouse (more locations than SKUs)
    assert wh.total_locations >= len(skus)

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
```

- [ ] **Step 2: Run the integration test**

```bash
pytest tests/test_integration.py -v
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

```bash
pytest --tb=short -v
```

Expected: all tests PASS (across all test files).

- [ ] **Step 4: Commit**

```bash
git add tests/test_integration.py
git commit -m "test: add integration test for full data pipeline"
```

---

### Task 15: Update Obsidian Vault HOME

**Files:**
- Modify: `vault/HOME.md`

- [ ] **Step 1: Update HOME.md with Sprint 1 deliverables**

Add a "Sprint 1 Deliverables" section to `vault/HOME.md` listing the completed research notes and code components with links.

```markdown
## Sprint 1 Deliverables

### Research Notes
- [[research/papers/slotting-taxonomy|Slotting Problem Taxonomy]]
- [[research/papers/tsp-warehouse-routing|TSP & Warehouse Routing]]
- [[research/papers/pick-route-heuristics|Pick-Route Heuristics Overview]]
- [[research/algorithms/warehouse-graph-model|Warehouse Graph Model]]
- [[research/algorithms/distance-metrics|Distance Metrics]]
- [[research/algorithms/s-shape-heuristic|S-Shape Heuristic]]
- [[research/algorithms/largest-gap-heuristic|Largest Gap Heuristic]]
- [[research/algorithms/pick-route-comparison|Pick-Route Comparison]]

### Code Components
- `slotting/models/` — Domain models (Warehouse, SKU, Order)
- `slotting/warehouse_graph.py` — NetworkX graph for distance/routing
- `slotting/generators/` — Synthetic data generators (warehouse, SKU, orders)
- `slotting/io/export.py` — JSON/CSV export
```

- [ ] **Step 2: Commit**

```bash
git add vault/HOME.md
git commit -m "docs: update vault HOME with Sprint 1 deliverables"
```

---

## Verification

After completing all tasks, run the full verification:

```bash
# All tests pass
pytest --tb=short -v

# Check test coverage
pytest --cov=slotting --cov-report=term-missing

# Verify vault notes exist
ls vault/research/papers/
ls vault/research/algorithms/

# Verify exports work
python -c "
from slotting.generators.warehouse_generator import generate_warehouse
from slotting.generators.sku_generator import generate_skus
from slotting.generators.order_generator import generate_orders, OrderGenConfig
from slotting.warehouse_graph import WarehouseGraph
from pathlib import Path
import json

wh = generate_warehouse(seed=42)
skus = generate_skus(seed=42)
orders = generate_orders(skus=skus, config=OrderGenConfig(orders_per_day=100, num_days=1), seed=42)
graph = WarehouseGraph(wh)

print(f'Warehouse: {wh.total_locations} locations across {len(wh.aisles)} aisles')
print(f'SKUs: {len(skus)}')
print(f'Orders: {len(orders)}')
print(f'Graph: {graph.node_count} nodes, {graph.edge_count} edges')
print(f'Depot to last aisle: {graph.distance(\"depot\", f\"{wh.aisles[-1].id}_front\"):.1f}m')
print('Sprint 1 verification: PASS')
"
```

Expected output:
```
Warehouse: ~3000 locations across 15 aisles
SKUs: ~10000
Orders: ~100
Graph: 31 nodes, ~44 edges
Depot to last aisle: ~63.0m
Sprint 1 verification: PASS
```
