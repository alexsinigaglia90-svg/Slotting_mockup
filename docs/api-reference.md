# API Reference — Action Warehouse Slotting Module

## Base URL

```
http://localhost:8000
```

## Authentication

No authentication required for current version.

---

## Endpoints

### 1. Health Check

**GET** `/health`

Check API service status.

**Response:** `200 OK`

```json
{
  "status": "ok",
  "version": "0.2.0"
}
```

**Example:**

```bash
curl http://localhost:8000/health
```

---

### 2. Optimize

**POST** `/optimize`

Run full warehouse slotting optimization with before/after comparison.

**Request Body:**

```json
{
  "warehouse_seed": 42,
  "sku_seed": 42,
  "order_seed": 42,
  "num_orders": 1000,
  "num_days": 1,
  "max_iterations": 100
}
```

**Parameters:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `warehouse_seed` | int | 42 | Seed for deterministic warehouse layout generation |
| `sku_seed` | int | 42 | Seed for SKU catalog generation |
| `order_seed` | int | 42 | Seed for order history generation |
| `num_orders` | int | 1000 | Number of orders to sample for evaluation |
| `num_days` | int | 1 | Days of order history to generate |
| `max_iterations` | int | 100 | Maximum iterations for simulated annealing optimizer |

**Response:** `200 OK`

```json
{
  "score_before": {
    "avg_distance_per_order": 159.2,
    "total_distance_sampled": 159200.5,
    "num_orders_sampled": 1000,
    "avg_aisles_per_order": 8.3,
    "avg_picks_per_order": 22.5,
    "distance_per_pick": 7.08
  },
  "score_after": {
    "avg_distance_per_order": 28.0,
    "total_distance_sampled": 28000.3,
    "num_orders_sampled": 1000,
    "avg_aisles_per_order": 1.9,
    "avg_picks_per_order": 22.5,
    "distance_per_pick": 1.24
  },
  "improvement_pct": 82.39,
  "iterations": 95,
  "num_skus_assigned": 8432,
  "num_locations_total": 3000
}
```

**Response Fields:**

**score_before** and **score_after** (ScoreResponse objects)

| Field | Type | Description |
|-------|------|-------------|
| `avg_distance_per_order` | float | Average walking distance per order (meters) |
| `total_distance_sampled` | float | Sum of all distances for sampled orders (meters) |
| `num_orders_sampled` | int | Number of orders evaluated |
| `avg_aisles_per_order` | float | Average number of aisles visited per order |
| `avg_picks_per_order` | float | Average picks per order |
| `distance_per_pick` | float | Total distance divided by total picks (meters/pick) |

**Top-level fields:**

| Field | Type | Description |
|-------|------|-------------|
| `improvement_pct` | float | Percentage reduction in avg distance (before → after) |
| `iterations` | int | Number of optimizer iterations executed |
| `num_skus_assigned` | int | Number of unique SKUs assigned to locations |
| `num_locations_total` | int | Total available rack locations in warehouse |

**Example:**

```bash
curl -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "warehouse_seed": 42,
    "sku_seed": 42,
    "order_seed": 42,
    "num_orders": 1000,
    "num_days": 1,
    "max_iterations": 100
  }'
```

**Notes:**

- Seeds determine reproducibility: same seeds → same warehouse, SKUs, orders
- Increasing `max_iterations` improves result quality but increases computation time
- The optimizer is deterministic given a seed; running twice with the same seed yields identical results
- Warehouse state (assignment, graph) is cached for use by `/pick-route` endpoint

---

### 3. Pick Route

**POST** `/pick-route`

Compute an optimized pick route for a list of SKUs using a specified heuristic.

**Requires:** Prior call to `/optimize` endpoint (uses cached state).

**Request Body:**

```json
{
  "sku_ids": ["SKU-001", "SKU-042", "SKU-156"],
  "heuristic": "s_shape"
}
```

**Parameters:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `sku_ids` | array[string] | — | List of product IDs to pick |
| `heuristic` | string | "largest_gap" | Routing algorithm: "s_shape" or "largest_gap" |

**Heuristic Descriptions:**

- **s_shape:** Follow aisle rows front-to-back, traverse each aisle fully before moving to next. Minimizes cross-aisle transitions. Best for small orders, well-structured aisles.
- **largest_gap:** Identify gaps between pick locations, visit largest gaps last. Adapts routing to actual pick pattern. Generally more efficient on random distributions.

**Response:** `200 OK`

```json
{
  "waypoints": ["LOC-001-01-01", "LOC-002-05-03", "LOC-003-12-02", "LOC-001-08-01"],
  "total_distance": 112.5,
  "aisles_visited": 3,
  "heuristic": "s_shape"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `waypoints` | array[string] | Ordered list of location IDs to visit (in optimal order) |
| `total_distance` | float | Total route distance in meters |
| `aisles_visited` | int | Number of distinct aisles traversed |
| `heuristic` | string | Heuristic used for routing |

**Example:**

```bash
curl -X POST http://localhost:8000/pick-route \
  -H "Content-Type: application/json" \
  -d '{
    "sku_ids": ["SKU-001", "SKU-042", "SKU-156"],
    "heuristic": "s_shape"
  }'
```

**Error Responses:**

| Status | Detail | Cause |
|--------|--------|-------|
| 404 | "No optimization has been run yet." | `/optimize` not called before `/pick-route` |
| 404 | "None of the requested SKUs are assigned." | All requested SKUs missing from warehouse assignment |
| 400 | Validation error | Invalid heuristic value or malformed request |

**Example Error:**

```json
{
  "detail": "No optimization has been run yet."
}
```

---

## Data Models

### ScoreResponse

Metrics for a warehouse configuration (before or after optimization).

```python
{
  "avg_distance_per_order": float,      # meters
  "total_distance_sampled": float,      # meters
  "num_orders_sampled": int,
  "avg_aisles_per_order": float,
  "avg_picks_per_order": float,
  "distance_per_pick": float            # meters/pick
}
```

### OptimizeRequest

```python
{
  "warehouse_seed": int = 42,
  "sku_seed": int = 42,
  "order_seed": int = 42,
  "num_orders": int = 1000,
  "num_days": int = 1,
  "max_iterations": int = 100
}
```

### OptimizeResponse

```python
{
  "score_before": ScoreResponse,
  "score_after": ScoreResponse,
  "improvement_pct": float,              # percentage
  "iterations": int,
  "num_skus_assigned": int,
  "num_locations_total": int
}
```

### PickRouteRequest

```python
{
  "sku_ids": list[str],
  "heuristic": str = "largest_gap"      # "s_shape" | "largest_gap"
}
```

### PickRouteResponse

```python
{
  "waypoints": list[str],               # location IDs in order
  "total_distance": float,              # meters
  "aisles_visited": int,
  "heuristic": str
}
```

### HealthResponse

```python
{
  "status": str,                        # "ok"
  "version": str                        # "0.2.0"
}
```

---

## Typical Usage Flow

### Complete Demo Workflow

1. **Start the service**
   ```bash
   cd /path/to/slotting_mockup
   python -m uvicorn slotting.api.app:create_app --reload
   ```

2. **Check health**
   ```bash
   curl http://localhost:8000/health
   ```

3. **Run optimization**
   ```bash
   curl -X POST http://localhost:8000/optimize \
     -H "Content-Type: application/json" \
     -d '{"max_iterations": 100}'
   ```
   
   Store the `score_before` and `score_after` metrics.

4. **Query a pick route**
   ```bash
   curl -X POST http://localhost:8000/pick-route \
     -H "Content-Type: application/json" \
     -d '{"sku_ids": ["SKU-001", "SKU-042"], "heuristic": "s_shape"}'
   ```

5. **Display results to frontend**
   - Render before/after metrics as bar charts
   - Animate 3D warehouse with the returned waypoints
   - Show improvement percentage

---

## Rate Limiting & Timeouts

- **Current:** No rate limiting (demo version)
- **Optimization timeout:** ~30 seconds for 10K SKUs, 100 iterations
- **Route computation timeout:** <1 second per order

---

## CORS Configuration

**Allowed Origins:** `http://localhost:3000`

**Allowed Methods:** `*` (GET, POST, PUT, DELETE, etc.)

**Allowed Headers:** `*`

To change allowed origins for production:

Edit `slotting/api/app.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Change this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Example Clients

### Python (httpx)

```python
import httpx
import json

async with httpx.AsyncClient() as client:
    # Optimize
    resp = await client.post(
        "http://localhost:8000/optimize",
        json={"warehouse_seed": 42, "max_iterations": 100}
    )
    result = resp.json()
    print(f"Improvement: {result['improvement_pct']:.1f}%")
    
    # Pick route
    resp = await client.post(
        "http://localhost:8000/pick-route",
        json={"sku_ids": ["SKU-001", "SKU-042"], "heuristic": "s_shape"}
    )
    route = resp.json()
    print(f"Route distance: {route['total_distance']:.1f}m")
```

### JavaScript/TypeScript (fetch)

```typescript
async function optimize() {
  const res = await fetch('http://localhost:8000/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      warehouse_seed: 42,
      max_iterations: 100,
    }),
  });
  
  const data = await res.json();
  console.log(`Improvement: ${data.improvement_pct.toFixed(1)}%`);
  
  return data;
}

async function pickRoute(skuIds: string[]) {
  const res = await fetch('http://localhost:8000/pick-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sku_ids: skuIds,
      heuristic: 's_shape',
    }),
  });
  
  const route = await res.json();
  console.log(`Route distance: ${route.total_distance.toFixed(1)}m`);
  
  return route;
}
```

---

## Future Endpoints (Roadmap)

- **POST** `/import` — Import real warehouse data (CSV)
- **POST** `/batch-optimize` — Optimize multiple orders simultaneously
- **GET** `/assignment` — Retrieve current SKU-to-location mapping
- **POST** `/scenario` — Compare alternative optimization parameters
- **WebSocket** `/optimize-stream` — Real-time progress during long optimizations

---

**Version:** 0.2.0  
**Last Updated:** 2026-04-10
