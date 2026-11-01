"use client";

import { Line, OrbitControls, PerformanceMonitor, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useMemo, useState } from "react";
import * as THREE from "three";
import type { ExperienceTier } from "@/lib/cinematic";
import { browserSupportsWebGl } from "@/lib/webgl";

const COORDINATES: Record<string, [number, number]> = {
  tourism: [28.2, 84],
  "loan-risk": [27.72, 85.32],
  remittance: [26.81, 87.28]
};

export function DatasetGlobeV3({
  tier,
  datasetIds,
  selectedId,
  onSelect
}: {
  tier: ExperienceTier;
  datasetIds: string[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [failed, setFailed] = useState(() => !browserSupportsWebGl());
  const [dpr, setDpr] = useState(tier === "full" ? 1.3 : 1);

  if (tier === "static" || failed) {
    return (
      <div className="v3-globe-fallback" role="img" aria-label="Static dataset map fallback">
        <strong>Dataset atlas</strong>
        <p>WebGL is paused. Use the dataset controls to inspect Tourism, Loan Risk, and Remittance.</p>
      </div>
    );
  }

  return (
    <div className="v3-globe-canvas" aria-label="Interactive selectable dataset globe">
      <Canvas
        frameloop="demand"
        dpr={dpr}
        gl={{ alpha: true, antialias: tier === "full", powerPreference: "high-performance" }}
        onCreated={({ gl, invalidate }) => {
          gl.domElement.addEventListener("webglcontextlost", (event) => {
            event.preventDefault();
            setFailed(true);
          }, { once: true });
          invalidate();
        }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(tier === "full" ? 1.3 : 1)}
        >
          <GlobeRig datasetIds={datasetIds} selectedId={selectedId} onSelect={onSelect} />
        </PerformanceMonitor>
      </Canvas>
    </div>
  );
}

function GlobeRig({ datasetIds, selectedId, onSelect }: { datasetIds: string[]; selectedId: string; onSelect: (id: string) => void }) {
  const { invalidate } = useThree();
  const latitudes = useMemo(() => [-60, -30, 0, 30, 60].map((latitude) => latitudeLine(latitude)), []);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.15, 4.7]} fov={43} />
      <ambientLight intensity={1.7} />
      <hemisphereLight args={["aliceblue", "sienna", 2]} />
      <directionalLight position={[4, 5, 4]} intensity={4.5} color="papayawhip" />
      <pointLight position={[-3, -1, 2]} intensity={11} color="goldenrod" />
      <group rotation={[0.1, -0.54, -0.04]}>
        <mesh>
          <sphereGeometry args={[1.48, 64, 64]} />
          <meshPhysicalMaterial color="midnightblue" roughness={0.5} metalness={0.18} clearcoat={0.32} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.53, 48, 48]} />
          <meshBasicMaterial color="lightcyan" transparent opacity={0.09} side={THREE.BackSide} />
        </mesh>
        {latitudes.map((line, index) => <Line key={index} points={line} color="lightgoldenrodyellow" transparent opacity={0.22} lineWidth={0.75} />)}
        {datasetIds.map((id) => (
          <mesh
            key={id}
            position={latLongToVector3(...(COORDINATES[id] || [27.72, 85.32]), 1.54)}
            scale={selectedId === id ? 1.42 : 1}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(id);
              invalidate();
            }}
          >
            <sphereGeometry args={[0.075, 18, 18]} />
            <meshStandardMaterial
              color={selectedId === id ? "orangered" : "goldenrod"}
              emissive={selectedId === id ? "firebrick" : "darkgoldenrod"}
              emissiveIntensity={2}
            />
          </mesh>
        ))}
      </group>
      <OrbitControls
        enablePan={false}
        enableDamping={false}
        minDistance={3.9}
        maxDistance={5.3}
        rotateSpeed={0.46}
        onChange={() => invalidate()}
      />
    </>
  );
}

function latitudeLine(latitude: number) {
  return Array.from({ length: 97 }, (_, index) => latLongToVector3(latitude, -180 + index * 3.75, 1.505));
}

function latLongToVector3(latitude: number, longitude: number, radius: number): [number, number, number] {
  const phi = ((90 - latitude) * Math.PI) / 180;
  const theta = ((longitude + 180) * Math.PI) / 180;
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  ];
}
