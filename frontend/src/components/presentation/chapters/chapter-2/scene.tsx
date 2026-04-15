"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { DotField } from "./dot-field";

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
      <ambientLight intensity={0.1} />
      <DotField sweepProgress={sweepProgress} />
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
    state.camera.lookAt(8, 4, 10);
  });
  return null;
}

