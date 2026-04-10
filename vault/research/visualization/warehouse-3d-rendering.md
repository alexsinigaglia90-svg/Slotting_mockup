---
tags: [research, visualization, threejs, r3f, 3d, sprint-3]
sources:
  - "React Three Fiber documentation — https://docs.pmnd.rs/react-three-fiber"
  - "Three.js InstancedMesh documentation"
  - "@react-three/drei — helper components for R3F"
  - "WebGL best practices for large scenes (MDN)"
sprint: 3
created: 2026-04-10
---

# 3D Warehouse Visualization — Best Practices

## Overview
3D warehouse visualization transforms abstract optimization data into spatial understanding. For Action, it's the difference between "we reduced distance by 82%" (abstract) and visually watching a picker walk a shorter route through familiar-looking aisles (visceral). This is the wow factor.

## Rendering Strategy

### InstancedMesh for Racks
- With 3,000 location boxes, individual meshes would create 3,000 draw calls — killing performance
- InstancedMesh renders all rack locations in 1-3 draw calls
- Set instance color via instanceColor attribute — supports per-location velocity coloring
- Update positions: `setMatrixAt(index, matrix)` for each location's position/scale
- Update colors: `setColorAt(index, color)` for velocity/zone coloring
- Target: 60fps with 3,000 instances is trivially achievable on any modern GPU

### Scene Organization
- Group by aisle for frustum culling benefits
- Floor: PlaneGeometry with subtle grid pattern (#1a1a2e background)
- Rack geometry: BoxGeometry (0.4m wide × 0.3m deep × 0.4m tall per shelf unit) shared across all instances
- Cross-aisles: thin PlaneGeometry strips at z=0 and z=40, slightly lighter color
- Aisle labels: drei Text component floating above each aisle

### Camera Strategy
- **Default:** OrbitControls with isometric-like angle — camera at (45, 35, 45) looking at warehouse center
- **Interaction:** Free rotate/zoom/pan with damping (dampingFactor=0.05) for smooth feel
- **Fly-through:** Animate camera along CatmullRomCurve3 spline following pick route — camera looks ahead along the path
- **Preset views:** "Top-down", "Isometric", "Side view" buttons for quick navigation

### Lighting
- Ambient light (intensity 0.4) — base illumination, no harsh shadows
- Directional light from above-left (position: [-10, 20, 10]) — depth perception
- Dark environment background (#111827) — professional, not pure black
- Emissive materials for highlighted/selected racks — glow without extra lights

### Color Encoding
- **Velocity mode:**
  - A-class (fast movers): red (#ef4444)
  - B-class: amber (#f59e0b)
  - C-class: sky blue (#38bdf8)
  - D-class (slow movers): blue (#3b82f6)
  - Empty: dark gray (#374151, opacity 0.3)
- **Zone mode:**
  - Forward pick: green (#22c55e)
  - Bulk storage: slate (#64748b)
  - Seasonal: purple (#a855f7)
- **Category mode:** 9 distinct colors mapping to Action's product categories

### Pick Route Animation
- Line2 (drei) or TubeGeometry for fat route lines (radius ~0.15m)
- Animate a sphere (picker marker) along the path using useFrame + lerp
- Before route: red/orange (#f97316), dashed
- After route: green (#22c55e), solid
- Dash offset animation for "flowing" effect
- Speed: ~2x real-time for demo impact

### Performance Budget
- Target: 60fps on mid-range laptop GPU (Intel Iris / GTX 1650)
- 3,000 instanced boxes + floor + 2 route lines = well within budget (~0.5ms GPU time)
- Avoid: real-time shadows on all racks, SSAO, bloom (save for hero screenshots only)
- Use drei's `Stats` component during development to monitor

## Implementation Implications
InstancedMesh is the core technique. drei provides OrbitControls, Line, Text, and utility components. Keep geometry simple (boxes), invest in color/material quality for the AAA feel. The "killer visual" is the animated before/after route comparison — this alone will sell the demo.
