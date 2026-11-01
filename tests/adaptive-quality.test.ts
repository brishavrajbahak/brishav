import { describe, expect, it } from "vitest";
import { geometryBudget, selectAdaptiveQuality } from "@/lib/adaptive-quality";

const capableDesktop = {
  width: 1440,
  reducedMotion: false,
  saveData: false,
  deviceMemory: 8,
  hardwareConcurrency: 12,
  webglAvailable: true
};

describe("adaptive scene quality", () => {
  it("selects full quality for a capable desktop", () => {
    expect(selectAdaptiveQuality(capableDesktop)).toBe("full");
  });

  it.each([
    ["reduced motion", { reducedMotion: true }],
    ["save data", { saveData: true }],
    ["mobile", { width: 390 }],
    ["low memory", { deviceMemory: 2 }],
    ["WebGL failure", { webglAvailable: false }]
  ])("uses a poster for %s", (_, override) => {
    expect(selectAdaptiveQuality({ ...capableDesktop, ...override })).toBe("poster");
  });

  it("reduces geometry and DPR for medium devices", () => {
    const quality = selectAdaptiveQuality({ ...capableDesktop, width: 900, deviceMemory: 4 });
    expect(quality).toBe("medium");
    expect(geometryBudget(quality)).toEqual({ dpr: 1, particles: 360, segments: 40 });
  });
});
