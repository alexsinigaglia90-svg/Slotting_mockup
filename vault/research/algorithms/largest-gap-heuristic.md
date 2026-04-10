---
title: "Largest Gap Heuristic"
tags:
  - research
  - routing
  - heuristics
  - largest-gap
  - algorithm
  - sprint-2
sources:
  - "De Koster, Le-Duc & Roodbergen (2007). Design and control of warehouse order picking: A literature review. European Journal of Operational Research, 182(2), 481-501."
  - "Hall (1993). Distance approximations for routing manual pickers in a warehouse. IIE Transactions, 25(4), 76-87."
  - "Roodbergen & De Koster (2001). Routing methods for warehouses with multiple cross aisles. International Journal of Production Research, 39(9), 1865-1883."
  - "Petersen (1997). An evaluation of order picking routeing policies. International Journal of Operations & Production Management, 17(11), 1098-1111."
  - "Vaughan & Petersen (1999). The effect of warehouse cross aisles on order picking efficiency. International Journal of Production Research, 37(4), 881-897."
complexity: "O(n log n) where n = number of pick locations"
sprint: 2
created: 2026-04-10
relevance: Primary production routing heuristic for Sprint 2
---

# Largest Gap Heuristic

## Overview

The largest gap heuristic is a per-aisle adaptive routing method that avoids traversing the **largest empty stretch** within each aisle. For each aisle containing picks, the algorithm identifies the largest contiguous gap between adjacent picks (or between a pick and the aisle entrance/exit). The picker enters from one or both ends of the aisle but never crosses the largest gap, thereby avoiding the most wasteful portion of travel.

First analyzed by Hall (1993) and extensively benchmarked by De Koster et al. (2007), the largest gap heuristic consistently ranks as one of the best simple routing heuristics, typically producing routes within **3-10% of optimal** — significantly better than S-shape (10-30%) while remaining straightforward to implement.

The largest gap heuristic is a generalization of the midpoint heuristic: where the midpoint heuristic uses a fixed boundary (the aisle center), the largest gap heuristic dynamically places the boundary at the position of the largest gap, adapting to the actual pick distribution in each aisle.

---

## Algorithm Steps

### Assumptions

- **Single-block rectangular warehouse** with parallel aisles
- **Two cross-aisles:** front (depot side) and back
- **Depot** at the front cross-aisle
- Each aisle can be entered from either end (front or back)

### Definitions

For a given aisle with picks at positions p_1, p_2, ..., p_k (sorted from front to back along the aisle, where 0 = front entrance and L = back entrance):

- **Gaps** are the distances between consecutive picks, and between the aisle ends and the nearest picks:
  - Gap_0 = p_1 - 0 (gap between front entrance and first pick)
  - Gap_i = p_{i+1} - p_i for i = 1, ..., k-1 (gaps between consecutive picks)
  - Gap_k = L - p_k (gap between last pick and back entrance)

- The **largest gap** is max(Gap_0, Gap_1, ..., Gap_k)

### Step-by-Step

1. **Identify aisles with picks.** Sort them by aisle number.

2. **For each aisle with picks, determine the aisle strategy:**

   a. **Compute all gaps** (including front-to-first-pick and last-pick-to-back).
   
   b. **Find the largest gap.**
   
   c. **Decide the traversal pattern based on gap position:**
      - If the largest gap is **Gap_0** (front entrance to first pick): enter from the **back**, pick all items walking toward the front, turn around at the frontmost pick, and exit from the **back**. (Never enter from the front; the gap is between the front entrance and the first pick.)
      - If the largest gap is **Gap_k** (last pick to back entrance): enter from the **front**, pick all items walking toward the back, turn around at the deepest pick, and exit from the **front**. (This is equivalent to the return heuristic for this aisle.)
      - If the largest gap is **Gap_i** (between two interior picks): enter the aisle from **both ends**. From the front, pick items up to p_i, then return to the front. From the back, pick items from p_{i+1} onward, then return to the back. The picker visits this aisle in two passes, one from each cross-aisle.

3. **Sequence the aisles.** Walk along the front and back cross-aisles to connect aisle visits. The first and last aisles with picks are handled specially to ensure the route starts and ends at the depot.

4. **Connect via cross-aisles.** Between aisles, the picker walks along whichever cross-aisle (front or back) connects the exit of one aisle to the entrance of the next.

5. **Return to depot** via the front cross-aisle.

### The "Both Ends" Case

When the largest gap is interior (between two picks), the aisle is effectively split into two segments:
- **Front segment:** picks from front entrance up to the gap
- **Back segment:** picks from the gap to the back entrance

Each segment is visited independently: the front segment is visited from the front cross-aisle, and the back segment is visited from the back cross-aisle. This is the key advantage — the picker avoids walking through the largest empty stretch.

---

## Pseudocode

```python
def largest_gap_route(warehouse, pick_locations, depot):
    """
    Compute a route using the largest gap heuristic.
    
    Parameters:
        warehouse: Warehouse object with aisle geometry
            - n_aisles: int
            - aisle_length: float (L)
            - aisle_spacing: float
            - aisle_x(i): float, x-coordinate of aisle i
        pick_locations: list of (aisle, position) tuples
            - aisle: int (1-indexed)
            - position: float, distance from front of aisle (0 = front, L = back)
        depot: (x, y) starting/ending coordinates
    
    Returns:
        route: ordered list of (x, y) waypoints
        total_distance: float
    """
    L = warehouse.aisle_length
    
    # Group picks by aisle
    aisle_picks = defaultdict(list)
    for aisle, pos in pick_locations:
        aisle_picks[aisle].append(pos)
    
    aisles_with_picks = sorted(aisle_picks.keys())
    
    if not aisles_with_picks:
        return [depot], 0.0
    
    # For each aisle, compute the strategy
    aisle_strategies = {}
    for aisle in aisles_with_picks:
        picks = sorted(aisle_picks[aisle])  # sorted front to back
        aisle_strategies[aisle] = compute_aisle_strategy(picks, L)
    
    # Build route by connecting aisle visits via cross-aisles
    route = [depot]
    total_distance = 0.0
    
    # Track which cross-aisle segments need visiting from front vs back
    front_visits = []  # (aisle, deepest_pick_from_front) — enter front, return front
    back_visits = []   # (aisle, deepest_pick_from_back) — enter back, return back
    
    for aisle in aisles_with_picks:
        strategy = aisle_strategies[aisle]
        
        if strategy["type"] == "front_only":
            # Enter from front, pick, return to front
            front_visits.append((aisle, strategy["deepest"]))
        
        elif strategy["type"] == "back_only":
            # Enter from back, pick, return to back
            back_visits.append((aisle, strategy["deepest"]))
        
        elif strategy["type"] == "both":
            # Split: front segment from front, back segment from back
            front_visits.append((aisle, strategy["front_deepest"]))
            back_visits.append((aisle, strategy["back_deepest"]))
    
    # Sequence: walk front cross-aisle left to right visiting front segments,
    # cross to back at rightmost aisle, walk back cross-aisle right to left
    # visiting back segments, return to depot
    
    # Front pass (left to right along front cross-aisle)
    for aisle, deepest in sorted(front_visits, key=lambda x: x[0]):
        aisle_x = warehouse.aisle_x(aisle)
        enter = (aisle_x, 0)                  # front entrance
        turn = (aisle_x, deepest)             # deepest pick from front
        
        total_distance += distance(route[-1], enter)
        route.append(enter)
        total_distance += deepest             # walk in
        route.append(turn)
        total_distance += deepest             # walk back out
        route.append(enter)
    
    # Cross to back cross-aisle (at the rightmost aisle or nearest connection)
    if back_visits:
        rightmost_back = max(back_visits, key=lambda x: x[0])
        cross_point_front = (warehouse.aisle_x(rightmost_back[0]), 0)
        cross_point_back = (warehouse.aisle_x(rightmost_back[0]), L)
        total_distance += distance(route[-1], cross_point_front)
        route.append(cross_point_front)
        total_distance += L
        route.append(cross_point_back)
        
        # Back pass (right to left along back cross-aisle)
        for aisle, deepest in sorted(back_visits, key=lambda x: x[0], reverse=True):
            aisle_x = warehouse.aisle_x(aisle)
            enter = (aisle_x, L)                           # back entrance
            turn = (aisle_x, L - deepest)                  # deepest pick from back
            
            total_distance += distance(route[-1], enter)
            route.append(enter)
            total_distance += deepest                      # walk in from back
            route.append(turn)
            total_distance += deepest                      # walk back out
            route.append(enter)
    
    # Return to depot
    total_distance += distance(route[-1], depot)
    route.append(depot)
    
    return route, total_distance


def compute_aisle_strategy(picks, aisle_length):
    """
    Determine the largest gap strategy for one aisle.
    
    Parameters:
        picks: sorted list of pick positions (0 = front, aisle_length = back)
        aisle_length: float, total aisle length (L)
    
    Returns:
        dict with strategy type and relevant depths
    """
    L = aisle_length
    k = len(picks)
    
    # Compute all gaps
    gaps = []
    gaps.append(("front", 0, picks[0]))                        # Gap_0: front to first pick
    for i in range(k - 1):
        gaps.append(("interior", i, picks[i + 1] - picks[i]))  # Gap_i: between picks
    gaps.append(("back", k, L - picks[-1]))                    # Gap_k: last pick to back
    
    # Find largest gap
    largest = max(gaps, key=lambda g: g[2])
    gap_type, gap_index, gap_size = largest
    
    if gap_type == "front":
        # Largest gap is at the front — enter from back only
        return {
            "type": "back_only",
            "deepest": L - picks[0],  # distance from back entrance to frontmost pick
        }
    
    elif gap_type == "back":
        # Largest gap is at the back — enter from front only (return strategy)
        return {
            "type": "front_only",
            "deepest": picks[-1],  # distance from front entrance to deepest pick
        }
    
    else:
        # Largest gap is interior — split the aisle
        front_deepest = picks[gap_index]        # deepest pick reachable from front
        back_deepest = L - picks[gap_index + 1] # deepest pick reachable from back
        return {
            "type": "both",
            "front_deepest": front_deepest,
            "back_deepest": back_deepest,
        }
```

---

## Complexity Analysis

- **Time complexity:** O(n log n) dominated by sorting pick positions per aisle. The gap computation is O(k) per aisle where k is the number of picks in that aisle. Route construction is O(n) total.
- **Space complexity:** O(n) for pick grouping and route storage.
- **Practical runtime:** <1ms for any realistic warehouse order.

---

## When to Use

### Largest Gap is a Good Choice When:

1. **Medium pick density (5-20 picks/order in a 10-15 aisle warehouse).** This is the sweet spot where largest gap outperforms S-shape by 10-20% because many aisles have picks in only part of the aisle.

2. **COI or turnover-based slotting is in use.** When fast movers are near the front of aisles, the largest gap heuristic naturally exploits this: the gap at the back of the aisle is often the largest, so the picker enters from the front and returns — equivalent to the return heuristic for well-slotted aisles.

3. **Variable pick distributions across aisles.** Unlike S-shape (which always traverses fully) or midpoint (which always splits at the center), largest gap adapts to the actual pick pattern in each aisle.

4. **Production routing for man-to-goods picking.** Largest gap provides an excellent quality-to-complexity trade-off for RF-guided or voice-directed picking where per-aisle route instructions can be communicated.

### Largest Gap is Less Effective When:

1. **Very high pick density.** When every aisle has picks throughout, the largest gap is small and the heuristic degenerates to S-shape (full traversal). No harm, but no additional benefit.

2. **Very few picks (1-3 per order).** With so few picks, the per-aisle gap analysis has limited scope. The combined heuristic or a general TSP solver may yield better results.

3. **Multiple cross-aisles.** The standard largest gap heuristic assumes two cross-aisles. With a middle cross-aisle, an extended version is needed (Roodbergen & De Koster, 2001) that considers gaps relative to each cross-aisle.

---

## Performance Characteristics

### Expected Distance (Hall, 1993)

Hall (1993) derived that the largest gap heuristic produces routes approximately:

```
E[D_largest_gap] ≈ E[D_optimal] + (small correction term)
```

Where the correction term decreases as pick density increases. For uniformly distributed picks:

| Picks/Order | Expected % Above Optimal |
|-------------|-------------------------|
| 3-5 | 5-10% |
| 6-10 | 3-8% |
| 11-20 | 3-6% |
| 21-30 | 2-5% |
| 30+ | 1-3% |

### Comparison with Other Heuristics (De Koster et al., 2007)

In systematic simulations across varying warehouse dimensions and pick densities:

| Metric | S-Shape | Return | Midpoint | Largest Gap | Combined | Optimal |
|--------|---------|--------|----------|-------------|----------|---------|
| Avg. % above optimal | 17% | 22% | 9% | 5% | 4% | 0% |
| Worst case % above | 35% | 45% | 18% | 12% | 10% | 0% |
| Best case % above | 1% | 5% | 2% | 0.5% | 0.3% | 0% |

The largest gap heuristic's key advantage is its **consistency**: it rarely produces significantly suboptimal routes across any pick pattern. S-shape and return can be much worse in their worst cases.

### Sensitivity to Warehouse Shape

| Warehouse Type | Largest Gap Advantage vs. S-Shape |
|---------------|----------------------------------|
| Many short aisles (wide warehouse) | 5-10% better |
| Few long aisles (deep warehouse) | 15-25% better |
| Square-proportioned | 10-15% better |

The advantage is largest in **deep warehouses** where unnecessary aisle traversal is most costly.

---

## Limitations

1. **Per-aisle greedy:** The largest gap heuristic makes an independent decision for each aisle without considering the global route. The optimal route might traverse an aisle fully (even though the gap is large) because it enables a shorter connection to the next aisle.

2. **Two cross-aisles only:** The standard formulation assumes exactly two cross-aisles. Warehouses with middle cross-aisles require an extended version.

3. **Route complexity:** The resulting route is less intuitive than S-shape. Pickers may need RF/voice guidance rather than memorized patterns. This is not a problem for Action (which uses RF scanners) but matters for paper-based operations.

4. **Both-ends visits:** When the largest gap is interior, the picker visits the aisle twice (once from each end). This is optimal for that aisle but increases cross-aisle travel. The net effect is almost always positive, but edge cases exist.

---

## Relationship to Other Heuristics

- **Midpoint heuristic** is a special case: midpoint always uses L/2 as the split boundary, while largest gap uses the actual largest gap position.
- **Return heuristic** is a special case: when the largest gap is always at the back (Gap_k), largest gap degenerates to return.
- **S-shape** is a special case: when the largest gap in every aisle is smaller than twice the gap size, full traversal is chosen (at very high density).
- **Combined heuristic** makes a similar per-aisle choice but evaluates full-traversal vs. return vs. gap-based, optimizing across all options.

---

## Implementation Notes for Action

### Priority: Primary Production Heuristic (Sprint 2 Week 2)

Largest gap should be the **second** routing heuristic implemented (after S-shape baseline) and will serve as the **primary production heuristic** for route generation.

### Why Largest Gap for Action:

1. **Order profile (15-40 lines):** Falls in the medium-to-high density sweet spot where largest gap provides 5-15% improvement over S-shape.
2. **COI-based slotting:** Action's slotting engine places fast movers near the front. Largest gap naturally exploits this by detecting large back-of-aisle gaps.
3. **RF-guided picking:** Action pickers use RF scanners, so the more complex route shape is not a compliance concern.
4. **Implementation simplicity:** Despite being much better than S-shape, it is still a simple per-aisle algorithm — no global optimization needed.

### Integration Points

- **Input:** Same as S-shape — list of pick locations + warehouse layout
- **Output:** Ordered waypoints + total distance + per-aisle strategy decisions (for debugging/visualization)
- **Used by:** Production route generation, batch evaluation (with slight overhead vs. S-shape but much better accuracy)
- **Benchmark against:** S-shape (should improve 10-20% on Action's order profile) and Ratliff-Rosenthal DP (should be within 3-8%)

### Test Cases

1. **All picks near front:** Largest gap should choose return strategy for most aisles (gap at back is largest).
2. **All picks near back:** Should choose back-only strategy for most aisles (gap at front is largest).
3. **Picks at both ends of aisle:** Should split the aisle and visit from both ends.
4. **Uniform distribution:** Should produce routes 3-8% above optimal.
5. **Single pick per aisle:** Should be similar to return heuristic.
6. **Degenerate to S-shape:** All picks spread evenly = small gaps = full traversal.

---

## References

1. De Koster, R., Le-Duc, T. & Roodbergen, K.J. (2007). Design and control of warehouse order picking: A literature review. *European Journal of Operational Research*, 182(2), 481-501.
2. Hall, R.W. (1993). Distance approximations for routing manual pickers in a warehouse. *IIE Transactions*, 25(4), 76-87.
3. Petersen, C.G. (1997). An evaluation of order picking routeing policies. *International Journal of Operations & Production Management*, 17(11), 1098-1111.
4. Roodbergen, K.J. & De Koster, R. (2001). Routing methods for warehouses with multiple cross aisles. *International Journal of Production Research*, 39(9), 1865-1883.
5. Vaughan, T.S. & Petersen, C.G. (1999). The effect of warehouse cross aisles on order picking efficiency. *International Journal of Production Research*, 37(4), 881-897.

---

## See Also

- [[pick-route-heuristics]] — Overview of all heuristics
- [[s-shape-heuristic]] — Baseline heuristic for comparison
- [[pick-route-comparison]] — Head-to-head benchmark comparison
- [[tsp-warehouse-routing]] — Exact methods and TSP formulation
