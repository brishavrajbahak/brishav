"use client";

import { Line, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { ExperienceTier } from "@/lib/cinematic";

export function CinematicHeroTerrain({ tier }: { tier: ExperienceTier }) {
  const [failed, setFailed] = useState(false);
  if (tier === "static" || failed) return null;

  return (
    <div className="v3-terrain-shell" aria-hidden="true">
      <Canvas
        frameloop="demand"
        dpr={tier === "full" ? [1, 1.5] : 1}
        gl={{ alpha: true, antialias: tier === "full", powerPreference: "high-performance" }}
        onCreated={({ gl, invalidate }) => {
          gl.domElement.addEventListener("webglcontextlost", (event) => {
            event.preventDefault();
            setFailed(true);
          }, { once: true });
          invalidate();
        }}
      >
        <TerrainRig tier={tier} />
      </Canvas>
    </div>
  );
}

function TerrainRig({ tier }: { tier: ExperienceTier }) {
  const terrain = useMemo(() => buildTerrain(tier === "full" ? 88 : 52), [tier]);
  const points = useMemo(() => buildSignalPoints(tier === "full" ? 620 : 260), [tier]);
  const ridgeLines = useMemo(() => buildRidgeLines(tier === "full" ? 9 : 6), [tier]);
  const group = useRef<THREE.Group>(null);
  const signal = useRef<THREE.Points>(null);
  const { camera, invalidate } = useThree();

  useEffect(() => {
    const handleProgress = (event: Event) => {
      const progress = Math.min(1, Math.max(0, Number((event as CustomEvent<number>).detail) || 0));
      camera.position.set(-0.7 + progress * 1.5, 2.6 - progress * 1.1, 6.8 - progress * 2.2);
      camera.lookAt(0.2 + progress * 0.6, -0.2, -0.35);
      if (group.current) {
        group.current.rotation.y = -0.28 + progress * 0.42;
        group.current.position.z = progress * 0.38;
      }
      if (signal.current) signal.current.rotation.y = progress * 0.5;
      invalidate();
    };
    window.addEventListener("observatory-terrain-progress", handleProgress);
    return () => window.removeEventListener("observatory-terrain-progress", handleProgress);
  }, [camera, invalidate]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[-0.7, 2.6, 6.8]} fov={44} />
      <ambientLight intensity={1.25} />
      <hemisphereLight args={["aliceblue", "saddlebrown", 2.1]} />
      <directionalLight position={[-4, 7, 3]} intensity={3.8} color="papayawhip" />
      <pointLight position={[3.5, 2.4, 2]} intensity={14} color="goldenrod" />
      <group ref={group} position={[0.1, -1.15, -0.3]} rotation={[-0.14, -0.28, 0]}>
        <mesh geometry={terrain} rotation={[-Math.PI / 2, 0, 0]}>
          <meshPhysicalMaterial color="linen" roughness={0.86} metalness={0.05} clearcoat={0.16} />
        </mesh>
        {ridgeLines.map((line, index) => (
          <Line
            key={index}
            points={line}
            color={index % 3 === 0 ? "firebrick" : "darkgoldenrod"}
            lineWidth={tier === "full" ? 1.2 : 1}
            transparent
            opacity={0.76}
          />
        ))}
        <points ref={signal} geometry={points}>
          <pointsMaterial color="orangered" size={tier === "full" ? 0.035 : 0.048} sizeAttenuation transparent opacity={0.9} />
        </points>
      </group>
      <fog attach="fog" args={["linen", 5.1, 12]} />
    </>
  );
}

function heightAt(x: number, y: number) {
  const main = Math.exp(-((x - 0.55) ** 2) * 0.42 - ((y + 0.25) ** 2) * 0.72) * 2.35;
  const shoulder = Math.exp(-((x + 1.35) ** 2) * 0.85 - ((y - 0.2) ** 2) * 0.58) * 1.2;
  return main + shoulder + Math.sin(x * 1.28) * 0.2 + Math.cos(y * 1.7) * 0.16;
}

function buildTerrain(segments: number) {
  const geometry = new THREE.PlaneGeometry(8.5, 5.8, segments, segments);
  const position = geometry.attributes.position;
  const random = seededRandom(9407);
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    position.setZ(index, heightAt(x, y) + (random() - 0.5) * 0.055);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function buildRidgeLines(count: number) {
  return Array.from({ length: count }, (_, lineIndex) => {
    const y = -2.35 + lineIndex * (4.55 / Math.max(count - 1, 1));
    return Array.from({ length: 72 }, (_, pointIndex) => {
      const x = -4 + pointIndex * (8 / 71);
      return new THREE.Vector3(x, y, heightAt(x, y) + 0.025);
    });
  });
}

function buildSignalPoints(count: number) {
  const random = seededRandom(2717);
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const progress = index / Math.max(count - 1, 1);
    const x = -3.9 + progress * 7.8;
    const y = Math.sin(progress * Math.PI * 4.2) * 0.62 + (random() - 0.5) * 0.16;
    positions[index * 3] = x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = heightAt(x, y) + 0.09 + random() * 0.05;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geometry;
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
