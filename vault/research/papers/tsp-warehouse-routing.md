---
title: TSP & Warehouse Order Picker Routing
tags:
  - research
  - tsp
  - routing
  - warehouse
  - order-picking
  - optimization
  - sprint-1
sources:
  - "Ratliff & Rosenthal (1983). Order-picking in a rectangular warehouse: A solvable case of the traveling salesman problem. Operations Research, 31(3), 507-521."
  - "De Koster, Le-Duc & Roodbergen (2007). Design and control of warehouse order picking: A literature review. European Journal of Operational Research, 182(2), 481-501."
  - "Theys, Bräysy, Dullaert & Raa (2010). Using a TSP heuristic for routing order pickers in warehouses. European Journal of Operational Research, 200(3), 755-763."
  - "Scholz, Schubert & Wäscher (2017). Order picking with multiple pickers and due dates — Simultaneous solution of order batching, batch assignment and sequencing, and picker routing problems. European Journal of Operational Research, 263(2), 461-478."
  - "Roodbergen & De Koster (2001). Routing methods for warehouses with multiple cross aisles. International Journal of Production Research, 39(9), 1865-1883."
  - "Hall (1993). Distance approximations for routing manual pickers in a warehouse. IIE Transactions, 25(4), 76-87."
sprint: 1
created: 2026-04-10
relevance: pick-route optimization in Sprint 2
---

# TSP & Warehouse Order Picker Routing

## Problem Formulation

The **order picker routing problem (OPRP)** asks: given a set of items to be picked from known locations in a warehouse, what is the shortest route that visits all locations and returns to the depot?

This maps directly to the **Traveling Salesman Problem (TSP)**: find the minimum-cost Hamiltonian cycle through a set of nodes. In the warehouse context:

- **Nodes** = pick locations (storage slots where items must be retrieved) + depot (start/end point)
- **Edges** = walkable paths between locations, weighted by travel distance
- **Objective** = minimize total travel distance (or time) for one pick tour
- **Constraint** = every pick location must be visited exactly once; the picker returns to the depot

### Warehouse-Specific Characteristics

Unlike the general TSP on arbitrary graphs, warehouse routing has **exploitable structure**:

1. **Rectangular grid layout** — parallel aisles connected by front/back cross-aisles
2. **Rectilinear (Manhattan) distances** — pickers cannot cut diagonally through racking
3. **Aisle traversal constraint** — within an aisle, a picker can only enter/exit from the ends (or from cross-aisles)
4. **Subgraph visit** — the picker does not need to visit every aisle, only those containing pick locations (this makes it a **Steiner TSP** variant)
5. **Depot location** — typically at the front of the warehouse, breaking symmetry

### Steiner TSP Connection

The warehouse routing problem is more precisely modeled as a **Steiner Traveling Salesman Problem**: the picker must visit a subset of nodes (pick locations) but may traverse intermediate nodes (aisle intersections, cross-aisle junctions) without picking. The graph contains "Steiner nodes" that can optionally be used to construct shorter paths.

---

## Complexity Analysis

### General Case: NP-Hard

The general TSP is NP-hard (Karp, 1972). The warehouse routing problem on arbitrary layouts — especially multi-block warehouses with multiple cross-aisles, non-rectangular shapes, or scattered storage zones — remains NP-hard. Specifically:

- Warehouses with **3 or more cross-aisles** make the problem NP-hard (Ratliff & Rosenthal, 1983)
- General multi-block layouts are NP-hard (Roodbergen & De Koster, 2001)

### Special Case: Polynomial for Single-Block Rectangular Warehouses

**Ratliff & Rosenthal (1983)** proved a landmark result: for a **rectangular warehouse with parallel aisles and exactly two cross-aisles** (front and back), the optimal picker route can be found in **O(n)** time using dynamic programming.

Key insight: the problem can be decomposed aisle-by-aisle. At each aisle, only a constant number of partial-tour structures need to be tracked (the picker either traverses the aisle fully, enters from one end, or skips it). This yields a DP with a state space of bounded size per aisle.

This is a rare and practically important result: a polynomial-time exact algorithm for a real-world TSP variant.

### Intermediate Cases

| Layout | Complexity | Method |
|--------|-----------|--------|
| Single block, 2 cross-aisles | **O(n)** polynomial | Ratliff-Rosenthal DP |
| Single block, 1 middle cross-aisle | **O(n)** polynomial | Extended DP (Roodbergen & De Koster, 2001) |
| Multi-block, k cross-aisles | **NP-hard** for general k | Heuristics or exact with exponential blowup |
| Arbitrary layout (non-rectangular) | **NP-hard** | General TSP solvers |

---

## Exact Methods

### 1. Ratliff-Rosenthal Dynamic Programming (1983)

- **Scope:** Single-block rectangular warehouse, parallel aisles, 2 cross-aisles (front/back)
- **Approach:** Process aisles left to right. At each aisle, enumerate a bounded set of partial-tour "equivalence classes" describing how the partial route connects picked locations. Use DP transitions to extend partial solutions.
- **Complexity:** O(n) where n = number of pick locations
- **Optimality:** Guaranteed optimal
- **Relevance for Action:** Directly applicable if Action warehouses are single-block rectangular with front/back cross-aisles. This is the standard layout for many discount-retail DCs.

### 2. Roodbergen & De Koster Extension (2001)

- **Scope:** Single-block with a **middle cross-aisle** (3 cross-aisles total: front, middle, back)
- **Approach:** Extended DP, but with exponentially more states due to the additional cross-aisle creating more connection options
- **Complexity:** Polynomial for fixed number of cross-aisles, but grows fast
- **Note:** For warehouses with many cross-aisles, this becomes impractical

### 3. Integer Programming / Branch-and-Bound

- **Scope:** Any layout, any number of cross-aisles
- **Approach:** Formulate as TSP-IP (MTZ or DFJ subtour elimination), solve with commercial solver (Gurobi, CPLEX) or OR-Tools
- **Practical limit:** Up to ~40-60 pick locations for exact solving in reasonable time
- **Use case:** Benchmark for heuristic quality; feasible for small orders

### 4. Graph-Based Shortest Path

For any warehouse layout:
1. Model the warehouse as a weighted graph (nodes = intersections + pick locations; edges = aisle segments)
2. Compute all-pairs shortest paths between pick locations (Floyd-Warshall or Dijkstra)
3. Solve the resulting TSP on the distance matrix

This separates the warehouse geometry from the combinatorial optimization.

---

## Heuristic Methods

De Koster et al. (2007) and Theys et al. (2010) provide extensive comparisons. Key heuristics:

### Construction Heuristics (Warehouse-Specific)

| Heuristic | Description | Quality vs. Optimal |
|-----------|-------------|-------------------|
| **S-shape (Traversal)** | Traverse every aisle that contains a pick, skip empty aisles | 10-30% above optimal |
| **Return** | Enter each aisle from the front, pick, return the same way | Good when picks are near the front |
| **Midpoint** | Enter from the nearest end, go up to the midpoint of picks, return | 5-15% above optimal |
| **Largest Gap** | Enter from the nearest end; if a large gap exists between picks, return rather than traverse | 3-10% above optimal |
| **Combined** | Per aisle, choose the better of S-shape or return | 3-8% above optimal |
| **Optimal (Ratliff-Rosenthal)** | DP-based exact for single-block | Optimal by definition |

### General TSP Heuristics (Theys et al., 2010)

Theys et al. tested classic TSP heuristics on warehouse instances:

| Heuristic | Description | Finding |
|-----------|-------------|---------|
| **Nearest Neighbor** | Greedily visit closest unvisited location | Simple but 15-25% above optimal |
| **Lin-Kernighan** | Iterative improvement via k-opt moves | Within 1-3% of optimal |
| **LKH (Lin-Kernighan-Helsgott)** | State-of-the-art TSP heuristic | Near-optimal (<1% gap) |
| **Christofides** | 3/2-approximation guarantee | Theoretical guarantee, 5-10% in practice |
| **Or-opt / 2-opt** | Local search improvement | Good as post-processing step |

**Key finding from Theys et al. (2010):** General-purpose TSP heuristics like LKH consistently outperform warehouse-specific heuristics (S-shape, largest gap) on routing quality. However, warehouse-specific heuristics are much faster to compute and produce routes that are more intuitive for pickers.

### Metaheuristics

For larger instances or integrated problems (batching + routing):

- **Genetic Algorithms** — encode route as permutation, crossover/mutation operators
- **Simulated Annealing** — neighborhood search with probabilistic acceptance
- **Ant Colony Optimization** — pheromone-based construction, works well for TSP variants
- **Tabu Search** — systematic neighborhood exploration with memory

---

## Key Insight: Warehouse Structure Matters

The central insight from this research is that **warehouse physical structure fundamentally determines algorithm choice**:

### Why General TSP Solvers Are Not Enough

1. **Wasted generality** — general TSP solvers ignore the grid/aisle structure, making the problem harder than it needs to be
2. **Picker behavior** — real pickers follow aisles, not arbitrary shortest paths. Routes must be aisle-respecting to be implementable
3. **Aisle traversal patterns** — the decision at each aisle is discrete (traverse fully, enter-and-return, or skip), which creates a much smaller decision space than arbitrary node orderings

### Why Pure Warehouse Heuristics May Not Be Enough

1. **S-shape is a 10-30% penalty** — for high-volume warehouses, this adds up to significant labor cost
2. **Cross-aisles change everything** — middle cross-aisles create shortcuts that simple heuristics cannot exploit
3. **Batch size matters** — with 15-40 lines per order (Action profile), even small percentage gains yield real euro savings at scale

### The Sweet Spot for Action

Given Action's profile (man-to-goods, rectangular warehouses, 15-40 lines per order):

- **For single-block layouts:** Use Ratliff-Rosenthal DP for exact optimal routes in O(n) time. This is fast enough for real-time route computation.
- **For layouts with middle cross-aisles:** Use the Roodbergen-De Koster extension or LKH heuristic.
- **For integrated batching + routing:** Use warehouse-specific heuristics (largest gap, combined) for fast batch evaluation, then refine final routes with LKH or DP.

---

## Relevance for Action

### Warehouse Profile Match

- **Layout:** Rectangular, parallel aisles — fits the Ratliff-Rosenthal model
- **Order size:** 15-40 lines — manageable for exact methods, large enough that route optimization matters
- **Volume:** 2,000-5,000 orders/day — demands fast computation; heuristics for batch evaluation, exact for final routes
- **Scale:** 26 warehouses — solutions must be parameterizable, not hardcoded to one layout

### Expected Impact

Literature consistently reports:
- **Optimal routing vs. S-shape:** 10-30% distance reduction (Hall, 1993; De Koster et al., 2007)
- **Optimal slotting + routing combined:** up to 40-50% distance reduction (De Koster et al., 2007)
- **At Action scale:** with ~3,000 orders/day, even 20% route reduction translates to meaningful FTE savings

### Cross-Aisle Significance

Cross-aisles are the single most impactful layout feature for routing:
- A middle cross-aisle can reduce average travel distance by 10-20% for partial-aisle picks
- More cross-aisles = more shortcut options = shorter routes, but also more complex optimization
- Action should consider cross-aisle placement as part of warehouse design, not just slotting

---

## Implementation Implications

### For Sprint 2 — OR Motor / Pick-Route Solver

1. **Graph model first:** Represent the warehouse as a graph with aisle segments and cross-aisle connections. This is layout-agnostic and supports any warehouse configuration.

2. **Distance matrix computation:** Use shortest-path algorithms (Dijkstra) on the warehouse graph to compute pairwise distances between all pick locations in an order. Cache or precompute for frequently used location pairs.

3. **Algorithm selection by layout:**
   - Single-block, 2 cross-aisles → implement Ratliff-Rosenthal DP
   - Single-block, middle cross-aisle → implement Roodbergen-De Koster extension
   - General layout → use OR-Tools TSP solver (wraps LKH-style heuristics) on the distance matrix

4. **Heuristic baseline:** Implement S-shape and largest-gap as baselines. They are simple, fast, and useful for:
   - Quick batch evaluation (testing thousands of batch combinations)
   - Fallback when exact methods are too slow
   - Intuitive route display for warehouse managers who know these patterns

5. **OR-Tools integration:** Google OR-Tools provides a routing solver that handles TSP and vehicle routing. Feed it the warehouse distance matrix and let it find near-optimal solutions. This is the pragmatic path for Sprint 2.

6. **Performance targets:**
   - Route computation for single order (30 picks): < 50ms (DP or OR-Tools)
   - Batch evaluation (route estimate for candidate batch): < 5ms (heuristic)
   - Full re-routing for daily orders: < 30 seconds (parallelizable)

### Technology Mapping

| Component | Library | Notes |
|-----------|---------|-------|
| Warehouse graph | `networkx` | Model aisles, cross-aisles, intersections |
| Shortest paths | `networkx` / `scipy.sparse.csgraph` | Dijkstra on warehouse graph |
| Ratliff-Rosenthal DP | Custom Python | Implement from paper; no standard library |
| General TSP solver | `ortools.constraint_solver` | RoutingModel with distance callback |
| Heuristic baselines | Custom Python | S-shape, largest gap, combined |
| Distance caching | `numpy` array or `dict` | Precompute location-to-location distances |

### Key Design Decision

**Separate routing from slotting:** The route solver should accept any set of pick locations and return the optimal route. Slotting optimization (which SKU goes where) is a separate upstream problem that uses the route solver as an evaluation function. This separation enables:
- Independent testing and benchmarking of each component
- Swapping route algorithms without changing the slotting optimizer
- Using fast heuristic routing during slotting search, then exact routing for final results

---

## References

1. Ratliff, H.D. & Rosenthal, A.S. (1983). Order-picking in a rectangular warehouse: A solvable case of the traveling salesman problem. *Operations Research*, 31(3), 507-521.
2. De Koster, R., Le-Duc, T. & Roodbergen, K.J. (2007). Design and control of warehouse order picking: A literature review. *European Journal of Operational Research*, 182(2), 481-501.
3. Theys, C., Bräysy, O., Dullaert, W. & Raa, B. (2010). Using a TSP heuristic for routing order pickers in warehouses. *European Journal of Operational Research*, 200(3), 755-763.
4. Roodbergen, K.J. & De Koster, R. (2001). Routing methods for warehouses with multiple cross aisles. *International Journal of Production Research*, 39(9), 1865-1883.
5. Hall, R.W. (1993). Distance approximations for routing manual pickers in a warehouse. *IIE Transactions*, 25(4), 76-87.
6. Scholz, A., Schubert, D. & Wäscher, G. (2017). Order picking with multiple pickers and due dates. *European Journal of Operational Research*, 263(2), 461-478.
7. Karp, R.M. (1972). Reducibility among combinatorial problems. In *Complexity of Computer Computations*, 85-103.

---

## See Also

- [[warehouse-layout-graph-model]] — Graph representation for Action warehouses
- [[pick-route-heuristics]] — Benchmark comparison of S-shape, largest gap, combined
- [[or-tools-routing]] — OR-Tools integration for TSP solving
