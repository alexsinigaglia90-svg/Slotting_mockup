"use client";
import { motion } from "motion/react";

export function LiveIndicator({ label = "Live" }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent-soft)] px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-[color:var(--color-accent)]">
      <motion.span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background: "var(--color-accent)",
          boxShadow: "0 0 10px var(--color-accent)",
        }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      {label}
    </div>
  );
}
