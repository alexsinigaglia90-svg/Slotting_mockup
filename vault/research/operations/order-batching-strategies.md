---
tags: [research, operations, batching, picking, sprint-2]
sources:
  - "De Koster, Le-Duc & Roodbergen (2007) - Design and control of warehouse order picking"
  - "Gademann & Van de Velde (2005) - Order batching to minimize total travel time"
  - "Henn & Wäscher (2012) - Tabu search heuristics for the order batching problem"
  - "Pan, Shih & Wu (2015) - Order batching in a pick-and-pass system"
sprint: 2
created: 2026-04-10
---

# Order Batching Strategies

## Overview
Order batching groups multiple customer orders into a single pick tour. Instead of one picker per order, multiple orders are picked simultaneously — reducing total travel distance by sharing common aisles.

## Why It Matters for Slotting
Slotting and batching are interrelated:
- Good slotting reduces the benefit of batching (picks are already clustered)
- But even with optimal slotting, batching further reduces travel by 15-30%
- The slotting evaluator should account for batching when scoring assignments

## Strategies

### FIFO (First-In-First-Out)
- Batch orders in arrival sequence
- Simple, fair, no optimization
- Baseline for comparison
- **Distance reduction vs. single-order:** 10-20%

### Seed-Based Batching
- Select a "seed" order, add similar orders to the batch
- Similarity measured by: aisle overlap, location proximity, or SKU overlap
- **Variants:** random seed, largest order seed, most-constrained seed
- **Distance reduction:** 20-35%

### Time-Window Batching
- Accumulate orders over a time window, then batch-optimize
- Larger window = better batches but longer wait
- Trade-off: pick efficiency vs. order lead time
- **Distance reduction:** 25-40%

### Proximity-Based Batching
- Group orders whose pick locations are physically close
- Often formulated as a bin-packing problem (max batch size = cart capacity)
- Can use affinity clusters as proximity proxy
- **Distance reduction:** 30-45%

## Comparison

| Strategy | Distance Reduction | Implementation | Latency |
|----------|-------------------|----------------|---------|
| FIFO | 10-20% | Trivial | Zero |
| Seed-based | 20-35% | Simple | Low |
| Time-window | 25-40% | Medium | Medium |
| Proximity | 30-45% | Complex | Varies |

## Relevance for Action
- Action's orders are **store replenishment** (not e-commerce) — less time pressure, can batch aggressively
- 15-40 lines per order — already large, batching 2-3 orders = 30-120 lines per tour
- Cart/pallet capacity is the constraint — typically 3-4 orders per batch

## Implementation Plan
- **Sprint 2:** Evaluator uses single-order routing (conservative baseline)
- **Sprint 2+:** Add seed-based batching to evaluator for more realistic scoring
- **Production:** Proximity-based batching using affinity clusters as input

## Interaction with Slotting
The optimizer should be aware that batching will happen:
- Score using batched orders, not single orders
- Prioritize zone clustering (reduces inter-zone travel in batches)
- Forward-pick zone should contain the most commonly batched SKUs
