---
tags: [research, operations, kpi, opex, dashboard, sprint-3]
sources:
  - "Frazelle (2002) - World-Class Warehousing and Material Handling"
  - "De Koster et al. (2007) - Design and control of warehouse order picking"
  - "Tompkins et al. (2010) - Facilities Planning"
  - "CBS / Eurostat labor cost data Netherlands 2024-2025"
sprint: 3
created: 2026-04-10
---

# Opex KPI Framework for Warehouse Managers

## Overview
KPIs must translate abstract optimization metrics into euros and FTEs. Warehouse managers think in "picks per hour" and "people per shift". Finance thinks in "cost per order" and "annual savings". The dashboard must serve both audiences.

## Primary KPIs

### Distance per Order (meters)
- Direct output from optimization engine (`avg_distance_per_order`)
- Most intuitive: "your pickers walk X meters less per order"
- Before/after comparison is the hero number
- Action benchmark: ~100-200m per order (unoptimized), target <50m (optimized)

### Picks per Hour
- Formula: `3600 / (avg_time_per_pick_seconds)`
- `avg_time_per_pick = (distance_per_pick / walking_speed) + handling_time`
- Walking speed: ~1.2 m/s (loaded trolley in warehouse aisle)
- Handling time: ~12 seconds per pick (reach, scan, place on trolley)
- Industry benchmark: 80-120 picks/hour for man-to-goods retail
- Post-optimization target: 150-200 picks/hour

### Orders per Shift
- Formula: `picks_per_hour × shift_hours / avg_picks_per_order`
- Shift: 8 hours effective (7.5 hours minus breaks)
- Action context: 15-40 lines per order → 8-20 orders/shift/picker typical

### Cost per Order (EUR)
- Formula: `hourly_labor_cost / orders_per_hour`
- Hourly labor cost: EUR 22-28 fully loaded (NL warehouse worker, incl. social charges)
- This is the bottom-line number that convinces finance

## FTE Impact Calculator

### Formula
```
current_fte = (orders_per_day × avg_picks_per_order) / (picks_per_hour_before × shift_hours)
optimized_fte = (orders_per_day × avg_picks_per_order) / (picks_per_hour_after × shift_hours)
fte_savings = current_fte - optimized_fte
annual_savings = fte_savings × annual_cost_per_fte
```

### Default Parameters (Action NL)
- Orders per day: 3,500 (configurable 2,000-5,000)
- Avg picks per order: from API data (~25)
- Hourly labor cost: EUR 25 (configurable)
- Shift hours: 7.5 effective
- Annual FTE cost: EUR 50,000 (configurable 45,000-55,000)
- Walking speed: 1.2 m/s

### Example Calculation
- Before: 159m/order → picks/hour = 3600 / (159/25/1.2 + 12) = ~58 picks/hour
- After: 28m/order → picks/hour = 3600 / (28/25/1.2 + 12) = ~265 picks/hour
- Orders/shift before: 58 × 7.5 / 25 = 17.4 orders/shift
- Orders/shift after: 265 × 7.5 / 25 = 79.5 orders/shift
- FTE for 3500 orders: before = 201 FTE, after = 44 FTE
- Annual saving: 157 FTE × EUR 50,000 = **EUR 7.85M per warehouse**

*Note: these numbers are based on synthetic data with extreme before/after delta. Real improvements will be 20-40% typically, yielding EUR 1-3M savings.*

## ROI Projection
- Investment: implementation + rollout cost across 26 warehouses
- Annual benefit per warehouse: FTE savings + error reduction (~2% of labor)
- Total annual benefit: per_warehouse × 26
- Payback period: total_investment / total_annual_benefit
- Show 36-month cumulative chart

## Configurable UI Parameters
| Parameter | Default | Range | Unit |
|-----------|---------|-------|------|
| orders_per_day | 3,500 | 2,000-5,000 | orders |
| hourly_labor_cost | 25 | 18-35 | EUR |
| shift_hours | 7.5 | 6-10 | hours |
| annual_fte_cost | 50,000 | 40,000-65,000 | EUR |
| walking_speed | 1.2 | 0.8-1.5 | m/s |
| handling_time | 12 | 8-18 | seconds |

## Implementation Implications
All KPIs derive from the optimization API response (distances, picks) combined with configurable business parameters. No additional API calls needed — pure frontend calculation. Store configurable parameters in React state with localStorage persistence.
