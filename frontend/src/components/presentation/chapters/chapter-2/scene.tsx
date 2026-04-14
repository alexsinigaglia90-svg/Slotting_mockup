"use client";
import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, DepthOfField, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { Slot } from "@/lib/grid/types";
import { SlotInstances } from "./slot-instances";

type Phase = "compliance" | "ergonomics" | "continuity" | "summary";

const CAMERA_POSITIONS: Record<Phase, { pos: THREE.Vector3; target: THREE.Vector3; fov: number }> = {
  compliance: {
    pos: new THREE.Vector3(25, 35, 25),
    target: new THREE.Vector3(12, 0, 12),
    fov: 35,
  },
  ergonomics: {
    pos: new THREE.Vector3(40, 12, 25),
    target: new THREE.Vector3(12, 4, 12),
    fov: 40,
  },
  continuity: {
    pos: new THREE.Vector3(-10, 6, -10),
    target: new THREE.Vector3(12, 3, 12),
    fov: 50,
  },
  summary: {
    pos: new THREE.Vector3(8, 55, 55),
    target: new THREE.Vector3(12, 0, 12),
    fov: 38,
  },
};

const ACCENT_COLORS: Record<Phase, THREE.Color> = {
  compliance: new THREE.Color(0xcada38), // lime
  ergonomics: new THREE.Color(0xff4d4d), // red-orange
  continuity: new THREE.Color(0x38caff), // cyan
  summary: new THREE.Color(0xcada38), // lime union
};

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

interface CameraRigProps {
  phase: Phase;
}

function CameraRig({ phase }: CameraRigProps) {
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;

  const fromPos = useRef(new THREE.Vector3().copy(CAMERA_POSITIONS[phase].pos));
  const fromTarget = useRef(new THREE.Vector3().copy(CAMERA_POSITIONS[phase].target));
  const fromFov = useRef(CAMERA_POSITIONS[phase].fov);
  const animT = useRef(1.0);
  const prevPhase = useRef(phase);

  useEffect(() => {
    if (phase !== prevPhase.current) {
      fromPos.current.copy(cam.position);
      fromTarget.current.copy(
        new THREE.Vector3(
          cam.position.x + cam.getWorldDirection(new THREE.Vector3()).x * 20,
          cam.position.y + cam.getWorldDirection(new THREE.Vector3()).y * 20,
          cam.position.z + cam.getWorldDirection(new THREE.Vector3()).z * 20
        )
      );
      fromFov.current = cam.fov;
      animT.current = 0;
      prevPhase.current = phase;
    }
  }, [phase, cam]);

  const targetLook = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    const cfg = CAMERA_POSITIONS[phase];
    animT.current = Math.min(animT.current + delta / 1.2, 1.0);
    const t = easeInOutQuart(animT.current);

    cam.position.lerpVectors(fromPos.current, cfg.pos, t);
    targetLook.current.lerpVectors(fromTarget.current, cfg.target, t);
    cam.lookAt(targetLook.current);
    cam.fov = fromFov.current + (cfg.fov - fromFov.current) * t;
    cam.updateProjectionMatrix();
  });

  return null;
}

// Simple particle system using Points geometry
interface ParticleBurstProps {
  centroid: THREE.Vector3;
  color: THREE.Color;
  active: boolean;
}

function ParticleBurst({ centroid, color, active }: ParticleBurstProps) {
  const ref = useRef<THREE.Points>(null!);
  const particleCount = 160;
  const lifetimes = useRef<Float32Array>(new Float32Array(particleCount).fill(-1));
  const velocities = useRef<Float32Array>(new Float32Array(particleCount * 3).fill(0));
  const fired = useRef(false);

  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = centroid.x;
      arr[i * 3 + 1] = centroid.y;
      arr[i * 3 + 2] = centroid.z;
    }
    return arr;
  }, [centroid.x, centroid.y, centroid.z]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
    return g;
  }, [positions]);

  useEffect(() => {
    if (active && !fired.current) {
      fired.current = true;
      // Initialize particles
      for (let i = 0; i < particleCount; i++) {
        lifetimes.current[i] = 1.2; // 1.2s lifetime
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 2 + Math.random() * 8;
        velocities.current[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
        velocities.current[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
        velocities.current[i * 3 + 2] = Math.cos(phi) * speed;
      }
      const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        posAttr.setXYZ(i, centroid.x, centroid.y, centroid.z);
      }
      posAttr.needsUpdate = true;
    }
    if (!active) {
      fired.current = false;
    }
  }, [active, centroid, geo]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    let anyAlive = false;
    for (let i = 0; i < particleCount; i++) {
      if (lifetimes.current[i] <= 0) continue;
      lifetimes.current[i] -= delta;
      if (lifetimes.current[i] > 0) {
        anyAlive = true;
        const px = posAttr.getX(i) + velocities.current[i * 3] * delta;
        const py = posAttr.getY(i) + velocities.current[i * 3 + 1] * delta;
        const pz = posAttr.getZ(i) + velocities.current[i * 3 + 2] * delta;
        posAttr.setXYZ(i, px, py, pz);
      }
    }
    if (anyAlive) posAttr.needsUpdate = true;
  });

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color,
        size: 0.15,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
      }),
    [color]
  );

  return <points ref={ref} geometry={geo} material={mat} />;
}

interface SceneContentProps {
  phase: Phase;
  slots: Slot[];
  activeSet: Set<string>;
  summarySet: Set<string>;
}

function SceneContent({ phase, slots, activeSet, summarySet }: SceneContentProps) {
  const displaySet = phase === "summary" ? summarySet : activeSet;
  const accentColor = ACCENT_COLORS[phase];

  // Compute centroid of active slots
  const centroid = useMemo(() => {
    const active = slots.filter((s) => displaySet.has(s.id));
    if (active.length === 0) return new THREE.Vector3(12, 2, 6);
    let x = 0, y = 0, z = 0;
    for (const s of active) {
      const zi = parseInt(s.position.zone.replace("Z", "")) - 1;
      x += zi * 3.8 + s.position.kolom * 0.38;
      y += s.position.hoogte_niveau * 0.44;
      z += s.position.rij * 0.38;
    }
    return new THREE.Vector3(x / active.length, y / active.length, z / active.length);
  }, [slots, displaySet]);

  const [burstKey, setBurstKey] = useState(0);
  const prevPhase = useRef(phase);
  useEffect(() => {
    if (phase !== prevPhase.current) {
      prevPhase.current = phase;
      setBurstKey((k) => k + 1);
    }
  }, [phase]);

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight
        position={[12, 20, 12]}
        intensity={phase === "summary" ? 3.0 : 1.5}
        color={accentColor}
        distance={60}
      />
      <directionalLight position={[20, 30, 10]} intensity={0.4} />

      <CameraRig phase={phase} />

      <SlotInstances
        slots={slots}
        activeSet={displaySet}
        accentColor={accentColor}
      />

      <ParticleBurst
        key={burstKey}
        centroid={centroid}
        color={accentColor}
        active={true}
      />

      <EffectComposer>
        <Bloom
          intensity={1.4}
          luminanceThreshold={0.4}
          luminanceSmoothing={0.9}
        />
        <DepthOfField
          focusDistance={0.02}
          focalLength={0.05}
          bokehScale={3}
        />
        <Vignette eskil={false} offset={0.3} darkness={0.85} />
      </EffectComposer>
    </>
  );
}

interface WarehouseSceneProps {
  phase: Phase;
  slots: Slot[];
  activeSet: Set<string>;
  summarySet: Set<string>;
}

export function WarehouseScene({
  phase,
  slots,
  activeSet,
  summarySet,
}: WarehouseSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [25, 35, 25], fov: 35, near: 0.1, far: 500 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#050608" }}
    >
      <SceneContent
        phase={phase}
        slots={slots}
        activeSet={activeSet}
        summarySet={summarySet}
      />
    </Canvas>
  );
}
