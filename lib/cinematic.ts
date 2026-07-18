import type { SceneQuality } from "./adaptive-quality";

export type ExperienceTier = "full" | "balanced" | "static";
export type IntroState = "first-session" | "returning" | "skipped" | "reduced-motion";

export type SceneCue = {
  id: string;
  start: number;
  end: number;
  target: string;
};

export type CinematicAsset = {
  id: string;
  desktopBase: string;
  mobileBase: string;
  width: 1672;
  height: 941;
  mobileWidth: 900;
  mobileHeight: 1125;
  focalPoint: `${number}% ${number}%`;
  alt: string;
  qualityTier: ExperienceTier;
  poster: string;
};

export type CinematicChapter = {
  id: "home" | "method" | "projects" | "laboratory" | "journey" | "insights" | "contact";
  label: string;
  scrollLengthVh: number;
  asset?: CinematicAsset;
  cues: SceneCue[];
};

export const CINEMATIC_TIMING = {
  introMs: 2200,
  introTraceMs: 760,
  introRevealMs: 520,
  introHoldMs: 560,
  hashRestoreMs: 420,
  gsap: {
    scrub: 0.72,
    scrubSoft: 1.1,
    snapDurationMin: 0.16,
    snapDurationMax: 0.42,
    projectCrossfade: 0.17,
    stagger: 0.065,
    ease: {
      linear: "none"
    },
    duration: {
      chapter: 1,
      heroExit: 0.2,
      mosaicReveal: 0.28,
      mosaicExit: 0.22,
      maskReveal: 0.3,
      captionReveal: 0.16,
      landscapeMove: 0.54,
      terrainReveal: 0.18,
      captionExit: 0.12,
      pipelineStep: 0.14,
      pipelineStepExit: 0.12,
      controlPanel: 0.34,
      controlTerminal: 0.28
    },
    at: {
      heroExit: 0.12,
      mosaicReveal: 0.18,
      mosaicCaption: 0.34,
      heroMask: 0.46,
      mosaicExit: 0.5,
      terrainReveal: 0.62,
      cameraCaption: 0.79,
      cameraCaptionExit: 0.94,
      mandalaReveal: 0.25,
      analysisReveal: 0.58
    }
  }
} as const;

export const INTRO_SESSION_KEY = "br-observatory-intro-v3";

function asset(
  id: string,
  alt: string,
  focalPoint: CinematicAsset["focalPoint"],
  qualityTier: ExperienceTier = "full"
): CinematicAsset {
  const path = `/assets/cinematic/${id}`;
  return {
    id,
    desktopBase: path,
    mobileBase: `${path}-mobile`,
    width: 1672,
    height: 941,
    mobileWidth: 900,
    mobileHeight: 1125,
    focalPoint,
    alt,
    qualityTier,
    poster: `${path}-768.webp`
  };
}

export const cinematicAssets = {
  summitDawn: asset(
    "summit-dawn",
    "A Himalayan summit at dawn crossed by restrained illuminated data contours",
    "58% 47%"
  ),
  contourRidge: asset(
    "contour-ridge",
    "Terraced Himalayan ridges connected by a crimson analytical route",
    "62% 54%"
  ),
  kathmanduGrid: asset(
    "kathmandu-grid",
    "Kathmandu Valley at sunrise with a subtle network of data signals",
    "52% 58%"
  ),
  observatoryWorkspace: asset(
    "observatory-workspace",
    "A warm Himalayan observatory workspace overlooking snow peaks",
    "50% 52%",
    "balanced"
  ),
  dataHorizon: asset(
    "data-horizon",
    "A broad Himalayan valley opening toward a calm sunrise horizon",
    "58% 48%",
    "balanced"
  )
} as const;

export const cinematicChapters: CinematicChapter[] = [
  {
    id: "home",
    label: "Summit",
    scrollLengthVh: 320,
    asset: cinematicAssets.summitDawn,
    cues: [
      { id: "poster", start: 0, end: 0.24, target: "hero-poster" },
      { id: "mosaic", start: 0.19, end: 0.52, target: "hero-mosaic" },
      { id: "monogram-mask", start: 0.45, end: 0.78, target: "hero-mask" },
      { id: "camera-dive", start: 0.72, end: 1, target: "terrain-camera" }
    ]
  },
  {
    id: "method",
    label: "Signal route",
    scrollLengthVh: 240,
    asset: cinematicAssets.contourRidge,
    cues: [
      { id: "ingest", start: 0, end: 0.18, target: "pipeline-0" },
      { id: "cleanse", start: 0.14, end: 0.35, target: "pipeline-1" },
      { id: "explore", start: 0.3, end: 0.52, target: "pipeline-2" },
      { id: "model", start: 0.47, end: 0.68, target: "pipeline-3" },
      { id: "visualize", start: 0.63, end: 0.84, target: "pipeline-4" },
      { id: "impact", start: 0.8, end: 1, target: "pipeline-5" }
    ]
  },
  {
    id: "projects",
    label: "Project reel",
    scrollLengthVh: 420,
    asset: cinematicAssets.kathmanduGrid,
    cues: [
      { id: "loan-analysis", start: 0, end: 0.28, target: "project-0" },
      { id: "inclusion", start: 0.24, end: 0.52, target: "project-1" },
      { id: "prediction", start: 0.48, end: 0.76, target: "project-2" },
      { id: "platform", start: 0.72, end: 1, target: "project-3" }
    ]
  },
  {
    id: "laboratory",
    label: "Control room",
    scrollLengthVh: 260,
    asset: cinematicAssets.observatoryWorkspace,
    cues: [
      { id: "terminal", start: 0, end: 0.34, target: "control-terminal" },
      { id: "mandala", start: 0.28, end: 0.68, target: "control-mandala" },
      { id: "analysis", start: 0.62, end: 1, target: "control-analysis" }
    ]
  },
  { id: "journey", label: "Altitude route", scrollLengthVh: 160, asset: cinematicAssets.contourRidge, cues: [] },
  { id: "insights", label: "Field reports", scrollLengthVh: 220, asset: cinematicAssets.kathmanduGrid, cues: [] },
  { id: "contact", label: "Horizon", scrollLengthVh: 140, asset: cinematicAssets.dataHorizon, cues: [] }
];

export function experienceTierFromQuality(quality: SceneQuality): ExperienceTier {
  if (quality === "full") return "full";
  if (quality === "medium") return "balanced";
  return "static";
}

export function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function cueProgress(progress: number, cue: Pick<SceneCue, "start" | "end">) {
  if (cue.end <= cue.start) return progress >= cue.end ? 1 : 0;
  return clampProgress((progress - cue.start) / (cue.end - cue.start));
}

export function resolveIntroState({
  completed,
  reducedMotion
}: {
  completed: boolean;
  reducedMotion: boolean;
}): IntroState {
  if (reducedMotion) return "reduced-motion";
  if (completed) return "returning";
  return "first-session";
}
