import type {
  HealthResponse,
  OptimizeRequest,
  OptimizeResponse,
  PickRouteRequest,
  PickRouteResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API error ${res.status}: ${detail}`);
  }
  return res.json();
}

export const api = {
  health: () => apiFetch<HealthResponse>("/health"),

  optimize: (params?: OptimizeRequest) =>
    apiFetch<OptimizeResponse>("/optimize", {
      method: "POST",
      body: JSON.stringify(params ?? {}),
    }),

  pickRoute: (params: PickRouteRequest) =>
    apiFetch<PickRouteResponse>("/pick-route", {
      method: "POST",
      body: JSON.stringify(params),
    }),
};
