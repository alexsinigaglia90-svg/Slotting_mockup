"use client";
import { motion } from "motion/react";

export function ChapterFourPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-10">
      <div className="max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-fg-dim)] mb-8"
        >
          Hoofdstuk 4
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          className="font-semibold leading-[0.92] mb-8"
          style={{ fontSize: "clamp(56px, 8vw, 112px)", letterSpacing: "-0.045em" }}
        >
          <span
            className="text-[color:var(--color-accent)]"
            style={{ textShadow: "0 0 60px rgba(202,218,56,0.5)" }}
          >
            Tempo.
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
          className="text-[color:var(--color-fg-muted)]"
          style={{ fontSize: "clamp(15px, 1.2vw, 18px)" }}
        >
          Vier scenario&apos;s. Eén voorstel, in seconden.
        </motion.p>
      </div>
    </div>
  );
}
