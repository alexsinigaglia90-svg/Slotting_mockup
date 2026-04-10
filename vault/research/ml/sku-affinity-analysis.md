---
tags: [research, ml, affinity, co-occurrence, clustering, sprint-2]
sources:
  - "Agrawal & Srikant (1994) - Fast Algorithms for Mining Association Rules"
  - "Han, Pei & Yin (2000) - Mining Frequent Patterns without Candidate Generation (FP-Growth)"
  - "Blondel et al. (2008) - Fast unfolding of communities in large networks (Louvain)"
  - "Kofler et al. (2014) - Affinity based slotting in warehouses with dynamic order patterns"
sprint: 2
created: 2026-04-10
---

# SKU Affinity Analysis

## Overview
SKUs that are frequently ordered together should be stored near each other to minimize picker travel. Affinity analysis identifies these co-purchase patterns from order history.

## Approaches

### Association Rule Mining (Apriori / FP-Growth)
- **Concept:** Find frequent itemsets and derive rules (A → B with confidence X, support Y)
- **Apriori:** Bottom-up, generates candidates, prunes by support threshold
- **FP-Growth:** Compresses data into FP-tree, mines without candidate generation — faster
- **Output:** Rules like "if customer orders houtskool, 65% also order aanmaakblokjes"
- **Pros:** Interpretable, well-studied, captures directional relationships
- **Cons:** Sensitive to support/confidence thresholds, can produce overwhelming number of rules

### Co-Occurrence Matrix + Jaccard Similarity
- **Concept:** Count how often each pair of SKUs appears in the same order, normalize by union
- **Jaccard(A,B):** |orders(A) ∩ orders(B)| / |orders(A) ∪ orders(B)|
- **Output:** Symmetric similarity matrix, values 0.0 to 1.0
- **Pros:** Simple, symmetric, easy to threshold, directly maps to graph edges
- **Cons:** Doesn't capture directional relationships, treats all co-occurrences equally

### Community Detection (Louvain Algorithm)
- **Concept:** Build graph where SKUs are nodes, edges weighted by Jaccard similarity. Detect communities.
- **Output:** SKU clusters (communities) — groups of SKUs that belong together
- **Pros:** Scalable (O(n log n)), produces natural groupings, integrates with networkx
- **Cons:** Non-deterministic (seed helps), resolution parameter affects granularity

## Recommendation for Action

**Primary: Co-occurrence matrix + Jaccard + Louvain clustering**

This three-step pipeline is implemented in our `SKUAffinityAnalyzer`:
1. Build co-occurrence matrix from order history
2. Compute Jaccard similarities between all pairs
3. Build similarity graph, apply Louvain community detection
4. Output: SKU → cluster mapping

**Why not Apriori/FP-Growth:** For slotting, we need symmetric groupings (A near B), not directional rules. Co-occurrence + clustering is simpler and directly usable.

## Implementation Notes
- `min_jaccard` threshold controls edge density — 0.05-0.10 for loose clusters, 0.3+ for tight
- Louvain `resolution` parameter can split/merge communities — default works well
- Clusters feed into the optimizer: SKUs in same cluster get assigned to nearby locations
