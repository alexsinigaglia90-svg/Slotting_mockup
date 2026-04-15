"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { EASE_OUT_EXPO } from "@/lib/motion/primitives";
import { WaveformCanvas, type SpikeEvent } from "./waveform";

type Beat = 1 | 2 | 3 | 4 | 5 | 6;

const SCENARIOS = [
  { tag: "SUPPLIER", line: "A supplier fails overnight." },
  { tag: "SEASONAL", line: "A new collection lands tomorrow." },
  { tag: "PHASE-OUT", line: "A line is phased out." },
  { tag: "EXPANSION", line: "A category doubles." },
] as const;

export function ChapterFourPlaceholder() {
  const [beat, setBeat] = useState<Beat>(1);
  const spikesRef = useRef<SpikeEvent[]>([]);

  const settling = beat === 6;

  // Beat orchestration + spike injection
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const spawnSpike = () => {
      spikesRef.current.push({
        spawnX: 1.0,
        spawnedAt: performance.now(),
        amplitude: 65 + Math.random() * 20,
        speed: 0.22 + Math.random() * 0.06,
        halfLife: 2800,
      });
      // Trim old dead spikes
      const now = performance.now();
      spikesRef.current = spikesRef.current.filter(
        (s) => now - s.spawnedAt < 9000
      );
    };

    timers.push(
      setTimeout(() => {
        setBeat(2);
        spawnSpike();
      }, 5000)
    );
    timers.push(
      setTimeout(() => {
        setBeat(3);
        spawnSpike();
      }, 10000)
    );
    timers.push(
      setTimeout(() => {
        setBeat(4);
        spawnSpike();
      }, 15000)
    );
    timers.push(
      setTimeout(() => {
        setBeat(5);
        spawnSpike();
      }, 20000)
    );
    timers.push(
      setTimeout(() => {
        setBeat(6);
      }, 25000)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#0a0a0f" }}>
      {/* Waveform canvas substrate */}
      <WaveformCanvas spikesRef={spikesRef} settling={settling} />

      {/* Dark vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(10,10,15,0.7) 100%)",
          zIndex: 2,
        }}
      />

      {/* Constant meta label top-left */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute text-[10px] uppercase tracking-[0.24em] text-[color:var(--color-fg-dim)] pointer-events-none"
        style={{ top: "clamp(80px, 8vh, 128px)", left: "clamp(32px, 4vw, 48px)", zIndex: 20 }}
      >
        04 · THE SPEED
      </motion.div>

      {/* Beat-keyed center copy */}
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
              style={{ fontSize: "clamp(52px, 7.5vw, 120px)", letterSpacing: "-0.045em" }}
            >
              <SplitReveal text="Reality doesn't" delayBase={0.4} />
              <br />
              <SplitReveal text="wait." delayBase={0.85} />
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 0.5, y: 0 }}
              transition={{ duration: 1, ease: EASE_OUT_EXPO, delay: 1.5 }}
              className="mt-8 text-center text-[color:var(--color-fg-muted)]"
              style={{ fontSize: "clamp(14px, 1.15vw, 18px)", maxWidth: 680, lineHeight: 1.6 }}
            >
              Every supplier, every season, every SKU change bleeds OPEX until your layout catches up.
            </motion.p>
          </motion.div>
        )}

        {(beat === 2 || beat === 3 || beat === 4 || beat === 5) && (
          <ScenarioBeat key={`beat${beat}`} beat={beat} />
        )}

        {beat === 6 && (
          <motion.div
            key="beat6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
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

// ─── Scenario beat ────────────────────────────────────────────────────────────

function ScenarioBeat({ beat }: { beat: Beat }) {
  const idx = (beat as number) - 2; // beats 2-5 → index 0-3
  const scenario = SCENARIOS[idx as 0 | 1 | 2 | 3];

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      style={{ zIndex: 20, padding: "0 clamp(40px, 6vw, 80px)" }}
    >
      {/* Tag */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.15 }}
        className="mb-5 text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-fg-dim)]"
      >
        {scenario.tag}
      </motion.div>

      {/* Main disruption line */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE_OUT_EXPO, delay: 0.2 }}
        className="font-semibold text-center leading-[0.92]"
        style={{
          fontSize: "clamp(44px, 6.5vw, 104px)",
          letterSpacing: "-0.042em",
          color: "var(--color-accent)",
          textShadow: "0 0 80px rgba(202,218,56,0.65)",
        }}
      >
        {scenario.line}
      </motion.h2>

      {/* Sub-label */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 0.55, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.42 }}
        className="mt-5 text-center text-[color:var(--color-fg-muted)]"
        style={{ fontSize: "clamp(12px, 1.05vw, 16px)", letterSpacing: "0.04em" }}
      >
        New proposal · instant
      </motion.p>
    </motion.div>
  );
}

// ─── Closing beat ─────────────────────────────────────────────────────────────

function ClosingLines() {
  return (
    <div className="flex flex-col items-center gap-5">
      <ChromaticReveal
        text="Every change, priced in."
        delayBase={0.1}
        size="clamp(44px, 6.5vw, 100px)"
      />
      <ChromaticReveal
        text="Every layout, optimal now."
        delayBase={0.5}
        size="clamp(44px, 6.5vw, 100px)"
        accent
      />
    </div>
  );
}

function ChromaticReveal({
  text,
  delayBase,
  size,
  accent,
}: {
  text: string;
  delayBase: number;
  size: string;
  accent?: boolean;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 40, filter: "blur(18px)", scale: 1.03 }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
      transition={{ duration: 1.1, ease: EASE_OUT_EXPO, delay: delayBase }}
      className="inline-block font-semibold text-center leading-[0.92]"
      style={
        accent
          ? {
              fontSize: size,
              letterSpacing: "-0.04em",
              color: "var(--color-accent)",
              textShadow: "0 0 90px rgba(202,218,56,0.75), 0 0 30px rgba(202,218,56,0.5)",
            }
          : {
              fontSize: size,
              letterSpacing: "-0.04em",
            }
      }
    >
      {text}
    </motion.span>
  );
}

// ─── Split letter reveal ──────────────────────────────────────────────────────

function SplitReveal({ text, delayBase }: { text: string; delayBase: number }) {
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
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}
