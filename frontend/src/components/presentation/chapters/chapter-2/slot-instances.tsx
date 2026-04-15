"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildFixtureGrid } from "@/lib/grid";

const ZONE_SPACING = 4;
const COL_SPACING = 0.7;
const ROW_SPACING = 0.9;
const LEVEL_SPACING = 0.35;
const WAREHOUSE_X_RANGE = 20;

interface SlotInstancesProps {
  sweepProgress: number;
}

export function SlotInstances({ sweepProgress }: SlotInstancesProps) {
  const grid = useMemo(() => buildFixtureGrid(), []);

  const { positions, driftOffsets, count } = useMemo(() => {
    const positions: { x: number; y: number; z: number }[] = [];
    const driftOffsets: { ry: number; dy: number }[] = [];

    for (const slot of grid.slots) {
      const zoneNum = parseInt(slot.position.zone.replace(/\D/g, ""), 10) || 1;
      const x = (zoneNum - 1) * ZONE_SPACING + slot.position.kolom * COL_SPACING - 2;
      const zDepth = slot.position.rij * ROW_SPACING;
      const y = slot.position.hoogte_niveau * LEVEL_SPACING;
      positions.push({ x, y, z: zDepth });

      // Deterministic drift from slot id hash
      const hash = slot.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      driftOffsets.push({
        ry: ((hash % 17) - 8) * 0.01, // -0.08 to +0.08 rad
        dy: ((hash % 13) - 6) * 0.015, // -0.09 to +0.09 units
      });
    }

    return { positions, driftOffsets, count: positions.length };
  }, [grid]);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tmpObj = useMemo(() => new THREE.Object3D(), []);

  // Track previous sweep X to only update changed slots
  const prevSweepX = useRef<number>(-999);

  useFrame(() => {
    if (!meshRef.current) return;
    const sweepX = -2 + sweepProgress * WAREHOUSE_X_RANGE;

    // Only do full update if sweep has moved
    if (Math.abs(sweepX - prevSweepX.current) < 0.001 && sweepProgress > 0 && sweepProgress < 1) {
      return;
    }
    prevSweepX.current = sweepX;

    for (let i = 0; i < count; i++) {
      const p = positions[i];
      const d = driftOffsets[i];
      const passed = p.x < sweepX;

      tmpObj.position.set(p.x, p.y + (passed ? d.dy : 0), p.z);
      tmpObj.rotation.set(0, passed ? d.ry : 0, 0);
      tmpObj.scale.set(1, 1, 1);
      tmpObj.updateMatrix();
      meshRef.current.setMatrixAt(i, tmpObj.matrix);

      // Color: lime for pristine, desaturated grey for swept
      const color = passed
        ? new THREE.Color(0.35, 0.38, 0.22)
        : new THREE.Color(0.79, 0.86, 0.22);
      meshRef.current.setColorAt(i, color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <boxGeometry args={[0.35, 0.3, 0.35]} />
      <meshStandardMaterial
        vertexColors
        emissive={new THREE.Color("#cada38")}
        emissiveIntensity={0.6}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
