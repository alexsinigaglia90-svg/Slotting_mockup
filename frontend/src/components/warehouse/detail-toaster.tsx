"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FunnelChart } from "@/components/ui/funnel-chart";

/* ─── Types (mirrors Loc from page.tsx) ─── */
type Velocity = "A" | "B" | "C" | "D" | "empty";

export interface LocSummary {
  id: string;
  velocity: Velocity;
  skuName: string | null;
  skuId: string | null;
  category: string | null;
  picksWeek: number;
  picksMonth: number;
  lastPicked: string | null;
  routeScore: number;
  slottingScore: number;
  coCluster: string;
  coScore: number;
  stock: number;
  maxStock: number;
  aisle: number;
  side: "L" | "R";
  position: number;
  level: number;
}

interface DetailToasterProps {
  loc: LocSummary;
  onClose: () => void;
}

/* ─── Velocity colour map ─── */
const VCOL: Record<Velocity, string> = {
  A: "#34d89e", B: "#f0c040", C: "#5ba8ff", D: "#8090b8", empty: "transparent",
};

/* ─── Seeded RNG (same as page.tsx) ─── */
function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

/* ─── Bar chart component ─── */
function BklitBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 72, padding: "0 2px" }}>
      {data.map((v, i) => {
        const h = Math.max(3, (v / max) * 72);
        const isRecent = i >= data.length - 7;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: h }}
              transition={{ duration: 0.5, delay: i * 0.015, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: "100%", borderRadius: "3px 3px 1px 1px",
                background: isRecent
                  ? `linear-gradient(180deg, ${color}, ${color}88)`
                  : `linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))`,
                opacity: isRecent ? 0.9 : 0.4,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ─── Apple Watch ring gauge ─── */
function MotionGauge({ value, max, label, color, size = 56 }: { value: number; max: number; label: string; color: string; size?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={5} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={5} strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "var(--font-mono)", color }}>{Math.round(pct)}</span>
        </div>
      </div>
      <div style={{ fontSize: 9, color: "var(--color-fg-muted)", fontWeight: 500, textAlign: "center" }}>{label}</div>
    </div>
  );
}

const TABS = ["Overzicht", "Charts", "Analyse"];

export function DetailToaster({ loc, onClose }: DetailToasterProps) {
  const [tab, setTab] = useState(0);

  const r = rng(loc.id.charCodeAt(3) * 100 + loc.position);
  const barData = Array.from({ length: 28 }, () =>
    Math.max(1, Math.round(r() * (loc.velocity === "A" ? 80 : loc.velocity === "B" ? 40 : loc.velocity === "C" ? 15 : 5)))
  );

  const funnelData = [
    { label: "Dagorders", value: 3500 },
    { label: "Dit SKU", value: Math.round(loc.picksWeek * 5.2) },
    { label: "Deze zone", value: Math.round(loc.picksWeek * 3.8) },
    { label: "Locatie", value: loc.picksWeek },
  ];

  const gaugeColor = (score: number, inv?: boolean) => {
    if (inv) return score < 2 ? "#34d89e" : score > 3 ? "#ff5c7c" : "#ffb340";
    return score > 70 ? "#34d89e" : score < 35 ? "#ff5c7c" : "#ffb340";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 16, scale: 0.97, filter: "blur(10px)" }}
      transition={{ duration: 0.56, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 360,
        borderRadius: 16,
        overflow: "hidden",
        zIndex: 50,
        background: "rgba(10,10,15,0.78)",
        backdropFilter: "blur(28px) saturate(1.4)",
        WebkitBackdropFilter: "blur(28px) saturate(1.4)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 60px 120px -40px rgba(0,0,0,0.85), 0 0 0 1px rgba(202,218,56,0.08)",
      }}
    >
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: VCOL[loc.velocity],
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#000",
            boxShadow: `0 0 12px ${VCOL[loc.velocity]}66`,
          }}>
            {loc.velocity}
          </div>
          <div>
            <div className="label" style={{ marginBottom: 2, color: "var(--color-fg-muted)" }}>LOCATIE DETAIL</div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>{loc.id}</div>
            {loc.skuName && (
              <div style={{ fontSize: 10, color: "var(--color-fg-muted)", marginTop: 1 }}>
                {loc.skuName} · {loc.stock}/{loc.maxStock} eenheden
              </div>
            )}
          </div>
        </div>
        <motion.button
          onClick={onClose}
          whileHover={{ rotate: 90, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          style={{
            width: 26, height: 26, borderRadius: 8,
            border: "1px solid var(--color-border)",
            background: "rgba(255,255,255,0.04)",
            color: "var(--color-fg-muted)",
            cursor: "pointer", fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ×
        </motion.button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", position: "relative" }}>
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            style={{
              flex: 1, padding: "9px 0", border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: tab === i ? 600 : 400,
              color: tab === i ? "#cada38" : "var(--color-fg-muted)",
              background: "transparent",
              position: "relative",
              fontFamily: "var(--font-sans)",
              transition: "color 0.15s ease",
            }}
          >
            {t}
            {tab === i && (
              <motion.div
                layoutId="detail-tab-indicator"
                style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: 2, background: "#cada38", borderRadius: "2px 2px 0 0",
                }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ maxHeight: 340, overflow: "auto" }}>
        <AnimatePresence mode="wait">
          {tab === 0 && (
            <motion.div
              key="tab0"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ padding: "14px 16px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 14 }}>
                <MotionGauge value={loc.slottingScore} max={100} label="Slotting" color={gaugeColor(loc.slottingScore)} />
                <MotionGauge value={loc.coScore} max={100} label="Co-occur." color={gaugeColor(loc.coScore)} />
                <MotionGauge value={Math.round((1 - (loc.routeScore - 1) / 4) * 100)} max={100} label="Route" color={gaugeColor(loc.routeScore, true)} />
              </div>

              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {[
                  { l: "Picks/wk", v: String(loc.picksWeek) },
                  { l: "Gangp.", v: loc.routeScore.toFixed(1) },
                  { l: "Cluster", v: loc.coCluster },
                ].map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    style={{
                      flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 8,
                      padding: "7px 8px", textAlign: "center",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div style={{ fontSize: 8, color: "var(--color-fg-muted)", marginBottom: 2 }}>{m.l}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-fg)" }}>{m.v}</div>
                  </motion.div>
                ))}
              </div>

              <div className="label" style={{ marginBottom: 8 }}>Vaak samen gepickt</div>
              {["Afwasmiddel 500ml", "WC-Reiniger", "Schoonmaakdoekjes"].map((n, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none", fontSize: 11 }}>
                  <span style={{ fontWeight: 500, color: "var(--color-fg)" }}>{n}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-fg-muted)" }}>{85 - i * 12}%</span>
                </div>
              ))}
            </motion.div>
          )}

          {tab === 1 && (
            <motion.div
              key="tab1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ padding: "14px 16px" }}
            >
              <div className="label" style={{ marginBottom: 8 }}>Pick frequentie — 4 weken</div>
              <BklitBarChart data={barData} color={VCOL[loc.velocity]} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "var(--color-fg-muted)", marginTop: 4, marginBottom: 18 }}>
                <span>4w geleden</span><span>Nu</span>
              </div>
              <div className="label" style={{ marginBottom: 8 }}>Pick Flow Funnel</div>
              <FunnelChart
                data={funnelData.map((d, i) => ({
                  label: d.label,
                  value: d.value,
                  gradient: [
                    { offset: "0%", color: ["#8b6fff", "#34d89e", "#5ba8ff", "#34d89e"][i] },
                    { offset: "100%", color: ["#34d89e", "#5ba8ff", "#34d89e", "#34d89e"][i] },
                  ],
                }))}
                layers={3}
                showPercentage={true}
                showValues={true}
                showLabels={true}
                edges="curved"
                style={{ aspectRatio: "2.5/1" }}
              />
            </motion.div>
          )}

          {tab === 2 && (
            <motion.div
              key="tab2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ padding: "14px 16px" }}
            >
              <div style={{
                background: loc.slottingScore < 35 ? "rgba(255,92,124,0.06)" : "rgba(52,216,158,0.06)",
                borderRadius: 10, padding: 12, marginBottom: 14,
                border: `1px solid ${loc.slottingScore < 35 ? "rgba(255,92,124,0.14)" : "rgba(52,216,158,0.14)"}`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: loc.slottingScore < 35 ? "#ff5c7c" : "#34d89e" }}>
                  {loc.slottingScore < 35 ? "⚠ Herslotting aanbevolen" : "✓ Optimaal geslot"}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-fg-muted)", lineHeight: 1.5 }}>
                  {loc.slottingScore < 35 && loc.picksWeek > 30
                    ? `${loc.coScore}% co-occurrence met "${loc.coCluster}" maar buiten zone. Hergroepering: ${loc.routeScore.toFixed(1)} → ${(loc.routeScore * 0.6).toFixed(1)} gangp/order.`
                    : loc.slottingScore < 35
                    ? `Lage co-occurrence (${loc.coScore}%). Verplaatsing naar ${loc.coCluster}-cluster aanbevolen.`
                    : `Correct in ${loc.coCluster}-cluster (${loc.coScore}%). Route ${loc.routeScore.toFixed(1)} is optimaal.`}
                </div>
              </div>
              {[
                { l: "Affinity Cluster", v: loc.coCluster },
                { l: "Velocity", v: `${loc.velocity}-class` },
                { l: "Co-occurrence Score", v: `${loc.coScore}%` },
                { l: "Route Impact", v: `${loc.routeScore.toFixed(1)} gangp/order` },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none", fontSize: 11 }}>
                  <span style={{ color: "var(--color-fg-muted)" }}>{f.l}</span>
                  <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--color-fg)" }}>{f.v}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
