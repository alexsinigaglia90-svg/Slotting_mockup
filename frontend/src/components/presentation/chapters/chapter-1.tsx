"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { HeroShader } from "@/components/hero/hero-shader";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { LiveIndicator } from "@/components/ui/live-indicator";
import { buildFixtureGrid, computeMetersPerShift } from "@/lib/grid";
import { EASE_OUT_EXPO } from "@/lib/motion/primitives";

const COST_PER_METER_EUR = 0.05;
const SHIFT_SECONDS = 28800;

const TITLE_LINE_1 = "Every step";
const TITLE_LINE_2 = "is OPEX.";

export function ChapterOnePlaceholder() {
  const { meters, slotCount } = useMemo(() => {
    const grid = buildFixtureGrid();
    const m = computeMetersPerShift(grid);
    return { meters: m, slotCount: grid.slots.length };
  }, []);

  const eurPerSecond = (meters.meters_per_shift * COST_PER_METER_EUR) / SHIFT_SECONDS;

  const [bleed, setBleed] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      if (startedAt.current === null) startedAt.current = now;
      const elapsed = (now - startedAt.current) / 1000;
      setBleed(elapsed * eurPerSecond);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      startedAt.current = null;
    };
  }, [eurPerSecond]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <HeroShader />
      {/* dark vignette overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(10,10,15,0.75) 100%)",
        }}
      />

      <div className="relative h-full w-full flex flex-col">
        {/* Section A — meta strip */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO, delay: 0.2 }}
          className="flex items-center justify-between"
          style={{ padding: "120px clamp(40px, 6vw, 80px) 0" }}
        >
          <div className="flex items-center gap-4">
            <LiveIndicator label="Live opex bleed" />
            <span className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--color-fg-dim)]">
              01 · The Problem
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--color-fg-dim)]">
            Demo fixture · {slotCount.toLocaleString("en-US")} slots
          </span>
        </motion.div>

        {/* Section B + C + D — center vertical group */}
        <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: "0 clamp(40px, 6vw, 80px)" }}>
          {/* Section B — hero title */}
          <h1
            className="font-semibold leading-[0.92] text-center"
            style={{
              fontSize: "clamp(64px, 9vw, 140px)",
              letterSpacing: "-0.045em",
            }}
          >
            <SplitReveal text={TITLE_LINE_1} accentWord="step" delayBase={0.4} />
            <br />
            <SplitReveal text={TITLE_LINE_2} accentWord="OPEX." delayBase={0.9} />
          </h1>

          {/* Section C — subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE_OUT_EXPO, delay: 1.5 }}
            className="mt-10 max-w-[640px] text-center text-[color:var(--color-fg-muted)]"
            style={{ fontSize: "clamp(16px, 1.4vw, 20px)", lineHeight: 1.55, opacity: 0.7 }}
          >
            Built to scale across hundreds of thousands of SKUs. Live, continuous,
            machine-learning-driven layout optimization.
          </motion.p>

          {/* Section D — OPEX bleed counter */}
          <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.4, ease: EASE_OUT_EXPO, delay: 1.9 }}
            className="mt-16 flex flex-col items-center"
          >
            <div
              className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--color-fg-dim)] mb-3"
            >
              EUR · accumulating since you opened this slide
            </div>
            <div
              className="font-semibold tabular-nums"
              style={{
                fontSize: "clamp(80px, 12vw, 200px)",
                lineHeight: 0.92,
                letterSpacing: "-0.045em",
                color: "var(--color-accent)",
                textShadow: "0 0 80px rgba(202,218,56,0.5)",
                fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
              }}
            >
              €{bleed.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
            <div className="mt-3 text-[11px] text-[color:var(--color-fg-dim)]">
              Based on live OPEX bleed across the demo fixture
            </div>
          </motion.div>
        </div>

        {/* Section E — footer KPI strip */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={{
            initial: {},
            animate: { transition: { staggerChildren: 0.15, delayChildren: 2.4 } },
          }}
          className="grid grid-cols-3 gap-8 max-w-[1100px] mx-auto w-full"
          style={{ paddingBottom: "clamp(100px, 10vh, 140px)", padding: "0 clamp(40px, 6vw, 80px) clamp(100px, 10vh, 140px)" }}
        >
          {[
            {
              label: "Slots in fixture",
              value: slotCount.toLocaleString("en-US"),
              animated: false,
            },
            {
              label: "Picks per shift",
              value: Math.round(meters.picks_per_shift),
              animated: true,
            },
            {
              label: "Avg meters per pick",
              value: `${meters.meters_per_pick_avg.toFixed(1)} m`,
              animated: false,
            },
          ].map((k, i) => (
            <motion.div
              key={k.label}
              variants={{
                initial: { opacity: 0, y: 30 },
                animate: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.8, ease: EASE_OUT_EXPO },
                },
              }}
              className={`flex flex-col gap-2 ${
                i > 0 ? "pl-8 border-l border-[color:var(--color-border)]" : ""
              }`}
            >
              <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-fg-dim)]">
                {k.label}
              </div>
              <div
                className="font-semibold tabular-nums text-[color:var(--color-fg)]"
                style={{
                  fontSize: "clamp(28px, 3vw, 44px)",
                  letterSpacing: "-0.025em",
                }}
              >
                {k.animated ? (
                  <AnimatedNumber value={k.value as number} duration={2} />
                ) : (
                  (k.value as string)
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function SplitReveal({
  text,
  accentWord,
  delayBase,
}: {
  text: string;
  accentWord?: string;
  delayBase: number;
}) {
  // Find the start index of the accent word within the text
  const accentStart = accentWord ? text.indexOf(accentWord) : -1;
  const accentEnd = accentStart >= 0 && accentWord ? accentStart + accentWord.length : -1;

  return (
    <span className="inline-block">
      {text.split("").map((ch, i) => {
        const isAccent = accentStart >= 0 && i >= accentStart && i < accentEnd;
        return (
          <motion.span
            key={`${text}-${i}`}
            initial={{ opacity: 0, y: 80, filter: "blur(14px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 1.05,
              ease: EASE_OUT_EXPO,
              delay: delayBase + i * 0.025,
            }}
            className="inline-block"
            style={
              isAccent
                ? {
                    color: "var(--color-accent)",
                    textShadow: "0 0 50px rgba(202,218,56,0.55)",
                  }
                : undefined
            }
          >
            {ch === " " ? "\u00A0" : ch}
          </motion.span>
        );
      })}
    </span>
  );
}
