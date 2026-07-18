export type SceneQuality = "full" | "medium" | "poster";

export type QualitySignals = {
  width: number;
  reducedMotion: boolean;
  saveData: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  webglAvailable: boolean;
};

export function selectAdaptiveQuality(signals: QualitySignals): SceneQuality {
  if (
    signals.reducedMotion ||
    signals.saveData ||
    !signals.webglAvailable ||
    signals.width < 768 ||
    (signals.deviceMemory !== undefined && signals.deviceMemory <= 2)
  ) {
    return "poster";
  }

  if (
    signals.width < 1180 ||
    (signals.deviceMemory !== undefined && signals.deviceMemory <= 4) ||
    (signals.hardwareConcurrency !== undefined && signals.hardwareConcurrency <= 4)
  ) {
    return "medium";
  }

  return "full";
}

export function geometryBudget(quality: SceneQuality) {
  if (quality === "full") return { dpr: 1.5, particles: 900, segments: 72 };
  if (quality === "medium") return { dpr: 1, particles: 360, segments: 40 };
  return { dpr: 1, particles: 0, segments: 0 };
}
