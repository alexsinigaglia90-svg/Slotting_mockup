"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { SlotInstances } from "./slot-instances";

type Beat = 1 | 2 | 3 | 4;

interface SceneProps {
  sweepProgress: number;
  beat: Beat;
}

export function Scene({ sweepProgress, beat }: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#0a0a0f", position: "absolute", inset: 0 }}
    >
      <PerspectiveCamera makeDefault position={[10, 8, 20]} fov={40} />
      <CameraDrift beat={beat} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[15, 20, 10]} intensity={0.4} color="#ffffff" />
      <SlotInstances sweepProgress={sweepProgress} />
      <SweepFrontPlane sweepProgress={sweepProgress} />
      <EffectComposer>
        <Bloom intensity={1.2} luminanceThreshold={0.35} luminanceSmoothing={0.9} />
        <Vignette eskil={false} offset={0.2} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}

function CameraDrift({ beat }: { beat: Beat }) {
  useFrame((state, delta) => {
    // Slow forward drift: camera z decreases by ~2 over 35s = ~0.057/s
    state.camera.position.z -= delta * 0.057;
    // In beat 3+, drift camera slightly lower
    const targetY = beat >= 3 ? 7 : 8;
    state.camera.position.y += (targetY - state.camera.position.y) * delta * 0.8;
    state.camera.lookAt(12, 2, 12);
  });
  return null;
}

function SweepFrontPlane({ sweepProgress }: { sweepProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    // Warehouse X range ~ -2 to 18. Sweep position x = -2 + sweepProgress * 20.
    const x = -2 + sweepProgress * 20;
    meshRef.current.position.x = x;
    meshRef.current.visible = sweepProgress > 0.001 && sweepProgress < 0.999;
  });

  return (
    <mesh ref={meshRef} position={[-2, 3, 6]}>
      <planeGeometry args={[0.25, 14]} />
      <meshBasicMaterial
        color={new THREE.Color("#cada38")}
        transparent
        opacity={0.85}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
