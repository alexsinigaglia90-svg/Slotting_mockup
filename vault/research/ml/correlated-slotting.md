---
tags: [research, slotting, affinity, correlated, sprint-2]
sources:
  - "Mantel, Schuur & Heragu (2007) - Order oriented slotting: a new assignment strategy"
  - "Kofler, Beham, Wagner & Affenzeller (2014) - Affinity based slotting in warehouses"
  - "Brynzer & Johansson (1996) - Storage location assignment using product structure"
  - "Frazelle (2002) - World-Class Warehousing and Material Handling"
sprint: 2
created: 2026-04-10
---

# Correlated Slotting

## Overview
Traditional slotting assigns locations based on individual SKU properties (velocity, size, weight). Correlated slotting additionally considers **which SKUs are picked together** — placing co-occurring items near each other to reduce per-order travel distance.

## Key Concept: Order-Oriented Slotting
Mantel et al. (2007) introduced "order-oriented slotting" — instead of optimizing individual SKU placements, optimize for the typical order profile. The objective shifts from "fast movers near depot" to "items that are picked together near each other."

## Approaches

### Cluster-First, Assign-Second
1. Cluster SKUs by co-occurrence affinity (Louvain, k-means on co-occurrence features)
2. Assign each cluster to a zone (nearby aisles)
3. Within each zone, assign by velocity (fast movers on ground level, near aisle entrance)

**Pros:** Clean separation of concerns, scalable
**Cons:** Zone boundaries can be suboptimal

### Joint Optimization
- Formulate as quadratic assignment problem (QAP)
- Objective: minimize Σ flow(i,j) × distance(loc(i), loc(j))
- Where flow(i,j) = co-occurrence count between SKU i and SKU j
- NP-hard — requires heuristics (simulated annealing, genetic algorithms)

### Hybrid: Velocity + Affinity
- Primary sort: velocity class (A near depot, D far)
- Secondary sort within velocity class: affinity cluster (co-occurring items adjacent)
- This is our approach for Action

## Results from Literature
- Kofler et al. (2014): 8-15% additional distance reduction beyond velocity-only slotting
- Mantel et al. (2007): 12-20% improvement on mixed-SKU retail orders
- Effect is strongest when orders contain many lines (>10 lines) — which matches Action's 15-40 line orders

## Relevance for Action
Action's large orders (15-40 lines) make correlated slotting highly effective. The cluster-first approach maps well to their zone structure (forward-pick + bulk storage).

## Implementation
Our optimizer uses a two-stage approach:
1. VelocityClassifier determines ABC+ class from order data
2. SKUAffinityAnalyzer produces affinity clusters
3. Optimizer assigns: velocity determines zone proximity, affinity determines within-zone adjacency
