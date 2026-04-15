"use client";
import { useRef, useEffect } from "react";

export interface SpikeEvent {
  /** normalized x position [0,1] where spike was born (always 1.0 = right edge) */
  spawnX: number;
  /** wall-clock ms when the spike was spawned */
  spawnedAt: number;
  /** peak amplitude in px */
  amplitude: number;
  /** travel speed: units of normalized-x per second */
  speed: number;
  /** decay half-life in ms */
  halfLife: number;
}

interface WaveformCanvasProps {
  /** mutable ref array of spike events owned by parent */
  spikesRef: React.MutableRefObject<SpikeEvent[]>;
  /** whether to flatten (beat 6) */
  settling: boolean;
}

const LIME = "rgba(202, 218, 56,";
const NUM_POINTS = 900;

export function WaveformCanvas({ spikesRef, settling }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let startTime = performance.now();

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (now: number) => {
      const elapsed = (now - startTime) / 1000; // seconds
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;

      ctx.clearRect(0, 0, W, H);

      // Baseline y — 55% height
      const baseY = H * 0.55;

      // Build points
      const pts: { x: number; y: number }[] = [];

      for (let i = 0; i < NUM_POINTS; i++) {
        const t = i / (NUM_POINTS - 1); // 0..1 normalized x
        const px = t * W;

        // Ambient sine ripple — quieter when settling
        const ambientAmp = settling ? 2 : 6;
        const ambientY =
          Math.sin(t * 14 + elapsed * 0.8) * ambientAmp +
          Math.sin(t * 7 - elapsed * 1.3) * (ambientAmp * 0.5);

        // Accumulate spikes at this x
        let spikeY = 0;
        const nowMs = now;
        for (const spike of spikesRef.current) {
          if (settling) continue; // flatten during beat 6
          const age = (nowMs - spike.spawnedAt) / 1000; // age in seconds
          // Current x position of spike center (travels left over time)
          const spikeX = spike.spawnX - spike.speed * age;
          if (spikeX < -0.3) continue; // well off screen

          // Decay
          const decay = Math.pow(0.5, (age * 1000) / spike.halfLife);
          const currentAmp = spike.amplitude * decay;

          // Gaussian envelope around spikeX
          const spread = 0.04 + age * 0.015; // widens slightly over time
          const dx = t - spikeX;
          const gaussian = Math.exp((-dx * dx) / (2 * spread * spread));

          spikeY += currentAmp * gaussian;
        }

        pts.push({ x: px, y: baseY - ambientY - spikeY });
      }

      // Draw the waveform path
      ctx.save();
      ctx.beginPath();

      // Build gradient for edge fade
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, `${LIME} 0)`);
      grad.addColorStop(0.08, `${LIME} 1)`);
      grad.addColorStop(0.92, `${LIME} 1)`);
      grad.addColorStop(1, `${LIME} 0)`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = settling ? 2.5 : 1.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Shadow glow
      ctx.shadowBlur = settling ? 28 : 18;
      ctx.shadowColor = "rgba(202, 218, 56, 0.75)";

      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        // Smooth catmull-rom via control points
        const cpX = (prev.x + curr.x) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, cpX, (prev.y + curr.y) / 2);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();

      // Extra glow pass — wider, less opaque
      ctx.beginPath();
      ctx.lineWidth = settling ? 8 : 5;
      ctx.shadowBlur = settling ? 48 : 32;
      ctx.shadowColor = "rgba(202, 218, 56, 0.4)";
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = grad;
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const cpX = (prev.x + curr.x) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, cpX, (prev.y + curr.y) / 2);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [spikesRef, settling]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
