"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Environment } from "@react-three/drei";
import { Suspense, useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import {
  generateAllPositions,
  getWarehouseCenter,
  getWarehouseBounds,
  RACK_WIDTH,
  RACK_HEIGHT,
  RACK_DEPTH,
} from "@/lib/warehouse-geometry";
import { DEFAULT_WAREHOUSE_CONFIG } from "@/lib/types";
import { getVelocityClass, VELOCITY_COLORS } from "@/lib/color-scales";

/* ───── Instanced Racks ───── */
function InstancedRacks() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const positions = useMemo(() => generateAllPositions(), []);
  const count = positions.length;
  const config = DEFAULT_WAREHOUSE_CONFIG;

  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    positions.forEach((pos, i) => {
      matrix.setPosition(pos.worldX, pos.worldY, pos.worldZ);
      mesh.setMatrixAt(i, matrix);

      const vel = getVelocityClass(pos.aisleIndex, pos.level, config.numAisles);
      color.set(VELOCITY_COLORS[vel]);
      mesh.setColorAt(i, color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [positions, config.numAisles]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[RACK_WIDTH, RACK_HEIGHT, RACK_DEPTH]} />
      <meshStandardMaterial
        vertexColors
        metalness={0.15}
        roughness={0.6}
        envMapIntensity={0.5}
      />
    </instancedMesh>
  );
}

/* ───── Floor ───── */
function Floor() {
  const bounds = getWarehouseBounds();
  const center = getWarehouseCenter();

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[center.x, -0.01, center.z]}
      receiveShadow
    >
      <planeGeometry args={[bounds.width + 20, bounds.depth + 20]} />
      <meshStandardMaterial color="#1a1a2e" roughness={0.95} />
    </mesh>
  );
}

/* ───── Grid Overlay ───── */
function FloorGrid() {
  const center = getWarehouseCenter();
  const config = DEFAULT_WAREHOUSE_CONFIG;
  const lines: React.ReactElement[] = [];

  // Aisle center lines
  for (let a = 0; a < config.numAisles; a++) {
    const x = a * config.aisleSpacingM;
    lines.push(
      <mesh key={`aisle-${a}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.005, center.z]}>
        <planeGeometry args={[0.08, config.aisleLengthM + 2]} />
        <meshBasicMaterial color="#334155" transparent opacity={0.5} />
      </mesh>
    );
  }

  return <>{lines}</>;
}

/* ───── Cross-Aisles ───── */
function CrossAisles() {
  const config = DEFAULT_WAREHOUSE_CONFIG;
  const width = (config.numAisles - 1) * config.aisleSpacingM + 8;
  const centerX = ((config.numAisles - 1) * config.aisleSpacingM) / 2;

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.01, 0]}>
        <planeGeometry args={[width, 3.5]} />
        <meshStandardMaterial color="#252540" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.01, config.aisleLengthM]}>
        <planeGeometry args={[width, 3.5]} />
        <meshStandardMaterial color="#252540" roughness={0.9} />
      </mesh>
    </>
  );
}

/* ───── Depot Marker ───── */
function DepotMarker() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.5;
    }
  });

  return (
    <group position={[-3, 0, -2]}>
      {/* Glowing disc */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 32]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={2}
          transparent
          opacity={0.3}
        />
      </mesh>
      {/* Spinning ring */}
      <mesh ref={ringRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.3, 32]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={1.5}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Center dot */}
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={3} />
      </mesh>
      <Text
        position={[0, 2.5, 0]}
        fontSize={1.2}
        color="#4ade80"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        DEPOT
      </Text>
    </group>
  );
}

/* ───── Aisle Labels ───── */
function AisleLabels() {
  const config = DEFAULT_WAREHOUSE_CONFIG;
  return (
    <>
      {Array.from({ length: config.numAisles }, (_, i) => (
        <Text
          key={i}
          position={[i * config.aisleSpacingM, config.levelsPerRack * RACK_HEIGHT + 1.5, -2]}
          fontSize={1.0}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {`A${String(i + 1).padStart(2, "0")}`}
        </Text>
      ))}
    </>
  );
}

/* ───── Rack Frame Outlines ───── */
function RackFrames() {
  const config = DEFAULT_WAREHOUSE_CONFIG;
  const totalHeight = config.levelsPerRack * RACK_HEIGHT;
  const frames: React.ReactElement[] = [];

  for (let a = 0; a < config.numAisles; a++) {
    const aisleX = a * config.aisleSpacingM;
    for (const side of ["left", "right"] as const) {
      const xOffset = side === "left" ? -2.0 : 2.0;
      // Vertical posts at start and end
      for (const z of [2, config.aisleLengthM]) {
        frames.push(
          <mesh
            key={`frame-${a}-${side}-${z}`}
            position={[aisleX + xOffset, totalHeight / 2, z]}
          >
            <boxGeometry args={[0.06, totalHeight, 0.06]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
        );
      }
    }
  }

  return <>{frames}</>;
}

/* ───── Main Scene ───── */
interface WarehouseSceneProps {
  pickRouteWaypoints?: string[];
  pickRouteColor?: string;
}

export default function WarehouseScene({ pickRouteWaypoints, pickRouteColor }: WarehouseSceneProps) {
  const center = getWarehouseCenter();

  return (
    <div className="w-full h-full" style={{ minHeight: "100vh" }}>
      <Canvas
        shadows
        camera={{
          position: [center.x - 15, 25, center.z + 35],
          fov: 45,
          near: 0.1,
          far: 500,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        style={{ background: "#0d0d1a" }}
      >
        <Suspense fallback={null}>
          {/* Lighting — dramatic and visible */}
          <ambientLight intensity={0.6} color="#c8d0e0" />
          <directionalLight
            position={[40, 50, 30]}
            intensity={1.5}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={200}
            shadow-camera-left={-80}
            shadow-camera-right={80}
            shadow-camera-top={60}
            shadow-camera-bottom={-60}
          />
          <directionalLight
            position={[-20, 30, -10]}
            intensity={0.4}
            color="#6366f1"
          />
          {/* Hemisphere light for ambient color variation */}
          <hemisphereLight
            args={["#1e1b4b", "#0f172a", 0.4]}
          />

          {/* Scene Elements */}
          <Floor />
          <FloorGrid />
          <CrossAisles />
          <DepotMarker />
          <AisleLabels />
          <RackFrames />
          <InstancedRacks />

          {/* Fog for depth */}
          <fog attach="fog" args={["#0d0d1a", 60, 180]} />

          {/* Camera Controls */}
          <OrbitControls
            target={[center.x, center.y, center.z]}
            enableDamping
            dampingFactor={0.08}
            maxPolarAngle={Math.PI / 2.05}
            minDistance={8}
            maxDistance={120}
            rotateSpeed={0.5}
            zoomSpeed={0.8}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
