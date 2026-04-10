"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import { Suspense, useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import {
  generateAllPositions,
  getWarehouseCenter,
  RACK_WIDTH,
  RACK_HEIGHT,
  RACK_DEPTH,
} from "@/lib/warehouse-geometry";
import { DEFAULT_WAREHOUSE_CONFIG } from "@/lib/types";
import { getVelocityClass, VELOCITY_COLORS } from "@/lib/color-scales";
import PickRouteLine from "./pick-route-line";

function InstancedRacks() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const positions = useMemo(() => generateAllPositions(), []);
  const count = positions.length;

  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    const config = DEFAULT_WAREHOUSE_CONFIG;
    positions.forEach((pos, i) => {
      matrix.setPosition(pos.worldX, pos.worldY, pos.worldZ);
      mesh.setMatrixAt(i, matrix);

      // Color based on velocity class (aisle distance + level)
      const vel = getVelocityClass(pos.aisleIndex, pos.level, config.numAisles);
      color.set(VELOCITY_COLORS[vel]);
      mesh.setColorAt(i, color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[RACK_WIDTH, RACK_HEIGHT, RACK_DEPTH]} />
      <meshStandardMaterial vertexColors metalness={0.3} roughness={0.7} />
    </instancedMesh>
  );
}

function Floor() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[30, -0.01, 20]}>
        <planeGeometry args={[100, 60]} />
        <meshStandardMaterial color="#111118" />
      </mesh>
      <Grid
        args={[100, 60]}
        position={[30, 0, 20]}
        cellSize={4.5}
        cellThickness={0.5}
        cellColor="#1a1a2e"
        sectionSize={4.5}
        sectionThickness={0.5}
        sectionColor="#1a1a2e"
        fadeDistance={100}
        infiniteGrid={false}
      />
    </>
  );
}

function CrossAisles() {
  const config = DEFAULT_WAREHOUSE_CONFIG;
  const width = (config.numAisles - 1) * config.aisleSpacingM + 4;
  const centerX = ((config.numAisles - 1) * config.aisleSpacingM) / 2;

  return (
    <>
      {/* Front cross-aisle at z=0 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.005, 0]}>
        <planeGeometry args={[width, 3]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Back cross-aisle at z=40 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.005, config.aisleLengthM]}>
        <planeGeometry args={[width, 3]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    </>
  );
}

function DepotMarker() {
  return (
    <group position={[0, 0, -2]}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.1, 32]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>
      <Text position={[0, 1, 0]} fontSize={0.8} color="#22c55e" anchorX="center" anchorY="middle">
        DEPOT
      </Text>
    </group>
  );
}

function AisleLabels() {
  const config = DEFAULT_WAREHOUSE_CONFIG;
  return (
    <>
      {Array.from({ length: config.numAisles }, (_, i) => (
        <Text
          key={i}
          position={[i * config.aisleSpacingM, 3, -1]}
          fontSize={0.6}
          color="#64748b"
          anchorX="center"
          anchorY="middle"
        >
          {`A${String(i + 1).padStart(2, "0")}`}
        </Text>
      ))}
    </>
  );
}

interface WarehouseSceneProps {
  pickRouteWaypoints?: string[];
  pickRouteColor?: string;
}

export default function WarehouseScene({ pickRouteWaypoints, pickRouteColor }: WarehouseSceneProps = {}) {
  const center = getWarehouseCenter();

  return (
    <div className="w-full h-full" style={{ minHeight: "calc(100vh - 0px)" }}>
      <Canvas
        camera={{
          position: [center.x + 45, 35, center.z + 30],
          fov: 50,
          near: 0.1,
          far: 500,
        }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ background: "#0a0a0f" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[30, 40, 20]} intensity={0.8} />
          <Floor />
          <CrossAisles />
          <DepotMarker />
          <AisleLabels />
          <InstancedRacks />
          {pickRouteWaypoints && pickRouteWaypoints.length >= 2 && (
            <PickRouteLine waypoints={pickRouteWaypoints} color={pickRouteColor} />
          )}
          <OrbitControls
            target={[center.x, center.y, center.z]}
            enableDamping
            dampingFactor={0.1}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={5}
            maxDistance={150}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
