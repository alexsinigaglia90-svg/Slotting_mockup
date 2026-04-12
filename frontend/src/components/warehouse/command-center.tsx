"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface CommandCenterProps {
  picks: number;
  suboptimalCount: number;
  newSkuReady: boolean;
  onOpenReslot: () => void;
  onOpenNewSku: () => void;
}

interface Alert {
  type: "reslot" | "newsku";
  msg: string;
  color: string;
}

export function CommandCenter({ picks, suboptimalCount, newSkuReady, onOpenReslot, onOpenNewSku }: CommandCenterProps) {
  const [pos, setPos] = useState({ x: 280, y: 80 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const onDown = (e: React.PointerEvent) => {
    setDragging(true);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
  };
  const onUp = () => setDragging(false);

  const alerts: Alert[] = [];
  if (suboptimalCount > 0) alerts.push({ type: "reslot", msg: `${suboptimalCount} locaties suboptimaal`, color: "#ff5c7c" });
  if (newSkuReady) alerts.push({ type: "newsku", msg: "12 nieuwe SKUs wachten", color: "#cada38" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 16, scale: 0.97, filter: "blur(10px)" }}
      transition={{ duration: 0.56, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 60 }}
    >
      <div
        style={{
          width: 280,
          borderRadius: 16,
          overflow: "hidden",
          userSelect: "none",
          background: "rgba(10,10,15,0.78)",
          backdropFilter: "blur(28px) saturate(1.4)",
          WebkitBackdropFilter: "blur(28px) saturate(1.4)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 60px 120px -40px rgba(0,0,0,0.85), 0 0 0 1px rgba(202,218,56,0.08)",
        }}
      >
        {/* Drag handle */}
        <div
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          style={{
            padding: "10px 14px",
            cursor: dragging ? "grabbing" : "grab",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid var(--color-border)",
            background: "rgba(255,255,255,0.025)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Grip dots */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[0, 1].map(row => (
                <div key={row} style={{ display: "flex", gap: 2 }}>
                  {[0, 1, 2].map(col => (
                    <div key={col} style={{ width: 3, height: 3, borderRadius: 1, background: "rgba(255,255,255,0.25)" }} />
                  ))}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-fg-muted)", letterSpacing: "0.06em" }}>COMMAND CENTER</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d89e", animation: "pulse 2s ease infinite" }} />
            <span style={{ fontSize: 9, color: "#34d89e", fontWeight: 600 }}>LIVE</span>
          </div>
        </div>

        {/* Live stats */}
        <div style={{ padding: "12px 14px", display: "flex", gap: 8 }}>
          {[
            { label: "LIVE PICKS", value: picks, color: "#34d89e", isNumber: true },
            { label: "ALERTS", value: alerts.length, color: alerts.length > 0 ? "#ff5c7c" : "rgba(255,255,255,0.3)", isNumber: true },
            { label: "STATUS", value: null, color: "#34d89e", isNumber: false },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 10,
                padding: "8px 8px", textAlign: "center",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div style={{ fontSize: 8, color: "var(--color-fg-muted)", marginBottom: 3, letterSpacing: "0.05em" }}>{stat.label}</div>
              {stat.isNumber ? (
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", color: stat.color, lineHeight: 1 }}>
                  <AnimatedNumber value={stat.value as number} duration={0.8} />
                </div>
              ) : (
                <div style={{ fontSize: 11, fontWeight: 600, color: stat.color, marginTop: 3 }}>Online</div>
              )}
            </div>
          ))}
        </div>

        {/* Alert feed */}
        <div style={{ padding: "0 14px 12px" }}>
          <AnimatePresence>
            {alerts.length === 0 ? (
              <motion.div
                key="no-alerts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  padding: "8px 10px", borderRadius: 8,
                  background: "rgba(52,216,158,0.04)",
                  border: "1px solid rgba(52,216,158,0.1)",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: 10, color: "rgba(52,216,158,0.7)" }}>Geen actieve alerts</span>
              </motion.div>
            ) : (
              alerts.map((a, i) => (
                <motion.button
                  key={a.type}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ delay: i * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onClick={a.type === "reslot" ? onOpenReslot : onOpenNewSku}
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 11px", marginBottom: 6,
                    borderRadius: 8,
                    border: `1px solid ${a.color}22`,
                    background: `${a.color}08`,
                    cursor: "pointer",
                    fontSize: 11, fontWeight: 500, color: "var(--color-fg-muted)",
                    fontFamily: "var(--font-sans)",
                    position: "relative", overflow: "hidden",
                    textAlign: "left",
                  }}
                >
                  {/* Left color strip */}
                  <div style={{ width: 3, height: "calc(100% - 12px)", borderRadius: 2, background: a.color, flexShrink: 0, position: "absolute", left: 6, top: 6 }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.color, animation: "pulse 2s ease infinite", flexShrink: 0, marginLeft: 10 }} />
                  <span style={{ flex: 1 }}>{a.msg}</span>
                  <span style={{ fontSize: 11, color: a.color, fontWeight: 700 }}>→</span>
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
