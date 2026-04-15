"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const WAREHOUSE_X_RANGE = 20;

export function DotField({ sweepProgress }: { sweepProgress: number }) {
  const { basePositions, driftOffsets, count } = useMemo(() => {
    const GRID_X = 18;
    const GRID_Y = 10;
    const GRID_Z = 14;
    const CELL = 1.1;
    const X_OFFSET = -4;
    const Y_OFFSET = -2;
    const Z_OFFSET = 3;
    const cells = GRID_X * GRID_Y * GRID_Z * 2;

    const positions = new Float32Array(cells * 3);
    const drifts = new Float32Array(cells * 3);

    // Seeded pseudo-random — deterministic, always positive [0, 1)
    const seed = (n: number): number => {
      const x = Math.sin(n * 9999.1) * 43758.5453;
      return Math.abs(x - Math.floor(x));
    };

    let idx = 0;
    for (let xi = 0; xi < GRID_X; xi++) {
      for (let yi = 0; yi < GRID_Y; yi++) {
        for (let zi = 0; zi < GRID_Z; zi++) {
          for (let p = 0; p < 2; p++) {
            const jx = seed(idx * 3.1) - 0.5;
            const jy = seed(idx * 5.7) - 0.5;
            const jz = seed(idx * 7.3) - 0.5;
            positions[idx * 3]     = X_OFFSET + xi * CELL + jx * 0.7;
            positions[idx * 3 + 1] = Y_OFFSET + yi * CELL + jy * 0.7;
            positions[idx * 3 + 2] = Z_OFFSET + zi * CELL + jz * 0.7;

            drifts[idx * 3]     = (seed(idx * 11.2) - 0.5) * 0.9;
            drifts[idx * 3 + 1] = (seed(idx * 17.5) - 0.5) * 0.9;
            drifts[idx * 3 + 2] = (seed(idx * 23.1) - 0.5) * 0.9;

            idx++;
          }
        }
      }
    }
    return { basePositions: positions, driftOffsets: drifts, count: idx };
  }, []);

  const pointsRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<Float32Array | null>(null);
  const colorsRef = useRef<Float32Array | null>(null);

  // Initialize mutable live arrays — kept in refs so useFrame can mutate without re-render
  const { livePositions, liveColors } = useMemo(() => {
    const pos = new Float32Array(basePositions);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      col[i * 3]     = 0.79;
      col[i * 3 + 1] = 0.86;
      col[i * 3 + 2] = 0.22;
    }
    positionsRef.current = pos;
    colorsRef.current = col;
    return { livePositions: pos, liveColors: col };
  }, [basePositions, count]);

  const lastSweep = useRef(-1);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const sweepX = -2 + sweepProgress * WAREHOUSE_X_RANGE;
    if (Math.abs(sweepX - lastSweep.current) < 0.01) return;
    lastSweep.current = sweepX;

    const pos = positionsRef.current!;
    const col = colorsRef.current!;

    for (let i = 0; i < count; i++) {
      const baseX = basePositions[i * 3];
      const baseY = basePositions[i * 3 + 1];
      const baseZ = basePositions[i * 3 + 2];
      const passed = baseX < sweepX;

      if (passed) {
        pos[i * 3]     = baseX + driftOffsets[i * 3];
        pos[i * 3 + 1] = baseY + driftOffsets[i * 3 + 1];
        pos[i * 3 + 2] = baseZ + driftOffsets[i * 3 + 2];
        col[i * 3]     = 0.35;
        col[i * 3 + 1] = 0.38;
        col[i * 3 + 2] = 0.22;
      } else {
        // Subtle breath before the sweep
        const breath = Math.sin(state.clock.elapsedTime * 0.8 + i * 0.01) * 0.03;
        pos[i * 3]     = baseX;
        pos[i * 3 + 1] = baseY + breath;
        pos[i * 3 + 2] = baseZ;
        col[i * 3]     = 0.79;
        col[i * 3 + 1] = 0.86;
        col[i * 3 + 2] = 0.22;
      }
    }

    const geom = pointsRef.current.geometry;
    (geom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geom.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[livePositions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[liveColors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.11}
        vertexColors
        transparent
        opacity={0.95}
        sizeAttenuation
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}
