"use client";

import { SlottingProvider } from "@/context/slotting-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SlottingProvider>{children}</SlottingProvider>;
}
