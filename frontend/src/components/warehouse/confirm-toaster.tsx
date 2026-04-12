"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";

interface ConfirmToasterProps {
  onDone: () => void;
}

export function ConfirmToaster({ onDone }: ConfirmToasterProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, [onDone]);

  const confetti = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      x: Math.random() * 320 - 10,
      y: -10 - Math.random() * 40,
      rot: Math.random() * 360,
      color: ["#ff5c7c", "#ffb340", "#4da8ff", "#34d89e", "#8b6fff", "#ffbe30"][i % 6],
      size: 4 + Math.random() * 6,
      delay: Math.random() * 0.4,
      dur: 1.2 + Math.random() * 0.8,
    }))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 16, scale: 0.97, filter: "blur(10px)" }}
      transition={{ duration: 0.56, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "fixed", top: 20, right: 20, zIndex: 200 }}
    >
      <div
        style={{
          width: 320,
          padding: "28px 24px",
          borderRadius: 16,
          background: "rgba(10,10,15,0.88)",
          backdropFilter: "blur(28px) saturate(1.4)",
          WebkitBackdropFilter: "blur(28px) saturate(1.4)",
          border: "1px solid rgba(52,216,158,0.25)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 40px 80px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(52,216,158,0.08), 0 0 60px rgba(52,216,158,0.06)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Close button */}
        <motion.button
          onClick={onDone}
          whileHover={{ rotate: 90, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "absolute", top: 10, right: 10,
            width: 24, height: 24, borderRadius: 7,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "var(--color-fg-muted)",
            cursor: "pointer", fontSize: 12,
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5,
          }}
        >
          ×
        </motion.button>

        {/* Confetti */}
        {confetti.current.map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: c.x, top: c.y,
              width: c.size, height: c.size * 0.6, borderRadius: 1,
              background: c.color, opacity: 0.9,
              transform: `rotate(${c.rot}deg)`,
              animation: `confettiFall ${c.dur}s ease-in ${c.delay}s forwards`,
            }}
          />
        ))}

        {/* Content */}
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(52,216,158,0.12)",
              border: "2px solid rgba(52,216,158,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 18px",
              boxShadow: "0 0 30px rgba(52,216,158,0.2)",
            }}
          >
            <span style={{ fontSize: 28, color: "#34d89e" }}>✓</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <div className="label" style={{ marginBottom: 6, color: "#34d89e" }}>BEVESTIGD</div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 6 }}>
              Herslotting uitgevoerd
            </div>
            <div style={{ fontSize: 13, color: "#34d89e", fontWeight: 600, marginBottom: 4 }}>
              5 verplaatsingen verzonden naar WMS
            </div>
            <div style={{ fontSize: 12, color: "var(--color-fg-muted)", marginBottom: 20 }}>
              Route-efficiëntie +23% · Co-occurrence clusters hersteld
            </div>
            <div style={{ fontSize: 11, color: "var(--color-fg-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d89e", animation: "pulse 1s ease infinite", display: "inline-block" }} />
              WMS instructies worden verwerkt
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
