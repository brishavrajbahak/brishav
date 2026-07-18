import { describe, expect, it } from "vitest";
import { MOTION, indexedReveal, transitions } from "@/lib/motion";

describe("central motion configuration", () => {
  it("keeps every named duration in the shared configuration", () => {
    expect(Object.values(MOTION.duration).every((duration) => duration > 0)).toBe(true);
    expect(transitions.reveal.duration).toBe(MOTION.duration.reveal);
  });

  it("derives indexed delays from the shared stagger", () => {
    const visible = typeof indexedReveal.visible === "function" ? indexedReveal.visible(3, {}, {}) : null;
    expect(visible && typeof visible === "object" && "transition" in visible ? visible.transition?.delay : undefined).toBeCloseTo(MOTION.stagger.base * 3);
  });
});
