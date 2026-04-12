"use client";

import { useState, useMemo, useRef } from "react";
import { motion, useInView } from "motion/react";
import { HeroShader } from "@/components/hero/hero-shader";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { LiveIndicator } from "@/components/ui/live-indicator";
import {
  buildFixtureGrid,
  computeMetersPerShift,
  checkRules,
  clientSideVoorstelGenerator,
} from "@/lib/grid";
import { EASE_OUT_EXPO } from "@/lib/motion/primitives";

/* ─────────────────────────── helpers ─────────────────────────── */

interface OpexParams {
  ordersPerDay: number;
  hourlyLaborCost: number;
  shiftHours: number;
  annualFteCost: number;
  walkingSpeed: number;
  handlingTime: number;
}

const defaults: OpexParams = {
  ordersPerDay: 3500,
  hourlyLaborCost: 25,
  shiftHours: 7.5,
  annualFteCost: 50000,
  walkingSpeed: 1.2,
  handlingTime: 12,
};

function calcKpis(distPerOrder: number, picksPerOrder: number, params: OpexParams) {
  const distPerPick = distPerOrder / Math.max(picksPerOrder, 1);
  const timePerPick = distPerPick / params.walkingSpeed + params.handlingTime;
  const picksPerHour = 3600 / timePerPick;
  const ordersPerHour = picksPerHour / Math.max(picksPerOrder, 1);
  const ordersPerShift = ordersPerHour * params.shiftHours;
  const costPerOrder = params.hourlyLaborCost / Math.max(ordersPerHour, 0.01);
  const fteNeeded = params.ordersPerDay / Math.max(ordersPerShift, 0.01);
  const annualCost = fteNeeded * params.annualFteCost;
  return { picksPerHour, ordersPerShift, costPerOrder, fteNeeded, annualCost };
}

/* ─────────────────────────── sub-components ─────────────────────────── */

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
            textShadow: accent ? "0 0 48px rgba(202,218,56,0.55)" : undefined,
          }}
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}

function KpiTile({
  label,
  value,
  sub,
  isText,
  delay = 0,
}: {
  label: string;
  value: number | string;
  sub: string;
  isText?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 48, scale: 0.94, filter: "blur(8px)" },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: { duration: 1.0, ease: EASE_OUT_EXPO, delay },
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
          "0 1px 0 rgba(255,255,255,0.06) inset, 0 40px 80px -40px rgba(0,0,0,0.8), 0 0 1px rgba(202,218,56,0.2)",
      }}
    >
      {/* Lime glow halo top-right */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(202,218,56,0.22) 0%, transparent 65%)",
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
          {label}
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
          {isText ? (
            value
          ) : (
            <AnimatedNumber value={value as number} duration={1.8} />
          )}
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            color: "rgba(245,245,247,0.38)",
          }}
        >
          {sub}
        </div>
      </div>
    </motion.div>
  );
}

function SectionReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}

function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "rgba(245,245,247,0.38)",
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 13,
            fontFamily: "var(--font-mono)",
            color: "var(--color-accent)",
            fontWeight: 600,
          }}
        >
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: "100%",
          accentColor: "var(--color-accent)",
          cursor: "pointer",
        }}
      />
    </div>
  );
}

/* ─────────────────────────── main page ─────────────────────────── */

export default function OpexPage() {
  const [params, setParams] = useState(defaults);

  /* Grid-engine computed values */
  const { meters, violations, zonePickLoad, totalSlots, emptySlots } = useMemo(() => {
    const grid = buildFixtureGrid();
    const meters = computeMetersPerShift(grid);
    const violations = checkRules(grid);

    /* zone pick distribution */
    const zonePickLoad: Record<string, number> = {};
    let totalPicks = 0;
    for (const slot of grid.slots) {
      const sku = grid.skus[slot.sku_id];
      if (!sku) continue;
      zonePickLoad[slot.position.zone] =
        (zonePickLoad[slot.position.zone] ?? 0) + sku.pick_frequency_per_shift;
      totalPicks += sku.pick_frequency_per_shift;
    }

    const emptySlots = grid.slots.filter((s) => !grid.skus[s.sku_id]).length;
    const totalSlots = grid.slots.length;

    return { meters, violations, zonePickLoad, totalSlots, emptySlots, totalPicks };
  }, []);

  /* Voorstel scenario — computed async-style but synchronously via useMemo */
  const voorstelMeters = useMemo(() => {
    const grid = buildFixtureGrid();
    /* Minor reslot: remove 20 low-frequency SKUs from front of slot list */
    const lowFreqSkuIds = grid.slots
      .filter((s) => {
        const sku = grid.skus[s.sku_id];
        return sku && sku.pick_frequency_per_shift < 5;
      })
      .slice(0, 20)
      .map((s) => s.sku_id);

    /* Apply scenario synchronously using the internal helper signature */
    const newSkus = { ...grid.skus };
    for (const id of lowFreqSkuIds) delete newSkus[id];
    const newSlots = grid.slots.map((s) =>
      lowFreqSkuIds.includes(s.sku_id) ? { ...s, sku_id: "__EMPTY__" } : s,
    );
    const newGrid = { ...grid, slots: newSlots, skus: newSkus };
    return computeMetersPerShift(newGrid);
  }, []);

  /* Legacy OPEX KPI calculator (preserved) */
  const before = calcKpis(159.2, 25, params);
  const after = calcKpis(28.0, 25, params);
  const fteSaved = before.fteNeeded - after.fteNeeded;
  const annualSaving = fteSaved * params.annualFteCost;

  const totalViolations =
    violations.compliance.length + violations.ergonomie.length + violations.continuiteit.length;

  const emptyPct = totalSlots > 0 ? Math.round((emptySlots / totalSlots) * 100) : 0;

  /* Voor-na delta */
  const metersDeltaPct =
    meters.meters_per_shift > 0
      ? Math.round(
          ((voorstelMeters.meters_per_shift - meters.meters_per_shift) /
            meters.meters_per_shift) *
            100,
        )
      : 0;
  const urenDeltaPct =
    meters.uren_per_shift > 0
      ? Math.round(
          ((voorstelMeters.uren_per_shift - meters.uren_per_shift) /
            meters.uren_per_shift) *
            100,
        )
      : 0;

  const zones = Object.entries(
    Object.fromEntries(
      ["Z1", "Z2", "Z3", "Z4", "Z5"].map((z) => [z, zonePickLoad[z] ?? 0]),
    ),
  );
  const maxZonePicks = Math.max(...zones.map(([, v]) => v), 1);

  return (
    <div style={{ overflowY: "auto", minHeight: "100vh" }}>

      {/* ═══════════════ SECTION A — CINEMATIC HERO ═══════════════ */}
      <section
        className="relative w-full overflow-hidden"
        style={{ minHeight: "70vh", padding: "120px clamp(32px, 5vw, 80px) 80px" }}
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
          {/* Meta label */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT_EXPO } },
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <LiveIndicator />
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "rgba(245,245,247,0.38)",
              }}
            >
              DC-Demo · OPEX Overview
            </span>
          </motion.div>

          {/* Hero title — split-letter reveal */}
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
            <HeroLine text="Elke meter" />
            <br />
            <HeroLine text="kost " />
            <HeroLine text="geld." accent />
          </h1>

          {/* Subtitle */}
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
            Wat jullie magazijn nu aan looptijd kost. Wat daarvan terugverdiend kan worden.
          </motion.p>

          {/* ═══ SECTION B — HERO KPI STRIP ═══ */}
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
            <KpiTile
              label="Meters per shift"
              value={Math.round(meters.meters_per_shift)}
              sub="loopafstand totaal"
            />
            <KpiTile
              label="Meters per pick"
              value={parseFloat(meters.meters_per_pick_avg.toFixed(1))}
              sub="gemiddeld per pick"
            />
            <KpiTile
              label="Uren-equivalent"
              value={parseFloat(meters.uren_per_shift.toFixed(1))}
              sub="shift loop-uren"
            />
            <KpiTile
              label="Picks per shift"
              value={Math.round(meters.picks_per_shift)}
              sub="live uit grid engine"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ SECTION C — VOOR EN NA ═══════════════ */}
      <section
        style={{
          padding: "120px clamp(32px, 5vw, 80px)",
          position: "relative",
        }}
      >
        <div className="max-w-[1400px] mx-auto">
          <SectionReveal>
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.24em",
                color: "rgba(245,245,247,0.38)",
                marginBottom: 16,
              }}
            >
              Scenario analyse
            </div>
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: "clamp(32px, 4vw, 64px)",
                letterSpacing: "-0.03em",
                color: "var(--color-fg)",
                lineHeight: 1.0,
                marginBottom: 48,
              }}
            >
              Voor en{" "}
              <span
                style={{
                  color: "var(--color-accent)",
                  textShadow: "0 0 48px rgba(202,218,56,0.45)",
                }}
              >
                na
              </span>{" "}
              voorstel
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: 0,
                alignItems: "stretch",
              }}
            >
              {/* LEFT — huidige layout */}
              <div
                style={{
                  padding: "40px 40px 48px",
                  borderRadius: "var(--radius-lg) 0 0 var(--radius-lg)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRight: "none",
                  background: "rgba(255,255,255,0.025)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "rgba(245,245,247,0.38)",
                    marginBottom: 24,
                    fontWeight: 500,
                  }}
                >
                  Huidige layout
                </div>

                <VoorNaMetric
                  label="Meters per shift"
                  value={Math.round(meters.meters_per_shift)}
                  delta={null}
                />
                <VoorNaMetric
                  label="Loop-uren"
                  value={parseFloat(meters.uren_per_shift.toFixed(1))}
                  delta={null}
                  format={(v) => v.toFixed(1)}
                />
                <VoorNaMetric
                  label="Overtredingen"
                  value={totalViolations}
                  delta={null}
                />
              </div>

              {/* DIVIDER */}
              <div
                style={{
                  width: 2,
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(202,218,56,0.6) 40%, rgba(202,218,56,0.6) 60%, transparent 100%)",
                  boxShadow: "0 0 24px rgba(202,218,56,0.3)",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--color-bg)",
                    border: "1px solid rgba(202,218,56,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    color: "var(--color-accent)",
                    fontWeight: 700,
                    boxShadow: "0 0 24px rgba(202,218,56,0.25)",
                  }}
                >
                  →
                </div>
              </div>

              {/* RIGHT — na voorstel */}
              <div
                style={{
                  padding: "40px 40px 48px",
                  borderRadius: "0 var(--radius-lg) var(--radius-lg) 0",
                  border: "1px solid rgba(202,218,56,0.2)",
                  borderLeft: "none",
                  background:
                    "linear-gradient(135deg, rgba(202,218,56,0.07) 0%, rgba(202,218,56,0.02) 100%)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "inset 0 0 80px -40px rgba(202,218,56,0.08)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "var(--color-accent)",
                    marginBottom: 24,
                    fontWeight: 500,
                    opacity: 0.8,
                  }}
                >
                  Na voorstel
                </div>

                <VoorNaMetric
                  label="Meters per shift"
                  value={Math.round(voorstelMeters.meters_per_shift)}
                  delta={metersDeltaPct}
                />
                <VoorNaMetric
                  label="Loop-uren"
                  value={parseFloat(voorstelMeters.uren_per_shift.toFixed(1))}
                  delta={urenDeltaPct}
                  format={(v) => v.toFixed(1)}
                />
                <VoorNaMetric
                  label="Overtredingen"
                  value={totalViolations}
                  delta={0}
                />
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ═══════════════ SECTION D — BREAKDOWN STRIP ═══════════════ */}
      <section
        style={{
          padding: "0 clamp(32px, 5vw, 80px) 120px",
        }}
      >
        <div className="max-w-[1400px] mx-auto">
          <SectionReveal>
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.24em",
                color: "rgba(245,245,247,0.38)",
                marginBottom: 16,
              }}
            >
              Breakdown
            </div>
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: "clamp(28px, 3vw, 48px)",
                letterSpacing: "-0.03em",
                color: "var(--color-fg)",
                lineHeight: 1.0,
                marginBottom: 40,
              }}
            >
              Kosten{" "}
              <span style={{ color: "rgba(245,245,247,0.38)" }}>verdeeld</span>
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 20,
              }}
            >
              {/* Tile 1: Zone distribution */}
              <div
                style={{
                  padding: "28px 28px 32px",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.035)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "rgba(245,245,247,0.38)",
                    fontWeight: 500,
                    marginBottom: 20,
                  }}
                >
                  Distributie over zones
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {zones.map(([zone, picks]) => {
                    const isHotspot = zone === "Z3";
                    const pct = Math.round((picks / maxZonePicks) * 100);
                    return (
                      <div key={zone}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 4,
                            fontSize: 11,
                            color: isHotspot
                              ? "var(--color-accent)"
                              : "rgba(245,245,247,0.62)",
                            fontWeight: isHotspot ? 600 : 400,
                          }}
                        >
                          <span style={{ fontFamily: "var(--font-mono)" }}>{zone}</span>
                          <span style={{ fontFamily: "var(--font-mono)" }}>
                            {Math.round(picks).toLocaleString("nl-NL")}
                          </span>
                        </div>
                        <div
                          style={{
                            height: 4,
                            borderRadius: 2,
                            background: "rgba(255,255,255,0.06)",
                            overflow: "hidden",
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1.2, ease: EASE_OUT_EXPO, delay: 0.3 }}
                            style={{
                              height: "100%",
                              borderRadius: 2,
                              background: isHotspot
                                ? "var(--color-accent)"
                                : "rgba(255,255,255,0.25)",
                              boxShadow: isHotspot
                                ? "0 0 12px rgba(202,218,56,0.5)"
                                : "none",
                            }}
                          />
                        </div>
                        {isHotspot && (
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 10,
                              color: "var(--color-accent)",
                              opacity: 0.7,
                            }}
                          >
                            hotspot — 2.5× zone multiplier
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tile 2: Violations breakdown */}
              <div
                style={{
                  padding: "28px 28px 32px",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.035)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "rgba(245,245,247,0.38)",
                    fontWeight: 500,
                    marginBottom: 24,
                  }}
                >
                  Overtredingen per laag
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <ViolationRow
                    tone="critical"
                    label="Compliance"
                    count={violations.compliance.length}
                    desc="gevaarlijke stoffen, zware items op hoogte"
                  />
                  <ViolationRow
                    tone="secondary"
                    label="Ergonomie"
                    count={violations.ergonomie.length}
                    desc="hoog-freq picks in buk/klimzone"
                  />
                  <ViolationRow
                    tone="accent"
                    label="Continuïteit"
                    count={violations.continuiteit.length}
                    desc="zone-bottleneck detecties"
                  />
                </div>

                <div
                  style={{
                    marginTop: 28,
                    paddingTop: 20,
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(245,245,247,0.38)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Totaal
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 28,
                      fontWeight: 700,
                      color: "var(--color-fg)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    <AnimatedNumber value={totalViolations} duration={1.4} />
                  </span>
                </div>
              </div>

              {/* Tile 3: Fixture headroom ring */}
              <div
                style={{
                  padding: "28px 28px 32px",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.035)",
                  backdropFilter: "blur(16px)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "rgba(245,245,247,0.38)",
                    fontWeight: 500,
                    marginBottom: 24,
                  }}
                >
                  Fixture headroom
                </div>

                {/* Ring gauge */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                  }}
                >
                  <RingGauge pct={emptyPct} />
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: "rgba(245,245,247,0.62)",
                        marginBottom: 4,
                      }}
                    >
                      {emptySlots.toLocaleString("nl-NL")} lege slots
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(245,245,247,0.38)" }}>
                      van {totalSlots.toLocaleString("nl-NL")} totaal
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ═══════════════ FTE IMPACT — preserved from original ═══════════════ */}
      <section
        style={{
          padding: "0 clamp(32px, 5vw, 80px) 120px",
        }}
      >
        <div className="max-w-[1400px] mx-auto">
          <SectionReveal>
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.24em",
                color: "rgba(245,245,247,0.38)",
                marginBottom: 16,
              }}
            >
              FTE impact
            </div>
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: "clamp(28px, 3vw, 48px)",
                letterSpacing: "-0.03em",
                color: "var(--color-fg)",
                lineHeight: 1.0,
                marginBottom: 40,
              }}
            >
              Wat betekent dit in{" "}
              <span
                style={{
                  color: "var(--color-accent)",
                  textShadow: "0 0 32px rgba(202,218,56,0.4)",
                }}
              >
                mensen
              </span>
              ?
            </h2>

            {/* KPI row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 20,
                marginBottom: 40,
              }}
            >
              {[
                {
                  label: "FTE voor optimalisatie",
                  value: before.fteNeeded,
                  color: "var(--color-critical)",
                },
                {
                  label: "FTE na optimalisatie",
                  value: after.fteNeeded,
                  color: "var(--color-positive)",
                },
                {
                  label: "Jaarlijkse besparing",
                  value: annualSaving / 1_000_000,
                  color: "var(--color-accent)",
                  format: (v: number) => `EUR ${v.toFixed(1)}M`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "28px 28px 32px",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.035)",
                    backdropFilter: "blur(16px)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      color: "rgba(245,245,247,0.38)",
                      fontWeight: 500,
                      marginBottom: 16,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                      fontSize: "clamp(36px, 4vw, 56px)",
                      letterSpacing: "-0.03em",
                      lineHeight: 1.0,
                      color: item.color,
                    }}
                  >
                    {item.format ? (
                      item.format(item.value)
                    ) : (
                      <AnimatedNumber value={Math.round(item.value)} duration={1.6} />
                    )}
                  </div>
                  <div
                    style={{ marginTop: 8, fontSize: 11, color: "rgba(245,245,247,0.38)" }}
                  >
                    {item.label.includes("besparing") ? "op jaarbasis" : "FTE per shift"}
                  </div>
                </div>
              ))}
            </div>

            {/* Parameters */}
            <div
              style={{
                padding: "32px 32px 36px",
                borderRadius: "var(--radius-lg)",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.025)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "rgba(245,245,247,0.38)",
                  fontWeight: 500,
                  marginBottom: 24,
                }}
              >
                Parameters — aanpasbaar
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "28px 40px",
                }}
              >
                <ParamSlider
                  label="Orders / dag"
                  value={params.ordersPerDay}
                  min={1000}
                  max={6000}
                  step={100}
                  onChange={(v) => setParams((p) => ({ ...p, ordersPerDay: v }))}
                />
                <ParamSlider
                  label="Uurloon (EUR)"
                  value={params.hourlyLaborCost}
                  min={18}
                  max={35}
                  step={1}
                  onChange={(v) => setParams((p) => ({ ...p, hourlyLaborCost: v }))}
                />
                <ParamSlider
                  label="Shift uren"
                  value={params.shiftHours}
                  min={6}
                  max={10}
                  step={0.5}
                  onChange={(v) => setParams((p) => ({ ...p, shiftHours: v }))}
                />
                <ParamSlider
                  label="Jaarkosten FTE (EUR)"
                  value={params.annualFteCost}
                  min={40000}
                  max={65000}
                  step={1000}
                  onChange={(v) => setParams((p) => ({ ...p, annualFteCost: v }))}
                />
                <ParamSlider
                  label="Loopsnelheid (m/s)"
                  value={params.walkingSpeed}
                  min={0.8}
                  max={1.5}
                  step={0.1}
                  onChange={(v) => setParams((p) => ({ ...p, walkingSpeed: v }))}
                />
                <ParamSlider
                  label="Handlingstijd (s)"
                  value={params.handlingTime}
                  min={8}
                  max={18}
                  step={1}
                  onChange={(v) => setParams((p) => ({ ...p, handlingTime: v }))}
                />
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ═══════════════ SECTION E — FOOTNOTE ═══════════════ */}
      <section
        style={{
          padding: "0 clamp(32px, 5vw, 80px) 80px",
        }}
      >
        <div className="max-w-[1400px] mx-auto">
          <div
            style={{
              padding: "24px 28px",
              borderRadius: "var(--radius)",
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Pill tone="default" style={{ flexShrink: 0, marginTop: 2 }}>
                kalibratie
              </Pill>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(245,245,247,0.38)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Meters- en uren-waarden zijn berekend via een demo-benadering: loopafstand
                als gewogen som van slot-afstanden tot de dock-origin, 1,2 m/s loopsnelheid
                en 4 seconden pick-overhead. Deze waarden zijn demonstratief en worden
                verfijnd zodra reële Action pick-route data beschikbaar is.
                De FTE-berekening gebruikt sprint-2 integratietest waarden (voor: 159,2 m/order,
                na: 28,0 m/order, 25 picks/order).
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────── small helpers ─────────────────────────── */

function VoorNaMetric({
  label,
  value,
  delta,
  format,
}: {
  label: string;
  value: number;
  delta: number | null;
  format?: (v: number) => string;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "rgba(245,245,247,0.38)",
          fontWeight: 500,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
            fontSize: 36,
            fontWeight: 700,
            color: "var(--color-fg)",
            letterSpacing: "-0.025em",
          }}
        >
          {format ? format(value) : <AnimatedNumber value={value} duration={1.4} />}
        </span>
        {delta !== null && delta !== 0 && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: delta < 0 ? "var(--color-accent)" : "var(--color-critical)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
        )}
        {delta === 0 && (
          <span
            style={{
              fontSize: 11,
              color: "rgba(245,245,247,0.38)",
              fontFamily: "var(--font-mono)",
            }}
          >
            ongewijzigd
          </span>
        )}
      </div>
    </div>
  );
}

function ViolationRow({
  tone,
  label,
  count,
  desc,
}: {
  tone: "critical" | "secondary" | "accent";
  label: string;
  count: number;
  desc: string;
}) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        <Pill tone={tone}>{label}</Pill>
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 24,
            fontWeight: 700,
            color: "var(--color-fg)",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
            marginBottom: 4,
          }}
        >
          <AnimatedNumber value={count} duration={1.2} />
        </div>
        <div style={{ fontSize: 11, color: "rgba(245,245,247,0.38)" }}>{desc}</div>
      </div>
    </div>
  );
}

function RingGauge({ pct }: { pct: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const filled = ((100 - pct) / 100) * circ;

  return (
    <div style={{ position: "relative", width: 130, height: 130 }}>
      <svg width="130" height="130" style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx="65"
          cy="65"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        {/* Progress */}
        <motion.circle
          cx="65"
          cy="65"
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: filled }}
          transition={{ duration: 1.4, ease: EASE_OUT_EXPO, delay: 0.4 }}
          style={{ filter: "drop-shadow(0 0 8px rgba(202,218,56,0.6))" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--color-accent)",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {pct}%
        </span>
        <span
          style={{
            fontSize: 10,
            color: "rgba(245,245,247,0.38)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginTop: 4,
          }}
        >
          leeg
        </span>
      </div>
    </div>
  );
}
