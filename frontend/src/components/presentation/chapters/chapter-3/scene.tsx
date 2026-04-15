"use client";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

type Beat = 1 | 2 | 3 | 4;

interface SceneProps {
  beat: Beat;
  elapsed: number; // kept for API compat with index.tsx; internally unused
}

// ─── Vertex shader ────────────────────────────────────────────────────────────
const VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vPos;

void main() {
  vNormal = normalMatrix * normal;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewDir = -mv.xyz;
  vPos = position;
  gl_Position = projectionMatrix * mv;
}
`;

// ─── Fragment shader ─────────────────────────────────────────────────────────
const FRAG = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOrbIntensity;
uniform float uConnectionAlpha;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vPos;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(
      mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
      mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x),
      f.y
    ),
    mix(
      mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
      mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x),
      f.y
    ),
    f.z
  );
}

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vViewDir);

  // Fresnel — brighter at grazing angles
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);

  // Flowing noise on the surface
  float nsample = noise(vPos * 2.5 + vec3(uTime * 0.25, uTime * 0.15, uTime * 0.1));
  nsample += 0.5 * noise(vPos * 5.0 + vec3(-uTime * 0.3, 0.0, uTime * 0.2));
  nsample = smoothstep(0.3, 1.0, nsample);

  // Moving highlight band
  float band = sin(vPos.x * 3.0 + vPos.y * 2.0 + uTime * 0.8) * 0.5 + 0.5;
  band = smoothstep(0.55, 0.85, band);

  // Combine
  vec3 base = mix(uColorA, uColorB, nsample * 0.7);
  vec3 col = base;
  col += uColorB * fres * 1.4 * uOrbIntensity;
  col += uColorB * band * 0.35;

  // Connection state: when uConnectionAlpha > 0, add a subtle ring pulse
  float ring = smoothstep(0.5, 0.52, abs(nsample - 0.5)) * uConnectionAlpha;
  col += uColorB * ring * 0.6;

  gl_FragColor = vec4(col, 1.0);
}
`;

// ─── Scene root ──────────────────────────────────────────────────────────────
export function Scene({ beat }: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#0a0a0f", position: "absolute", inset: 0 }}
    >
      <PerspectiveCamera makeDefault position={[0, 0.5, 5]} fov={40} />
      <ambientLight intensity={0.15} />
      <CentralOrb beat={beat} />
      {beat === 3 && <Satellites />}
      <EffectComposer>
        <Bloom intensity={1.8} luminanceThreshold={0.3} luminanceSmoothing={0.9} />
        <Vignette eskil={false} offset={0.25} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  );
}

// ─── Central liquid-mercury orb ───────────────────────────────────────────────
function CentralOrb({ beat }: { beat: Beat }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color(0.08, 0.1, 0.04) },
      uColorB: { value: new THREE.Color(0.79, 0.86, 0.22) },
      uOrbIntensity: { value: 0.6 },
      uConnectionAlpha: { value: 0.0 },
    }),
    []
  );

  useFrame((state, delta) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    const targetIntensity = beat === 2 ? 1.0 : 0.7;
    const targetConn = beat === 3 ? 1.0 : 0.0;

    matRef.current.uniforms.uOrbIntensity.value +=
      (targetIntensity - matRef.current.uniforms.uOrbIntensity.value) * delta * 2.0;
    matRef.current.uniforms.uConnectionAlpha.value +=
      (targetConn - matRef.current.uniforms.uConnectionAlpha.value) * delta * 3.0;

    // Gentle breathing scale
    if (meshRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
      meshRef.current.scale.setScalar(s);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -1.5, 0]}>
      <icosahedronGeometry args={[1.2, 6]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        toneMapped={false}
      />
    </mesh>
  );
}

// ─── Orbital satellites (beat 3 only) ────────────────────────────────────────
function Satellites() {
  const configs = useMemo(() => {
    const c = [];
    for (let i = 0; i < 8; i++) {
      const plane = i < 4 ? 0 : 1;
      const axisTilt = plane === 0 ? 0 : Math.PI / 5;
      const radiusA = plane === 0 ? 2.4 : 2.1;
      const radiusB = plane === 0 ? 2.6 : 2.3;
      const phase = (i / 4) * Math.PI * 2 + plane * 0.8;
      const speed = 0.3 + i * 0.04;
      c.push({ axisTilt, radiusA, radiusB, phase, speed });
    }
    return c;
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    configs.forEach((cfg, i) => {
      const child = groupRef.current!.children[i];
      if (!child) return;
      const angle = t * cfg.speed + cfg.phase;
      const x = Math.cos(angle) * cfg.radiusA;
      const z = Math.sin(angle) * cfg.radiusB;
      const y = Math.sin(angle) * Math.sin(cfg.axisTilt) * cfg.radiusA;
      child.position.set(x, -1.5 + y * 0.5, z);
    });
  });

  return (
    <group ref={groupRef}>
      {configs.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshBasicMaterial color="#cada38" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
