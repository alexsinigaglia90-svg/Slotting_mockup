"use client";
import { motion } from "motion/react";
import { useMemo } from "react";
import { HeroShader } from "./hero-shader";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { buildFixtureGrid, computeMetersPerShift, checkRules } from "@/lib/grid";
import { EASE_OUT_EXPO } from "@/lib/motion/primitives";

const TITLE_LINE_1 = "Jullie magazijn,";
const TITLE_LINE_2 = "altijd optimaal.";

export function WarehouseHero() {
  const { metersData, violations, slotCount } = useMemo(() => {
    const grid = buildFixtureGrid();
    const metersData = computeMetersPerShift(grid);
    const violations = checkRules(grid);
    return { metersData, violations, slotCount: grid.slots.length };
  }, []);

  const totalViolations =
    violations.compliance.length + violations.ergonomie.length + violations.continuiteit.length;

  const kpis: Array<{ label: string; value: number | string; sub: string; isText?: boolean }> = [
    { label: "Slots", value: slotCount, sub: "fysieke opslagplekken" },
    { label: "Picks / shift", value: metersData.picks_per_shift, sub: "live uit grid engine" },
    { label: "Overtredingen", value: totalViolations, sub: "compliance + ergo + continuïteit" },
    { label: "Hotspot", value: "Z3", sub: "38.6% van alle picks", isText: true },
  ];

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: "80vh", padding: "120px clamp(32px, 5vw, 80px) 80px" }}
    >
      <HeroShader />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
        }}
        className="relative z-10 max-w-[1400px] mx-auto"
      >
        {/* META LABEL */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT_EXPO } },
          }}
          className="mb-8"
          style={{
            fontSize: 11,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "rgba(245,245,247,0.38)",
          }}
        >
          DC-Demo · Warehouse ·{" "}
          <span style={{ color: "var(--color-accent)" }}>Live</span>
        </motion.div>

        {/* HERO TITLE — split-letter reveal */}
        <h1
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            lineHeight: 0.92,
            marginBottom: 24,
            fontSize: "clamp(52px, 8vw, 112px)",
            letterSpacing: "-0.045em",
            color: "var(--color-fg)",
          }}
        >
          <HeroLine text={TITLE_LINE_1} />
          <br />
          <HeroLine text={TITLE_LINE_2} accent />
        </h1>

        {/* SUBTITLE */}
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 14 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT_EXPO } },
          }}
          className="max-w-xl mb-16"
          style={{
            color: "rgba(245,245,247,0.62)",
            fontSize: "clamp(16px, 1.4vw, 20px)",
            lineHeight: 1.5,
          }}
        >
          {slotCount.toLocaleString("nl-NL")} slots, in real-time geoptimaliseerd.
          Iedere beweging, iedere regel, iedere kans zichtbaar.
        </motion.p>

        {/* KPI STRIP */}
        <motion.div
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } },
          }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 20,
          }}
        >
          {kpis.map((kpi) => (
            <motion.div
              key={kpi.label}
              variants={{
                hidden: { opacity: 0, y: 48, scale: 0.94, filter: "blur(8px)" },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  filter: "blur(0px)",
                  transition: { duration: 1.0, ease: EASE_OUT_EXPO },
                },
              }}
              className="relative overflow-hidden"
              style={{
                padding: "28px 28px 32px",
                borderRadius: "var(--radius-lg)",
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 100%)",
                backdropFilter: "blur(24px)",
                boxShadow:
                  "0 1px 0 rgba(255,255,255,0.06) inset, 0 40px 80px -40px rgba(0,0,0,0.8), 0 0 1px rgba(255,106,61,0.15)",
              }}
            >
              {/* Glow halo */}
              <div
                className="absolute pointer-events-none"
                style={{
                  top: -40,
                  right: -40,
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,106,61,0.18) 0%, transparent 65%)",
                  filter: "blur(12px)",
                }}
              />
              <div className="relative">
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "rgba(245,245,247,0.38)",
                    marginBottom: 16,
                    fontWeight: 500,
                  }}
                >
                  {kpi.label}
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    fontSize: "clamp(44px, 5vw, 80px)",
                    letterSpacing: "-0.035em",
                    lineHeight: 0.95,
                    color: "var(--color-fg)",
                  }}
                >
                  {kpi.isText ? (
                    kpi.value
                  ) : (
                    <AnimatedNumber value={kpi.value as number} duration={1.8} />
                  )}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 11,
                    color: "rgba(245,245,247,0.38)",
                  }}
                >
                  {kpi.sub}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

function HeroLine({ text, accent = false }: { text: string; accent?: boolean }) {
  return (
    <span style={{ display: "inline-block" }}>
      {text.split("").map((ch, i) => (
        <motion.span
          key={`${text}-${i}`}
          variants={{
            hidden: { opacity: 0, y: 80, filter: "blur(14px)" },
            visible: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 1.05, ease: EASE_OUT_EXPO, delay: i * 0.025 },
            },
          }}
          style={{
            display: "inline-block",
            color: accent ? "var(--color-accent)" : undefined,
            textShadow: accent ? "0 0 40px rgba(255,106,61,0.4)" : undefined,
          }}
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}
