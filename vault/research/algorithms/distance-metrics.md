---
tags:
  - research
  - algorithms
  - distance-metrics
  - warehouse-layout
  - pick-time
  - sprint-1
sources:
  - "De Koster, Le-Duc & Roodbergen (2007) - Design and control of warehouse order picking: A literature review"
  - "Hausman, Schwarz & Graves (1976) - Optimal Storage Assignment in Automatic Warehousing Systems"
  - "Petersen (1997) - An evaluation of order picking routeing policies"
  - "Ratliff & Rosenthal (1983) - Order-Picking in a Rectangular Warehouse: A Solvable Case of the Traveling Salesman Problem"
  - "Roodbergen & De Koster (2001) - Routing methods for warehouses with multiple cross aisles"
  - "Coyle, Bardi & Langley (2003) - The Management of Business Logistics"
  - "Tompkins, White, Bozer & Tanchoco (2010) - Facilities Planning"
  - "Bartholdi & Hackman (2019) - Warehouse & Distribution Science"
sprint: 1
created: 2026-04-10
---

# Distance Metrics in the Warehouse Context

## Overview

Distance metrics are the foundation of slotting optimization. Every slotting decision — location ranking, affinity scoring, route evaluation — depends on accurately measuring the "cost" of reaching a warehouse location. In a warehouse, the relevant distance is not Euclidean (straight-line) but rather the actual **walking path** a picker must follow through aisles and cross-aisles.

This note evaluates four distance metrics in the warehouse context and recommends a combined approach for the Action slotting engine.

---

## Rectilinear (Manhattan) Distance

### Definition

Rectilinear distance, also called Manhattan distance or L1-norm, measures the sum of absolute differences along each axis:

```
d_manhattan(A, B) = |x_A - x_B| + |y_A - y_B|
```

where `x` represents the position along the cross-aisle axis (which aisle) and `y` represents the position along the aisle depth axis (which bay).

### Application in Warehouses

In a rectangular warehouse with a grid layout, rectilinear distance approximates the walking path because pickers move in orthogonal directions — along aisles (y-axis) and along cross-aisles (x-axis). It was the standard distance metric in early warehouse optimization literature (Hausman et al., 1976).

For two locations in the **same aisle**, rectilinear distance reduces to the simple along-aisle distance:

```
d = |bay_A - bay_B| * bay_spacing
```

For two locations in **different aisles**, a picker must exit the current aisle via a cross-aisle, traverse to the target aisle, and enter it:

```
d = (distance to nearest cross-aisle from A)
  + (inter-aisle distance along cross-aisle)
  + (distance from cross-aisle to B)
```

### Pros

- **Fast to compute** — O(1) per pair, no graph traversal needed.
- **No preprocessing** — Does not require building or storing a graph.
- **Good approximation** — For warehouses with only front-and-back cross-aisles, rectilinear distance is within 10-20% of true walking distance for most location pairs (Petersen, 1997).
- **Sufficient for ranking** — For the purpose of ranking locations by accessibility (e.g., COI-based slotting), the relative ordering produced by rectilinear distance usually matches that of exact graph distance.

### Cons

- **Ignores cross-aisle constraints** — Rectilinear distance assumes the picker can exit an aisle at any point, when in reality they must walk to a cross-aisle. This overestimates distance for locations near a cross-aisle and underestimates it for mid-aisle locations.
- **Inaccurate for mid-aisle locations** — A picker at bay 20 of a 40-bay aisle must walk to bay 0 (front) or bay 39 (back) to reach the cross-aisle. Rectilinear distance does not capture this detour.
- **No routing awareness** — Cannot account for which direction a picker enters an aisle in a multi-stop route.
- **Fails with non-standard layouts** — Blocked aisles, diagonal paths, or multiple cross-aisles are not handled.

### When to Use

Rectilinear distance is appropriate as a **fast heuristic** for:
- Initial location ranking during COI computation
- Quick feasibility checks
- Seed solutions for metaheuristic optimizers
- Approximate affinity scoring when graph computation is too expensive (unlikely at Action's scale)

---

## Graph-Based Distance

### Definition

The shortest-path distance on a warehouse graph, where nodes represent locations and aisle intersections, and edges represent walkable paths weighted by physical distance. See [[warehouse-graph-model]] for the full graph construction.

```
d_graph(A, B) = shortest_path_length(G, A, B, weight="weight")
```

Computed using Dijkstra's algorithm or, for the simple structure of a warehouse graph, even BFS with edge weights.

### Application in Warehouses

Graph-based distance captures the **exact walking distance** a picker must travel, accounting for:
- The requirement to reach a cross-aisle before changing aisles
- The choice between front and back cross-aisle (whichever is shorter)
- Multiple cross-aisle options if the warehouse has more than two
- Any blocked or one-way aisles

Ratliff & Rosenthal (1983) showed that the graph structure of a rectangular warehouse enables not just shortest-path computation but also optimal route (TSP) computation in polynomial time.

### Pros

- **Exact** — Represents true walking distance with no approximation.
- **Layout-flexible** — Handles any warehouse topology: multiple cross-aisles, blocked sections, one-way aisles, non-rectangular extensions.
- **Route-compatible** — The same graph is used for route optimization, ensuring consistency between slotting evaluation and actual picking.
- **Efficient at Action's scale** — For ~756 nodes and ~810 edges, Dijkstra runs in microseconds. Even all-pairs shortest paths can be precomputed in < 1 second.

### Cons

- **Requires graph construction** — Must build and maintain the warehouse graph. Changes to layout (blocked aisle, new racking) require graph updates.
- **Slightly more complex implementation** — Compared to a formula-based metric, requires a graph library (NetworkX).
- **Overhead for trivial cases** — For same-aisle distance, the graph lookup is overkill (but still fast).

### When to Use

Graph-based distance should be the **primary metric** for:
- Final slotting scoring and location assignment
- Route length estimation for order evaluation
- Affinity cluster compactness measurement
- Before/after comparison of slotting changes

---

## Chebyshev Distance

### Definition

Chebyshev distance (L-infinity norm) is the maximum of absolute differences along each axis:

```
d_chebyshev(A, B) = max(|x_A - x_B|, |y_A - y_B|)
```

### Application in Warehouses

Chebyshev distance is used in contexts where movement in multiple dimensions is simultaneous (e.g., a crane in an AS/RS that moves horizontally and vertically at the same time). In such systems, the total travel time is determined by the slower axis, hence the max operation.

### Relevance for Action

**Not directly useful** for Action's man-to-goods picking. Human pickers move sequentially — they walk along an aisle, then along a cross-aisle — they do not move in both directions simultaneously. Chebyshev distance would significantly **underestimate** walking distance in a manual warehouse.

However, if Action has any **automated storage/retrieval systems (AS/RS)** or shuttle systems in specific zones, Chebyshev distance would be the correct metric for those components. This is not currently in scope but noted for completeness.

---

## Height-Adjusted Pick Time Model

### Motivation

Distance metrics above measure **horizontal travel** — the time to walk to a location. But the total pick time also includes:
1. **Vertical reach/access time** — Time to pick from different rack levels
2. **Search time** — Time to identify the correct item (relatively constant)
3. **Extraction time** — Time to physically grab and place the item (depends on weight/size)

The vertical component is significant: picking from floor level or high shelves takes measurably longer than picking from waist-to-shoulder height (the "golden zone"). Tompkins et al. (2010) reported that pick time from the highest rack level can be 2-3x that of the ergonomic mid-level, especially when equipment (ladders, order pickers) is needed.

### Model

A practical pick-time model combines horizontal travel time with a height-dependent pick-time penalty:

```
T_pick(location) = T_travel(location) + T_height(level) + T_extract(sku)
```

Where:

**T_travel** — Horizontal travel time, derived from graph distance:
```
T_travel = d_graph(depot, location) / v_walk
```
With `v_walk` typically 0.8-1.2 m/s for loaded pickers (Bartholdi & Hackman, 2019; the lower end accounts for acceleration, deceleration, and congestion).

**T_height** — Height-dependent pick time penalty per level:

| Level | Description | Time Penalty | Notes |
|-------|-------------|-------------|-------|
| 1 (floor) | Ground level | +3-5 s | Bending/crouching required |
| 2 | Below waist | +1-2 s | Slight bend |
| 3 | Waist to chest | +0 s (baseline) | **Golden zone** — ergonomic optimum |
| 4 | Chest to shoulder | +0-1 s | Still comfortable |
| 5 | Above shoulder | +3-6 s | Reaching up, possible step stool |
| 6 | Top level | +6-12 s | Ladder or order picker vehicle required |

These values are indicative; exact times should be calibrated from Action's time-and-motion data or standard ergonomic databases. Coyle, Bardi & Langley (2003) provide similar ranges for manual picking environments.

**T_extract** — SKU-dependent extraction time based on weight and handling characteristics. Typically 2-5 seconds for standard cases, longer for heavy or awkward items. Can be modeled as a constant initially and refined later with SKU-level data.

### Composite Cost for Slotting

For slotting purposes, we combine frequency, distance, and pick time into a weighted location cost:

```
cost(sku, location) = frequency(sku) * [w_travel * T_travel(location)
                                       + w_height * T_height(level)
                                       + w_ergo * E_penalty(level, sku_weight)]
```

Where `w_travel`, `w_height`, and `w_ergo` are tunable weights. The ergonomic penalty `E_penalty` penalizes placing heavy items at non-ergonomic heights, independent of pick-time impact.

### Relevance for Action

Action warehouses have 4-6 height levels per rack. With 8,000-12,000 SKUs and large orders (15-40 lines), the cumulative height penalty across an order is significant. A slotting engine that only considers horizontal distance will sub-optimally place fast-moving items at inconvenient heights.

The height-adjusted model ensures:
- **A-class SKUs** land in the golden zone (levels 2-4) of close-to-depot aisles
- **Heavy items** stay at levels 1-3 regardless of velocity (ergonomic/safety constraint)
- **Slow movers** absorb the worst positions (high shelves in distant aisles)

---

## Metric Comparison

| Metric | Accuracy | Compute Cost | Layout Flexibility | Routing Compatible |
|--------|----------|-------------|-------------------|-------------------|
| Rectilinear (Manhattan) | Moderate (~80-90% of true) | O(1) | Low (grid only) | No |
| Graph-based (Dijkstra) | Exact | O((V+E) log V) | High (any layout) | Yes |
| Chebyshev | Poor for manual picking | O(1) | Low | No |
| Height-adjusted pick time | Exact + vertical | O((V+E) log V) + O(1) | High | Yes |

---

## Recommendation for the Action Slotting Engine

### Primary Metric: Graph-Based Distance

Use graph shortest-path distance as the primary horizontal distance metric. At Action's warehouse scale (~756 nodes), computation is trivially fast and provides exact results. The warehouse graph is needed anyway for route optimization, so there is no additional infrastructure cost.

### Height-Adjusted Scoring for Location Ranking

Extend the pure distance metric with the height-adjusted pick time model when scoring locations for SKU assignment. This ensures the golden zone is prioritized for high-velocity items and ergonomic constraints are respected.

### Rectilinear as Fast Heuristic

Use rectilinear distance only where sub-millisecond computation matters and approximate results are acceptable:
- **Metaheuristic inner loops** — When a simulated annealing or genetic algorithm evaluates millions of candidate swaps, rectilinear distance avoids graph lookups. (Though at Action's graph size, even graph lookups may be fast enough.)
- **Initial seed solutions** — Rank locations by rectilinear distance from depot as a starting point before refining with graph-based scoring.

### Implementation Priority

1. **Sprint 1:** Build `WarehouseGraph` class with Dijkstra-based `shortest_distance()` and `distance_from_depot()`. Define height penalty lookup table. Implement composite `pick_time()` function.
2. **Sprint 2:** Integrate graph distances into COI scoring and affinity compactness metrics. Calibrate height penalties with Action data (or sensible defaults). Use rectilinear distance as fallback in optimization inner loops if profiling shows graph lookups are a bottleneck.

---

## References

1. Bartholdi, J.J., & Hackman, S.T. (2019). *Warehouse & Distribution Science*. Georgia Institute of Technology. Available at: www.warehouse-science.com.
2. Coyle, J.J., Bardi, E.J., & Langley, C.J. (2003). *The Management of Business Logistics: A Supply Chain Perspective* (7th ed.). South-Western.
3. De Koster, R., Le-Duc, T., & Roodbergen, K.J. (2007). Design and control of warehouse order picking: A literature review. *European Journal of Operational Research*, 182(2), 481-501.
4. Hausman, W.H., Schwarz, L.B., & Graves, S.C. (1976). Optimal storage assignment in automatic warehousing systems. *Management Science*, 22(6), 629-638.
5. Petersen, C.G. (1997). An evaluation of order picking routeing policies. *International Journal of Operations & Production Management*, 17(11), 1098-1111.
6. Ratliff, H.D., & Rosenthal, A.S. (1983). Order-picking in a rectangular warehouse: A solvable case of the traveling salesman problem. *Operations Research*, 31(3), 507-521.
7. Roodbergen, K.J., & De Koster, R. (2001). Routing methods for warehouses with multiple cross aisles. *International Journal of Production Research*, 39(9), 1865-1883.
8. Tompkins, J.A., White, J.A., Bozer, Y.A., & Tanchoco, J.M.A. (2010). *Facilities Planning* (4th ed.). Wiley.
