---
title: Pick-Route Heuristics — Overview
tags:
  - research
  - routing
  - heuristics
  - order-picking
  - warehouse
  - sprint-2
sources:
  - "De Koster, Le-Duc & Roodbergen (2007). Design and control of warehouse order picking: A literature review. European Journal of Operational Research, 182(2), 481-501."
  - "Hall (1993). Distance approximations for routing manual pickers in a warehouse. IIE Transactions, 25(4), 76-87."
  - "Roodbergen & De Koster (2001). Routing methods for warehouses with multiple cross aisles. International Journal of Production Research, 39(9), 1865-1883."
  - "Petersen (1997). An evaluation of order picking routeing policies. International Journal of Operations & Production Management, 17(11), 1098-1111."
  - "Petersen & Aase (2004). A comparison of picking, storage, and routing policies in manual order picking. International Journal of Production Economics, 92(1), 11-19."
  - "Ratliff & Rosenthal (1983). Order-picking in a rectangular warehouse: A solvable case of the traveling salesman problem. Operations Research, 31(3), 507-521."
  - "Vaughan & Petersen (1999). The effect of warehouse cross aisles on order picking efficiency. International Journal of Production Research, 37(4), 881-897."
sprint: 2
created: 2026-04-10
relevance: Algorithm selection for Sprint 2 pick-route solver
---

# Pick-Route Heuristics — Overview

## Introduction

In manual order-picking warehouses, **50-65% of total picking time** is spent traveling between locations (Tompkins et al., 2003; De Koster et al., 2007). The route a picker follows to collect all items on a pick list therefore has an outsized impact on warehouse throughput. An optimal route visits all required locations in the shortest total distance and returns to the depot.

For single-block rectangular warehouses with two cross-aisles (front and back), Ratliff & Rosenthal (1983) showed that the optimal route can be computed in O(n) time using dynamic programming. However, in practice most warehouses use **routing heuristics** because they are simple to communicate to pickers, easy to implement, and fast to compute during batch evaluation. The trade-off is that heuristic routes are longer than optimal — typically by 5-30% depending on the heuristic and the number of picks.

De Koster et al. (2007) and Petersen (1997) provide the most comprehensive comparisons of these heuristics. This note summarizes the five principal heuristics, their relative performance, and the recommendation for Action.

---

## The Five Principal Heuristics

### 1. S-Shape (Traversal) Heuristic

**Core idea:** The picker traverses every aisle that contains at least one pick, entirely from end to end. Empty aisles are skipped. The picker alternates direction (down one aisle, up the next), creating an S-shaped pattern.

**Strengths:**
- Extremely simple to implement and explain
- No decision-making required per aisle — just "walk through if there's a pick"
- Produces predictable, repeatable routes

**Weaknesses:**
- Forces the picker to walk the full length of every visited aisle, even if there is only one pick near the entrance
- Worst performer among the five heuristics when the number of picks per aisle is low
- Performance degrades when picks are clustered near the front

**Typical performance:** 10-30% above optimal, depending on pick density (De Koster et al., 2007; Hall, 1993). At high pick densities (many picks per aisle), S-shape approaches optimality because the picker would need to traverse most of each aisle anyway.

**See:** [[s-shape-heuristic]]

---

### 2. Return Heuristic

**Core idea:** The picker enters every aisle from the same end (typically the front cross-aisle), walks to the deepest pick in that aisle, then returns the same way and continues to the next aisle. The picker never exits from the far end of an aisle.

**Strengths:**
- Very simple; no traversal of unnecessary aisle length beyond the deepest pick
- Performs well when picks are concentrated near the front of aisles (common with COI/turnover-based slotting that places fast movers near the front)

**Weaknesses:**
- Always doubles back, which is wasteful when picks span the full aisle depth
- Particularly poor when there are picks near both ends of an aisle
- Does not exploit cross-aisles at the back of the warehouse

**Typical performance:** 15-40% above optimal in general; can be competitive with S-shape when picks are front-loaded (Petersen, 1997). Substantially worse than S-shape when pick density is high.

---

### 3. Midpoint Heuristic

**Core idea:** The warehouse is conceptually divided at the midpoint of the aisles. Picks in the front half of an aisle are accessed from the front cross-aisle; picks in the back half are accessed from the back cross-aisle. No aisle is traversed past its midpoint from either direction.

**Strengths:**
- Limits unnecessary travel in each aisle
- Naturally exploits both front and back cross-aisles
- Simple rule: "enter from the nearest end, never cross the midpoint"

**Weaknesses:**
- Can create suboptimal routes when a single aisle has picks on both sides of the midpoint (the picker may need to visit the aisle twice, once from each end)
- Rigid midpoint boundary does not adapt to actual pick positions

**Typical performance:** 5-15% above optimal (De Koster et al., 2007). Consistently better than S-shape for low-to-medium pick densities. Becomes less advantageous at high densities where S-shape's simplicity matches its effectiveness.

---

### 4. Largest Gap Heuristic

**Core idea:** For each aisle, the picker identifies the **largest gap** — the longest stretch within the aisle that contains no picks (including the gap between the first/last pick and the aisle entrance/exit). If the largest gap is between picks, the picker enters the aisle from both ends but turns back at the boundaries of the gap, never crossing it. If the largest gap is at one end of the aisle, the picker enters from the other end and returns.

**Strengths:**
- Adapts to the actual distribution of picks within each aisle
- Avoids traversing the largest empty stretch, which is the biggest source of wasted travel
- Generalizes the midpoint heuristic: midpoint is a special case where the "gap boundary" is fixed at the center

**Weaknesses:**
- Slightly more complex to implement and explain than S-shape or return
- Still a greedy per-aisle decision; does not consider interactions between aisles

**Typical performance:** 3-10% above optimal (De Koster et al., 2007; Hall, 1993). Consistently one of the best-performing simple heuristics across all pick densities. Particularly strong for medium pick densities (5-15 picks per order in a 10-aisle warehouse).

**See:** [[largest-gap-heuristic]]

---

### 5. Combined Heuristic

**Core idea:** For each aisle, the picker dynamically chooses the better strategy: either traverse the aisle completely (S-shape style) or enter and return from the nearest end (return style). The choice is made per-aisle based on which option yields a shorter partial route. This can be extended to consider largest-gap decisions per aisle as well.

**Strengths:**
- Combines the strengths of traversal and return strategies
- Adapts per-aisle to local pick distribution
- Theoretical performance approaches optimal for single-block warehouses

**Weaknesses:**
- More complex to implement — requires per-aisle cost evaluation
- Route shape is less predictable for pickers, which can reduce compliance in paper-based environments (less of an issue with RF scanners or voice-directed picking)
- Optimal per-aisle decisions can be computed via DP, at which point the "combined heuristic" effectively becomes the Ratliff-Rosenthal optimal algorithm

**Typical performance:** 3-8% above optimal (De Koster et al., 2007). The best-performing heuristic in most studies, approaching or matching optimal when pick density is moderate.

---

## Comparison Matrix

| Heuristic | Complexity | Avg. % Above Optimal | Best When | Worst When |
|-----------|-----------|---------------------|-----------|------------|
| **S-shape** | O(n) trivial | 10-30% | High pick density (many picks/aisle) | Few picks scattered across many aisles |
| **Return** | O(n) trivial | 15-40% | Picks near front of aisles (COI slotting) | Picks distributed across full aisle depth |
| **Midpoint** | O(n) simple | 5-15% | Low-to-medium density, both cross-aisles available | Single cross-aisle layout; picks straddling midpoint |
| **Largest Gap** | O(n log n) | 3-10% | Medium density, variable pick positions | Very high density (degenerates to S-shape) |
| **Combined** | O(n) per aisle eval | 3-8% | All densities; adapts dynamically | Minimal advantage over largest gap for effort |

### Performance by Pick Density

Based on De Koster et al. (2007) and Petersen (1997) simulation studies on rectangular single-block warehouses:

| Heuristic | Few Picks (1-5/order) | Medium (6-15/order) | Many (16-30/order) | Very Many (30+/order) |
|-----------|-----------------------|---------------------|--------------------|-----------------------|
| S-shape | 25-35% above optimal | 15-25% above | 8-15% above | 3-8% above |
| Return | 10-20% above | 20-35% above | 25-40% above | 30-45% above |
| Midpoint | 8-15% above | 5-12% above | 5-10% above | 5-8% above |
| Largest Gap | 5-10% above | 3-8% above | 3-6% above | 2-5% above |
| Combined | 3-8% above | 2-5% above | 2-4% above | 1-3% above |
| Optimal (DP) | 0% | 0% | 0% | 0% |

**Key observation:** The relative advantage of smarter heuristics (largest gap, combined) over S-shape is largest at low-to-medium pick densities. At very high densities, all heuristics converge toward the optimal because most aisles must be fully traversed regardless.

---

## Recommendation for Action

### Context

- **Order profile:** 15-40 lines per order (medium to high pick density)
- **Warehouse layout:** Rectangular, single-block, parallel aisles, front/back cross-aisles
- **Picking method:** Man-to-goods with RF scanners
- **Warehouse count:** 26 warehouses (solution must be parameterizable)
- **Current state:** Likely using S-shape or ad-hoc routing

### Implementation Strategy

**Sprint 2 — Phase 1: Baseline**
1. Implement **S-shape** as the baseline heuristic. It is the simplest to implement, widely understood, and serves as the benchmark against which all improvements are measured.
2. Implement **largest gap** as the primary production heuristic. It offers the best trade-off between simplicity and performance (3-10% above optimal vs. 10-30% for S-shape).

**Sprint 2 — Phase 2: Advanced**
3. Implement the **combined heuristic** for advanced mode. For Action's order profile (15-40 lines), the combined heuristic should be within 2-5% of optimal — close enough that further optimization effort has diminishing returns.
4. Implement **Ratliff-Rosenthal DP** as the optimal solver for benchmarking and for final route generation when computation time is not the bottleneck (single-order routing).

**Why not combined from day one?** The largest gap heuristic is simpler to implement, debug, and validate. Starting with it provides 75-85% of the potential improvement over S-shape, with lower implementation risk. The combined heuristic adds marginal improvement but more complexity.

### Expected Impact at Action Scale

Assuming 3,000 orders/day, 25 lines/order average, 10m average aisle length:

| Routing Method | Avg. Route Length (est.) | vs. S-shape | Daily Distance Saved |
|---------------|-------------------------|-------------|---------------------|
| S-shape (baseline) | 420m/order | -- | -- |
| Largest gap | 360m/order | -14% | 180 km/day |
| Combined | 345m/order | -18% | 225 km/day |
| Optimal (DP) | 335m/order | -20% | 255 km/day |

At a walking speed of 0.8 m/s, 180 km/day saved = 62.5 hours of walking time saved daily across the warehouse = roughly **8 FTE equivalent** in travel reduction per warehouse.

---

## Interaction with Storage Policy

The routing heuristic and storage policy are **tightly coupled** (Petersen & Aase, 2004; De Koster et al., 2007):

- **S-shape + turnover-based storage:** Moderate synergy. Fast movers near the front reduce total aisle visits, but S-shape still traverses visited aisles fully.
- **S-shape + random storage:** Poor. S-shape forces full traversal of many aisles with scattered picks.
- **Largest gap + COI storage:** Strong synergy. COI clusters fast movers near the front, creating large gaps in the back portions of aisles that the largest gap heuristic exploits.
- **Largest gap + affinity storage:** Best combination. Correlated items in adjacent locations create compact pick clusters with large surrounding gaps.

**Bottom line for Action:** The slotting engine (affinity-based, COI-weighted, class-based) should be co-optimized with the routing heuristic. Evaluate candidate slotting solutions using the largest gap heuristic as the cost function during search, then apply the combined heuristic or DP optimal for final route generation.

---

## References

1. De Koster, R., Le-Duc, T. & Roodbergen, K.J. (2007). Design and control of warehouse order picking: A literature review. *European Journal of Operational Research*, 182(2), 481-501.
2. Hall, R.W. (1993). Distance approximations for routing manual pickers in a warehouse. *IIE Transactions*, 25(4), 76-87.
3. Petersen, C.G. (1997). An evaluation of order picking routeing policies. *International Journal of Operations & Production Management*, 17(11), 1098-1111.
4. Petersen, C.G. & Aase, G. (2004). A comparison of picking, storage, and routing policies in manual order picking. *International Journal of Production Economics*, 92(1), 11-19.
5. Ratliff, H.D. & Rosenthal, A.S. (1983). Order-picking in a rectangular warehouse: A solvable case of the traveling salesman problem. *Operations Research*, 31(3), 507-521.
6. Roodbergen, K.J. & De Koster, R. (2001). Routing methods for warehouses with multiple cross aisles. *International Journal of Production Research*, 39(9), 1865-1883.
7. Tompkins, J.A., White, J.A., Bozer, Y.A., & Tanchoco, J.M.A. (2003). *Facilities Planning* (3rd ed.). Wiley.
8. Vaughan, T.S. & Petersen, C.G. (1999). The effect of warehouse cross aisles on order picking efficiency. *International Journal of Production Research*, 37(4), 881-897.

---

## See Also

- [[s-shape-heuristic]] — S-shape algorithm detail and pseudocode
- [[largest-gap-heuristic]] — Largest gap algorithm detail and pseudocode
- [[pick-route-comparison]] — Performance comparison matrix with benchmark data
- [[tsp-warehouse-routing]] — Exact methods and TSP formulation
- [[slotting-taxonomy]] — Storage policy interaction with routing
