"use client";

import { OrbitControls, PerspectiveCamera, useCursor, View } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { geometryBudget, type SceneQuality } from "@/lib/adaptive-quality";

type SceneSlotProps = {
  quality: SceneQuality;
  className: string;
  poster: React.ReactNode;
  children: React.ReactNode;
  ariaLabel: string;
};

export function SceneSlot({ quality, className, poster, children, ariaLabel }: SceneSlotProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || quality === "poster") return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "180px 0px", threshold: 0.01 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [quality]);

  if (quality === "poster") {
    return (
      <div className={className} role="img" aria-label={`${ariaLabel}. Static reduced-motion view.`}>
        {poster}
      </div>
    );
  }

  return (
    <View ref={ref} className={className} aria-hidden="true" frames={visible ? Infinity : 1}>
      {visible ? children : null}
    </View>
  );
}

export function SharedSceneCanvas({
  rootRef,
  quality
}: {
  rootRef: React.RefObject<HTMLDivElement | null>;
  quality: SceneQuality;
}) {
  if (quality === "poster") return null;
  const budget = geometryBudget(quality);

  return (
    <Canvas
      className="shared-webgl-canvas"
      dpr={[1, budget.dpr]}
      eventSource={rootRef as unknown as React.RefObject<HTMLElement>}
      eventPrefix="client"
      gl={{ alpha: true, antialias: quality === "full", powerPreference: "high-performance" }}
    >
      <View.Port />
    </Canvas>
  );
}

export function HeroTerrain({ quality }: { quality: SceneQuality }) {
  const budget = geometryBudget(quality);
  const terrain = useMemo(() => createTerrainGeometry(budget.segments), [budget.segments]);
  const particles = useMemo(() => createDataStream(budget.particles, 1107), [budget.particles]);
  const points = useRef<THREE.Points>(null);

  useFrame((state, delta) => {
    if (!points.current) return;
    points.current.rotation.y += delta * 0.025;
    points.current.position.y = Math.sin(state.clock.elapsedTime * 0.24) * 0.05;
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2.1, 6.2]} fov={48} />
      <ambientLight intensity={1.3} />
      <directionalLight position={[4, 6, 2]} intensity={2.2} color="ivory" />
      <directionalLight position={[-5, 2, -1]} intensity={1.5} color="goldenrod" />
      <group rotation={[-0.08, -0.3, 0]} position={[0.35, -0.72, 0]}>
        <mesh geometry={terrain} rotation={[-Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="ivory" roughness={0.82} metalness={0.08} wireframe />
        </mesh>
        <mesh geometry={terrain} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]}>
          <meshStandardMaterial color="whitesmoke" roughness={0.96} metalness={0} transparent opacity={0.72} />
        </mesh>
      </group>
      <points ref={points} geometry={particles} position={[0.2, 0.12, 0]}>
        <pointsMaterial color="firebrick" size={quality === "full" ? 0.028 : 0.04} sizeAttenuation transparent opacity={0.82} />
      </points>
      <mesh position={[1.9, 0.55, -0.3]}>
        <sphereGeometry args={[0.075, 18, 18]} />
        <meshStandardMaterial color="goldenrod" emissive="goldenrod" emissiveIntensity={1.5} />
      </mesh>
      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.18} />
    </>
  );
}

export function MissionNodes({
  projectIds,
  selectedId,
  onSelect
}: {
  projectIds: string[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const positions: Array<[number, number, number]> = [
    [-2.15, 0.6, 0],
    [-0.8, -0.42, 0.25],
    [0.78, 0.48, -0.05],
    [2.15, -0.28, 0.1]
  ];

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.2, 6.4]} fov={48} />
      <ambientLight intensity={1.45} />
      <pointLight position={[0, 3, 3]} intensity={16} color="goldenrod" />
      <group>
        <mesh position={[0, 0.05, -0.35]}>
          <planeGeometry args={[5.6, 2.3, 16, 8]} />
          <meshBasicMaterial color="ivory" wireframe transparent opacity={0.23} />
        </mesh>
        {projectIds.slice(0, 4).map((id, index) => (
          <MissionNode
            key={id}
            id={id}
            index={index}
            position={positions[index]}
            active={selectedId === id}
            onSelect={onSelect}
          />
        ))}
        <DataConnection points={positions} />
      </group>
    </>
  );
}

function MissionNode({
  id,
  index,
  position,
  active,
  onSelect
}: {
  id: string;
  index: number;
  position: [number, number, number];
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Group>(null);
  useCursor(hovered);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.62 + index) * 0.06;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.35 + index) * 0.04;
  });

  return (
    <group
      ref={ref}
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh scale={active ? 1.18 : hovered ? 1.1 : 1}>
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial
          color={active ? "firebrick" : "midnightblue"}
          emissive={active ? "firebrick" : "midnightblue"}
          emissiveIntensity={active || hovered ? 1.1 : 0.35}
          roughness={0.35}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.38, 0.012, 8, 48]} />
        <meshBasicMaterial color={active ? "goldenrod" : "cadetblue"} transparent opacity={0.78} />
      </mesh>
    </group>
  );
}

function DataConnection({ points }: { points: Array<[number, number, number]> }) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    return new THREE.TubeGeometry(curve, 80, 0.012, 6, false);
  }, [points]);
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color="goldenrod" transparent opacity={0.58} />
    </mesh>
  );
}

export function DatasetGlobe({
  datasetIds,
  selectedId,
  onSelect,
  quality
}: {
  datasetIds: string[];
  selectedId: string;
  onSelect: (id: string) => void;
  quality: SceneQuality;
}) {
  const globe = useRef<THREE.Group>(null);
  const coordinates: Array<[number, number]> = [
    [27.72, 85.32],
    [28.21, 83.99],
    [26.81, 87.28]
  ];

  useFrame((_, delta) => {
    if (globe.current) globe.current.rotation.y += delta * (quality === "full" ? 0.06 : 0.035);
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 4.6]} fov={48} />
      <ambientLight intensity={1.4} />
      <directionalLight position={[3, 4, 3]} intensity={2.4} color="ivory" />
      <group ref={globe} rotation={[0.08, -0.34, 0]}>
        <mesh>
          <sphereGeometry args={[1.45, quality === "full" ? 64 : 36, quality === "full" ? 64 : 36]} />
          <meshStandardMaterial color="ivory" transparent opacity={0.38} roughness={0.72} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.47, 32, 24]} />
          <meshBasicMaterial color="midnightblue" wireframe transparent opacity={0.22} />
        </mesh>
        {datasetIds.slice(0, 3).map((id, index) => (
          <GlobePoint
            key={id}
            id={id}
            active={selectedId === id}
            position={latLongToVector3(coordinates[index][0], coordinates[index][1], 1.5)}
            onSelect={onSelect}
          />
        ))}
      </group>
      <OrbitControls enablePan={false} minDistance={3.6} maxDistance={5.4} rotateSpeed={0.42} />
    </>
  );
}

function GlobePoint({
  id,
  active,
  position,
  onSelect
}: {
  id: string;
  active: boolean;
  position: [number, number, number];
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  return (
    <mesh
      position={position}
      scale={active || hovered ? 1.35 : 1}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.075, 18, 18]} />
      <meshStandardMaterial
        color={active ? "firebrick" : "goldenrod"}
        emissive={active ? "firebrick" : "goldenrod"}
        emissiveIntensity={1.5}
      />
    </mesh>
  );
}

export function HeroPoster() {
  return (
    <div className="scene-poster hero-poster" aria-hidden>
      <span className="poster-sun" />
      <span className="mountain mountain-one" />
      <span className="mountain mountain-two" />
      <span className="mountain mountain-three" />
      <span className="poster-grid" />
    </div>
  );
}

export function MissionPoster() {
  return (
    <div className="scene-poster mission-poster" aria-hidden>
      {Array.from({ length: 4 }, (_, index) => <span key={index} className={`poster-node node-${index + 1}`} />)}
      <i />
    </div>
  );
}

export function GlobePoster() {
  return (
    <div className="scene-poster globe-poster" aria-hidden>
      <span />
      <i className="globe-axis-one" />
      <i className="globe-axis-two" />
      <b className="globe-point-one" />
      <b className="globe-point-two" />
      <b className="globe-point-three" />
    </div>
  );
}

function createTerrainGeometry(segments: number) {
  const geometry = new THREE.PlaneGeometry(7.6, 5.2, segments, segments);
  const positions = geometry.attributes.position;
  const random = seededRandom(8841);
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const ridge = Math.sin(x * 1.25) * 0.3 + Math.cos(y * 1.55) * 0.22;
    const peak = Math.exp(-Math.pow(x - 0.7, 2) * 0.62) * Math.exp(-Math.pow(y + 0.25, 2) * 0.32) * 1.7;
    positions.setZ(index, ridge + peak + (random() - 0.5) * 0.08);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createDataStream(count: number, seed: number) {
  const random = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const progress = index / Math.max(count - 1, 1);
    const ribbon = Math.sin(progress * Math.PI * 8) * 0.35;
    positions[index * 3] = -3.3 + progress * 6.7;
    positions[index * 3 + 1] = 0.4 + ribbon + (random() - 0.5) * 0.3;
    positions[index * 3 + 2] = Math.cos(progress * Math.PI * 5) * 0.55 + (random() - 0.5) * 0.45;
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

function latLongToVector3(latitude: number, longitude: number, radius: number): [number, number, number] {
  const phi = ((90 - latitude) * Math.PI) / 180;
  const theta = ((longitude + 180) * Math.PI) / 180;
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  ];
}
