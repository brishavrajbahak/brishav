"use client";

import type { SceneQuality } from "@/lib/adaptive-quality";
import {
  DatasetGlobe,
  HeroTerrain,
  MissionNodes,
  SceneSlot,
  SharedSceneCanvas
} from "./scene-system";

export function HeroSceneExperience({ quality }: { quality: SceneQuality }) {
  return (
    <SceneSlot quality={quality} className="hero-scene" poster={null} ariaLabel="Himalayan terrain with flowing data streams">
      <HeroTerrain quality={quality} />
    </SceneSlot>
  );
}

export function MissionSceneExperience({
  quality,
  projectIds,
  selectedId,
  onSelect
}: {
  quality: SceneQuality;
  projectIds: string[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <SceneSlot
      quality={quality}
      className="mission-scene"
      poster={null}
      ariaLabel="Interactive project mission nodes. The project cards provide the equivalent semantic interface."
    >
      <MissionNodes projectIds={projectIds} selectedId={selectedId} onSelect={onSelect} />
    </SceneSlot>
  );
}

export function GlobeSceneExperience({
  quality,
  datasetIds,
  selectedId,
  onSelect
}: {
  quality: SceneQuality;
  datasetIds: string[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <SceneSlot
      quality={quality}
      className="globe-scene"
      poster={null}
      ariaLabel="Interactive dataset globe. Dataset buttons remain available in the adjacent semantic list."
    >
      <DatasetGlobe datasetIds={datasetIds} selectedId={selectedId} onSelect={onSelect} quality={quality} />
    </SceneSlot>
  );
}

export function SharedCanvasLayer({
  rootRef,
  quality
}: {
  rootRef: React.RefObject<HTMLDivElement | null>;
  quality: SceneQuality;
}) {
  return <SharedSceneCanvas rootRef={rootRef} quality={quality} />;
}
