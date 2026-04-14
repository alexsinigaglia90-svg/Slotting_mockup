"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ChapterId = 1 | 2 | 3 | 4 | 5;

interface PresentationContextValue {
  chapter: ChapterId;
  next: () => void;
  prev: () => void;
  goTo: (c: ChapterId) => void;
}

const Ctx = createContext<PresentationContextValue | null>(null);

export function PresentationProvider({ children }: { children: ReactNode }) {
  const [chapter, setChapter] = useState<ChapterId>(1);

  const next = useCallback(() => setChapter((c) => (Math.min(5, c + 1) as ChapterId)), []);
  const prev = useCallback(() => setChapter((c) => (Math.max(1, c - 1) as ChapterId)), []);
  const goTo = useCallback((c: ChapterId) => setChapter(c), []);

  return (
    <Ctx.Provider value={{ chapter, next, prev, goTo }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePresentation(): PresentationContextValue {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePresentation must be used inside PresentationProvider");
  return c;
}
