import { describe, expect, it } from "vitest";
import {
  cinematicAssets,
  cinematicChapters,
  cueProgress,
  experienceTierFromQuality,
  resolveIntroState
} from "@/lib/cinematic";

describe("cinematic architecture", () => {
  it("interpolates chapter cues at stable boundaries", () => {
    expect(cueProgress(-0.2, { start: 0.25, end: 0.75 })).toBe(0);
    expect(cueProgress(0.25, { start: 0.25, end: 0.75 })).toBe(0);
    expect(cueProgress(0.5, { start: 0.25, end: 0.75 })).toBe(0.5);
    expect(cueProgress(0.75, { start: 0.25, end: 0.75 })).toBe(1);
    expect(cueProgress(1.2, { start: 0.25, end: 0.75 })).toBe(1);
  });

  it("resolves the intro without replaying returning or reduced-motion sessions", () => {
    expect(resolveIntroState({ completed: false, reducedMotion: false })).toBe("first-session");
    expect(resolveIntroState({ completed: true, reducedMotion: false })).toBe("returning");
    expect(resolveIntroState({ completed: false, reducedMotion: true })).toBe("reduced-motion");
  });

  it("maps adaptive quality to the public experience tiers", () => {
    expect(experienceTierFromQuality("full")).toBe("full");
    expect(experienceTierFromQuality("medium")).toBe("balanced");
    expect(experienceTierFromQuality("poster")).toBe("static");
  });

  it("ships typed responsive assets and the planned chapter lengths", () => {
    Object.values(cinematicAssets).forEach((asset) => {
      expect(asset.width).toBe(1672);
      expect(asset.height).toBe(941);
      expect(asset.mobileWidth / asset.mobileHeight).toBe(0.8);
      expect(asset.poster).toMatch(/-768\.webp$/);
      expect(asset.alt.length).toBeGreaterThan(24);
    });
    expect(cinematicChapters.find((chapter) => chapter.id === "home")?.scrollLengthVh).toBe(320);
    expect(cinematicChapters.find((chapter) => chapter.id === "projects")?.scrollLengthVh).toBe(420);
    expect(cinematicChapters.find((chapter) => chapter.id === "laboratory")?.scrollLengthVh).toBe(260);
  });
});
