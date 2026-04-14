"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { buildFixtureGrid, checkRules } from "@/lib/grid";
import { EASE_OUT_EXPO } from "@/lib/motion/primitives";
import { DigitRoll } from "./digit-roll";

// Dynamic import to avoid SSR issues with three.js
const WarehouseScene = dynamic(
  () => import("./scene").then((m) => ({ default: m.WarehouseScene })),
  { ssr: false }
);

type Phase = "compliance" | "ergonomics" | "continuity" | "summary";

const PHASE_ORDER: Phase[] = ["compliance", "ergonomics", "continuity", "summary"];
const PHASE_DURATIONS: Record<Phase, number> = {
  compliance: 12000,
  ergonomics: 12000,
  continuity: 12000,
  summary: 6000,
};

const PHASE_LABELS: Record<Phase, string> = {
  compliance: "COMPLIANCE",
  ergonomics: "ERGONOMICS",
  continuity: "CONTINUITY",
  summary: "OPEX-RELEVANT VIOLATIONS",
};

const PHASE_TAGLINES: Record<Phase, string> = {
  compliance: "Every violation is a future fine.",
  ergonomics: "Every claim is a forecast you didn't make.",
  continuity: "One bottleneck. One lost quarter.",
  summary: "Nothing of this is on your balance sheet. Yet.",
};

const PHASE_ACCENT: Record<Phase, string> = {
  compliance: "rgba(202,218,56,0.6)",
  ergonomics: "rgba(255,77,77,0.6)",
  continuity: "rgba(56,202,255,0.6)",
  summary: "rgba(202,218,56,0.6)",
};

const PHASE_COLOR: Record<Phase, string> = {
  compliance: "var(--color-accent)",
  ergonomics: "#ff4d4d",
  continuity: "#38caff",
  summary: "var(--color-accent)",
};

// Chromatic aberration text reveal
function ChromaticText({
  text,
  phase,
  fontSize,
  className,
}: {
  text: string;
  phase: Phase;
  fontSize?: string;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${phase}-${text}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={className}
        style={{ position: "relative", display: "inline-block", fontSize }}
      >
        {/* Red channel — offset left */}
        <motion.span
          initial={{ x: -8, opacity: 0 }}
          animate={{ x: 0, opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          style={{
            position: "absolute",
            inset: 0,
            color: "rgba(255,60,60,0.6)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
          aria-hidden
        >
          {text}
        </motion.span>
        {/* Blue channel — offset right */}
        <motion.span
          initial={{ x: 8, opacity: 0 }}
          animate={{ x: 0, opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          style={{
            position: "absolute",
            inset: 0,
            color: "rgba(60,120,255,0.6)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
          aria-hidden
        >
          {text}
        </motion.span>
        {/* Main text */}
        <motion.span
          initial={{ opacity: 0, filter: "blur(6px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.1 }}
          style={{ position: "relative" }}
        >
          {text}
        </motion.span>
      </motion.div>
    </AnimatePresence>
  );
}

// Summary word-by-word reveal
function WordReveal({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.08, delayChildren: 0.1 },
        },
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.4, ease: EASE_OUT_EXPO },
            },
          }}
          style={{ display: "inline-block", marginRight: "0.25em" }}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}

export function ChapterTwoPlaceholder() {
  const { violations, slotCount, slots } = useMemo(() => {
    const grid = buildFixtureGrid();
    const v = checkRules(grid);
    return { violations: v, slotCount: grid.slots.length, slots: grid.slots };
  }, []);

  const counts = useMemo(
    () => ({
      compliance: violations.compliance.length,
      ergonomics: violations.ergonomie.length,
      continuity: violations.continuiteit.length,
    }),
    [violations]
  );
  const total = counts.compliance + counts.ergonomics + counts.continuity;

  const [phase, setPhase] = useState<Phase>("compliance");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Clear any existing timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    let elapsed = 0;
    for (const p of PHASE_ORDER) {
      const delay = elapsed;
      const t = setTimeout(() => setPhase(p), delay);
      timersRef.current.push(t);
      elapsed += PHASE_DURATIONS[p];
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  // Active slot sets per phase
  const complianceSet = useMemo(
    () => new Set(violations.compliance.map((v) => v.slot_id)),
    [violations]
  );
  const ergonomicsSet = useMemo(
    () => new Set(violations.ergonomie.map((v) => v.slot_id)),
    [violations]
  );
  const continuitySet = useMemo(() => {
    // Continuity violations have zone names as slot_ids
    const zoneNames = new Set(violations.continuiteit.map((v) => v.slot_id));
    return new Set(
      slots
        .filter((s) => zoneNames.has(s.position.zone))
        .map((s) => s.id)
    );
  }, [violations, slots]);
  const summarySet = useMemo(
    () => new Set([...complianceSet, ...ergonomicsSet, ...continuitySet]),
    [complianceSet, ergonomicsSet, continuitySet]
  );

  const activeSet = useMemo(() => {
    if (phase === "compliance") return complianceSet;
    if (phase === "ergonomics") return ergonomicsSet;
    if (phase === "continuity") return continuitySet;
    return summarySet;
  }, [phase, complianceSet, ergonomicsSet, continuitySet, summarySet]);

  const displayCount = useMemo(() => {
    if (phase === "compliance") return counts.compliance;
    if (phase === "ergonomics") return counts.ergonomics;
    if (phase === "continuity") return continuitySet.size;
    return total;
  }, [phase, counts, continuitySet, total]);

  const accentGlow = PHASE_ACCENT[phase];
  const accentColor = PHASE_COLOR[phase];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 3D Scene — full bleed background */}
      <div className="absolute inset-0" aria-hidden>
        <WarehouseScene
          phase={phase}
          slots={slots}
          activeSet={activeSet}
          summarySet={summarySet}
        />
      </div>

      {/* Vignette overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 20%, rgba(5,6,8,0.65) 100%)",
        }}
      />

      {/* Scanline sweep — compliance phase */}
      <AnimatePresence>
        {phase === "compliance" && (
          <motion.div
            key="scanline"
            initial={{ top: "0%" }}
            animate={{ top: "100%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: EASE_OUT_EXPO }}
            className="pointer-events-none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: "2px",
              background: "var(--color-accent)",
              boxShadow: "0 0 30px var(--color-accent), 0 0 60px rgba(202,218,56,0.4)",
              zIndex: 10,
            }}
          />
        )}
      </AnimatePresence>

      {/* Radar sweep — continuity phase */}
      <AnimatePresence>
        {phase === "continuity" && (
          <motion.div
            key="radar"
            initial={{ width: 0, height: 0, opacity: 0.6 }}
            animate={{ width: "200vmax", height: "200vmax", opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4, ease: EASE_OUT_EXPO }}
            className="pointer-events-none"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              border: "1px solid #38caff",
              boxShadow: "inset 0 0 60px rgba(56,202,255,0.3)",
              zIndex: 10,
            }}
          />
        )}
      </AnimatePresence>

      {/* Summary ambient pulse */}
      <AnimatePresence>
        {phase === "summary" && (
          <motion.div
            key="summary-pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.05, 0.18, 0.05] }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(202,218,56,0.15) 0%, transparent 70%)",
              zIndex: 5,
            }}
          />
        )}
      </AnimatePresence>

      {/* DOM Overlay — centered count + label + tagline */}
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        style={{ zIndex: 20 }}
      >
        {/* Phase label with chromatic aberration */}
        <div style={{ marginBottom: "0.5rem" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
              style={{
                fontSize: "11px",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: accentColor,
                fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
              }}
            >
              <ChromaticText text={PHASE_LABELS[phase]} phase={phase} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Digit-roll count */}
        <div
          style={{
            fontSize: "clamp(120px, 16vw, 240px)",
            fontWeight: 600,
            lineHeight: 0.9,
            letterSpacing: "-0.05em",
            color: accentColor,
            textShadow: `0 0 80px ${accentGlow}`,
            fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
            marginBottom: "1.5rem",
          }}
        >
          <DigitRoll value={displayCount} />
        </div>

        {/* Tagline — chromatic reveal */}
        {phase !== "summary" && (
          <AnimatePresence mode="wait">
            <div key={`tagline-${phase}`}>
              <ChromaticText
                text={PHASE_TAGLINES[phase]}
                phase={phase}
                fontSize="clamp(14px, 1.4vw, 20px)"
                className="text-center"
              />
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Summary multi-line word-by-word reveal — bottom of screen */}
      <AnimatePresence>
        {phase === "summary" && (
          <motion.div
            key="summary-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.5 }}
            className="pointer-events-none absolute"
            style={{
              bottom: "clamp(100px, 12vh, 160px)",
              left: 0,
              right: 0,
              zIndex: 20,
              textAlign: "center",
              padding: "0 clamp(40px, 6vw, 120px)",
              color: "rgba(255,255,255,0.8)",
              fontSize: "clamp(15px, 1.3vw, 20px)",
              lineHeight: 1.7,
            }}
          >
            <div style={{ marginBottom: "0.4em" }}>
              <WordReveal text={`${total} active OPEX-relevant violations.`} />
            </div>
            <div style={{ marginBottom: "0.4em" }}>
              <WordReveal text="Compliance · Ergonomics · Continuity." />
            </div>
            <div>
              <WordReveal text="Nothing of this is on your balance sheet. Yet." />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top-right meta strip */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO, delay: 0.3 }}
        className="pointer-events-none absolute"
        style={{
          top: "clamp(90px, 10vh, 130px)",
          right: "clamp(40px, 5vw, 80px)",
          zIndex: 20,
          textAlign: "right",
          fontSize: "10px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--color-fg-dim)",
        }}
      >
        Demo fixture · {slotCount.toLocaleString("en-US")} slots
      </motion.div>

      {/* Chapter label */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO, delay: 0.2 }}
        className="pointer-events-none absolute"
        style={{
          top: "clamp(90px, 10vh, 130px)",
          left: "clamp(40px, 5vw, 80px)",
          zIndex: 20,
          fontSize: "10px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--color-fg-dim)",
        }}
      >
        02 · The Risk
      </motion.div>
    </div>
  );
}
