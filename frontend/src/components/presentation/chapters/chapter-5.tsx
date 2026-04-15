"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { EASE_OUT_EXPO } from "@/lib/motion/primitives";

type Beat = 1 | 2 | 3 | 4;

export function ChapterFivePlaceholder() {
  const [beat, setBeat] = useState<Beat>(1);

  useEffect(() => {
    const timers = [
      setTimeout(() => setBeat(2), 2000),
      setTimeout(() => setBeat(3), 10000),
      setTimeout(() => setBeat(4), 14000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <LocalAmbient />

      {/* Meta label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="absolute top-12 left-12 text-[10px] uppercase tracking-[0.24em] text-[color:var(--color-fg-dim)]"
      >
        05 · The Promise
      </motion.div>

      {/* Tagline (beat 2+) */}
      <AnimatePresence>
        {beat >= 2 && (
          <motion.div
            key="tagline"
            className="absolute left-0 right-0 flex flex-col items-center"
            style={{ top: "38%" }}
          >
            <h1
              className="font-semibold text-center leading-[1.02]"
              style={{
                fontSize: "clamp(48px, 7vw, 104px)",
                letterSpacing: "-0.045em",
              }}
            >
              <SplitReveal text="Never yesterday optimal." delayBase={0.0} />
              <br />
              <SplitReveal
                text="Always optimal now."
                delayBase={1.1}
                accent
              />
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capability recap (beat 3+) */}
      <AnimatePresence>
        {beat >= 3 && (
          <motion.div
            key="recap"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } },
            }}
            className="absolute left-0 right-0 flex flex-col items-center text-center"
            style={{ top: "74%" }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.9, ease: EASE_OUT_EXPO },
                },
              }}
              className="text-[color:var(--color-fg-muted)] text-[14px] md:text-[16px] mb-1"
            >
              Standalone. Or native to any WMS.
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.9, ease: EASE_OUT_EXPO },
                },
              }}
              className="text-[color:var(--color-fg-muted)] text-[14px] md:text-[16px] mb-3"
            >
              Machine-learning-driven. Continuous.
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.9, ease: EASE_OUT_EXPO },
                },
              }}
              className="font-medium text-[16px] md:text-[18px]"
              style={{
                color: "var(--color-accent)",
                textShadow: "0 0 24px rgba(202,218,56,0.35)",
              }}
            >
              Significant OPEX reduction.
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function SplitReveal({
  text,
  delayBase,
  accent = false,
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
            duration: 1.1,
            ease: EASE_OUT_EXPO,
            delay: delayBase + i * 0.03,
          }}
          className={`inline-block ${accent ? "text-[color:var(--color-accent)]" : ""}`}
          style={
            accent
              ? { textShadow: "0 0 80px rgba(202,218,56,0.55)" }
              : undefined
          }
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}

function LocalAmbient() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none -z-10 overflow-hidden"
    >
      <motion.div
        className="absolute w-[70vw] h-[70vw] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(202,218,56,0.10), transparent 65%)",
          top: "10%",
          left: "15%",
          filter: "blur(120px)",
        }}
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 15, 0] }}
        transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-[55vw] h-[55vw] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.06), transparent 65%)",
          bottom: "-10%",
          right: "-10%",
          filter: "blur(140px)",
        }}
        animate={{ x: [0, -25, 35, 0], y: [0, 25, -15, 0] }}
        transition={{ duration: 62, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
