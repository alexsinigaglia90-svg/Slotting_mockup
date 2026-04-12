"use client";
import { motion } from "motion/react";

/**
 * Slowly drifting radial gradient glows. CSS-only for Fase 1.
 * Fase 2 replaces this with a WebGL shader for true cinematic quality.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <motion.div
        className="absolute w-[60vw] h-[60vw] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,106,61,0.18), transparent 60%)",
          top: "-10%",
          right: "-10%",
          filter: "blur(80px)",
        }}
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-[50vw] h-[50vw] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(244,114,182,0.12), transparent 60%)",
          bottom: "-15%",
          left: "-10%",
          filter: "blur(100px)",
        }}
        animate={{ x: [0, -30, 40, 0], y: [0, 20, -30, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-[40vw] h-[40vw] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,106,61,0.08), transparent 60%)",
          top: "30%",
          left: "25%",
          filter: "blur(120px)",
        }}
        animate={{ x: [0, 20, -40, 0], y: [0, 40, -20, 0] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
