"use client";
import { AnimatePresence, motion } from "motion/react";

interface DigitRollProps {
  value: number;
  className?: string;
  style?: React.CSSProperties;
}

export function DigitRoll({ value, className, style }: DigitRollProps) {
  const digits = String(Math.max(0, Math.round(value))).split("");

  return (
    <span
      className={className}
      style={{ display: "inline-flex", overflow: "hidden", ...style }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {digits.map((d, i) => (
          <motion.span
            key={`${digits.length - digits.length + i}-${d}-${digits.length}`}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
            style={{ display: "inline-block", lineHeight: 1 }}
          >
            {d}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}
