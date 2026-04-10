"use client";

import { Line } from "@react-three/drei";
import { DEFAULT_WAREHOUSE_CONFIG } from "@/lib/types";

interface PickRouteLineProps {
  waypoints: string[]; // e.g. ["depot", "A01_front", "A01_back", "A02_front", "depot"]
  color?: string;
  lineWidth?: number;
}

function waypointToPosition(wp: string): [number, number, number] {
  const config = DEFAULT_WAREHOUSE_CONFIG;
  if (wp === "depot") return [0, 0.5, -2];

  const match = wp.match(/^A(\d+)_(front|back)$/);
  if (match) {
    const aisleNum = parseInt(match[1]) - 1;
    const isFront = match[2] === "front";
    return [
      aisleNum * config.aisleSpacingM,
      0.5,
      isFront ? 0 : config.aisleLengthM,
    ];
  }
  return [0, 0.5, 0];
}

export default function PickRouteLine({ waypoints, color = "#22c55e", lineWidth = 3 }: PickRouteLineProps) {
  if (waypoints.length < 2) return null;

  const points = waypoints.map(waypointToPosition);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      dashed={color.includes("f97316")}
      dashSize={0.5}
      gapSize={0.3}
    />
  );
}
