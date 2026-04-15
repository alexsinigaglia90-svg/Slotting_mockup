"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";
import { buildFixtureGrid, computeMetersPerShift } from "@/lib/grid";
import { EASE_OUT_EXPO } from "@/lib/motion/primitives";

const Scene = dynamic(
  () => import("./scene").then((m) => ({ default: m.Scene })),
  { ssr: false }
);

type Beat = 1 | 2 | 3 | 4;

export function ChapterTwoPlaceholder() {
  const { meters } = useMemo(() => {
    const grid = buildFixtureGrid();
    return { meters: computeMetersPerShift(grid) };
  }, []);

  const [beat, setBeat] = useState<Beat>(1);
  const [sweepProgress, setSweepProgress] = useState(0);
  const [costAccumulated, setCostAccumulated] = useState(0);

  // Orchestrate beats
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setBeat(2), 6000));
    timers.push(setTimeout(() => setBeat(3), 20000));
    timers.push(setTimeout(() => setBeat(4), 30000));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Sweep progress (RAF-driven, starts at t=6s, duration 14s)
  useEffect(() => {
    let raf = 0;
    let startedAt: number | null = null;
    const duration = 14000;
    const startDelay = 6000;

    const tick = (now: number) => {
      if (startedAt === null) startedAt = now;
      const elapsed = now - startedAt;
      if (elapsed < startDelay) {
        setSweepProgress(0);
      } else if (elapsed >= startDelay + duration) {
        setSweepProgress(1);
        return;
      } else {
        const t = (elapsed - startDelay) / duration;
        setSweepProgress(Math.min(1, Math.max(0, t)));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Cost counter (starts at t=20s)
  useEffect(() => {
    let raf = 0;
    let startedAt: number | null = null;
    const eurPerSecond = (meters.meters_per_shift * 0.05) / 28800;
    const startDelay = 20000;

    const tick = (now: number) => {
      if (startedAt === null) startedAt = now;
      const elapsed = now - startedAt;
      if (elapsed >= startDelay) {
        const seconds = (elapsed - startDelay) / 1000;
        setCostAccumulated(seconds * eurPerSecond);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [meters]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Scene sweepProgress={sweepProgress} beat={beat} />

      {/* Top-left chapter label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute top-32 left-12 text-[10px] uppercase tracking-[0.24em] text-[color:var(--color-fg-dim)] pointer-events-none"
        style={{ zIndex: 20 }}
      >
        02 · The Risk
      </motion.div>

      {/* Top-right label — cross-fades between beat 1 and beat 3 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={beat >= 3 ? "beat3-label" : "beat1-label"}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.4 }}
          className="absolute top-32 right-12 text-[10px] uppercase tracking-[0.24em] text-[color:var(--color-fg-dim)] pointer-events-none"
          style={{ zIndex: 20 }}
        >
          {beat >= 3 ? "Optimized · never again since" : "Optimized · 3 months ago"}
        </motion.div>
      </AnimatePresence>

      {/* Beat 1: opening copy */}
      <AnimatePresence mode="wait">
        {beat === 1 && (
          <motion.div
            key="beat1-copy"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 1.8 }}
            className="absolute top-[22%] left-0 right-0 flex flex-col items-center pointer-events-none"
            style={{ zIndex: 20 }}
          >
            <h1
              className="font-semibold text-center"
              style={{
                fontSize: "clamp(44px, 6vw, 88px)",
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
              }}
            >
              The moment your layout is set,
              <br />
              it starts aging.
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beat 2: sweep word beats */}
      {beat === 2 && <SweepWord startAt={7500} text="Demand shifts." />}
      {beat === 2 && <SweepWord startAt={11000} text="Supply changes." />}
      {beat === 2 && <SweepWord startAt={14500} text="Assortments churn." />}

      {/* Beat 3+: cost counter */}
      {beat >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="absolute bottom-[22%] left-0 right-0 flex flex-col items-center pointer-events-none"
          style={{ zIndex: 20 }}
        >
          <div className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--color-fg-dim)] mb-3">
            Cost accumulated while you watched
          </div>
          <div
            className="font-semibold tabular-nums"
            style={{
              fontSize: "clamp(40px, 5vw, 80px)",
              letterSpacing: "-0.035em",
              color: "var(--color-accent)",
              textShadow: "0 0 40px rgba(202,218,56,0.45)",
            }}
          >
            &euro;{costAccumulated.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
        </motion.div>
      )}

      {/* Beat 4: closing line */}
      <AnimatePresence>
        {beat === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
            className="absolute top-[32%] left-0 right-0 flex flex-col items-center pointer-events-none"
            style={{ zIndex: 20 }}
          >
            <h2
              className="font-semibold text-center"
              style={{
                fontSize: "clamp(40px, 5.5vw, 80px)",
                letterSpacing: "-0.035em",
                lineHeight: 1.1,
              }}
            >
              Every day you don&apos;t re-optimize
              <br />
              <span
                className="text-[color:var(--color-accent)]"
                style={{ textShadow: "0 0 60px rgba(202,218,56,0.55)" }}
              >
                is a day of hidden cost.
              </span>
            </h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SweepWord({ startAt, text }: { startAt: number; text: string }) {
  const [visible, setVisible] = useState(false);
  const mountedAt = useRef<number | null>(null);

  useEffect(() => {
    // beat===2 starts at 6000ms from chapter mount
    // startAt is absolute ms from chapter mount
    // We mount this component when beat===2, so offset by 6000ms
    if (mountedAt.current === null) mountedAt.current = Date.now();
    const wait = Math.max(0, startAt - 6000);
    const show = setTimeout(() => setVisible(true), wait);
    const hide = setTimeout(() => setVisible(false), wait + 2500);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [startAt]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, filter: "blur(16px)", scale: 1.02 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          exit={{ opacity: 0, filter: "blur(12px)", scale: 0.98 }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="absolute top-[38%] left-0 right-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 20 }}
        >
          <div
            className="font-semibold"
            style={{
              fontSize: "clamp(56px, 8vw, 140px)",
              letterSpacing: "-0.045em",
              color: "var(--color-accent)",
              textShadow: "0 0 60px rgba(202,218,56,0.5)",
            }}
          >
            {text}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
