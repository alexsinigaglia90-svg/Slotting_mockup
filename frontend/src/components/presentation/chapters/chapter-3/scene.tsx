"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

type Beat = 1 | 2 | 3 | 4;

interface SceneProps {
  beat: Beat;
  elapsed: number;
}

// 8 connection line directions radiating from center
const LINE_TARGETS = [
  new THREE.Vector3(6, 4, 0),
  new THREE.Vector3(-6, 4, 0),
  new THREE.Vector3(0, 6, 0),
  new THREE.Vector3(0, -6, 0),
  new THREE.Vector3(5, -4, 0),
  new THREE.Vector3(-5, -4, 0),
  new THREE.Vector3(4, 5, 0),
  new THREE.Vector3(-4, 5, 0),
  new THREE.Vector3(6, 0, 0),
  new THREE.Vector3(-6, 0, 0),
];

export function Scene({ beat, elapsed }: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#0a0a0f", position: "absolute", inset: 0 }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
      <ambientLight intensity={0.05} />
      <Orb beat={beat} elapsed={elapsed} />
      {beat === 3 &&
        LINE_TARGETS.map((target, i) => (
          <ConnectionLine key={i} target={target} index={i} elapsed={elapsed} />
        ))}
      <EffectComposer>
        <Bloom intensity={1.8} luminanceThreshold={0.3} luminanceSmoothing={0.9} />
        <Vignette eskil={false} offset={0.25} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  );
}

function Orb({ beat, elapsed }: { beat: Beat; elapsed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current || !innerRef.current) return;
    const t = state.clock.getElapsedTime();

    // Breathing pulse: base scale + breath
    let baseScale = 1.0;
    let emissiveIntensity = 1.5;

    if (beat === 1) {
      baseScale = 1.0;
      emissiveIntensity = 1.5;
    } else if (beat === 2) {
      baseScale = 1.25;
      emissiveIntensity = 3.0;
    } else if (beat === 3) {
      baseScale = 1.15;
      emissiveIntensity = 2.2;
    } else if (beat === 4) {
      // Contracts back
      baseScale = 1.0;
      emissiveIntensity = 1.2;
    }

    const breath = Math.sin(t * Math.PI) * 0.05; // 0.05 amplitude = 1.0→1.1 range
    const scale = baseScale + breath;

    meshRef.current.scale.setScalar(scale);
    innerRef.current.scale.setScalar(scale * 0.65);

    // Update emissive on material
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = emissiveIntensity + Math.sin(t * 2) * 0.3;

    const innerMat = innerRef.current.material as THREE.MeshStandardMaterial;
    innerMat.emissiveIntensity = emissiveIntensity * 0.6;
  });

  return (
    <>
      {/* Outer orb */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1, 4]} />
        <meshStandardMaterial
          color="#cada38"
          emissive="#cada38"
          emissiveIntensity={1.5}
          roughness={0.15}
          metalness={0.1}
          toneMapped={false}
        />
      </mesh>
      {/* Inner brighter core */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1, 3]} />
        <meshStandardMaterial
          color="#edf5a8"
          emissive="#ffffff"
          emissiveIntensity={0.9}
          roughness={0.0}
          metalness={0.0}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

function ConnectionLine({
  target,
  index,
  elapsed,
}: {
  target: THREE.Vector3;
  index: number;
  elapsed: number;
}) {
  const lineRef = useRef<THREE.Line>(null!);
  const particleRef = useRef<THREE.Mesh>(null);

  const points = [new THREE.Vector3(0, 0, 0), target];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Stagger fade-in per line
    const staggerDelay = index * 0.12;
    const age = Math.max(0, t - staggerDelay);
    const opacity = Math.min(1, age * 2) * 0.55;

    if (lineRef.current) {
      (lineRef.current.material as THREE.LineBasicMaterial).opacity = opacity;
    }

    // Animate particle along line
    if (particleRef.current) {
      const speed = 0.4 + index * 0.03;
      const frac = ((t * speed + index * 0.3) % 1.2) / 1.2;
      const clampedFrac = Math.min(1, Math.max(0, frac));
      const pos = new THREE.Vector3().lerpVectors(points[0], target, clampedFrac);
      particleRef.current.position.copy(pos);
      // Fade out toward end
      const particleOpacity = Math.max(0, 1 - clampedFrac * 1.5);
      (particleRef.current.material as THREE.MeshBasicMaterial).opacity =
        particleOpacity * opacity * 1.8;
    }
  });

  return (
    <>
      <primitive
        object={
          (() => {
            const line = new THREE.Line(
              geometry,
              new THREE.LineBasicMaterial({
                color: "#cada38",
                transparent: true,
                opacity: 0,
                toneMapped: false,
              })
            );
            (line as unknown as THREE.Line & { __lineRef?: boolean }).__lineRef = true;
            return line;
          })()
        }
        ref={lineRef}
      />
      <mesh ref={particleRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial
          color="#edf5a8"
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}
