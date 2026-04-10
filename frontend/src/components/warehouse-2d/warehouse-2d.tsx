"use client";

import { useRef, useEffect } from "react";
import { DEFAULT_WAREHOUSE_CONFIG } from "@/lib/types";
import { getVelocityClass, VELOCITY_COLORS } from "@/lib/color-scales";

export default function Warehouse2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = DEFAULT_WAREHOUSE_CONFIG;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = 12; // pixels per meter
    const padX = 40;
    const padY = 40;
    canvas.width = (config.numAisles - 1) * config.aisleSpacingM * scale + padX * 2 + 40;
    canvas.height = config.aisleLengthM * scale + padY * 2;

    // Background
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cross-aisles
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(padX - 10, padY - 5, canvas.width - padX * 2 + 20, 6);
    ctx.fillRect(padX - 10, padY + config.aisleLengthM * scale - 1, canvas.width - padX * 2 + 20, 6);

    // Depot
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(padX, padY - 15, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#22c55e";
    ctx.font = "10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("DEPOT", padX, padY - 28);

    // Aisles and racks
    for (let a = 0; a < config.numAisles; a++) {
      const x = padX + a * config.aisleSpacingM * scale;

      // Aisle label
      ctx.fillStyle = "#64748b";
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(`A${String(a + 1).padStart(2, "0")}`, x, padY - 5);

      // Aisle center line
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, padY);
      ctx.lineTo(x, padY + config.aisleLengthM * scale);
      ctx.stroke();

      // Rack positions (left and right)
      const rackSpacing = config.aisleLengthM / config.racksPerAisle;
      for (let r = 1; r <= config.racksPerAisle; r++) {
        const y = padY + r * rackSpacing * scale;
        for (const sideOffset of [-6, 6]) {
          // Average velocity class across levels for 2D representation
          const vel = getVelocityClass(a, 1, config.numAisles);
          ctx.fillStyle = VELOCITY_COLORS[vel];
          ctx.globalAlpha = 0.8;
          ctx.fillRect(x + sideOffset - 3, y - 4, 6, 8);
          ctx.globalAlpha = 1;
        }
      }
    }
  }, [config]);

  return (
    <div className="w-full h-full overflow-auto flex items-center justify-center bg-[var(--background)]">
      <canvas ref={canvasRef} className="border border-[var(--border)] rounded-lg" />
    </div>
  );
}
