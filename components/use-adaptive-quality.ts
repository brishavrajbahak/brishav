"use client";

import { useEffect, useState } from "react";
import { selectAdaptiveQuality, type QualitySignals, type SceneQuality } from "@/lib/adaptive-quality";
import { browserSupportsWebGl } from "@/lib/webgl";

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

export function useAdaptiveQuality(): SceneQuality {
  const [quality, setQuality] = useState<SceneQuality>("poster");

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const recalculate = () => {
      const localOverride = /^(?:localhost|127\.0\.0\.1)$/.test(window.location.hostname)
        ? new URLSearchParams(window.location.search).get("experience")
        : null;
      if (localOverride === "full" || localOverride === "balanced" || localOverride === "static") {
        commitQuality(localOverride === "balanced" ? "medium" : localOverride === "static" ? "poster" : "full");
        return;
      }
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
        webglAvailable: shouldProbeWebGl ? browserSupportsWebGl() : false
      };
      commitQuality(selectAdaptiveQuality(signals));
    };

    const commitQuality = (next: SceneQuality) => {
      setQuality(next);
      document.documentElement.dataset.experience = next === "full" ? "full" : next === "medium" ? "balanced" : "static";
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
