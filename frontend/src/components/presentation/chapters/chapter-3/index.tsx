"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";
import { EASE_OUT_EXPO } from "@/lib/motion/primitives";

const Scene = dynamic(
  () => import("./scene").then((m) => ({ default: m.Scene })),
  { ssr: false }
);

type Beat = 1 | 2 | 3 | 4;

export function ChapterThreePlaceholder() {
  const [beat, setBeat] = useState<Beat>(1);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);

  // Beat orchestration
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setBeat(2), 7000));
    timers.push(setTimeout(() => setBeat(3), 15000));
    timers.push(setTimeout(() => setBeat(4), 23000));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Elapsed time for scene
  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      if (startedAt.current === null) startedAt.current = now;
      setElapsed((now - startedAt.current) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      startedAt.current = null;
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Scene beat={beat} elapsed={elapsed} />

      {/* Constant top-left meta label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute top-32 left-12 text-[10px] uppercase tracking-[0.24em] text-[color:var(--color-fg-dim)] pointer-events-none"
        style={{ zIndex: 20 }}
      >
        03 · WMS INTEGRATION
      </motion.div>

      {/* Beat-keyed overlay copy */}
      <AnimatePresence mode="wait">
        {beat === 1 && (
          <motion.div
            key="beat1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ zIndex: 20, padding: "0 clamp(40px, 6vw, 80px)" }}
          >
            <h1
              className="font-semibold text-center leading-[0.92]"
              style={{
                fontSize: "clamp(56px, 8vw, 128px)",
                letterSpacing: "-0.045em",
              }}
            >
              <SplitReveal text="Whatever you" delayBase={0.5} />
              <br />
              <SplitReveal text="run on today." delayBase={0.9} />
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 0.5, y: 0 }}
              transition={{ duration: 1, ease: EASE_OUT_EXPO, delay: 1.6 }}
              className="mt-8 text-center text-[color:var(--color-fg-muted)]"
              style={{
                fontSize: "clamp(14px, 1.2vw, 18px)",
                maxWidth: 640,
                lineHeight: 1.6,
              }}
            >
              SAP, Manhattan, Blue Yonder, K&ouml;rber, Oracle, Infor, in-house &mdash; or nothing at all.
            </motion.p>
          </motion.div>
        )}

        {beat === 2 && (
          <motion.div
            key="beat2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ zIndex: 20, padding: "0 clamp(40px, 6vw, 80px)" }}
          >
            <h2
              className="font-semibold text-center leading-[0.92]"
              style={{
                fontSize: "clamp(56px, 8vw, 128px)",
                letterSpacing: "-0.045em",
                color: "var(--color-accent)",
                textShadow: "0 0 80px rgba(202,218,56,0.6)",
              }}
            >
              <SplitReveal text="Standalone." delayBase={0.15} accent />
            </h2>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 0.55, y: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.7 }}
              className="mt-8 text-center text-[color:var(--color-fg-muted)]"
              style={{
                fontSize: "clamp(14px, 1.2vw, 18px)",
                maxWidth: 560,
                lineHeight: 1.6,
              }}
            >
              The tool runs on its own. Ingest. Optimize. Propose.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 1.0 }}
              className="mt-6"
            >
              <PillBadge label="NO WMS REQUIRED" />
            </motion.div>
          </motion.div>
        )}

        {beat === 3 && (
          <motion.div
            key="beat3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ zIndex: 20, padding: "0 clamp(40px, 6vw, 80px)" }}
          >
            <h2
              className="font-semibold text-center leading-[0.92]"
              style={{
                fontSize: "clamp(56px, 8vw, 128px)",
                letterSpacing: "-0.045em",
              }}
            >
              <SplitReveal text="Or on top" delayBase={0.15} />
              <br />
              <SplitReveal text="of yours." delayBase={0.5} />
            </h2>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 0.55, y: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: 0.8 }}
              className="mt-8 text-center text-[color:var(--color-fg-muted)]"
              style={{
                fontSize: "clamp(14px, 1.2vw, 18px)",
                maxWidth: 560,
                lineHeight: 1.6,
              }}
            >
              Reads your data. Writes back proposals. Replaces nothing.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 1.1 }}
              className="mt-6"
            >
              <PillBadge label="ANY WMS · EVERY WMS" />
            </motion.div>
          </motion.div>
        )}

        {beat === 4 && (
          <motion.div
            key="beat4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ zIndex: 20, padding: "0 clamp(40px, 6vw, 80px)" }}
          >
            <ClosingLines />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Local helpers ────────────────────────────────────────────────────────────

function SplitReveal({
  text,
  delayBase,
  accent,
}: {
  text: string;
  delayBase: number;
  accent?: boolean;
}) {
  return (
    <span className="inline-block">
      {text.split("").map((ch, i) => (
        <motion.span
          key={`${text}-${i}`}
          initial={{ opacity: 0, y: 60, filter: "blur(14px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 1.0,
            ease: EASE_OUT_EXPO,
            delay: delayBase + i * 0.028,
          }}
          className="inline-block"
          style={
            accent
              ? {
                  color: "var(--color-accent)",
                  textShadow: "0 0 60px rgba(202,218,56,0.6)",
                }
              : undefined
          }
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}

function PillBadge({ label }: { label: string }) {
  return (
    <div
      className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] uppercase tracking-[0.22em] font-medium"
      style={{
        border: "1px solid rgba(202,218,56,0.45)",
        color: "var(--color-accent)",
        background: "rgba(202,218,56,0.08)",
        boxShadow: "0 0 24px rgba(202,218,56,0.15)",
      }}
    >
      {label}
    </div>
  );
}

function ClosingLines() {
  const line1 = "No rip-and-replace.";
  const line2 = "Just OPEX reduction, continuously.";

  return (
    <div className="flex flex-col items-center gap-4">
      <h2
        className="font-semibold text-center leading-[0.92]"
        style={{
          fontSize: "clamp(44px, 6vw, 96px)",
          letterSpacing: "-0.04em",
        }}
      >
        <ChromaticReveal text={line1} delayBase={0.1} />
      </h2>
      <h2
        className="font-semibold text-center leading-[0.92]"
        style={{
          fontSize: "clamp(44px, 6vw, 96px)",
          letterSpacing: "-0.04em",
          color: "var(--color-accent)",
          textShadow: "0 0 80px rgba(202,218,56,0.65)",
        }}
      >
        <ChromaticReveal text={line2} delayBase={0.45} accent />
      </h2>
    </div>
  );
}

function ChromaticReveal({
  text,
  delayBase,
  accent,
}: {
  text: string;
  delayBase: number;
  accent?: boolean;
}) {
  // Simple blur-up with a slight scale, approximates chromatic feel
  return (
    <span className="inline-block relative">
      <motion.span
        initial={{ opacity: 0, y: 40, filter: "blur(18px)", scale: 1.03 }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
        transition={{ duration: 1.1, ease: EASE_OUT_EXPO, delay: delayBase }}
        className="inline-block"
        style={
          accent
            ? {
                color: "var(--color-accent)",
                textShadow: "0 0 80px rgba(202,218,56,0.65)",
              }
            : undefined
        }
      >
        {text}
      </motion.span>
    </span>
  );
}
