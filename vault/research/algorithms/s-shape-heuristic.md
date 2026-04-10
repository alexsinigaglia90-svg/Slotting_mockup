---
title: "S-Shape (Traversal) Heuristic"
tags:
  - research
  - routing
  - heuristics
  - s-shape
  - algorithm
  - sprint-2
sources:
  - "De Koster, Le-Duc & Roodbergen (2007). Design and control of warehouse order picking: A literature review. European Journal of Operational Research, 182(2), 481-501."
  - "Hall (1993). Distance approximations for routing manual pickers in a warehouse. IIE Transactions, 25(4), 76-87."
  - "Petersen (1997). An evaluation of order picking routeing policies. International Journal of Operations & Production Management, 17(11), 1098-1111."
  - "Roodbergen & De Koster (2001). Routing order pickers in a warehouse with a middle aisle. European Journal of Operational Research, 133(1), 32-43."
complexity: "O(n) where n = number of pick locations"
sprint: 2
created: 2026-04-10
relevance: Baseline routing heuristic for Sprint 2 pick-route solver
---

# S-Shape (Traversal) Heuristic

## Overview

The S-shape heuristic (also called the **traversal heuristic**) is the simplest and most widely used routing method in manual order-picking warehouses. The picker follows an S-shaped path through the warehouse, fully traversing every aisle that contains at least one pick and skipping aisles with no picks. It is named for the serpentine shape of the resulting route when viewed from above.

Despite its simplicity, S-shape is used in an estimated 80% of warehouses worldwide (Tompkins et al., 2003), largely because it requires zero computation, is easy to explain to pickers, and produces consistent, predictable routes.

---

## Algorithm Steps

### Assumptions

- **Single-block rectangular warehouse** with parallel aisles
- **Two cross-aisles:** one at the front (depot side) and one at the back
- **Depot** located at the front-left corner (generalizable to any front position)
- Aisles are numbered left to right: aisle 1, aisle 2, ..., aisle N

### Step-by-Step

1. **Sort aisles:** Identify which aisles contain at least one pick. Sort these aisles by aisle number (left to right from depot).

2. **Initialize:** Start at the depot (front cross-aisle, leftmost position).

3. **Traverse to first aisle:** Walk along the front cross-aisle to the entrance of the first aisle with picks.

4. **For each aisle with picks (in order):**
   a. **Enter the aisle** from whichever end the picker is currently on (front or back, alternating).
   b. **Walk the entire length of the aisle**, picking all items along the way.
   c. **Exit from the opposite end** of the aisle.
   d. **Walk along the cross-aisle** (front or back) to the entrance of the next aisle with picks.

5. **Handle the last aisle:** After exiting the last aisle with picks, walk along the cross-aisle back to the depot.

### Special Cases

- **Single aisle with picks:** Traverse that aisle and return via the cross-aisle.
- **Odd number of aisles with picks:** The picker ends at the back cross-aisle after the last aisle and must walk along the back cross-aisle and then down a return path to the depot. Alternatively, the last aisle can be entered and the picker returns from the same end (a hybrid S-shape/return for the last aisle).
- **Adjacent empty aisles:** Skip them entirely; walk along the cross-aisle past them.

---

## Pseudocode

```python
def s_shape_route(warehouse, pick_locations, depot):
    """
    Compute an S-shape (traversal) route through a rectangular warehouse.
    
    Parameters:
        warehouse: Warehouse object with aisle geometry
            - n_aisles: int, number of aisles
            - aisle_length: float, length of each aisle
            - aisle_spacing: float, distance between adjacent aisles
        pick_locations: list of (aisle, position) tuples
            - aisle: int, aisle number (1-indexed)
            - position: float, distance from front of aisle
        depot: (x, y) coordinates of the depot
    
    Returns:
        route: ordered list of (x, y) waypoints
        total_distance: float
    """
    # Step 1: Identify aisles that contain picks
    aisles_with_picks = sorted(set(aisle for aisle, pos in pick_locations))
    
    if not aisles_with_picks:
        return [depot], 0.0
    
    # Step 2: Build route
    route = [depot]
    total_distance = 0.0
    current_end = "front"  # Picker starts at front cross-aisle
    
    for i, aisle in enumerate(aisles_with_picks):
        aisle_x = warehouse.aisle_x(aisle)  # x-coordinate of the aisle
        
        if current_end == "front":
            # Enter from front, exit at back
            enter_point = (aisle_x, 0)                          # front of aisle
            exit_point  = (aisle_x, warehouse.aisle_length)     # back of aisle
        else:
            # Enter from back, exit at front
            enter_point = (aisle_x, warehouse.aisle_length)     # back of aisle
            exit_point  = (aisle_x, 0)                          # front of aisle
        
        # Walk along cross-aisle to aisle entrance
        total_distance += distance(route[-1], enter_point)
        route.append(enter_point)
        
        # Collect picks in this aisle (sorted by position along travel direction)
        aisle_picks = sorted(
            [(aisle_x, pos) for a, pos in pick_locations if a == aisle],
            key=lambda p: p[1],
            reverse=(current_end == "back")
        )
        route.extend(aisle_picks)
        
        # Walk to exit end of aisle
        total_distance += warehouse.aisle_length  # Full traversal
        route.append(exit_point)
        
        # Flip direction for next aisle
        current_end = "back" if current_end == "front" else "front"
    
    # Step 3: Return to depot along the cross-aisle
    total_distance += distance(route[-1], depot)
    route.append(depot)
    
    return route, total_distance


def distance(p1, p2):
    """Manhattan (rectilinear) distance between two points."""
    return abs(p1[0] - p2[0]) + abs(p1[1] - p2[1])
```

---

## Complexity Analysis

- **Time complexity:** O(n log n) where n = number of pick locations (dominated by the sort to identify unique aisles and sort picks within aisles; the traversal logic itself is O(n))
- **Space complexity:** O(n) for the route waypoints
- **Practical runtime:** Negligible (<1ms) for any realistic warehouse

---

## When to Use

### S-Shape is a Good Choice When:

1. **Pick density is high:** When most aisles are visited and each aisle has multiple picks, the S-shape route is near-optimal because full aisle traversal is necessary anyway.
   - Rule of thumb: S-shape is within 5-10% of optimal when >60% of aisles are visited (Hall, 1993).

2. **Simplicity is paramount:** When pickers work from paper lists without RF scanners, S-shape is the only heuristic that can be reliably followed without electronic guidance.

3. **Quick batch evaluation:** When evaluating thousands of candidate batch combinations, the S-shape distance estimate can be used as a fast lower bound approximation (though it overestimates, it preserves relative ordering).

4. **Baseline benchmarking:** Every routing improvement should be measured against S-shape as the naive baseline.

### S-Shape is a Poor Choice When:

1. **Pick density is low:** With 3-5 picks scattered across a 15-aisle warehouse, S-shape forces traversal of many aisles for minimal reason. The largest gap or combined heuristic will be 20-30% shorter.

2. **Picks are concentrated near the front:** If COI-based slotting places most picks near the front of aisles, the return heuristic may outperform S-shape because it avoids traversing empty back portions.

3. **Warehouse has a middle cross-aisle:** S-shape cannot exploit shortcuts through a middle cross-aisle. More sophisticated heuristics or the Roodbergen-De Koster DP extension should be used.

---

## Performance Characteristics

### Distance Formula (Hall, 1993)

Hall derived an approximate expected travel distance for S-shape routing in a rectangular warehouse:

```
E[D_sshape] = 2 * d_front + S * w + (n_a_visited - 1) * w_aisle
```

Where:
- `d_front` = distance from depot to the first/last aisle with picks (along front cross-aisle)
- `S` = number of aisles visited (with picks)
- `w` = aisle length (full traversal per visited aisle)
- `w_aisle` = aisle spacing (distance between adjacent aisles along cross-aisle)

This simplifies to approximately:

```
E[D_sshape] ≈ S * aisle_length + (S + 1) * aisle_spacing
```

### Comparison with Optimal (De Koster et al., 2007)

| Picks/Order | Aisles Visited (typ.) | S-Shape vs. Optimal |
|-------------|----------------------|---------------------|
| 2-5 | 2-4 of 10 | +25-35% |
| 6-10 | 4-7 of 10 | +15-25% |
| 11-20 | 6-9 of 10 | +8-15% |
| 21-30 | 8-10 of 10 | +3-8% |
| 30+ | 9-10 of 10 | +1-5% |

### Impact of Warehouse Shape

- **Wide warehouses (many short aisles):** S-shape performs relatively well because cross-aisle travel dominates; full aisle traversal is cheap.
- **Deep warehouses (few long aisles):** S-shape performs poorly because traversing a long aisle for one pick near the entrance is extremely wasteful.

---

## Limitations

1. **No adaptivity:** The heuristic ignores the actual positions of picks within each aisle. An aisle with one pick near the front is traversed just as fully as an aisle with picks spread throughout.

2. **Forced traversal:** The rule "traverse every aisle with a pick" is rigid. The optimal route may skip an aisle and access it from the other end via the back cross-aisle, which S-shape cannot do.

3. **Cross-aisle blindness:** S-shape does not use middle cross-aisles. In warehouses with multiple cross-aisles, this is a significant missed opportunity.

4. **Direction coupling:** Because the picker alternates direction, an aisle near the depot that would be better accessed from the front may be accessed from the back (or vice versa) due to the fixed alternation pattern.

---

## Implementation Notes for Action

### Priority: Implement First (Sprint 2 Week 1)

S-shape should be the **first** routing heuristic implemented because:
- It serves as the benchmark baseline for all other heuristics
- It validates the warehouse graph model — if S-shape produces incorrect routes, the graph is wrong
- It can be tested without complex per-aisle decision logic
- Warehouse managers at Action will recognize and trust S-shape routes

### Integration Points

- **Input:** List of pick locations (aisle, bay, level) + warehouse layout parameters
- **Output:** Ordered sequence of waypoints + total estimated distance
- **Used by:** Batch evaluation engine (fast distance estimate), route display module
- **Tested against:** Ratliff-Rosenthal DP optimal (benchmark gap should match literature: 10-30%)

### Test Cases

1. **All aisles visited:** Pick in every aisle — S-shape should be near-optimal
2. **Sparse picks:** 3 picks in 15 aisles — S-shape should be 25-35% above DP optimal
3. **Front-loaded picks:** All picks in the first 20% of aisle depth — S-shape should be outperformed by return heuristic
4. **Single aisle:** Degenerate case — S-shape should produce a simple in-and-out route
5. **Empty pick list:** Edge case — route is just depot to depot (distance 0)

---

## References

1. De Koster, R., Le-Duc, T. & Roodbergen, K.J. (2007). Design and control of warehouse order picking: A literature review. *European Journal of Operational Research*, 182(2), 481-501.
2. Hall, R.W. (1993). Distance approximations for routing manual pickers in a warehouse. *IIE Transactions*, 25(4), 76-87.
3. Petersen, C.G. (1997). An evaluation of order picking routeing policies. *International Journal of Operations & Production Management*, 17(11), 1098-1111.
4. Roodbergen, K.J. & De Koster, R. (2001). Routing order pickers in a warehouse with a middle aisle. *European Journal of Operational Research*, 133(1), 32-43.
5. Tompkins, J.A., White, J.A., Bozer, Y.A., & Tanchoco, J.M.A. (2003). *Facilities Planning* (3rd ed.). Wiley.

---

## See Also

- [[pick-route-heuristics]] — Overview of all heuristics
- [[largest-gap-heuristic]] — The recommended primary heuristic for Action
- [[pick-route-comparison]] — Head-to-head benchmark comparison
- [[tsp-warehouse-routing]] — Exact methods and TSP formulation
