"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
  }

  float blob(vec2 uv, vec2 center, float radius, float softness) {
    float d = length(uv - center);
    return smoothstep(radius, radius - softness, d);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

    float t = uTime * 0.06;

    vec2 c1 = vec2(sin(t * 0.7) * 0.35 + 0.15, cos(t * 0.6) * 0.25 + 0.2);
    vec2 c2 = vec2(cos(t * 0.5) * 0.4 - 0.2, sin(t * 0.8) * 0.3 - 0.15);
    vec2 c3 = vec2(sin(t * 1.1) * 0.25, cos(t * 0.9) * 0.2 + 0.1);

    float b1 = blob(p, c1, 0.55, 0.55) * 0.55;
    float b2 = blob(p, c2, 0.45, 0.5) * 0.4;
    float b3 = blob(p, c3, 0.35, 0.4) * 0.3;

    vec3 lime  = vec3(0.792, 0.855, 0.220);  // #cada38 — CICT lime
    vec3 white = vec3(0.92, 0.92, 0.94);     // soft off-white
    vec3 bg    = vec3(0.039, 0.039, 0.059);

    vec3 col = bg;
    col += lime * b1 * 0.95;
    col += white * b2 * 0.22;
    col += lime * b3 * 0.55;

    float n = noise(uv * uResolution.xy * 0.35 + uTime * 0.5) - 0.5;
    col += n * 0.035;

    float vig = 1.0 - length(p) * 0.8;
    col *= clamp(vig, 0.55, 1.0);

    // Slow luminance pulse
    float pulse = 0.96 + 0.04 * sin(uTime * 0.4);
    col *= pulse;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function ShaderPlane() {
  const ref = useRef<THREE.ShaderMaterial>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.uniforms.uTime.value = state.clock.elapsedTime;
      const { width, height } = state.size;
      ref.current.uniforms.uResolution.value.set(width, height);
    }
  });
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={ref}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={{
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(1, 1) },
        }}
      />
    </mesh>
  );
}

export function HeroShader() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1 }}
        gl={{ antialias: false, alpha: false }}
        dpr={[1, 2]}
      >
        <ShaderPlane />
      </Canvas>
    </div>
  );
}
