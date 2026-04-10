# Action Warehouse Slotting Module — Kennisbasis

## Project Overzicht
- **Klant:** Action (26 warehouses, discount retail)
- **Doel:** AI-gedreven slottingmodule voor opex-optimalisatie en opex-reductie
- **Scope:** SKU-to-location assignment, pick-route optimalisatie, batchvorming, zone-indeling
- **Warehouse type:** Primair man-to-goods, met ondersteuning voor hybride setups
- **Tech stack:** Next.js frontend + Python backend (scipy, networkx, OR-Tools, ML)
- **AI aanpak:** Hybride ML (forecasting, clustering) + OR (optimalisatie, routing)

## Vault Structuur

| Map | Inhoud |
|-----|--------|
| [[research/papers/]] | Wetenschappelijke papers en samenvattingen |
| [[research/algorithms/]] | Algoritme-documentatie en vergelijkingen |
| [[research/benchmarks/]] | Benchmark resultaten en vergelijkingsdata |
| [[architecture/]] | Systeemarchitectuur en technische ontwerpen |
| [[data-model/]] | Datamodel, synthetische data specificaties |
| [[propositions/]] | Propositiedocumenten richting Action |
| [[presentations/]] | HTML presentatie bronmateriaal |

## Sprint Planning
1. **Fundament** — Core research + datamodel + synthetische data generator
2. **Optimalisatie-Engine** — ML pipeline + OR-solver + API
3. **AAA Frontend** — Warehouse visualisatie + opex dashboards
4. **Propositie & Polish** — Presentatie + documentatie + data-import

## Sprint 1 Deliverables

### Research Notes
- [[research/papers/slotting-taxonomy|Slotting Problem Taxonomy]]
- [[research/papers/tsp-warehouse-routing|TSP & Warehouse Routing]]
- [[research/papers/pick-route-heuristics|Pick-Route Heuristics Overview]]
- [[research/algorithms/warehouse-graph-model|Warehouse Graph Model]]
- [[research/algorithms/distance-metrics|Distance Metrics]]
- [[research/algorithms/s-shape-heuristic|S-Shape Heuristic]]
- [[research/algorithms/largest-gap-heuristic|Largest Gap Heuristic]]
- [[research/algorithms/pick-route-comparison|Pick-Route Comparison]]

### Code Components
- `slotting/models/` — Domain models (Warehouse, SKU, Order)
- `slotting/warehouse_graph.py` — NetworkX graph voor distance/routing
- `slotting/generators/` — Synthetische data generators (warehouse, SKU, orders)
- `slotting/io/export.py` — JSON/CSV export

## Sprint 2 Deliverables

### Research Notes
- [[research/ml/demand-forecasting-comparison|Demand Forecasting Comparison]]
- [[research/ml/sku-affinity-analysis|SKU Affinity Analysis]]
- [[research/ml/correlated-slotting|Correlated Slotting]]
- [[research/algorithms/metaheuristics-slotting|Metaheuristics for Slotting]]
- [[research/operations/order-batching-strategies|Order Batching Strategies]]

### Engine Components
- `slotting/engine/types.py` — SlottingAssignment, SlottingScore, SlottingResult, PickRouteResult
- `slotting/engine/affinity.py` — SKUAffinityAnalyzer (co-occurrence, Jaccard, Louvain clustering)
- `slotting/engine/velocity.py` — VelocityClassifier (dynamic ABC+ met seasonal adjustment)
- `slotting/engine/pick_route.py` — PickRouteSolver (S-shape + largest gap heuristieken)
- `slotting/engine/evaluator.py` — SlottingEvaluator (score via gesimuleerde pick-routes)
- `slotting/engine/optimizer.py` — SlottingOptimizer (greedy + local search, 82.4% verbetering)

### API Layer
- `slotting/api/app.py` — FastAPI application factory
- `slotting/api/routes.py` — REST endpoints: /health, /optimize, /pick-route
- `slotting/api/schemas.py` — Pydantic request/response models

### Key Result
**82.4% reductie in gemiddelde loopafstand** (159.2m → 28.0m per order) — bewezen in integration tests.

## Sprint 3 Deliverables

### Research Notes
- [[research/visualization/warehouse-3d-rendering|3D Warehouse Rendering Best Practices]]
- [[research/operations/opex-kpi-framework|Opex KPI Framework]]

### Frontend Components (Next.js 14 + React Three Fiber)
- `frontend/src/components/warehouse-3d/warehouse-scene.tsx` — 3D warehouse met 3000 instanced racks
- `frontend/src/components/warehouse-3d/pick-route-line.tsx` — Geanimeerde pick-route lijnen
- `frontend/src/components/warehouse-2d/warehouse-2d.tsx` — 2D top-down analytische view
- `frontend/src/app/opex/page.tsx` — Opex dashboard met KPI cards, FTE calculator, ROI
- `frontend/src/context/slotting-context.tsx` — State management met useReducer
- `frontend/src/lib/warehouse-geometry.ts` — 3D positie-berekeningen voor 3000 locaties
- `frontend/src/lib/color-scales.ts` — Velocity/zone kleurschalen
- `frontend/src/lib/api.ts` — TypeScript API client

### Key Features
- 3D/2D dual-view warehouse visualisatie met velocity heatmap
- Instanced rendering (1-3 draw calls voor 3000 racks, 60fps)
- Live optimization via API met before/after vergelijking
- Opex dashboard met configureerbare parameters (FTE, kosten, ROI)
- Dark theme, professionele AAA-grade look

## Beslissingen
- Iteratieve spiraal aanpak: research en bouw versterken elkaar per sprint
- Synthetische data eerst, ontwerp klaar voor echte Action-data later
- Obsidian vault dient als AI-kennisbasis, bron voor presentatie en productdocumentatie
