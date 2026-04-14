"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import type { Slot } from "@/lib/grid/types";
import * as THREE from "three";

interface SlotInstancesProps {
  slots: Slot[];
  activeSet: Set<string>;
  accentColor: THREE.Color;
}

// Convert slot position to 3D coords
function slotTo3D(slot: Slot): [number, number, number] {
  const zoneIndex = parseInt(slot.position.zone.replace("Z", "")) - 1; // 0..4
  const x = zoneIndex * 3.8 + slot.position.kolom * 0.38;
  const z = slot.position.rij * 0.38;
  const y = slot.position.hoogte_niveau * 0.44;
  return [x, y, z];
}

interface SlotEntry {
  id: string;
  pos: [number, number, number];
}

export function SlotInstances({
  slots,
  activeSet,
  accentColor,
}: SlotInstancesProps) {
  const entries = useMemo<SlotEntry[]>(
    () => slots.map((s) => ({ id: s.id, pos: slotTo3D(s) })),
    [slots]
  );

  // Use a single instanced mesh with manual color updates via useFrame
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const emissiveValues = useRef<Float32Array>(
    new Float32Array(slots.length).fill(0)
  );
  const colorArray = useRef<Float32Array>(
    new Float32Array(slots.length * 3).fill(0)
  );

  const activeIds = useRef<Set<string>>(new Set());

  // Update active set ref
  activeIds.current = activeSet;

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize instance matrices on mount
  const initDone = useRef(false);
  useFrame(() => {
    if (!meshRef.current) return;

    // Init matrices once
    if (!initDone.current) {
      initDone.current = true;
      for (let i = 0; i < entries.length; i++) {
        const [x, y, z] = entries[i].pos;
        dummy.position.set(x, y, z);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Animate emissive per instance
    const dt = 1 / 60; // approximate
    const accentR = accentColor.r;
    const accentG = accentColor.g;
    const accentB = accentColor.b;

    let dirty = false;
    for (let i = 0; i < entries.length; i++) {
      const isActive = activeIds.current.has(entries[i].id);
      const target = isActive ? 1.0 : 0.0;
      const speed = isActive ? dt / 0.8 : dt / 1.2;
      const prev = emissiveValues.current[i];
      const next = THREE.MathUtils.lerp(prev, target, Math.min(speed * 60, 1));
      if (Math.abs(next - prev) > 0.002) {
        emissiveValues.current[i] = next;
        dirty = true;
      }

      // base color: very dark blue-grey, lerp to accent when active
      const t = emissiveValues.current[i];
      const baseR = 0.04;
      const baseG = 0.045;
      const baseB = 0.06;
      colorArray.current[i * 3 + 0] = baseR + (accentR - baseR) * t;
      colorArray.current[i * 3 + 1] = baseG + (accentG - baseG) * t;
      colorArray.current[i * 3 + 2] = baseB + (accentB - baseB) * t;

      if (dirty || t > 0.01) {
        const col = new THREE.Color(
          colorArray.current[i * 3 + 0],
          colorArray.current[i * 3 + 1],
          colorArray.current[i * 3 + 2]
        );
        meshRef.current.setColorAt(i, col);
      }
    }

    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, entries.length]}>
      <boxGeometry args={[0.3, 0.38, 0.3]} />
      <meshStandardMaterial
        color={new THREE.Color(0x0a0c10)}
        emissive={accentColor}
        emissiveIntensity={0}
        roughness={0.7}
        metalness={0.3}
      />
    </instancedMesh>
  );
}
