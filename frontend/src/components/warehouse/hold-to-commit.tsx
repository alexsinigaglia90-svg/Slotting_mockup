"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface HoldToCommitProps {
  onConfirm: () => void;
  label?: string;
  size?: number;
}

export function HoldToCommit({ onConfirm, label = "Hold to commit", size = 100 }: HoldToCommitProps) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const confirmedRef = useRef(false);

  const radius = (size - 8) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (progress / 100) * circ;

  const startHold = useCallback(() => {
    if (confirmedRef.current) return;
    setHolding(true);
    setProgress(0);
    let p = 0;
    timerRef.current = setInterval(() => {
      p += 100 / 40; // 1200ms / 30ms interval
      setProgress(Math.min(100, p));
      if (p >= 100) {
        if (timerRef.current) clearInterval(timerRef.current);
        confirmedRef.current = true;
        setDone(true);
        setTimeout(onConfirm, 400);
      }
    }, 30);
  }, [onConfirm]);

  const cancelHold = useCallback(() => {
    if (confirmedRef.current) return;
    setHolding(false);
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        userSelect: "none",
      }}
    >
      <div
        style={{ position: "relative", width: size, height: size, cursor: done ? "default" : "pointer" }}
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
      >
        {/* Track ring */}
        <svg
          width={size}
          height={size}
          style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(202,218,56,0.15)"
            strokeWidth={5}
          />
          {/* Progress ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={done ? "#34d89e" : "#cada38"}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: holding ? "stroke-dashoffset 0.03s linear" : "stroke-dashoffset 0.3s ease" }}
          />
        </svg>

        {/* Center content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: holding
              ? `rgba(202,218,56,0.08)`
              : done
              ? `rgba(52,216,158,0.12)`
              : `rgba(202,218,56,0.04)`,
            border: `2px solid ${done ? "rgba(52,216,158,0.4)" : holding ? "rgba(202,218,56,0.5)" : "rgba(202,218,56,0.2)"}`,
            transition: "background 0.2s ease, border-color 0.2s ease",
          }}
        >
          <AnimatePresence mode="wait">
            {done ? (
              <motion.span
                key="done"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ fontSize: 24, color: "#34d89e" }}
              >
                ✓
              </motion.span>
            ) : holding ? (
              <motion.div
                key="progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  fontFamily: "var(--font-mono)",
                  color: "#cada38",
                  lineHeight: 1,
                }}
              >
                {Math.round(progress)}%
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: "center", padding: "0 8px" }}
              >
                <div style={{ fontSize: 18, color: "#cada38", marginBottom: 2 }}>⏎</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done-label"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: 12, fontWeight: 600, color: "#34d89e" }}
          >
            Bevestigd!
          </motion.div>
        ) : (
          <motion.div
            key="hold-label"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: holding ? "#cada38" : "var(--color-fg-muted)",
              transition: "color 0.2s ease",
              textAlign: "center",
            }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
