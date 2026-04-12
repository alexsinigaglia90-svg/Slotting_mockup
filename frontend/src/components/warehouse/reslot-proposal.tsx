"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FunnelChart } from "@/components/ui/funnel-chart";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { HoldToCommit } from "./hold-to-commit";

/* ─── Types ─── */
interface ReslotProposalProps {
  suboptimalCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  onTabChange?: (tab: number) => void;
}

/* ─── Data ─── */
const MOVES = [
  { from: "A09-L14-L1", to: "A03-R03-L1", sku: "Afwasmiddel 500ml", reason: "Co-occurrence 87% — cluster hergroeperen", cat: "Schoonmaak", improvement: 48, confidence: 94 },
  { from: "A11-R08-L1", to: "A04-L07-L1", sku: "Chips Paprika 200g", reason: "Snacks-cluster plaatsing — route-score -38%", cat: "Food", improvement: 38, confidence: 91 },
  { from: "A10-L19-L1", to: "A03-R01-L1", sku: "Shampoo Argan 300ml", reason: "Beauty-cluster hergroeperen — -1.3 gangp/order", cat: "Beauty", improvement: 32, confidence: 88 },
  { from: "A02-L04-L1", to: "A12-R11-L1", sku: "Riem Leder Bruin", reason: "Vrijmaken high-freq zone — +15% zone-eff.", cat: "Kleding", improvement: 15, confidence: 85 },
  { from: "A01-R09-L1", to: "A14-L06-L1", sku: "Kunstbloem Roos", reason: "0% co-occurrence — naar low-freq zone", cat: "Decoratie", improvement: 12, confidence: 82 },
];

const BEFORE_AFTER = [
  { label: "Gangpaden/order", before: 3.8, after: 2.4, unit: "", better: "lower" as const },
  { label: "Route-efficiëntie", before: 62, after: 85, unit: "%", better: "higher" as const },
  { label: "Cluster coherentie", before: 41, after: 78, unit: "%", better: "higher" as const },
  { label: "Zone-balans", before: 56, after: 74, unit: "%", better: "higher" as const },
];

/* ─── Gauge (Apple Watch ring) ─── */
function MotionGauge({ value, max, label, color, size = 64 }: { value: number; max: number; label: string; color: string; size?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={5} strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--font-mono)", color }}>{Math.round(pct)}</span>
        </div>
      </div>
      <div style={{ fontSize: 9, color: "var(--color-fg-muted)", fontWeight: 500, textAlign: "center" }}>{label}</div>
    </div>
  );
}

const TABS = ["Impact", "Verplaatsingen", "Bevestig"];

export function ReslotProposal({ suboptimalCount, onConfirm, onCancel, onTabChange }: ReslotProposalProps) {
  const [tab, setTab] = useState(0);

  const changeTab = (t: number) => {
    setTab(t);
    onTabChange?.(t);
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
        width: 440,
        maxHeight: "calc(100vh - 48px)",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        zIndex: 55,
        background: "rgba(10,10,15,0.78)",
        backdropFilter: "blur(28px) saturate(1.4)",
        WebkitBackdropFilter: "blur(28px) saturate(1.4)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 60px 120px -40px rgba(0,0,0,0.85), 0 0 0 1px rgba(202,218,56,0.08)",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="label" style={{ marginBottom: 6, color: "var(--color-accent)", letterSpacing: "0.08em" }}>HERSLOTTING VOORSTEL</div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--color-fg)", lineHeight: 1.15 }}>
              {MOVES.length} verplaatsingen
            </div>
            <div style={{ fontSize: 11, color: "var(--color-fg-muted)", marginTop: 3 }}>
              ML confidence 91% · <AnimatedNumber value={suboptimalCount} /> locaties gedetecteerd
            </div>
          </div>
          <motion.button
            onClick={onCancel}
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{
              width: 28, height: 28, borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--color-fg-muted)",
              cursor: "pointer", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </motion.button>
        </div>

        {/* Hero metric */}
        <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 12, background: "rgba(202,218,56,0.06)", border: "1px solid rgba(202,218,56,0.12)" }}>
          <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, color: "#cada38", fontFamily: "var(--font-mono)", letterSpacing: "-0.04em" }}>
            −18%
          </div>
          <div style={{ fontSize: 12, color: "var(--color-fg-muted)", marginTop: 4 }}>verwachte looptijdreductie per order</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", flexShrink: 0, position: "relative" }}>
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => changeTab(i)}
            style={{
              flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
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
                layoutId="reslot-tab-indicator"
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
      <div style={{ flex: 1, overflow: "auto" }}>
        <AnimatePresence mode="wait">
          {tab === 0 && (
            <motion.div
              key="tab0"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ padding: "16px 20px" }}
            >
              {/* Gauges */}
              <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 20 }}>
                <MotionGauge value={23} max={100} label="Route ↑" color="#34d89e" size={60} />
                <MotionGauge value={91} max={100} label="ML Conf." color="#8b6fff" size={60} />
                <MotionGauge value={37} max={100} label="Impact" color="#cada38" size={60} />
              </div>

              {/* Before/After */}
              <div className="label" style={{ marginBottom: 10 }}>Before / After Vergelijking</div>
              {BEFORE_AFTER.map((ba, i) => {
                const beforePct = ba.better === "lower" ? (ba.before / 5) * 100 : ba.before;
                const afterPct = ba.better === "lower" ? (ba.after / 5) * 100 : ba.after;
                const improved = ba.better === "lower" ? ba.after < ba.before : ba.after > ba.before;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={{ marginBottom: 12 }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "var(--color-fg-muted)" }}>{ba.label}</span>
                      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600, color: improved ? "#34d89e" : "#ff5c7c" }}>
                        {ba.before}{ba.unit} → <span style={{ color: improved ? "#cada38" : "#ff5c7c" }}>{ba.after}{ba.unit}</span>
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 4, height: 6 }}>
                      <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${beforePct}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                          style={{ height: "100%", borderRadius: 3, background: "#ff5c7c", opacity: 0.6 }}
                        />
                      </div>
                      <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${afterPct}%` }}
                          transition={{ duration: 0.8, delay: 0.4 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                          style={{ height: "100%", borderRadius: 3, background: "#34d89e" }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "var(--color-fg-muted)", marginTop: 2 }}>
                      <span>Huidig</span><span>Na herslotting</span>
                    </div>
                  </motion.div>
                );
              })}

              {/* Funnel */}
              <div className="label" style={{ marginBottom: 10, marginTop: 16 }}>Optimalisatie Flow</div>
              <FunnelChart
                data={[
                  { label: "Gedetecteerd", value: suboptimalCount, gradient: [{ offset: "0%", color: "#ff5c7c" }, { offset: "100%", color: "#ffb340" }] },
                  { label: "Geanalyseerd", value: Math.round(suboptimalCount * 0.85), gradient: [{ offset: "0%", color: "#ffb340" }, { offset: "100%", color: "#cada38" }] },
                  { label: "Voorgesteld", value: MOVES.length, gradient: [{ offset: "0%", color: "#cada38" }, { offset: "100%", color: "#8b6fff" }] },
                  { label: "Bevestigd", value: 0, displayValue: "—", gradient: [{ offset: "0%", color: "#8b6fff" }, { offset: "100%", color: "#34d89e" }] },
                ]}
                layers={3}
                showPercentage={false}
                style={{ aspectRatio: "3/1" }}
              />
            </motion.div>
          )}

          {tab === 1 && (
            <motion.div
              key="tab1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ padding: "16px 20px" }}
            >
              {MOVES.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    borderRadius: 10,
                    padding: "12px 14px",
                    marginBottom: 8,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderLeft: `3px solid ${m.confidence > 90 ? "#34d89e" : m.confidence > 85 ? "#cada38" : "#ffb340"}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-fg)" }}>{m.sku}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: "rgba(255,255,255,0.06)", color: "var(--color-fg-muted)" }}>{m.cat}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "rgba(139,111,255,0.15)", color: "#8b6fff" }}>{m.confidence}%</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <div style={{ flex: 1, padding: "5px 8px", borderRadius: 6, background: "rgba(255,92,124,0.06)", border: "1px solid rgba(255,92,124,0.12)" }}>
                      <div style={{ fontSize: 8, color: "#ff5c7c", fontWeight: 700, marginBottom: 1 }}>VAN</div>
                      <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 600 }}>{m.from}</div>
                    </div>
                    <span style={{ fontSize: 14, color: "#34d89e" }}>→</span>
                    <div style={{ flex: 1, padding: "5px 8px", borderRadius: 6, background: "rgba(52,216,158,0.06)", border: "1px solid rgba(52,216,158,0.12)" }}>
                      <div style={{ fontSize: 8, color: "#34d89e", fontWeight: 700, marginBottom: 1 }}>NAAR</div>
                      <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 600 }}>{m.to}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${m.improvement}%` }}
                        transition={{ duration: 0.7, delay: 0.2 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        style={{ height: "100%", borderRadius: 2, background: "#34d89e" }}
                      />
                    </div>
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#34d89e", minWidth: 30 }}>+{m.improvement}%</span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--color-fg-muted)", marginTop: 4 }}>{m.reason}</div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {tab === 2 && (
            <motion.div
              key="tab2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ padding: "24px 20px", textAlign: "center" }}
            >
              <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.03em" }}>
                <AnimatedNumber value={MOVES.length} /> verplaatsingen
              </div>
              <div style={{ fontSize: 13, color: "var(--color-fg-muted)", marginBottom: 4 }}>Route-efficiëntie: 62% → 85%</div>
              <div style={{ fontSize: 13, color: "#34d89e", fontWeight: 600, marginBottom: 20 }}>ML Confidence: 91%</div>

              <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
                {[{ l: "Gangp/order", v: "-1.4" }, { l: "Route eff.", v: "+23%" }, { l: "Clusters", v: "3 hersteld" }].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
                    style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 8px" }}
                  >
                    <div style={{ fontSize: 9, color: "var(--color-fg-muted)", marginBottom: 3 }}>{s.l}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "var(--font-mono)", color: "#34d89e" }}>{s.v}</div>
                  </motion.div>
                ))}
              </div>

              <HoldToCommit onConfirm={onConfirm} label="Houd ingedrukt om te bevestigen" size={100} />
              <div style={{ fontSize: 10, color: "var(--color-fg-muted)", marginTop: 12 }}>Instructies worden direct naar het WMS verzonden</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
