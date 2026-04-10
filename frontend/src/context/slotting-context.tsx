"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import type { OptimizeResponse, ColorMode, ViewMode } from "@/lib/types";

interface State {
  optimizeResult: OptimizeResponse | null;
  isOptimizing: boolean;
  colorMode: ColorMode;
  viewMode: ViewMode;
  error: string | null;
}

type Action =
  | { type: "OPTIMIZE_START" }
  | { type: "OPTIMIZE_SUCCESS"; payload: OptimizeResponse }
  | { type: "OPTIMIZE_ERROR"; payload: string }
  | { type: "SET_COLOR_MODE"; payload: ColorMode }
  | { type: "SET_VIEW_MODE"; payload: ViewMode };

const initialState: State = {
  optimizeResult: null,
  isOptimizing: false,
  colorMode: "velocity",
  viewMode: "3d",
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "OPTIMIZE_START":
      return { ...state, isOptimizing: true, error: null };
    case "OPTIMIZE_SUCCESS":
      return { ...state, isOptimizing: false, optimizeResult: action.payload };
    case "OPTIMIZE_ERROR":
      return { ...state, isOptimizing: false, error: action.payload };
    case "SET_COLOR_MODE":
      return { ...state, colorMode: action.payload };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };
    default:
      return state;
  }
}

const SlottingContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function SlottingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <SlottingContext.Provider value={{ state, dispatch }}>
      {children}
    </SlottingContext.Provider>
  );
}

export function useSlotting() {
  const ctx = useContext(SlottingContext);
  if (!ctx) throw new Error("useSlotting must be used within SlottingProvider");
  return ctx;
}
