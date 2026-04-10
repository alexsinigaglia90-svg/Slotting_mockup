# Sprint 3: AAA Frontend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the AAA-grade frontend that delivers the wow factor for Action — a 3D warehouse visualization with animated pick routes, a 2D analytical view, opex dashboard, and optimization controls. This is the presentation layer that turns the Sprint 2 engine into a compelling demo.

**Architecture:** Next.js 14 App Router frontend in `frontend/`. Fetches data from the FastAPI backend at `localhost:8000`. Client-side 3D rendering with React Three Fiber. State management with React Context + useReducer for optimization state. Dark theme with Tailwind CSS + shadcn/ui components.

**Tech Stack:** Next.js 14, React 18, TypeScript, React Three Fiber, Three.js, @react-three/drei, Tailwind CSS 3, shadcn/ui, Recharts (charts), Playwright (E2E tests)

**Backend prerequisite:** The FastAPI app needs CORS middleware added before the frontend can communicate with it. This is included as Task 3 Step 1.

---

## File Structure

```
frontend/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── .env.local                              # NEXT_PUBLIC_API_URL=http://localhost:8000
├── public/
│   └── fonts/                              # Inter font files (if self-hosted)
├── app/
│   ├── layout.tsx                          # Root layout — dark theme, sidebar
│   ├── page.tsx                            # Dashboard home / warehouse overview
│   ├── globals.css                         # Tailwind base + dark theme variables
│   ├── providers.tsx                       # Client providers wrapper
│   ├── warehouse/
│   │   └── page.tsx                        # 3D/2D warehouse view page
│   └── opex/
│       └── page.tsx                        # Opex dashboard page
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx                     # Left sidebar navigation
│   │   ├── header.tsx                      # Top header with breadcrumbs
│   │   └── view-toggle.tsx                 # 3D / 2D toggle switch
│   ├── warehouse-3d/
│   │   ├── warehouse-scene.tsx             # Main R3F Canvas + Scene
│   │   ├── floor.tsx                       # Ground plane + grid
│   │   ├── aisle.tsx                       # Single aisle with racks
│   │   ├── rack.tsx                        # Single rack with levels (instanced)
│   │   ├── rack-location.tsx               # Individual location box on rack
│   │   ├── depot-marker.tsx                # Depot position marker
│   │   ├── cross-aisle.tsx                 # Cross-aisle floor markings
│   │   ├── pick-route-line.tsx             # Animated 3D pick-route tube/line
│   │   ├── camera-controls.tsx             # OrbitControls + fly-through
│   │   └── color-legend.tsx                # Velocity/zone color legend overlay
│   ├── warehouse-2d/
│   │   ├── top-down-view.tsx               # 2D canvas warehouse view
│   │   ├── heatmap-overlay.tsx             # Velocity heatmap layer
│   │   ├── route-overlay.tsx               # 2D route path drawing
│   │   └── zone-overlay.tsx                # Zone boundary indicators
│   ├── dashboard/
│   │   ├── kpi-card.tsx                    # Single KPI metric card
│   │   ├── kpi-grid.tsx                    # Grid of KPI cards
│   │   ├── fte-calculator.tsx              # FTE impact calculator
│   │   ├── roi-projection.tsx              # ROI projection chart
│   │   └── score-comparison.tsx            # Before/after score bars
│   ├── controls/
│   │   ├── optimize-button.tsx             # Run optimization button + progress
│   │   ├── parameter-panel.tsx             # Tweakable optimization parameters
│   │   └── scenario-selector.tsx           # Scenario comparison dropdown
│   └── comparison/
│       ├── split-view.tsx                  # Side-by-side 3D comparison
│       └── metrics-diff.tsx                # Before/after metrics animation
├── lib/
│   ├── api.ts                              # API client — fetch from FastAPI
│   ├── types.ts                            # TypeScript types matching API schemas
│   ├── warehouse-geometry.ts               # Convert warehouse data to 3D coordinates
│   ├── color-scales.ts                     # Velocity/zone color mapping functions
│   └── format.ts                           # Number/currency formatting utilities
├── hooks/
│   ├── use-optimization.ts                 # Optimization state + API calls
│   ├── use-warehouse-data.ts               # Warehouse layout data hook
│   └── use-pick-route.ts                   # Pick route fetching hook
├── context/
│   └── slotting-context.tsx                # Global slotting state (results, assignment)
├── e2e/
│   ├── playwright.config.ts
│   ├── warehouse-view.spec.ts
│   ├── optimization-flow.spec.ts
│   └── opex-dashboard.spec.ts
└── components/ui/                          # shadcn/ui components (auto-generated)
    ├── button.tsx
    ├── card.tsx
    ├── badge.tsx
    ├── progress.tsx
    ├── tabs.tsx
    ├── slider.tsx
    ├── select.tsx
    └── separator.tsx

vault/research/
├── visualization/
│   └── warehouse-3d-rendering.md           # 3D warehouse viz best practices
└── operations/
    └── opex-kpi-framework.md               # Opex KPIs for warehouse managers

slotting/api/
└── app.py                                  # (Modified) Add CORS middleware
```

---

## Warehouse Geometry Reference

These constants define the 3D scene and must be consistent across all visualization components:

```
WAREHOUSE DIMENSIONS:
- 15 aisles, spaced 4.5m apart (x-axis: 0 to 63m)
- Each aisle: 40m long (z-axis: 0 to 40m), 3m wide
- 20 rack positions per aisle side (left + right = 40 racks per aisle)
- Rack spacing: 40m / 20 = 2m per rack position along the z-axis
- 5 levels per rack, ~0.5m per level = 2.5m total rack height
- Depot at world origin (0, 0, 0)
- Cross-aisles at z=0 and z=40 (open corridors, no racks)
- Total locations: 15 aisles x 40 racks x 5 levels = 3,000

3D COORDINATE MAPPING:
- x-axis: across aisles (aisle index * 4.5m)
- y-axis: height (level * 0.5m, ground at y=0)
- z-axis: along aisle length (rack position * 2.0m)
- Left racks: x_aisle - 1.0m offset
- Right racks: x_aisle + 1.0m offset
- Rack box size: 0.8m wide x 0.45m tall x 1.8m deep
```

---

## Part A: Research (Obsidian Vault)

### Task 1: Sprint 3 Research Notes

**Files:**
- Create: `vault/research/visualization/warehouse-3d-rendering.md`
- Create: `vault/research/operations/opex-kpi-framework.md`

- [ ] **Step 1: Research and write 3D warehouse visualization best practices**

Search for: "React Three Fiber warehouse visualization", "Three.js instanced mesh performance", "3D warehouse rendering techniques", "WebGL large scene optimization". Document in `vault/research/visualization/warehouse-3d-rendering.md`:

```markdown
---
tags: [research, visualization, threejs, r3f, 3d, sprint-3]
sources: [papers and references found]
sprint: 3
created: 2026-04-10
---

# 3D Warehouse Visualization — Best Practices

## Overview
[Why 3D warehouse visualization matters for stakeholder buy-in and spatial understanding]

## Rendering Strategy

### InstancedMesh for Racks
- With 3,000 location boxes, individual meshes would kill performance
- InstancedMesh renders all rack locations in 1-3 draw calls
- Set instance color via instanceColor attribute — supports per-location velocity coloring
- Update: use setMatrixAt() for position/scale, setColorAt() for coloring
- Target: 60fps with 3,000 instances is trivially achievable

### Scene Organization
- Group by aisle for frustum culling benefits
- Floor plane: simple PlaneGeometry with grid shader or GridHelper
- Rack geometry: BoxGeometry shared across all instances
- Cross-aisles: thin PlaneGeometry strips at z=0 and z=40

### Camera Strategy
- OrbitControls for free rotation/zoom (default interaction)
- Isometric view as default angle: camera at (45, 35, 45) looking at center
- Fly-through: animate camera along a spline path following pick route
- Damping enabled for smooth feel

### Lighting
- Ambient light (intensity 0.4) for base illumination
- Directional light from above-left for depth shadows
- Optional: subtle AO (screen-space ambient occlusion) via postprocessing
- Dark environment: dark gray (#111) background, not pure black

### Color Encoding
- Velocity: gradient from red (#ef4444, A-class) through yellow (#eab308, B) to blue (#3b82f6, D-class)
- Zones: forward_pick = green tint, bulk_storage = neutral, seasonal = purple tint
- Empty locations: dark gray (#374151) with low opacity
- Selected/highlighted: emissive glow or bright outline

### Pick Route Animation
- TubeGeometry or Line2 (fat lines) for route path
- Animate a sphere or marker along the path using useFrame
- Dash offset animation on the line material for "flowing" effect
- Before route: red/orange color; After route: green color

### Performance Budget
- Target: 60fps on mid-range laptop GPU
- 3,000 instanced boxes + floor + route lines = well within budget
- Avoid: real-time shadows on all objects, complex post-processing
- Use drei's BakeShadows for static shadow baking

## Implementation Implications
[InstancedMesh is the core technique. drei provides OrbitControls, Line, and utility components. Keep geometry simple (boxes), invest in color/material quality for the AAA feel.]
```

- [ ] **Step 2: Research and write opex KPI framework**

Search for: "warehouse KPI metrics operations", "cost per order warehouse", "FTE calculation warehouse picking", "picks per hour benchmark retail". Document in `vault/research/operations/opex-kpi-framework.md`:

```markdown
---
tags: [research, operations, kpi, opex, dashboard, sprint-3]
sources: [papers and references found]
sprint: 3
created: 2026-04-10
---

# Opex KPI Framework for Warehouse Managers

## Overview
[KPIs that resonate with warehouse managers and C-level — must translate optimization into euros]

## Primary KPIs

### Distance per Order (meters)
- Direct output from the optimization engine (avg_distance_per_order)
- Most intuitive metric: "your pickers walk X meters less per order"
- Before/after comparison is the hero number

### Picks per Hour
- Formula: 3600 / (avg_time_per_pick_seconds)
- avg_time_per_pick = (distance_per_pick / walking_speed_m_s) + handling_time_seconds
- Walking speed: ~1.2 m/s (loaded trolley in warehouse)
- Handling time: ~12 seconds per pick (reach, scan, place)
- Industry benchmark: 80-120 picks/hour for man-to-goods

### Orders per Shift
- Formula: picks_per_hour * shift_hours / avg_picks_per_order
- Shift: 8 hours effective (accounting for breaks)
- Direct link to FTE requirements

### Cost per Order (EUR)
- Formula: (hourly_labor_cost / orders_per_hour)
- Hourly labor cost: ~EUR 22-28 fully loaded (NL warehouse worker)
- The bottom-line number that convinces finance

## FTE Impact Calculator
- Current FTEs = total_daily_orders * avg_picks_per_order / (picks_per_hour * shift_hours)
- Optimized FTEs = same formula with improved picks_per_hour
- FTE savings = Current - Optimized
- Annual savings = FTE_savings * annual_cost_per_FTE (EUR ~45,000-55,000)

## ROI Projection
- Investment: implementation cost (this module)
- Annual benefit: FTE savings + reduced error rate + faster throughput
- Payback period: investment / annual_benefit
- 3-year NPV with discount rate ~8%

## Configurable Parameters (for the UI)
- orders_per_day: 2000-5000 (slider)
- avg_picks_per_order: from API data
- hourly_labor_cost: EUR 25 default (editable)
- shift_hours: 8 default (editable)
- annual_fte_cost: EUR 50,000 default (editable)
- walking_speed: 1.2 m/s default

## Implementation Implications
[All KPIs derive from the optimization API response (distances, picks) combined with configurable business parameters. No additional API calls needed — pure frontend calculation.]
```

**Acceptance Criteria:**
- Both vault notes exist with frontmatter, sections, and actionable recommendations
- Notes follow the standard format: samenvatting, key findings, relevantie, implementatie-implicaties
- Content is grounded in real techniques/benchmarks, not generic filler

---

## Part B: Project Setup

### Task 2: Next.js Project Scaffolding

**Files:**
- Create: `frontend/` directory with full Next.js 14 project
- Create: `.env.local` with API URL

- [ ] **Step 1: Initialize Next.js project**

```bash
cd C:/Users/asini/Documents/GitHub/Slotting_mockup
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Accept defaults. This creates the Next.js 14 App Router project with TypeScript and Tailwind.

- [ ] **Step 2: Install dependencies**

```bash
cd frontend
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
npm install recharts
npm install -D @types/three
```

- [ ] **Step 3: Install and initialize shadcn/ui**

```bash
npx shadcn@latest init
```

Choose: New York style, Zinc base color, CSS variables enabled. Then add components:

```bash
npx shadcn@latest add button card badge progress tabs slider select separator tooltip switch
```

- [ ] **Step 4: Create environment file**

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 5: Configure next.config.ts for client-side 3D**

Update `frontend/next.config.ts` to transpile Three.js packages and disable SSR for R3F:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
};

export default nextConfig;
```

- [ ] **Step 6: Set up dark theme globals**

Replace `frontend/app/globals.css` with Tailwind base including dark theme CSS variables. The dark theme should use:
- Background: `#0a0a0f` (near-black with slight blue)
- Card backgrounds: `#111118` 
- Borders: `#1e1e2e`
- Primary accent: `#3b82f6` (blue-500)
- Success: `#22c55e` (green-500)
- Warning: `#eab308` (yellow-500)
- Danger: `#ef4444` (red-500)

- [ ] **Step 7: Verify project runs**

```bash
cd frontend && npm run dev
```

Verify: `http://localhost:3000` loads without errors.

**Acceptance Criteria:**
- `npm run dev` starts without errors on `localhost:3000`
- Tailwind dark theme renders (dark background visible)
- shadcn/ui components import correctly (test with a `<Button>` render)
- Three.js imports resolve without SSR errors
- `.env.local` contains `NEXT_PUBLIC_API_URL=http://localhost:8000`

---

### Task 3: Backend CORS + API Client

**Files:**
- Modify: `slotting/api/app.py` (add CORS middleware)
- Create: `frontend/lib/api.ts`
- Create: `frontend/lib/types.ts`

- [ ] **Step 1: Add CORS middleware to FastAPI**

Update `slotting/api/app.py` — add `CORSMiddleware` allowing origin `http://localhost:3000`:

```python
"""FastAPI application factory."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from slotting.api.routes import router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Action Warehouse Slotting API",
        description="AI-driven warehouse slotting optimization engine",
        version="0.2.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)
    return app
```

- [ ] **Step 2: Create TypeScript types matching API schemas**

Create `frontend/lib/types.ts` with interfaces matching the Pydantic models in `slotting/api/schemas.py`:

```typescript
// Mirrors slotting/api/schemas.py

export interface ScoreResponse {
  avg_distance_per_order: number;
  total_distance_sampled: number;
  num_orders_sampled: number;
  avg_aisles_per_order: number;
  avg_picks_per_order: number;
  distance_per_pick: number;
}

export interface OptimizeResponse {
  score_before: ScoreResponse;
  score_after: ScoreResponse;
  improvement_pct: number;
  iterations: number;
  num_skus_assigned: number;
  num_locations_total: number;
}

export interface OptimizeRequest {
  warehouse_seed?: number;
  sku_seed?: number;
  order_seed?: number;
  num_orders?: number;
  num_days?: number;
  max_iterations?: number;
}

export interface PickRouteRequest {
  sku_ids: string[];
  heuristic?: "s_shape" | "largest_gap";
}

export interface PickRouteResponse {
  waypoints: string[];
  total_distance: number;
  aisles_visited: number;
  heuristic: string;
}

export interface HealthResponse {
  status: string;
  version: string;
}

// Frontend-specific types

export interface WarehouseConfig {
  numAisles: number;
  racksPerAisle: number;
  levelsPerRack: number;
  aisleLengthM: number;
  aisleSpacingM: number;
  aisleWidthM: number;
}

export const DEFAULT_WAREHOUSE_CONFIG: WarehouseConfig = {
  numAisles: 15,
  racksPerAisle: 20,
  levelsPerRack: 5,
  aisleLengthM: 40,
  aisleSpacingM: 4.5,
  aisleWidthM: 3.0,
};

export type VelocityClass = "A" | "B" | "C" | "D";
export type ColorMode = "velocity" | "zone" | "category";
export type ViewMode = "3d" | "2d";
```

- [ ] **Step 3: Create API client**

Create `frontend/lib/api.ts`:

```typescript
import type {
  HealthResponse,
  OptimizeRequest,
  OptimizeResponse,
  PickRouteRequest,
  PickRouteResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API error ${res.status}: ${detail}`);
  }
  return res.json();
}

export const api = {
  health: () => apiFetch<HealthResponse>("/health"),

  optimize: (params?: OptimizeRequest) =>
    apiFetch<OptimizeResponse>("/optimize", {
      method: "POST",
      body: JSON.stringify(params ?? {}),
    }),

  pickRoute: (params: PickRouteRequest) =>
    apiFetch<PickRouteResponse>("/pick-route", {
      method: "POST",
      body: JSON.stringify(params),
    }),
};
```

- [ ] **Step 4: Verify CORS works**

Start backend: `uvicorn slotting.api.app:create_app --factory`
Start frontend: `cd frontend && npm run dev`
Open browser console at `localhost:3000` and run: `fetch('http://localhost:8000/health').then(r => r.json()).then(console.log)` — should return `{status: "ok", version: "0.2.0"}` without CORS errors.

**Acceptance Criteria:**
- FastAPI app includes CORS middleware allowing `localhost:3000`
- `api.health()` succeeds from the frontend without CORS errors
- `api.optimize()` returns typed `OptimizeResponse`
- TypeScript types match the Pydantic schemas exactly (field names use snake_case to match JSON)
- Existing backend tests still pass: `pytest tests/`

---

## Part C: Layout Shell

### Task 4: Application Layout — Sidebar, Header, Dark Theme

**Files:**
- Create: `frontend/app/layout.tsx`
- Create: `frontend/app/page.tsx`
- Create: `frontend/app/providers.tsx`
- Create: `frontend/components/layout/sidebar.tsx`
- Create: `frontend/components/layout/header.tsx`

- [ ] **Step 1: Create providers wrapper**

Create `frontend/app/providers.tsx` — a `"use client"` component that wraps children with any context providers needed (SlottingContext will be added in Task 6).

- [ ] **Step 2: Create root layout**

Create `frontend/app/layout.tsx`:
- Import Inter font from `next/font/google`
- Set `<html className="dark">` for permanent dark mode
- Body: flex row layout — sidebar (fixed 240px width) + main content area
- Apply dark background and text colors
- Wrap children in `<Providers>`

- [ ] **Step 3: Create sidebar navigation**

Create `frontend/components/layout/sidebar.tsx`:
- Logo/title area: "Action Slotting" with a small warehouse icon
- Navigation links using Next.js `Link`:
  - Dashboard (`/`)
  - Warehouse (`/warehouse`) — with sub-indicators for 3D/2D
  - Opex Dashboard (`/opex`)
- Active link highlighting
- Bottom section: API status indicator (green dot if `/health` returns ok)
- Styling: dark panel (`bg-[#0d0d14]`), border-right, professional typography

- [ ] **Step 4: Create header**

Create `frontend/components/layout/header.tsx`:
- Breadcrumb showing current page
- Right side: color mode selector (velocity/zone/category dropdown)
- Minimal height (~48px)

- [ ] **Step 5: Create dashboard home page**

Create `frontend/app/page.tsx`:
- Hero card: "Action Warehouse Slotting Module" title
- Quick stats cards (placeholder values until API integration):
  - Warehouse: "15 aisles, 3,000 locations"
  - Status: "Ready to optimize" / "Last run: ..."
  - Improvement: "-- %" (or value after optimization)
- "Analyze Warehouse" CTA button linking to `/warehouse`
- "Run Optimization" CTA button (placeholder)

- [ ] **Step 6: Verify layout renders**

Run `npm run dev`, navigate to `localhost:3000`. Verify:
- Dark theme applies globally
- Sidebar renders with navigation links
- Links navigate between `/`, `/warehouse`, `/opex`
- Layout is responsive but desktop-optimized (min-width assumption)

**Acceptance Criteria:**
- Dark theme (`#0a0a0f` background) renders on all pages
- Sidebar shows 3 navigation items with active state highlighting
- Header shows breadcrumbs and color mode selector
- Dashboard page renders with placeholder cards
- No hydration errors in console
- Layout fills viewport height without scrollbar on the shell itself

---

## Part D: 3D Warehouse Visualization

### Task 5: 3D Warehouse Scene — Floor, Aisles, Racks

This is the most important task in the sprint — the hero visual.

**Files:**
- Create: `frontend/app/warehouse/page.tsx`
- Create: `frontend/components/warehouse-3d/warehouse-scene.tsx`
- Create: `frontend/components/warehouse-3d/floor.tsx`
- Create: `frontend/components/warehouse-3d/aisle.tsx`
- Create: `frontend/components/warehouse-3d/rack.tsx`
- Create: `frontend/components/warehouse-3d/rack-location.tsx`
- Create: `frontend/components/warehouse-3d/depot-marker.tsx`
- Create: `frontend/components/warehouse-3d/cross-aisle.tsx`
- Create: `frontend/components/warehouse-3d/camera-controls.tsx`
- Create: `frontend/lib/warehouse-geometry.ts`

- [ ] **Step 1: Create warehouse geometry utilities**

Create `frontend/lib/warehouse-geometry.ts` — pure functions that convert warehouse configuration into 3D world coordinates. This is the single source of truth for all position calculations:

```typescript
import { DEFAULT_WAREHOUSE_CONFIG, type WarehouseConfig } from "./types";

export interface RackPosition3D {
  locationId: string;
  aisleIndex: number;
  rackPosition: number;   // 1-20
  side: "left" | "right";
  level: number;           // 1-5
  worldX: number;
  worldY: number;
  worldZ: number;
}

const RACK_WIDTH = 0.8;
const RACK_HEIGHT = 0.45;
const RACK_DEPTH = 1.8;
const SIDE_OFFSET = 1.0;  // offset from aisle center for left/right racks

export function generateAllPositions(
  config: WarehouseConfig = DEFAULT_WAREHOUSE_CONFIG
): RackPosition3D[] {
  const positions: RackPosition3D[] = [];
  const rackSpacing = config.aisleLengthM / config.racksPerAisle; // 2.0m

  for (let a = 0; a < config.numAisles; a++) {
    const aisleX = a * config.aisleSpacingM;
    for (const side of ["left", "right"] as const) {
      const xOffset = side === "left" ? -SIDE_OFFSET : SIDE_OFFSET;
      for (let r = 1; r <= config.racksPerAisle; r++) {
        const z = r * rackSpacing; // starts at 2.0, ends at 40.0
        for (let l = 1; l <= config.levelsPerRack; l++) {
          const aislePadded = String(a + 1).padStart(2, "0");
          const sideChar = side === "left" ? "L" : "R";
          const rackPadded = String(r).padStart(2, "0");
          positions.push({
            locationId: `A${aislePadded}-${sideChar}${rackPadded}-L${l}`,
            aisleIndex: a,
            rackPosition: r,
            side,
            level: l,
            worldX: aisleX + xOffset,
            worldY: (l - 1) * RACK_HEIGHT + RACK_HEIGHT / 2,
            worldZ: z,
          });
        }
      }
    }
  }
  return positions;
}

export function getAisleCenter(aisleIndex: number, config = DEFAULT_WAREHOUSE_CONFIG) {
  return { x: aisleIndex * config.aisleSpacingM, z: config.aisleLengthM / 2 };
}

export function getWarehouseCenter(config = DEFAULT_WAREHOUSE_CONFIG) {
  return {
    x: ((config.numAisles - 1) * config.aisleSpacingM) / 2,
    y: 1.25,
    z: config.aisleLengthM / 2,
  };
}

export { RACK_WIDTH, RACK_HEIGHT, RACK_DEPTH };
```

- [ ] **Step 2: Create the warehouse scene component**

Create `frontend/components/warehouse-3d/warehouse-scene.tsx`:
- `"use client"` component containing an R3F `<Canvas>` with:
  - `camera` prop: initial isometric-like position looking at warehouse center
  - `gl` prop: antialias enabled, alpha false, powerPreference "high-performance"
  - Dark background color (`#0a0a0f`)
- Inside Canvas:
  - `<ambientLight intensity={0.4} />`
  - `<directionalLight position={[30, 40, 20]} intensity={0.8} />`
  - `<Floor />`
  - `<CrossAisle />` at z=0 and z=40
  - `<DepotMarker />`
  - `<InstancedRacks />` — the main instanced mesh rendering all 3,000 locations
  - `<CameraControls />`
- Wrap Canvas in a container div that fills the parent (h-full w-full)
- Use `Suspense` with a loading fallback around the Canvas

- [ ] **Step 3: Create floor and structural elements**

Create `frontend/components/warehouse-3d/floor.tsx`:
- A large PlaneGeometry (80m x 60m) rotated to be horizontal
- Dark gray material (`#111118`) with subtle grid lines
- Use `drei`'s `Grid` helper for the grid overlay (faded, thin lines every 4.5m matching aisle spacing)

Create `frontend/components/warehouse-3d/cross-aisle.tsx`:
- Two horizontal strips at z=0 and z=40 spanning the full warehouse width
- Slightly different color from main floor (lighter, `#1a1a2e`) to indicate walkable cross-aisles
- Width: ~3m (matching aisle width)

Create `frontend/components/warehouse-3d/depot-marker.tsx`:
- A small glowing marker at position (0, 0.05, 0) — the depot/start point
- Use a cylinder or ring geometry with emissive green material
- Optional: drei's `Text` component floating above it saying "DEPOT"

- [ ] **Step 4: Create instanced rack rendering**

This is performance-critical. Create `frontend/components/warehouse-3d/rack.tsx`:
- Use `THREE.InstancedMesh` with a single `BoxGeometry(RACK_WIDTH, RACK_HEIGHT, RACK_DEPTH)`
- Generate all 3,000 positions using `generateAllPositions()`
- In a `useEffect`, iterate over positions and call `setMatrixAt()` for each instance position, `setColorAt()` for each instance color
- Default color: neutral dark gray (`#374151`)
- Accept a `colorMode` prop and a `velocityData` prop (map of locationId to VelocityClass)
- When velocityData is provided, color instances:
  - A: `#ef4444` (red)
  - B: `#eab308` (yellow) 
  - C: `#60a5fa` (light blue)
  - D: `#3b82f6` (blue)
  - Unassigned: `#374151` (gray)
- On colorMode/velocityData change, re-run setColorAt and mark `instanceColor.needsUpdate = true`
- Material: `MeshStandardMaterial` with slight metalness (0.3) and roughness (0.7) for a professional look

- [ ] **Step 5: Create camera controls**

Create `frontend/components/warehouse-3d/camera-controls.tsx`:
- Use drei's `<OrbitControls>` with:
  - `target` = warehouse center
  - `enableDamping` = true
  - `dampingFactor` = 0.1
  - `maxPolarAngle` = Math.PI / 2 (prevent going below floor)
  - `minDistance` = 5, `maxDistance` = 150
- Expose a `flyTo(position, target)` method via `useImperativeHandle` for programmatic camera moves
- Add preset view buttons (passed as overlay UI, not inside Canvas):
  - "Isometric" — camera at (45, 35, 45) 
  - "Top Down" — camera at (center.x, 80, center.z)
  - "Aisle View" — camera at (0, 2, -5) looking down first aisle

- [ ] **Step 6: Create the warehouse page**

Create `frontend/app/warehouse/page.tsx`:
- Full-height container below header
- `WarehouseScene` component filling the content area
- Overlay UI in top-right corner: view preset buttons, color mode toggle
- Use `dynamic` import with `{ ssr: false }` for the WarehouseScene to prevent SSR issues:
  ```typescript
  const WarehouseScene = dynamic(
    () => import("@/components/warehouse-3d/warehouse-scene"),
    { ssr: false }
  );
  ```

- [ ] **Step 7: Verify 3D scene renders correctly**

Run `npm run dev`, navigate to `/warehouse`. Verify:
- 3D scene renders with dark background
- 15 aisles of rack boxes are visible in correct positions
- Racks have 5 visible height levels
- Camera orbits smoothly with mouse drag/scroll
- Floor grid and cross-aisles visible
- Depot marker visible at origin
- No console errors, maintains 60fps
- Scene matches real warehouse dimensions (sanity check: aisles ~4.5m apart, racks 40m deep)

**Acceptance Criteria:**
- 3,000 rack location boxes render as instanced mesh (1-3 draw calls, not 3,000)
- Default camera shows full warehouse in isometric-like view
- OrbitControls allow rotate, zoom, pan
- View preset buttons switch camera angles
- Scene renders at 60fps on a standard laptop
- Warehouse dimensions are physically accurate (15 aisles x 4.5m spacing, 40m length, 5 levels)
- Floor, cross-aisles, and depot marker are all visible

---

### Task 6: API Integration + State Management

**Files:**
- Create: `frontend/context/slotting-context.tsx`
- Create: `frontend/hooks/use-optimization.ts`
- Create: `frontend/hooks/use-warehouse-data.ts`
- Create: `frontend/lib/color-scales.ts`

- [ ] **Step 1: Create slotting context**

Create `frontend/context/slotting-context.tsx`:
- `"use client"` context provider using `useReducer`
- State shape:
  ```typescript
  interface SlottingState {
    optimizeResult: OptimizeResponse | null;
    isOptimizing: boolean;
    error: string | null;
    colorMode: ColorMode;
    viewMode: ViewMode;
    // Synthetic velocity data for coloring (generated client-side from result)
    velocityMap: Record<string, VelocityClass>;
  }
  ```
- Actions: `OPTIMIZE_START`, `OPTIMIZE_SUCCESS`, `OPTIMIZE_ERROR`, `SET_COLOR_MODE`, `SET_VIEW_MODE`
- Provider wraps children and exposes state + dispatch via context

- [ ] **Step 2: Create optimization hook**

Create `frontend/hooks/use-optimization.ts`:
- `useOptimization()` hook that reads from SlottingContext
- Provides: `runOptimize(params?)`, `result`, `isOptimizing`, `error`
- `runOptimize` dispatches OPTIMIZE_START, calls `api.optimize()`, dispatches success/error
- On success, generates a synthetic velocity map: distributes location IDs across A/B/C/D classes based on the Pareto distribution (20% A, 30% B, 30% C, 20% D) and assigns to rack positions nearest the depot first for A-class. This is a client-side approximation for visualization — the backend does not return per-location velocity data.

- [ ] **Step 3: Create color scale utilities**

Create `frontend/lib/color-scales.ts`:
- `velocityColor(vc: VelocityClass): string` — returns hex color for each class
- `zoneColor(zone: "forward_pick" | "bulk_storage" | "seasonal"): string`
- `interpolateVelocityGradient(value: number): string` — 0-1 continuous gradient from blue to red
- Export named constants for all colors used in the visualization

- [ ] **Step 4: Wire color data into the 3D scene**

Update `frontend/components/warehouse-3d/rack.tsx` to consume `velocityMap` from SlottingContext.
- Before optimization: all racks neutral gray
- After optimization: racks colored by velocity class
- Smooth color transition using `THREE.Color.lerp` over ~30 frames when data changes

- [ ] **Step 5: Verify API integration**

Start both backend and frontend. Open `/warehouse`, run optimization via the browser console:
```javascript
// Temporary test — will be replaced by UI button in Task 10
fetch('http://localhost:8000/optimize', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{}'}).then(r => r.json()).then(console.log)
```
Verify the response shape matches `OptimizeResponse`.

**Acceptance Criteria:**
- SlottingContext provides optimization state to all components
- `useOptimization().runOptimize()` calls the API and updates state
- After optimization, velocity map is generated and racks re-color in the 3D view
- Color transitions are smooth (not a hard snap)
- Error state displays if API is unreachable

---

### Task 7: 3D Rack Coloring + Color Legend

**Files:**
- Create: `frontend/components/warehouse-3d/color-legend.tsx`
- Modify: `frontend/components/warehouse-3d/warehouse-scene.tsx` (add legend overlay)

- [ ] **Step 1: Create velocity heatmap coloring**

Enhance the rack instanced mesh (from Task 5) to support three color modes:
- **Velocity mode:** A=red, B=yellow, C=light blue, D=blue (default after optimization)
- **Zone mode:** Forward pick aisles (1-4) = green, Bulk storage (5-15) = neutral gray, based on `WarehouseConfig.forwardPickAisles = 4`
- **Category mode:** Color by SKU category using a 9-color categorical palette (one color per `Category` enum value)

Color mode switching should re-run `setColorAt()` on all instances and mark the instance color buffer for update.

- [ ] **Step 2: Create color legend overlay**

Create `frontend/components/warehouse-3d/color-legend.tsx`:
- Positioned absolute in bottom-left of the warehouse view
- Shows the current color mode's legend:
  - Velocity: colored squares for A/B/C/D with labels
  - Zone: colored squares for Forward Pick / Bulk Storage
  - Category: 9 color swatches with category names
- Uses shadcn/ui Card for the container, semi-transparent dark background
- Animates in/out when color mode changes

- [ ] **Step 3: Verify coloring**

Navigate to `/warehouse`. Toggle between color modes using the header dropdown. Verify:
- Velocity mode shows a gradient pattern (A-class racks near depot are red)
- Zone mode clearly separates forward pick aisles from bulk
- Legend updates to match the active color mode
- Switching is smooth (no flicker)

**Acceptance Criteria:**
- Three color modes work: velocity, zone, category
- Each mode shows distinct, meaningful coloring across 3,000 locations
- Color legend is readable over the dark 3D scene
- Mode switching takes <100ms to recolor all instances

---

## Part E: 2D View + Pick Routes

### Task 8: 2D Top-Down Analytical View

**Files:**
- Create: `frontend/components/warehouse-2d/top-down-view.tsx`
- Create: `frontend/components/warehouse-2d/heatmap-overlay.tsx`
- Create: `frontend/components/warehouse-2d/route-overlay.tsx`
- Create: `frontend/components/warehouse-2d/zone-overlay.tsx`
- Create: `frontend/components/layout/view-toggle.tsx`

- [ ] **Step 1: Create view toggle**

Create `frontend/components/layout/view-toggle.tsx`:
- A toggle button/switch: "3D" | "2D" using shadcn/ui `Tabs` or `Switch`
- Updates `viewMode` in SlottingContext
- Positioned in the warehouse page header area

- [ ] **Step 2: Create 2D top-down view**

Create `frontend/components/warehouse-2d/top-down-view.tsx`:
- HTML5 Canvas-based (using `useRef` + `useEffect` for drawing, or SVG for simpler interactivity)
- Renders the warehouse from above:
  - Each aisle as a vertical strip
  - Each rack position as a small colored rectangle
  - Cross-aisles as horizontal strips at top/bottom
  - Depot marker at (0,0)
- Scale: fit the entire warehouse (63m x 40m) into the available viewport
- Use the same color mapping as 3D view (velocity/zone/category) from `color-scales.ts`

- [ ] **Step 3: Create heatmap overlay**

Create `frontend/components/warehouse-2d/heatmap-overlay.tsx`:
- Semi-transparent heatmap layer over the 2D view
- Intensity based on velocity class or pick frequency
- Uses a gradient: transparent (cold) to red (hot)
- Renders on a separate canvas layer stacked via CSS

- [ ] **Step 4: Create zone overlay**

Create `frontend/components/warehouse-2d/zone-overlay.tsx`:
- Draws zone boundaries as dashed rectangles on the 2D view
- Labels each zone ("Forward Pick", "Bulk Storage")
- Toggle-able independently from heatmap

- [ ] **Step 5: Wire into warehouse page**

Update `frontend/app/warehouse/page.tsx`:
- When `viewMode === "3d"`: show `<WarehouseScene />`
- When `viewMode === "2d"`: show `<TopDownView />`
- Animate the transition (fade or slide)
- Both views share the same state (color mode, velocity data)

- [ ] **Step 6: Verify 2D view**

Toggle to 2D view. Verify:
- All 15 aisles render with correct rack positions
- Heatmap overlay shows velocity pattern
- Zone overlay shows forward pick vs bulk boundaries
- Toggling between 3D and 2D preserves color mode and data

**Acceptance Criteria:**
- 2D view renders all 15 aisles with 40 rack positions each
- Heatmap overlay is toggleable and shows meaningful gradients
- Zone boundaries are clearly visible with labels
- View toggle switches between 3D and 2D without losing state
- 2D view is performant (no lag on redraw)

---

### Task 9: Animated Pick Route Visualization (3D + 2D)

This is the "killer visual" from the spec.

**Files:**
- Create: `frontend/components/warehouse-3d/pick-route-line.tsx`
- Create: `frontend/hooks/use-pick-route.ts`
- Modify: `frontend/components/warehouse-2d/route-overlay.tsx` (add route drawing)

- [ ] **Step 1: Create pick route hook**

Create `frontend/hooks/use-pick-route.ts`:
- `usePickRoute()` hook
- Provides: `fetchRoute(skuIds, heuristic)`, `beforeRoute`, `afterRoute`, `isLoading`
- Calls `api.pickRoute()` with a sample order's SKU IDs
- For before/after comparison: calls pick-route twice (once with a "bad" order of locations, once with the optimized order) — or uses two different heuristic results
- Converts waypoint location IDs to 3D world coordinates using `warehouse-geometry.ts`

- [ ] **Step 2: Create 3D animated pick route**

Create `frontend/components/warehouse-3d/pick-route-line.tsx`:
- Renders a pick route as a 3D line/tube in the warehouse scene
- Uses drei's `<Line>` component (or `THREE.TubeGeometry` for thicker routes)
- Route points at y=0.1 (just above floor) connecting waypoint locations
- Animation: a glowing sphere (the "picker") travels along the path using `useFrame`
  - Speed: configurable, default ~5 seconds for full route
  - Trail effect: line behind picker is solid, line ahead is dashed/faded
- Dash animation on the line itself using `dashOffset` animated in `useFrame`
- Colors:
  - Before route: `#ef4444` (red) — the "old" inefficient route
  - After route: `#22c55e` (green) — the optimized route
- Accept an `animate` boolean prop to start/stop the picker animation
- Accept a `visible` boolean prop

- [ ] **Step 3: Add route rendering to 2D view**

Update `frontend/components/warehouse-2d/route-overlay.tsx`:
- Draw the pick route as a polyline on the 2D canvas
- Same color coding as 3D (red before, green after)
- Animated dot traveling along the route (using `requestAnimationFrame`)
- Route drawn on a separate canvas layer above the warehouse but below controls

- [ ] **Step 4: Create sample demo route**

Generate a compelling demo route for the presentation:
- Select ~10 SKU IDs that produce an interesting route (visiting multiple aisles)
- Store as a constant in `frontend/lib/demo-data.ts`
- The "before" route visits aisles in a bad order (zigzag across warehouse)
- The "after" route visits aisles in S-shape order (efficient)
- This ensures the demo always looks good even without running the full optimizer

- [ ] **Step 5: Verify route animation**

Navigate to `/warehouse`, trigger demo route. Verify:
- 3D: route line renders at floor level connecting waypoints
- 3D: picker sphere animates along the path smoothly
- 3D: before route (red) is visually longer than after route (green)
- 2D: route renders on the top-down view with same animation
- Camera can optionally follow the picker (fly-through mode)

**Acceptance Criteria:**
- Pick route renders as a colored line in both 3D and 2D views
- Animated "picker" sphere travels along the route at configurable speed
- Before (red) and after (green) routes can display simultaneously or sequentially
- Route coordinates match actual rack positions in the warehouse
- Animation runs at 60fps
- Demo route demonstrates a clear visual difference (long messy route vs short efficient route)

---

## Part F: Opex Dashboard

### Task 10: Opex Dashboard — KPIs, FTE Calculator, ROI

**Files:**
- Create: `frontend/app/opex/page.tsx`
- Create: `frontend/components/dashboard/kpi-card.tsx`
- Create: `frontend/components/dashboard/kpi-grid.tsx`
- Create: `frontend/components/dashboard/fte-calculator.tsx`
- Create: `frontend/components/dashboard/roi-projection.tsx`
- Create: `frontend/components/dashboard/score-comparison.tsx`
- Create: `frontend/lib/format.ts`

- [ ] **Step 1: Create number formatting utilities**

Create `frontend/lib/format.ts`:
- `formatDistance(meters: number): string` — e.g. "142.5m" or "1.4km"
- `formatPercentage(value: number): string` — e.g. "+82.4%"
- `formatCurrency(euros: number): string` — e.g. "EUR 245,000"
- `formatNumber(n: number, decimals?: number): string` — locale-aware with thousands separator

- [ ] **Step 2: Create KPI card component**

Create `frontend/components/dashboard/kpi-card.tsx`:
- shadcn/ui Card with:
  - Title (small, muted text)
  - Value (large, bold, monospace font)
  - Trend indicator: up/down arrow with green/red coloring
  - Optional subtitle (e.g. "before: 285m")
- Animated number counting up on value change (countUp animation over ~1 second)
- Support for "loading" skeleton state

- [ ] **Step 3: Create KPI grid**

Create `frontend/components/dashboard/kpi-grid.tsx`:
- Grid of 4 KPI cards:
  1. **Distance/Order:** `score_after.avg_distance_per_order` — with before comparison
  2. **Picks/Hour:** calculated from distance_per_pick using walking speed + handling time formula
  3. **Orders/Shift:** calculated from picks/hour and avg_picks_per_order
  4. **Cost/Order:** calculated from hourly labor cost / orders per hour
- All values calculated from `OptimizeResponse` + configurable business params
- Before/after deltas shown as trend

- [ ] **Step 4: Create score comparison chart**

Create `frontend/components/dashboard/score-comparison.tsx`:
- Horizontal bar chart (Recharts `BarChart`) showing before vs after for:
  - Avg distance per order
  - Distance per pick
  - Avg aisles per order
- Two bars per metric: red (before), green (after)
- Animated on load

- [ ] **Step 5: Create FTE impact calculator**

Create `frontend/components/dashboard/fte-calculator.tsx`:
- Interactive calculator with sliders:
  - Orders per day: 2000-5000 (default 3000)
  - Hourly labor cost: EUR 15-40 (default EUR 25)
  - Shift hours: 6-10 (default 8)
  - Annual FTE cost: EUR 30,000-80,000 (default EUR 50,000)
- Calculated outputs:
  - Current FTEs required
  - Optimized FTEs required
  - FTE savings (big number, highlighted)
  - Annual savings in EUR (the money number, extra-large, green)
- Recalculates live as sliders move
- Uses the optimization result's distance/pick improvements

- [ ] **Step 6: Create ROI projection**

Create `frontend/components/dashboard/roi-projection.tsx`:
- Line chart (Recharts `LineChart`) showing cumulative savings over 36 months
- Input: module investment cost (configurable, default EUR 150,000)
- Chart shows:
  - Cumulative cost line (flat after implementation)
  - Cumulative savings line (grows monthly)
  - Break-even point highlighted
- Annotations: "Payback: X months", "3-year ROI: X%"

- [ ] **Step 7: Create opex dashboard page**

Create `frontend/app/opex/page.tsx`:
- Layout: full-width, scrollable
- Sections (top to bottom):
  1. KPI Grid (4 cards, top)
  2. Score Comparison Chart
  3. FTE Impact Calculator
  4. ROI Projection
- Each section in a shadcn/ui Card with header
- If no optimization has been run yet: show "Run optimization first" message with link to `/warehouse`
- Data comes from SlottingContext (the stored optimization result)

- [ ] **Step 8: Verify dashboard**

Run optimization first (via `/warehouse` or API call), then navigate to `/opex`. Verify:
- All 4 KPI cards show values derived from optimization result
- Score comparison chart renders with before/after bars
- FTE calculator sliders work and recalculate live
- ROI chart shows break-even point
- All numbers are formatted correctly (EUR, meters, percentages)

**Acceptance Criteria:**
- 4 KPI cards display: distance/order, picks/hour, orders/shift, cost/order
- All values calculated from real API response data + configurable params
- FTE calculator has 4 sliders that recalculate live
- ROI projection shows 36-month chart with break-even
- Number animations work on value change
- Dashboard is empty-state-safe (shows message when no optimization data exists)
- All currency formatted as EUR with thousands separator

---

## Part G: Optimization Controls + Comparison

### Task 11: Optimization Controls + Before/After Comparison

**Files:**
- Create: `frontend/components/controls/optimize-button.tsx`
- Create: `frontend/components/controls/parameter-panel.tsx`
- Create: `frontend/components/comparison/split-view.tsx`
- Create: `frontend/components/comparison/metrics-diff.tsx`

- [ ] **Step 1: Create optimize button**

Create `frontend/components/controls/optimize-button.tsx`:
- Large prominent button: "Run Optimization"
- States:
  - Idle: blue button with play icon
  - Running: animated progress indicator (pulsing ring or progress bar), disabled
  - Complete: green checkmark, shows improvement percentage briefly, then returns to idle
  - Error: red with error message tooltip
- Calls `useOptimization().runOptimize()` on click
- Positioned in the warehouse page overlay (top bar or floating panel)

- [ ] **Step 2: Create parameter panel**

Create `frontend/components/controls/parameter-panel.tsx`:
- Collapsible panel with optimization parameters:
  - Max iterations: 50-500 (slider, default 100)
  - Number of orders: 500-5000 (slider, default 1000)
  - Seeds: warehouse, SKU, order (number inputs, default 42)
- Maps to `OptimizeRequest` fields
- "Advanced" toggle to show/hide seed fields
- Values passed to `runOptimize()` when optimization button is clicked

- [ ] **Step 3: Create before/after split view**

Create `frontend/components/comparison/split-view.tsx`:
- Side-by-side 3D warehouse views: left = "before", right = "after"
- Both share the same camera angle (synchronized orbit controls)
- Left warehouse: racks colored with pre-optimization velocity (random/poor placement)
- Right warehouse: racks colored with post-optimization velocity (A-class near depot)
- Divider in the middle with labels "Before" / "After"
- This is a presentation mode — activated via a "Compare" button after optimization
- Implementation: two `<Canvas>` elements side by side, sharing the same camera state via a ref

- [ ] **Step 4: Create metrics diff panel**

Create `frontend/components/comparison/metrics-diff.tsx`:
- Compact panel showing key metric changes:
  - Distance/order: `285m -> 142m (-50.2%)`
  - Distance/pick: `18.5m -> 9.2m (-50.3%)`
  - Aisles/order: `8.2 -> 4.1 (-50.0%)`
- Animated number transition (old value counts down to new value)
- Green coloring for improvements, red for degradations
- Overall improvement percentage in large text: "82.4% improvement"
- Positioned below the split view or as an overlay

- [ ] **Step 5: Wire controls into warehouse page**

Update `frontend/app/warehouse/page.tsx`:
- Add optimize button to the top-right overlay
- Add parameter panel as a collapsible sidebar or drawer
- After optimization completes:
  - Racks recolor with velocity data
  - Show "Compare" button that activates split view
  - Show metrics diff panel
  - Trigger demo pick route animation

- [ ] **Step 6: Verify optimization flow**

Full demo flow test:
1. Navigate to `/warehouse` — see neutral gray racks
2. Click "Run Optimization" — see progress state
3. After completion: racks recolor by velocity, improvement % displayed
4. Click "Compare" — split view shows before/after side by side
5. Click "Show Route" — animated pick routes in both panels
6. Navigate to `/opex` — dashboard populated with results

**Acceptance Criteria:**
- Optimize button shows clear state transitions (idle -> running -> complete)
- Parameter panel allows tweaking optimization parameters
- Split view renders two synchronized 3D scenes side by side
- Metrics diff shows animated number transitions
- Full demo flow works end-to-end without manual API calls
- Progress/loading states prevent double-click or stale UI

---

## Part H: Testing + Polish

### Task 12: Playwright E2E Tests

**Files:**
- Create: `frontend/e2e/playwright.config.ts`
- Create: `frontend/e2e/warehouse-view.spec.ts`
- Create: `frontend/e2e/optimization-flow.spec.ts`
- Create: `frontend/e2e/opex-dashboard.spec.ts`

- [ ] **Step 1: Set up Playwright**

```bash
cd frontend
npm init playwright@latest
```

Configure `frontend/e2e/playwright.config.ts`:
- Base URL: `http://localhost:3000`
- Web server command: `npm run dev` (auto-start)
- Browser: chromium only (3D WebGL needs real browser)
- Timeout: 30 seconds (optimization calls can be slow)

- [ ] **Step 2: Write warehouse view tests**

Create `frontend/e2e/warehouse-view.spec.ts`:

```typescript
test("warehouse page loads with 3D canvas", async ({ page }) => {
  await page.goto("/warehouse");
  // Canvas element should be present (R3F renders into a canvas)
  await expect(page.locator("canvas")).toBeVisible();
});

test("view toggle switches between 3D and 2D", async ({ page }) => {
  await page.goto("/warehouse");
  // Find and click the 2D toggle
  await page.getByRole("tab", { name: "2D" }).click();
  // 2D canvas or SVG should be visible
  // Switch back to 3D
  await page.getByRole("tab", { name: "3D" }).click();
  await expect(page.locator("canvas")).toBeVisible();
});

test("color mode selector changes legend", async ({ page }) => {
  await page.goto("/warehouse");
  // Change color mode to "zone"
  // Verify legend updates
});
```

- [ ] **Step 3: Write optimization flow tests**

Create `frontend/e2e/optimization-flow.spec.ts`:

```typescript
test("full optimization flow", async ({ page }) => {
  // Requires backend running at localhost:8000
  await page.goto("/warehouse");
  
  // Click optimize button
  await page.getByRole("button", { name: /optimize/i }).click();
  
  // Wait for completion (may take 10-20 seconds)
  await expect(page.getByText(/improvement/i)).toBeVisible({ timeout: 30000 });
  
  // Verify racks are colored (non-gray)
  // Verify metrics are displayed
});

test("optimization shows error when backend is down", async ({ page }) => {
  // Test with backend not running
  await page.goto("/warehouse");
  await page.getByRole("button", { name: /optimize/i }).click();
  await expect(page.getByText(/error/i)).toBeVisible({ timeout: 10000 });
});
```

- [ ] **Step 4: Write opex dashboard tests**

Create `frontend/e2e/opex-dashboard.spec.ts`:

```typescript
test("opex dashboard shows empty state without optimization", async ({ page }) => {
  await page.goto("/opex");
  await expect(page.getByText(/run optimization first/i)).toBeVisible();
});

test("FTE calculator sliders update values", async ({ page }) => {
  // Run optimization first, then navigate to /opex
  // Adjust a slider
  // Verify calculated values change
});
```

- [ ] **Step 5: Run tests**

```bash
cd frontend && npx playwright test
```

Fix any failures. Ensure all tests pass with backend running.

**Acceptance Criteria:**
- Playwright is configured and runs from `frontend/`
- Warehouse view test: verifies canvas renders and view toggle works
- Optimization flow test: runs full optimize and verifies result display (requires backend)
- Opex dashboard test: verifies empty state and slider interaction
- All tests pass in CI-compatible headless mode
- Tests complete within 60 seconds total

---

### Task 13: Polish and Final Verification

- [ ] **Step 1: Visual polish pass**

Review all pages and components for:
- Consistent dark theme (no white flashes, no unstyled elements)
- Typography hierarchy: page titles (text-2xl), section headers (text-lg), body (text-sm)
- Spacing consistency: use Tailwind's spacing scale (p-4, gap-4, etc.)
- All shadcn/ui components properly themed for dark mode
- Loading skeletons for async content (Cards with shimmer animation)
- Smooth transitions on all state changes (opacity, transform)
- No layout shift when data loads

- [ ] **Step 2: Performance audit**

Check:
- 3D scene maintains 60fps with all 3,000 instances (check with Chrome DevTools Performance tab)
- `InstancedMesh` draw calls: should be 1-3, not 3,000 (check with Spector.js or renderer.info)
- No unnecessary re-renders (React DevTools Profiler)
- API calls are not duplicated (check Network tab)
- Bundle size: `next build` and check output — warn if over 500KB first-load JS

- [ ] **Step 3: Responsive sanity check**

Verify at:
- 1920x1080 (primary target — presentation screen)
- 1440x900 (laptop)
- Sidebar collapses or overlays on smaller screens
- 3D canvas resizes correctly on window resize

- [ ] **Step 4: End-to-end demo rehearsal**

Run through the full demo flow as a presentation:
1. Land on dashboard — see warehouse overview
2. Navigate to Warehouse — 3D view loads with neutral racks
3. Click "Run Optimization" — see progress, wait for completion
4. Racks recolor by velocity — red hot spots near depot
5. Toggle to 2D — see heatmap overlay
6. Toggle back to 3D — show pick route animation (before in red, after in green)
7. Click "Compare" — split view with synchronized cameras
8. Navigate to Opex Dashboard — KPIs, FTE calculator, ROI chart
9. Adjust FTE sliders — see savings recalculate
10. Total demo time: ~3-5 minutes

- [ ] **Step 5: Fix any issues found**

Address all issues from the polish pass, performance audit, and demo rehearsal.

**Acceptance Criteria:**
- All pages render with consistent dark theme and professional typography
- 3D scene is 60fps with <=3 draw calls for rack instances
- Full demo flow runs end-to-end without errors or visual glitches
- Bundle size first-load JS is under 500KB (excluding Three.js which lazy-loads)
- No console errors or warnings in production build
- `npm run build` succeeds without errors

---

## Summary

| Task | Description | Key Deliverable |
|------|-------------|----------------|
| 1 | Research notes | 2 vault notes: 3D rendering best practices, opex KPIs |
| 2 | Project scaffolding | Next.js 14 + Tailwind + shadcn + R3F setup |
| 3 | Backend CORS + API client | Working frontend-backend connection |
| 4 | Layout shell | Sidebar, header, dark theme, dashboard page |
| 5 | 3D warehouse scene | 3,000 instanced racks, camera controls, floor/depot |
| 6 | API integration + state | SlottingContext, optimization hook, velocity coloring |
| 7 | Rack coloring + legend | Velocity/zone/category modes, color legend overlay |
| 8 | 2D top-down view | Canvas-based analytical view with heatmap/zones |
| 9 | Animated pick routes | 3D+2D route animation — the killer visual |
| 10 | Opex dashboard | KPIs, FTE calculator, ROI projection |
| 11 | Optimization controls | Run button, params, split-view comparison |
| 12 | Playwright E2E tests | 3 test suites covering critical flows |
| 13 | Polish + verification | Visual, performance, demo rehearsal |

**Total: 13 tasks, ~45 files created, 1 file modified**

**Estimated complexity: HIGH** — this sprint has the most visual complexity and is the client-facing wow factor.

**Dependencies:**
- Tasks 1 (research) can run in parallel with Task 2-3 (setup)
- Tasks 4-7 are sequential (layout -> 3D scene -> state -> coloring)
- Tasks 8-9 depend on Task 5 (3D scene) and Task 6 (state)
- Task 10 depends on Task 6 (state/API)
- Task 11 depends on Tasks 5, 6, 9 (3D + state + routes)
- Task 12 depends on Tasks 4-11 being complete
- Task 13 is always last

**Parallel execution opportunities:**
- Task 1 || Tasks 2+3
- Task 8 || Task 9 || Task 10 (after Task 6 is done)
