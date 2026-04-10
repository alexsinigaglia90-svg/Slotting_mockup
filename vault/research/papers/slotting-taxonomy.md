---
tags:
  - research
  - slotting
  - taxonomy
  - storage-policy
  - sprint-1
sources:
  - "De Koster, Le-Duc & Roodbergen (2007) - Design and control of warehouse order picking: A literature review"
  - "Hausman, Schwarz & Graves (1976) - Optimal Storage Assignment in Automatic Warehousing Systems"
  - "Heskett (1963) - Cube-per-Order Index: A Key to Warehouse Stock Location"
  - "Petersen & Aase (2004) - A comparison of picking, storage, and routing policies in manual order picking"
  - "Jarvis & McDowell (1991) - Optimal Product Layout in an Order Picking Warehouse"
  - "Frazelle (2002) - World-Class Warehousing and Material Handling"
  - "Gu, Goetschalckx & McGinnis (2007) - Research on warehouse operation: A comprehensive review"
  - "Roodbergen & Vis (2009) - A survey of literature on automated storage and retrieval systems"
  - "Mantel, Schuur & Heragu (2007) - Order oriented slotting: a new assignment strategy for warehouses"
  - "Brynzer & Johansson (1996) - Storage location assignment: Using the product structure to reduce order picking times"
  - "Pan, Shih & Wu (2012) - Storage assignment problem with travel distance and blocking considerations"
  - "Kofler, Beham, Wagner & Affenzeller (2014) - Affinity based slotting in warehouses with dynamic order patterns"
  - "Jane & Laih (2005) - A clustering approach for warehouse class-based storage"
  - "Muppani & Adil (2008) - Efficient formation of storage classes for warehouse storage location assignment"
sprint: 1
created: 2026-04-10
---

# Slotting Problem Taxonomy

## Overview

The **storage location assignment problem** (SLAP), commonly called **slotting**, is the problem of assigning stock-keeping units (SKUs) to physical warehouse locations so as to minimize order-picking effort. It is one of the most impactful decisions in warehouse operations: research consistently shows that slotting improvements can reduce picking travel distance by 20-50%, translating directly into labour cost reduction (De Koster et al., 2007; Frazelle, 2002).

The slotting problem sits at the intersection of combinatorial optimization and warehouse operations research. Different problem variants arise depending on:

1. **Storage policy** — how locations are reserved or shared
2. **Assignment criterion** — what metric drives the placement decision
3. **Scope** — within-aisle vs. across-aisle vs. full-warehouse optimization
4. **Correlation awareness** — whether co-occurrence of items in orders is considered

This note classifies these variants and assesses their relevance for the Action slotting module.

---

## Storage Policies

### Dedicated Storage

**Definition:** Each SKU is permanently assigned to a fixed location. That location is reserved even when the product is temporarily out of stock.

**Key literature:** Hausman, Schwarz & Graves (1976) provided the foundational analysis comparing dedicated and random storage in automated warehousing systems. They proved that turnover-based dedicated storage minimizes expected travel time under certain assumptions.

**Advantages:**
- Pickers learn product locations, reducing search time and errors
- Simple to implement and manage
- Predictable layout; works well with paper-based picking
- Easy integration with WMS (warehouse management systems)

**Disadvantages:**
- Poor space utilization: locations reserved for out-of-stock or seasonal items sit empty
- Hausman et al. (1976) showed that random storage can require as little as 50% of the space needed by dedicated storage
- Inflexible to demand changes without periodic re-slotting
- Does not adapt to seasonal shifts automatically

**Relevance for Action:** Action warehouses currently likely use a form of dedicated or semi-dedicated storage. The familiarity benefit is important in man-to-goods picking with large orders (15-40 lines). However, the space penalty is significant given 8,000-12,000 SKUs and strong seasonality.

### Shared (Random) Storage

**Definition:** Any available location can hold any incoming SKU. When stock is replenished, it goes to the nearest open location. A WMS tracks where everything is in real-time.

**Key literature:** Hausman et al. (1976) showed random storage achieves ~85% space utilization vs. ~55-65% for dedicated storage. Petersen & Aase (2004) found that random storage combined with good routing heuristics can compete with poorly optimized dedicated storage.

**Advantages:**
- Maximum space utilization — no reserved empty locations
- Self-adapting: seasonal products naturally vacate space when depleted
- No re-slotting effort needed

**Disadvantages:**
- Requires real-time WMS with location tracking
- Pickers cannot rely on memory; fully dependent on pick-list/scanner
- Average travel distance higher than well-optimized dedicated storage
- Same SKU can be scattered across multiple locations (split-pick problem)

**Relevance for Action:** Pure random storage is unlikely optimal for Action given the large order sizes (15-40 lines) and man-to-goods picking. However, elements of shared storage in the bulk/reserve area make sense, combined with dedicated forward-pick locations.

### Class-Based Storage (CBS)

**Definition:** A hybrid approach where SKUs are grouped into classes (typically A/B/C based on pick frequency) and each class is assigned a zone. Within a zone, storage is random. The most popular classes are based on Pareto analysis of pick frequency.

**Key literature:**
- Hausman et al. (1976) showed that even a simple 3-class system (A/B/C) captures most of the travel-distance benefit of full dedicated storage while retaining much of the space efficiency of random storage.
- Jane & Laih (2005) proposed clustering-based methods for optimal class boundary formation.
- Muppani & Adil (2008) developed methods for efficient formation of storage classes that minimize the total number of classes while preserving near-optimal travel distance.
- Petersen & Aase (2004) found that increasing from 2 to 3 classes provides significant improvement, but beyond 5-8 classes the marginal benefit diminishes rapidly.

**Typical class boundaries (Pareto):**
- **A-class:** Top ~15-20% of SKUs by pick frequency (~60-80% of picks)
- **B-class:** Next ~30% of SKUs (~15-25% of picks)
- **C-class:** Remaining ~50% of SKUs (~5-15% of picks)

**Zone placement:** A-class SKUs are placed closest to the depot (start/end of pick routes) and at ergonomic pick heights (golden zone: waist to shoulder height). C-class goes to the back and high/low shelves.

**Advantages:**
- Near-optimal travel distance (within 5-10% of full dedicated, per Hausman et al.)
- Significantly better space utilization than dedicated (~70-80%)
- Simpler to manage than full dedicated (only class assignments, not SKU-level)
- Naturally handles seasonality: SKU moves between classes as demand shifts

**Disadvantages:**
- Class boundaries must be periodically recalculated
- Suboptimal if demand distribution changes rapidly within a class
- Does not consider item correlations

**Relevance for Action:** Class-based storage is the **most promising base policy** for Action. It balances the practical needs of man-to-goods picking (predictable zones) with the flexibility needed for seasonal retail. The strong Pareto distribution in Action's SKU mix (~20/80) maps directly to efficient class formation.

### Forward-Reserve (Forward-Pick Area)

**Definition:** A two-region system where a small, accessible forward-pick area holds fast-moving SKUs in pick-friendly quantities, replenished from a larger bulk/reserve area.

**Key literature:** Frazelle (2002) extensively documented forward-reserve strategies. The key design decisions are: (1) which SKUs go to the forward area, (2) how much space each gets, and (3) replenishment triggers.

**Relevance for Action:** The design spec already mentions forward-pick and bulk zones. The slotting engine should optimize assignment to the forward area based on predicted demand velocity.

---

## Assignment Criteria

### Turnover-Based Assignment

**Definition:** SKUs are ranked by their pick frequency (number of picks per period) and assigned to locations ranked by accessibility (travel distance from depot). The highest-turnover SKU gets the most accessible location.

**Key literature:** This is the simplest and most widely studied approach, dating back to Hausman et al. (1976). It is optimal for single-command picking (one order at a time) in a single-aisle system under dedicated storage.

**Strengths:**
- Simple to implement and explain to warehouse managers
- Effective when order sizes are small (few lines per order)
- Proven in practice

**Limitations:**
- Does not account for item size: a fast-moving pallet-sized item should not occupy a prime shelf location meant for small picks
- Ignores correlations between items in orders
- Optimizes individual item access, not full-order travel

### Cube-per-Order Index (COI)

**Definition:** The COI is defined as the ratio of an item's space requirement (cube) to its order frequency. Items with the lowest COI (small size relative to their pick frequency) get the most accessible locations. Formally: COI = (storage space required) / (number of orders containing the item).

**Key literature:** Heskett (1963) introduced the COI concept. It was later proven to be optimal for minimizing total travel distance under dedicated storage with single-command picking when items have varying space requirements (Malmborg & Bhaskaran, 1990).

**Intuition:** A tiny item picked 100 times/day has a much lower COI than a large item picked 100 times/day. The tiny item benefits more from a prime location because it occupies less space there — the "opportunity cost" is lower.

**Formula:**
```
COI_i = S_i / f_i
```
Where `S_i` is the storage space required for SKU i, and `f_i` is the order frequency.

**Strengths:**
- Accounts for the size-frequency trade-off that pure turnover ignores
- Optimal under dedicated storage for minimizing aggregate travel
- Particularly valuable when SKU sizes vary significantly

**Limitations:**
- Still ignores item correlations
- Assumes single-command (one-order-at-a-time) picking
- Less relevant when all items are roughly the same size

**Relevance for Action:** COI is more appropriate than pure turnover for Action because product sizes vary substantially (small beauty items vs. large household/garden items). The slotting engine should use COI or a COI-weighted variant as the base scoring mechanism.

### Correlation-Based / Affinity-Based Assignment

**Definition:** Items that are frequently ordered together are placed near each other so that a single pick tour visits a compact cluster rather than traversing the entire warehouse. This is also called **correlated storage** or **affinity-based slotting**.

**Key literature:**
- Brynzer & Johansson (1996) were among the first to use product structure (which items are bought together) to reduce pick times. They reported 10-15% travel reduction on top of turnover-based assignment.
- Mantel, Schuur & Heragu (2007) introduced **order-oriented slotting**, where the objective function considers complete orders rather than individual SKU frequencies.
- Kofler et al. (2014) addressed affinity-based slotting with dynamic order patterns, using evolutionary algorithms to recompute clusters as demand shifts.
- Frazelle (2002) described **complementarity** and **family grouping** as practical approaches.

**Methods:**
1. **Co-occurrence matrix:** Build a matrix where entry (i,j) counts how often SKU i and SKU j appear in the same order. Cluster SKUs using hierarchical clustering, k-means, or community detection (e.g., Louvain algorithm on a co-occurrence graph).
2. **Association rule mining:** Use Apriori or FP-Growth to find frequent itemsets; place high-confidence associations near each other.
3. **Graph-based:** Model SKUs as nodes and co-occurrences as weighted edges. Use graph partitioning (networkx community detection) to find clusters, then assign each cluster to a contiguous zone.

**Strengths:**
- Directly optimizes what matters: total travel per order, not per item
- Can yield 10-20% additional improvement on top of frequency-based methods
- Naturally groups seasonal items that tend to be ordered together

**Limitations:**
- Computationally more expensive (O(n^2) for co-occurrence matrix with n SKUs)
- Correlation patterns change with seasons — requires periodic recalculation
- Can conflict with COI/turnover ranking: two correlated items may have very different velocities

**Relevance for Action:** Correlation-based slotting is **highly relevant** for Action. With 15-40 lines per order and clear category affinities (e.g., seasonal garden products ordered together, party supplies cluster), affinity-based clustering can significantly reduce pick-route length. The design already includes co-occurrence analysis (networkx) as a core component.

---

## Optimization Scope

### Within-Aisle Optimization

**Focus:** Optimizing the vertical and depth placement of SKUs within a single aisle. The key decisions are:
- **Vertical position (level):** Heavy/bulky items at waist height; fast movers in the golden zone (levels 2-3 of a 5-level rack); slow movers at top/bottom
- **Depth position (horizontal within aisle):** Fastest movers nearest the aisle entrance

**Literature:** Jarvis & McDowell (1991) studied optimal product layout within aisles, finding that vertical placement based on ergonomics (golden zone for A-items) combined with horizontal placement based on frequency can yield 15-25% improvement vs. arbitrary placement.

### Across-Aisle Optimization

**Focus:** Deciding which aisle each SKU is assigned to. The objective is to concentrate frequently co-ordered items in adjacent aisles, minimizing the number of aisles a picker must visit per order.

**Literature:** Petersen & Aase (2004) showed that the interaction between storage assignment and routing policy is critical. An across-aisle strategy optimized for S-shape routing (the most common man-to-goods heuristic) may perform poorly under return routing, and vice versa.

**Key insight (De Koster et al., 2007):** The storage assignment and routing problems are tightly coupled. Ideally, slotting should be optimized jointly with the routing policy, but this joint problem is NP-hard. Practical approaches use iterative or hierarchical methods: first assign SKUs to zones/aisles, then optimize within-aisle placement, then evaluate with the actual routing heuristic.

### Full-Warehouse Joint Optimization

**Focus:** Simultaneously optimizing all location assignments across the entire warehouse, potentially jointly with routing.

**Literature:** Gu, Goetschalckx & McGinnis (2007) classified this as the most general form of SLAP. It is computationally intractable for exact methods at realistic scale (5,000-10,000 locations). Solution approaches include:
- **Metaheuristics:** Genetic algorithms, simulated annealing, tabu search (Pan, Shih & Wu, 2012)
- **Decomposition:** Break into zone assignment + within-zone placement
- **Iterative improvement:** Start from a COI-based solution, then apply local search with affinity objectives

**Relevance for Action:** A hierarchical approach is recommended:
1. **Zone level:** Assign SKU classes to warehouse zones (class-based storage)
2. **Aisle level:** Assign SKU clusters (affinity groups) to aisle groups
3. **Location level:** Assign individual SKUs to locations within their aisle (COI + ergonomic rules)

---

## Relevance for Action

### Warehouse Characteristics Driving the Choice

| Characteristic | Action Value | Implication |
|---|---|---|
| Picking method | Man-to-goods | Travel distance is the dominant cost driver |
| Order size | 15-40 lines | Correlation-based slotting has high impact |
| SKU count | 8,000-12,000 | Exact optimization intractable; need heuristics/metaheuristics |
| SKU size variation | High (beauty to garden) | COI preferred over pure turnover |
| Seasonality | Strong (Q4 peaks, summer garden) | Dynamic re-slotting or seasonal class adjustment needed |
| Warehouse layout | Rectangular grid, 15-20 aisles | Standard aisle-based models apply |
| Picking heuristic | Likely S-shape or largest gap | Storage strategy must be co-optimized with routing |

### Recommended Approach for the Slotting Engine

1. **Base policy:** Class-based storage with dynamic ABC+ classification driven by ML demand forecasting (not static historical analysis)
2. **Assignment criterion:** COI-weighted scoring, adjusted for ergonomic preferences (golden zone)
3. **Correlation layer:** Affinity-based clustering overlaid on the class structure — correlated items within the same class are placed in adjacent locations
4. **Optimization method:** Hierarchical decomposition (zone -> aisle -> location) with iterative local search
5. **Re-slotting trigger:** Seasonal demand shifts detected by the ML pipeline trigger re-optimization with configurable constraints (maximum % of locations changed per cycle to limit disruption)

---

## Implementation Implications

### For the Data Model (Sprint 1)
- Location model must capture: aisle, bay, level, zone, distance-from-depot, cubic capacity
- SKU model must include: cubic dimensions (for COI), pick frequency, category (for affinity seeding)
- Order history must preserve full line-level detail (for co-occurrence matrix construction)

### For the Intelligence Layer (Sprint 2)
- **ML pipeline:** Demand forecasting per SKU feeds into dynamic class boundaries and COI recalculation
- **Affinity engine:** Co-occurrence matrix -> graph clustering (Louvain via networkx) -> affinity groups
- **OR solver:** Hierarchical assignment formulated as a constrained optimization:
  - Objective: minimize expected weighted travel distance per order
  - Constraints: capacity per location, zone capacity, ergonomic rules, maximum re-slot disruption budget
- **Solver approach:** Start with COI-based greedy assignment, refine with simulated annealing or genetic algorithm using affinity-weighted objective

### For the Presentation Layer (Sprint 3)
- Visualize storage classes as colour-coded zones (A=red/hot, B=amber, C=blue/cold)
- Show affinity clusters as highlighted groups on the warehouse map
- Before/after comparison should report: average travel distance/order, picks/hour, aisle visits/order, and space utilization
- The "aha moment" can show how correlated products move from scattered locations to a compact cluster

### Computational Considerations
- Co-occurrence matrix for 10,000 SKUs is 10,000 x 10,000 = 100M entries — use sparse representation (scipy.sparse)
- Full re-optimization at warehouse scale should run within minutes on a standard server (target: <5 min for 10,000 locations)
- Incremental re-slotting (seasonal adjustment) should be possible without full recomputation

---

## Key Takeaways

1. **Class-based storage** is the sweet spot for Action: near-optimal travel distance with practical space efficiency
2. **COI** is superior to pure turnover when product sizes vary, which they do at Action
3. **Affinity-based clustering** provides 10-20% additional improvement and is especially impactful for Action's large order sizes
4. **Hierarchical decomposition** (zone -> aisle -> location) makes the NP-hard problem tractable at Action's scale
5. The storage policy and routing policy must be **co-optimized** — the slotting engine should evaluate solutions against the actual routing heuristic
6. **Dynamic re-slotting** driven by ML demand forecasting is essential for Action's seasonal business

---

## References

1. Brynzer, H., & Johansson, M.I. (1996). Storage location assignment: Using the product structure to reduce order picking times. *International Journal of Production Economics*, 46-47, 595-603.
2. De Koster, R., Le-Duc, T., & Roodbergen, K.J. (2007). Design and control of warehouse order picking: A literature review. *European Journal of Operational Research*, 182(2), 481-501.
3. Frazelle, E. (2002). *World-Class Warehousing and Material Handling*. McGraw-Hill.
4. Gu, J., Goetschalckx, M., & McGinnis, L.F. (2007). Research on warehouse operation: A comprehensive review. *European Journal of Operational Research*, 177(1), 1-21.
5. Hausman, W.H., Schwarz, L.B., & Graves, S.C. (1976). Optimal storage assignment in automatic warehousing systems. *Management Science*, 22(6), 629-638.
6. Heskett, J.L. (1963). Cube-per-order index — a key to warehouse stock location. *Transportation and Distribution Management*, 3, 27-31.
7. Jane, C.C., & Laih, Y.W. (2005). A clustering approach for warehouse class-based storage. *Journal of the Operational Research Society*, 56(9), 1050-1059.
8. Jarvis, J.M., & McDowell, E.D. (1991). Optimal product layout in an order picking warehouse. *IIE Transactions*, 23(1), 93-102.
9. Kofler, M., Beham, A., Wagner, S., & Affenzeller, M. (2014). Affinity based slotting in warehouses with dynamic order patterns. In *Advanced Methods and Applications in Computational Intelligence*, Springer, 273-292.
10. Malmborg, C.J., & Bhaskaran, K. (1990). A revised proof of optimality for the cube-per-order index rule for stored item location. *Applied Mathematical Modelling*, 14(2), 87-95.
11. Mantel, R.J., Schuur, P.C., & Heragu, S.S. (2007). Order oriented slotting: a new assignment strategy for warehouses. *European Journal of Industrial Engineering*, 1(3), 301-316.
12. Muppani, V.R., & Adil, G.K. (2008). Efficient formation of storage classes for warehouse storage location assignment: A simulated annealing approach. *Omega*, 36(4), 609-618.
13. Pan, J.C.H., Shih, P.H., & Wu, M.H. (2012). Storage assignment problem with travel distance and blocking considerations for a picker-to-parts order picking system. *Computers & Operations Research*, 39(11), 2527-2539.
14. Petersen, C.G., & Aase, G. (2004). A comparison of picking, storage, and routing policies in manual order picking. *International Journal of Production Economics*, 92(1), 11-19.
15. Roodbergen, K.J., & Vis, I.F.A. (2009). A survey of literature on automated storage and retrieval systems. *European Journal of Operational Research*, 194(2), 343-362.
