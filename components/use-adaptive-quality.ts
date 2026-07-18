"use client";

import { useEffect, useState } from "react";
import { selectAdaptiveQuality, type QualitySignals, type SceneQuality } from "@/lib/adaptive-quality";

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

export function useAdaptiveQuality(): SceneQuality {
  const [quality, setQuality] = useState<SceneQuality>("poster");

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const recalculate = () => {
      const nav = navigator as NavigatorWithHints;
      const width = window.innerWidth;
      const saveData = Boolean(nav.connection?.saveData);
      const deviceMemory = nav.deviceMemory;
      const shouldProbeWebGl =
        !reducedMotion.matches &&
        !saveData &&
        width >= 768 &&
        (deviceMemory === undefined || deviceMemory > 2);
      const signals: QualitySignals = {
        width,
        reducedMotion: reducedMotion.matches,
        saveData,
        deviceMemory,
        hardwareConcurrency: nav.hardwareConcurrency,
        webglAvailable: shouldProbeWebGl ? hasWebGl() : false
      };
      setQuality(selectAdaptiveQuality(signals));
    };

    recalculate();
    window.addEventListener("resize", recalculate, { passive: true });
    reducedMotion.addEventListener("change", recalculate);
    return () => {
      window.removeEventListener("resize", recalculate);
      reducedMotion.removeEventListener("change", recalculate);
    };
  }, []);

  return quality;
}

function hasWebGl() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
