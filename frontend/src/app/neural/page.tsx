"use client";

import { useRef, useEffect, useState, useCallback } from "react";

/* ═══ NODE DATA ═══ */
interface GNode {
  id: string;
  label: string;
  type: "sku" | "cluster" | "aisle" | "rule";
  cluster: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  activity: number; // 0-1, pulsing
  picks: number;
}

interface GEdge {
  from: string;
  to: string;
  weight: number; // 0-1
  type: "co-occurrence" | "assignment" | "cluster" | "rule";
  active: boolean;
}

const CLUSTERS = [
  { id: "cl-schoonmaak", label: "Schoonmaak", color: "#34d89e", skus: ["Afwasmiddel", "WC-Reiniger", "Schoonmaakdoekjes", "Allesreiniger", "Waspoeder"] },
  { id: "cl-beauty", label: "Beauty Basics", color: "#e879a8", skus: ["Shampoo", "Douchegel", "Handcrème", "Tandpasta", "Deodorant"] },
  { id: "cl-snacks", label: "Snacks & Snoep", color: "#f0c040", skus: ["Chips Paprika", "Chocoladereep", "Nootjes Mix", "Popcorn", "Koekjes"] },
  { id: "cl-tuin", label: "Tuin & Buiten", color: "#5ba8ff", skus: ["BBQ Houtskool", "Tuinkaars", "Plantenpot", "Gieter", "Zaadjes"] },
  { id: "cl-kantoor", label: "Kantoor", color: "#8b6fff", skus: ["Balpen", "Notitieboek", "Plakband", "Schaar", "Markeerstiften"] },
  { id: "cl-dier", label: "Huisdier", color: "#ff8c5a", skus: ["Hondenvoer", "Kattenvoer", "Kattenbak", "Hondensnoepjes", "Voerbak"] },
  { id: "cl-deco", label: "Decoratie", color: "#c084fc", skus: ["Kaars", "Fotolijst", "Vaas", "Kussen", "Kunstbloem"] },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

function generateGraph(): { nodes: GNode[]; edges: GEdge[] } {
  const r = seededRandom(42);
  const nodes: GNode[] = [];
  const edges: GEdge[] = [];

  // Create cluster center nodes
  CLUSTERS.forEach((cl, ci) => {
    const angle = (ci / CLUSTERS.length) * Math.PI * 2;
    const dist = 220;
    nodes.push({
      id: cl.id, label: cl.label, type: "cluster", cluster: cl.id,
      x: 500 + Math.cos(angle) * dist, y: 400 + Math.sin(angle) * dist,
      vx: 0, vy: 0, radius: 28, color: cl.color, activity: 0, picks: 0,
    });

    // Create SKU nodes around cluster
    cl.skus.forEach((sku, si) => {
      const sa = angle + ((si - 2) / 5) * 0.8;
      const sd = dist + 60 + r() * 40;
      const nodeId = `sku-${cl.id}-${si}`;
      nodes.push({
        id: nodeId, label: sku, type: "sku", cluster: cl.id,
        x: 500 + Math.cos(sa) * sd + (r() - 0.5) * 30,
        y: 400 + Math.sin(sa) * sd + (r() - 0.5) * 30,
        vx: 0, vy: 0, radius: 8 + r() * 6,
        color: cl.color, activity: 0, picks: Math.floor(r() * 80),
      });

      // Edge to cluster
      edges.push({ from: nodeId, to: cl.id, weight: 0.5 + r() * 0.5, type: "cluster", active: false });

      // Co-occurrence edges within cluster
      if (si > 0) {
        edges.push({ from: nodeId, to: `sku-${cl.id}-${si - 1}`, weight: 0.3 + r() * 0.6, type: "co-occurrence", active: false });
      }
    });
  });

  // Cross-cluster co-occurrence edges (sparse)
  for (let i = 0; i < 12; i++) {
    const c1 = Math.floor(r() * CLUSTERS.length);
    const c2 = (c1 + 1 + Math.floor(r() * (CLUSTERS.length - 1))) % CLUSTERS.length;
    const s1 = Math.floor(r() * 5);
    const s2 = Math.floor(r() * 5);
    edges.push({
      from: `sku-${CLUSTERS[c1].id}-${s1}`,
      to: `sku-${CLUSTERS[c2].id}-${s2}`,
      weight: 0.1 + r() * 0.3,
      type: "co-occurrence",
      active: false,
    });
  }

  // Rule nodes
  const rules = [
    { id: "rule-velocity", label: "Velocity ML", x: 500, y: 400 },
    { id: "rule-affinity", label: "Affinity Clustering", x: 460, y: 370 },
    { id: "rule-route", label: "Route Optimizer", x: 540, y: 370 },
  ];
  rules.forEach(ru => {
    nodes.push({
      id: ru.id, label: ru.label, type: "rule", cluster: "",
      x: ru.x + (r() - 0.5) * 40, y: ru.y + (r() - 0.5) * 40,
      vx: 0, vy: 0, radius: 18, color: "#E2D44A", activity: 0.5, picks: 0,
    });
  });

  // Rule connections to clusters
  CLUSTERS.forEach(cl => {
    rules.forEach(ru => {
      edges.push({ from: ru.id, to: cl.id, weight: 0.15, type: "rule", active: false });
    });
  });

  return { nodes, edges };
}

/* ═══ NEURAL GRAPH CANVAS ═══ */
export default function NeuralPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graph] = useState(generateGraph);
  const nodesRef = useRef(graph.nodes);
  const edgesRef = useRef(graph.edges);
  const frameRef = useRef(0);
  const [stats, setStats] = useState({ totalPicks: 0, activeEdges: 0, thinking: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GNode | null>(null);

  // Physics simulation + rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const render = () => {
      tick++;
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const w = W();
      const h = H();

      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = "#0a0b10";
      ctx.fillRect(0, 0, w, h);

      // Subtle radial glow in center
      const grd = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 350);
      grd.addColorStop(0, "rgba(139,111,255,0.06)");
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      // Simulate picks — random node activation
      if (tick % 30 === 0) {
        const skuNodes = nodes.filter(n => n.type === "sku");
        const picked = skuNodes[Math.floor(Math.random() * skuNodes.length)];
        if (picked) {
          picked.activity = 1;
          picked.picks++;
          // Activate connected edges
          edges.forEach(e => {
            if (e.from === picked.id || e.to === picked.id) {
              e.active = true;
              // Activate connected node too
              const otherId = e.from === picked.id ? e.to : e.from;
              const other = nodes.find(n => n.id === otherId);
              if (other) other.activity = Math.max(other.activity, 0.4);
            }
          });
          // Activate rule nodes
          nodes.filter(n => n.type === "rule").forEach(n => { n.activity = Math.min(1, n.activity + 0.3); });
        }
      }

      // Simple force simulation
      for (const n of nodes) {
        // Gravity toward center
        n.vx += (w / 2 - n.x) * 0.0003;
        n.vy += (h / 2 - n.y) * 0.0003;

        // Repulsion between nodes
        for (const m of nodes) {
          if (m === n) continue;
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = n.radius + m.radius + 20;
          if (dist < minDist) {
            const force = (minDist - dist) * 0.02;
            n.vx += (dx / dist) * force;
            n.vy += (dy / dist) * force;
          }
        }

        // Damping
        n.vx *= 0.92;
        n.vy *= 0.92;
        n.x += n.vx;
        n.y += n.vy;

        // Bounds
        n.x = Math.max(n.radius, Math.min(w - n.radius, n.x));
        n.y = Math.max(n.radius, Math.min(h - n.radius, n.y));

        // Decay activity
        n.activity *= 0.96;
      }

      // Edge spring forces
      for (const e of edges) {
        const a = nodes.find(n => n.id === e.from);
        const b = nodes.find(n => n.id === e.to);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = e.type === "cluster" ? 80 : e.type === "rule" ? 150 : 120;
        const force = (dist - targetDist) * 0.001 * e.weight;
        a.vx += (dx / dist) * force;
        a.vy += (dy / dist) * force;
        b.vx -= (dx / dist) * force;
        b.vy -= (dy / dist) * force;

        // Decay edge activity
        if (e.active) e.active = false;
      }

      // Draw edges
      for (const e of edges) {
        const a = nodes.find(n => n.id === e.from);
        const b = nodes.find(n => n.id === e.to);
        if (!a || !b) continue;

        const isActive = a.activity > 0.3 || b.activity > 0.3;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = isActive
          ? `rgba(${e.type === "rule" ? "226,212,74" : "139,111,255"}, ${0.3 + Math.max(a.activity, b.activity) * 0.7})`
          : `rgba(255,255,255, ${0.03 + e.weight * 0.05})`;
        ctx.lineWidth = isActive ? 1.5 + e.weight * 2 : 0.5 + e.weight;
        ctx.stroke();
      }

      // Draw nodes
      for (const n of nodes) {
        // Glow when active
        if (n.activity > 0.1) {
          const glowR = n.radius + 15 * n.activity;
          const glow = ctx.createRadialGradient(n.x, n.y, n.radius, n.x, n.y, glowR);
          glow.addColorStop(0, n.color + "40");
          glow.addColorStop(1, "transparent");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + (n.activity > 0.3 ? 2 : 0), 0, Math.PI * 2);
        const alpha = n.type === "sku" ? 0.6 + n.activity * 0.4 : 0.8;
        ctx.fillStyle = n.color + (Math.round(alpha * 255).toString(16).padStart(2, "0"));
        ctx.fill();

        // Border
        if (n.type === "cluster" || n.type === "rule") {
          ctx.strokeStyle = n.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Label
        if (n.type === "cluster" || n.type === "rule") {
          ctx.fillStyle = "#fff";
          ctx.font = `bold ${n.type === "rule" ? 8 : 9}px Inter, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(n.label, n.x, n.y);
        } else if (n.radius > 10) {
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.font = "6px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(n.label, n.x, n.y + n.radius + 10);
        }
      }

      // Hover detection
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      let found: GNode | null = null;
      for (const n of nodes) {
        const dx = mx - n.x;
        const dy = my - n.y;
        if (dx * dx + dy * dy < (n.radius + 5) * (n.radius + 5)) {
          found = n;
          break;
        }
      }
      setHoveredNode(found);

      // Stats
      if (tick % 60 === 0) {
        setStats({
          totalPicks: nodes.reduce((s, n) => s + n.picks, 0),
          activeEdges: edges.filter(e => {
            const a = nodes.find(n => n.id === e.from);
            const b = nodes.find(n => n.id === e.to);
            return a && b && (a.activity > 0.2 || b.activity > 0.2);
          }).length,
          thinking: Math.round(nodes.filter(n => n.type === "rule").reduce((s, n) => s + n.activity, 0) / 3 * 100),
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, [graph]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  return (
    <div style={{ height: "100vh", background: "#0a0b10", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ height: 54, background: "var(--bg-surface)", borderBottom: "1px solid var(--border-medium)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/warehouse" style={{ fontSize: 12, color: "var(--text-tertiary)", textDecoration: "none" }}>← Warehouse</a>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Neural Network View</span>
          <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(139,111,255,0.12)", color: "var(--accent-purple)", fontWeight: 600 }}>ML + OR Engine</span>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-green)", animation: "pulse 2s ease infinite" }} />
            <span style={{ color: "var(--text-tertiary)" }}>Live</span>
          </div>
          <span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{stats.totalPicks} picks</span>
          <span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{stats.activeEdges} active edges</span>
          <span style={{ color: "var(--accent-cict)", fontFamily: "var(--font-mono)" }}>Thinking: {stats.thinking}%</span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        style={{ flex: 1, cursor: "crosshair", width: "100%", height: "100%" }}
      />

      {/* Hover tooltip */}
      {hoveredNode && (
        <div style={{
          position: "fixed", left: mouseRef.current.x + 20, top: mouseRef.current.y + 60,
          background: "var(--bg-surface)", border: "1px solid var(--border-medium)",
          borderRadius: 12, padding: "12px 16px", minWidth: 200,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100, pointerEvents: "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: hoveredNode.color }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{hoveredNode.label}</span>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginBottom: 6 }}>
            {hoveredNode.type === "cluster" ? "Affinity Cluster" : hoveredNode.type === "rule" ? "ML/OR Engine" : "Product SKU"}
          </div>
          {hoveredNode.type === "sku" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 11 }}>
              <div><span style={{ color: "var(--text-tertiary)" }}>Picks: </span><span style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>{hoveredNode.picks}</span></div>
              <div><span style={{ color: "var(--text-tertiary)" }}>Activiteit: </span><span style={{ fontWeight: 600, color: "var(--accent-green)" }}>{Math.round(hoveredNode.activity * 100)}%</span></div>
              <div><span style={{ color: "var(--text-tertiary)" }}>Cluster: </span><span style={{ fontWeight: 500 }}>{CLUSTERS.find(c => c.id === hoveredNode.cluster)?.label}</span></div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 20, left: 20, background: "var(--bg-surface)",
        border: "1px solid var(--border-medium)", borderRadius: 12, padding: "14px 18px",
        boxShadow: "var(--shadow-lg)", zIndex: 2,
      }}>
        <div style={{ fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontWeight: 600 }}>Neural Graph</div>
        {[
          { color: "var(--accent-purple)", label: "Co-occurrence edges" },
          { color: "var(--accent-cict)", label: "ML/OR reasoning" },
          { color: "var(--accent-green)", label: "Active pick path" },
        ].map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ width: 16, height: 2, borderRadius: 1, background: l.color }} />
            <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{l.label}</span>
          </div>
        ))}
        <div style={{ marginTop: 8, borderTop: "1px solid var(--border-light)", paddingTop: 8 }}>
          {CLUSTERS.map((cl, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: cl.color }} />
              <span style={{ fontSize: 9, color: "var(--text-tertiary)" }}>{cl.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
