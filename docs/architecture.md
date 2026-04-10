# System Architecture — Action Warehouse Slotting Module

## Overview

The Action Warehouse Slotting Module is a four-layer system that combines machine learning demand forecasting with operations research optimization to reduce warehouse picking distances and improve operational efficiency.

```
Order History → ML Demand Forecast + SKU Affinities
                        ↓
Warehouse Layout + SKU Data → OR Optimizer → Optimal Slotting + Pick Routes
                        ↓
                   API Layer (REST)
                        ↓
          Frontend: 3D Warehouse + Opex Dashboard
```

## Layer 1: Data Layer

**Purpose:** Represent physical warehouse, products, and historical demand as computational models.

**Key Components:**

- **Warehouse Model** (`slotting/models/warehouse.py`)
  - Grid-based representation of warehouse layout
  - Aisle definitions with cross-aisle connections
  - Rack/bin locations with (x, y, z) coordinates
  - Zone partitioning (forward pick, bulk storage, seasonal)
  - Total location count: ~3,000–10,000 per warehouse

- **SKU Master** (`slotting/models/sku.py`)
  - Product attributes: ID, name, category, dimensions, weight
  - Velocity classification: A/B/C based on predicted demand
  - Affinity relationships: product co-occurrence patterns
  - Constraints: breakability, shelf-life, hazmat flags

- **Order Model** (`slotting/models/order.py`)
  - Historical order records with date, SKU list, quantities
  - Order lines tied to individual picks in the warehouse

- **Warehouse Graph** (`slotting/warehouse_graph.py`)
  - Graph-based distance computation: Manhattan distance with actual aisle routing
  - Node = location (rack bin), edge = aisle connectivity
  - Precomputed all-pairs distances for rapid route calculation

**Data Generator** (`slotting/generators/`)
  - `warehouse_generator.py`: Synthesizes warehouse layouts with configurable dimensions
  - `sku_generator.py`: Creates SKU catalogs with Action-like category distribution
  - `order_generator.py`: Generates realistic order patterns with seasonal variation
  - All generators use seeds for reproducibility

## Layer 2: Intelligence Layer

**Purpose:** Apply ML and OR algorithms to produce actionable optimization results.

**Key Components:**

### ML Engine

- **Demand Forecasting** (`slotting/engine/velocity.py`)
  - Time-series analysis per SKU
  - Classification into velocity tiers (Fast/Medium/Slow)
  - Inputs: order history, seasonal adjustments
  - Output: predicted daily picks per SKU

- **SKU Affinity Analysis** (`slotting/engine/affinity.py`)
  - Co-occurrence matrix: frequency of product pairs in single orders
  - Clustering of related items (e.g., cleaning supplies, garden tools)
  - Used to place correlated items nearby for batch picking efficiency

### OR Engine

- **Slotting Optimizer** (`slotting/engine/optimizer.py`)
  - **Algorithm:** Simulated annealing + local search
  - **Objective:** Minimize total weighted distance across all orders
  - **Constraints:** 
    - Each SKU assigned to exactly one location
    - All locations filled (or empty if SKUs < locations)
    - Zone capacity bounds
  - **Output:** Optimal SKU → Location assignment

- **Pick-Route Solver** (`slotting/engine/pick_route.py`)
  - **S-Shape Heuristic:** Follow aisle grid layout, traverse each aisle front-to-back
  - **Largest Gap Heuristic:** Identify gaps in aisle visitation, optimize ordering
  - **Input:** List of pick locations for a single order
  - **Output:** Ordered waypoints, total distance, aisles visited

- **Evaluator** (`slotting/engine/evaluator.py`)
  - Metrics computation: avg distance per order, picks per hour, aisles per order
  - Before/after comparison
  - Supports both exact evaluation (all orders) and sampling

## Layer 3: API Layer

**Technology:** FastAPI (Python)

**Application Factory** (`slotting/api/app.py`)
- CORS enabled for localhost:3000 (frontend dev)
- Middleware stack: error handling, logging

**Routes** (`slotting/api/routes.py`)

| Endpoint | Method | Purpose | Schema |
|----------|--------|---------|--------|
| `/health` | GET | Service health check | HealthResponse |
| `/optimize` | POST | Run full slotting optimization | OptimizeRequest → OptimizeResponse |
| `/pick-route` | POST | Compute pick route for order | PickRouteRequest → PickRouteResponse |

**Request/Response Schemas** (`slotting/api/schemas.py`)

- **OptimizeRequest**
  - `warehouse_seed`: Warehouse layout seed
  - `sku_seed`: SKU catalog seed
  - `order_seed`: Order history seed
  - `num_orders`: Orders to sample (default: 1000)
  - `num_days`: Days of history (default: 1)
  - `max_iterations`: Optimizer iterations (default: 100)

- **OptimizeResponse**
  - `score_before`: Metrics before optimization
  - `score_after`: Metrics after optimization
  - `improvement_pct`: Percentage reduction in distance
  - `iterations`: Iterations executed
  - `num_skus_assigned`: SKUs placed
  - `num_locations_total`: Total warehouse locations

- **PickRouteRequest**
  - `sku_ids`: List of product IDs to pick
  - `heuristic`: "s_shape" or "largest_gap"

- **PickRouteResponse**
  - `waypoints`: Ordered list of location IDs
  - `total_distance`: Route length in meters
  - `aisles_visited`: Number of distinct aisles
  - `heuristic`: Algorithm used

**State Management**
- In-memory dict to cache assignment, warehouse, and graph after optimization
- Pick-route endpoint reuses cached state (requires prior `/optimize` call)

## Layer 4: Presentation Layer

**Technology:** Next.js 15, React 19, Three.js via React Three Fiber

**Pages** (`frontend/src/app/`)
- `/warehouse`: 3D and 2D warehouse visualization with route animation
- `/opex`: Operational expense dashboard with KPIs and savings projections
- `/`: Home page with feature overview

**Components** (`frontend/src/components/`)
- **warehouse-3d/warehouse-scene.tsx**: Three.js scene with rack rendering, camera controls, route animation
- **warehouse-3d/pick-route-line.tsx**: 3D line geometry for pick path visualization
- **warehouse-2d/warehouse-2d.tsx**: Top-down SVG view for analytical mode
- **Sidebar, Navigation:** Feature selection and scenario controls

**Context** (`frontend/src/context/slotting-context.tsx`)
- Manages global state: current warehouse, assignment, selected routes
- Provides before/after toggle, heuristic selection

**Styling**
- Tailwind CSS for responsive layout
- Custom Three.js materials for rack and route visualization
- Dark theme with Action red (#E3000F) accents

## Data Flow

### Optimization Pipeline

1. **User Request** → POST `/optimize` with seeds
2. **Data Generation** → Warehouse, SKUs, orders created deterministically
3. **ML Analysis** → Velocity classification, affinity computation
4. **OR Optimization** → Simulated annealing solves assignment
5. **Evaluation** → Before/after metrics computed
6. **Response** → OptimizeResponse returned, state cached

### Visualization Pipeline

1. **Frontend Load** → Fetch `/optimize` endpoint
2. **Render 3D View** → Load warehouse geometry, color racks by velocity
3. **Route Query** → User selects order → POST `/pick-route`
4. **Animate Path** → Display waypoints, highlight aisles traversed
5. **Dashboard Update** → Show KPIs, savings projection

## Technology Rationale

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Backend Language** | Python | ML/OR ecosystem (scipy, networkx), rapid development |
| **Web Framework** | FastAPI | Async support, auto-generated API docs, minimal overhead |
| **Frontend Framework** | Next.js + React | Server components, Vercel deployment, ISR caching |
| **3D Rendering** | Three.js (R3F) | Industry standard, mature, React integration via Fiber |
| **Optimization** | Simulated Annealing | Near-optimal results on NP-hard problem, tunable parameters |
| **Routing Heuristics** | S-Shape + Largest Gap | Proven warehouse heuristics, O(n log n) complexity |
| **Distance Metric** | Graph-based Manhattan | Respects actual warehouse layout vs. Euclidean |

## Key Design Decisions

### 1. Hybrid ML + OR Approach
- **Why:** ML forecasts demand (knows *what* to expect), OR solves placement (knows *where* to put it)
- **Benefit:** Separates concerns; demand forecasting can be upgraded independently of optimization

### 2. Seeded Data Generation
- **Why:** Deterministic testing, reproducible demos, configurable warehouse scale
- **Benefit:** Same seed produces identical warehouse/orders across runs; easy to compare before/after

### 3. Simulated Annealing for Slotting
- **Why:** NP-hard problem; SA converges to near-optimal solutions efficiently
- **Benefit:** Tunable quality (iterations) vs. speed; works on large warehouses

### 4. Cached State in API
- **Why:** `/pick-route` depends on prior optimization results
- **Benefit:** Avoids redundant computation; simple single-request flow from frontend

### 5. Dual Visualization (3D + 2D)
- **Why:** 3D impresses stakeholders; 2D supports detailed analysis
- **Benefit:** 3D is the hero, 2D is the analytics tool

### 6. Real Warehouse Layout via Graph
- **Why:** Manhattan distance respects actual aisle layout
- **Benefit:** Metrics translate directly to real-world walking distances; more credible than Euclidean

## Deployment Architecture

**Backend:**
- FastAPI application runs on `localhost:8000`
- CORS middleware allows frontend on `localhost:3000`
- Stateless (data generation per request); no database needed for demo

**Frontend:**
- Next.js dev server on `localhost:3000`
- Fetches `/optimize` and `/pick-route` from backend
- 3D scene renders in browser using WebGL

**Production Readiness:**
- Backend: Deploy via Uvicorn + gunicorn to Heroku/AWS/GCP
- Frontend: Build and deploy to Vercel (native Next.js integration)
- Database: Add PostgreSQL for persistent slotting assignments, order history
- API Gateway: Add authentication (OAuth2), rate limiting, request logging

## Extensibility Points

1. **New Heuristics:** Add methods to `PickRouteSolver` class
2. **Demand Models:** Extend `velocity.py` with Prophet, LSTM, XGBoost
3. **Optimization Algorithms:** Replace simulated annealing with genetic algorithm, tabu search
4. **Data Import:** Add `.load_from_csv()` methods to models
5. **Zone Constraints:** Enhance optimizer to enforce zone capacity limits
6. **Batch Optimization:** Add `/batch-optimize` endpoint for multi-order picking
7. **Seasonal Config:** Support warehouse-specific seasonal profiles via config JSON

## Performance Characteristics

| Operation | Scale | Time |
|-----------|-------|------|
| Generate warehouse (3000 locs) | — | <100ms |
| Generate 10K SKUs | — | <50ms |
| Generate 1000 orders | — | <200ms |
| Optimize assignment (100 iterations) | 8000 SKUs, 3000 locs | ~5–10s |
| Compute pick route (1 order) | ~25 picks | <50ms |
| Evaluate all metrics (1000 orders) | 1000 picks total | ~500ms |

## Files Reference

```
slotting/
├── models/
│   ├── warehouse.py      # Warehouse grid, racks, zones
│   ├── sku.py             # Product attributes, velocity
│   ├── order.py           # Order records
│   └── __init__.py
├── engine/
│   ├── types.py           # Type definitions (SlottingAssignment, etc.)
│   ├── optimizer.py       # Simulated annealing solver
│   ├── evaluator.py       # Metrics computation
│   ├── affinity.py        # SKU correlation analysis
│   ├── velocity.py        # Demand forecasting
│   ├── pick_route.py      # S-shape, largest-gap heuristics
│   └── __init__.py
├── generators/
│   ├── warehouse_generator.py   # Procedural warehouse creation
│   ├── sku_generator.py         # Product catalog generation
│   ├── order_generator.py       # Synthetic order history
│   └── __init__.py
├── warehouse_graph.py     # Distance computation, routing graph
├── api/
│   ├── app.py            # FastAPI app factory
│   ├── routes.py         # Endpoint definitions
│   ├── schemas.py        # Pydantic models
│   └── __init__.py
├── io/
│   ├── export.py         # CSV/JSON export functions
│   └── __init__.py
└── __init__.py

frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Home page
│   │   ├── warehouse/page.tsx  # Warehouse visualization
│   │   ├── opex/page.tsx       # Opex dashboard
│   │   ├── layout.tsx          # Root layout
│   │   └── providers.tsx       # Context providers
│   ├── components/
│   │   ├── warehouse-3d/
│   │   │   ├── warehouse-scene.tsx
│   │   │   └── pick-route-line.tsx
│   │   └── warehouse-2d/
│   │       └── warehouse-2d.tsx
│   └── context/
│       └── slotting-context.tsx
├── next.config.ts
└── package.json
```

## Testing Strategy

**Unit Tests** (`tests/`)
- `test_optimizer.py`: Verify assignment improves metrics
- `test_pick_route.py`: Validate heuristic correctness
- `test_affinity.py`: Check co-occurrence calculation
- `test_evaluator.py`: Confirm metric formulas

**Integration Tests**
- `test_api.py`: End-to-end requests to all endpoints
- `test_integration.py`: Full pipeline from data gen → optimize → pick-route

**Manual Testing**
- Browser-based visual inspection of 3D warehouse
- Before/after comparison on real Action data (pilot phase)

---

**Version:** 0.2.0  
**Last Updated:** 2026-04-10
