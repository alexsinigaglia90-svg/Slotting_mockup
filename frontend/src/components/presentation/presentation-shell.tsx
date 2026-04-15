"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { usePresentation, type ChapterId } from "@/context/presentation-context";
import { ChapterOnePlaceholder } from "./chapters/chapter-1";
import { ChapterTwoPlaceholder } from "./chapters/chapter-2";
import { ChapterThreePlaceholder } from "./chapters/chapter-3";
import { ChapterFourPlaceholder } from "./chapters/chapter-4";
import { ChapterFivePlaceholder } from "./chapters/chapter-5";

const CHAPTERS: { id: ChapterId; label: string; title: string }[] = [
  { id: 1, label: "Problem", title: "The Problem" },
  { id: 2, label: "Risk", title: "The Risk" },
  { id: 3, label: "WMS", title: "WMS Integration" },
  { id: 4, label: "Speed", title: "The Speed" },
  { id: 5, label: "Promise", title: "The Promise" },
];

const CHAPTER_COMPONENTS: Record<ChapterId, React.ComponentType> = {
  1: ChapterOnePlaceholder,
  2: ChapterTwoPlaceholder,
  3: ChapterThreePlaceholder,
  4: ChapterFourPlaceholder,
  5: ChapterFivePlaceholder,
};

export function PresentationShell() {
  const { chapter, next, prev, goTo } = usePresentation();
  const ChapterComponent = CHAPTER_COMPONENTS[chapter];
  const meta = CHAPTERS.find((c) => c.id === chapter)!;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") window.location.href = "/warehouse";
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* CICT brand mark — persistent across all chapters */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-40 flex items-center gap-2"
        style={{ bottom: 110, right: 40 }}
      >
        <div className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-fg-dim)]">
          CICT
        </div>
        <div
          className="h-[5px] w-[5px] rounded-full"
          style={{
            background: "var(--color-accent)",
            boxShadow: "0 0 8px var(--color-accent-glow)",
          }}
        />
        <div className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-fg-dim)]">
          Innovations
        </div>
      </div>

      {/* Top bar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-50 flex items-center justify-between px-10 py-6"
      >
        <div className="flex items-center gap-3">
          <div
            className="h-2 w-2 rounded-full"
            style={{
              background: "var(--color-accent)",
              boxShadow: "0 0 10px var(--color-accent-glow)",
            }}
          />
          <span className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-fg-dim)]">
            CICT · Slotting · Presentation
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={chapter}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]"
          >
            Chapter {chapter} / 5 — {meta.label}
          </motion.div>
        </AnimatePresence>

        <Link
          href="/warehouse"
          className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-fg-dim)] hover:text-[color:var(--color-fg)] transition-colors"
        >
          Exit · Esc
        </Link>
      </motion.header>

      {/* Chapter body */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={chapter}
            initial={{ opacity: 0, scale: 0.98, filter: "blur(12px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <ChapterComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="relative z-50 px-10 py-8"
      >
        <div className="max-w-[1400px] mx-auto flex items-center gap-8">
          <button
            onClick={prev}
            disabled={chapter === 1}
            className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>

          <div className="flex-1 flex items-center gap-3">
            {CHAPTERS.map((c) => {
              const reached = chapter >= c.id;
              const active = chapter === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => goTo(c.id)}
                  className="group relative flex-1 flex flex-col items-start gap-2"
                >
                  <div className="relative h-[2px] w-full rounded-full overflow-hidden bg-white/10">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        background: "var(--color-accent)",
                        boxShadow: active ? "0 0 10px var(--color-accent-glow)" : "none",
                      }}
                      initial={false}
                      animate={{ width: reached ? "100%" : "0%" }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <div
                    className={`text-[10px] uppercase tracking-[0.14em] transition-colors ${
                      active
                        ? "text-[color:var(--color-fg)]"
                        : reached
                          ? "text-[color:var(--color-fg-muted)]"
                          : "text-[color:var(--color-fg-dim)] group-hover:text-[color:var(--color-fg-muted)]"
                    }`}
                  >
                    {String(c.id).padStart(2, "0")} · {c.label}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={next}
            disabled={chapter === 5}
            className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </motion.footer>
    </div>
  );
}
