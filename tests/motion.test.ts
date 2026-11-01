import { describe, expect, it } from "vitest";
import { MOTION, indexedReveal, transitions } from "@/lib/motion";
import { CINEMATIC_TIMING } from "@/lib/cinematic";

describe("central motion configuration", () => {
  it("keeps every named duration in the shared configuration", () => {
    expect(Object.values(MOTION.duration).every((duration) => duration > 0)).toBe(true);
    expect(transitions.reveal.duration).toBe(MOTION.duration.reveal);
  });

  it("derives indexed delays from the shared stagger", () => {
    const visible = typeof indexedReveal.visible === "function" ? indexedReveal.visible(3, {}, {}) : null;
    expect(visible && typeof visible === "object" && "transition" in visible ? visible.transition?.delay : undefined).toBeCloseTo(MOTION.stagger.base * 3);
  });

  it("keeps responsive cinematic scrub and crossfades centralized", () => {
    expect(CINEMATIC_TIMING.gsap.profiles.desktop.scrub).toBe(0.32);
    expect(CINEMATIC_TIMING.gsap.profiles.tablet.scrub).toBe(0.22);
    expect(CINEMATIC_TIMING.gsap.profiles.desktop.projectCrossfade).toBe(0.28);
    expect(CINEMATIC_TIMING.gsap.profiles.desktop.overlap).toBe(0.14);
    expect(CINEMATIC_TIMING.gsap.profiles.tablet.overlap).toBe(0.12);
    expect(CINEMATIC_TIMING.gsap.profiles.static.scrub).toBe(false);
  });
});
