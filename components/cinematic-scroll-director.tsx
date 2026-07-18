"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CINEMATIC_TIMING } from "@/lib/cinematic";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PROJECT_COUNT = 4;

export function CinematicScrollDirector() {
  useGSAP(() => {
    const media = gsap.matchMedia();

    media.add("(min-width: 1180px) and (prefers-reduced-motion: no-preference)", () => {
      createHeroTimeline();
      createPipelineTimeline();
      createProjectTimeline();
      createEditorialTimelines();
      return installDeferredControlTimeline(false);
    });

    media.add(
      "(min-width: 768px) and (max-width: 1179px) and (prefers-reduced-motion: no-preference)",
      () => {
        createHeroTimeline(true);
        createPipelineTimeline(true);
        createProjectTimeline(true);
        createEditorialTimelines();
        return installDeferredControlTimeline(true);
      }
    );

    return () => media.revert();
  });

  return null;
}

function installDeferredControlTimeline(balanced: boolean) {
  let timeline: gsap.core.Timeline | null = null;
  const install = () => {
    if (timeline || !document.querySelector(".v3-control-sequence")) return;
    timeline = createControlRoomTimeline(balanced);
    ScrollTrigger.refresh();
  };
  install();
  window.addEventListener("observatory-control-ready", install);
  return () => {
    window.removeEventListener("observatory-control-ready", install);
    timeline?.scrollTrigger?.kill();
    timeline?.kill();
  };
}

function stageTimeline(section: string, stage: string, balanced = false) {
  return gsap.timeline({
    defaults: { ease: CINEMATIC_TIMING.gsap.ease.linear },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      pin: stage,
      pinSpacing: false,
      scrub: balanced ? CINEMATIC_TIMING.gsap.scrubSoft : CINEMATIC_TIMING.gsap.scrub,
      invalidateOnRefresh: true,
      anticipatePin: 1
    }
  });
}

function createHeroTimeline(balanced = false) {
  const timeline = stageTimeline(".v3-hero-sequence", ".v3-hero-stage", balanced);
  const trigger = timeline.scrollTrigger;
  if (trigger) {
    trigger.vars.onUpdate = (self) => {
      window.dispatchEvent(new CustomEvent("observatory-terrain-progress", { detail: self.progress }));
    };
  }

  timeline
    .to(
      ".v3-hero-editorial",
      { yPercent: -22, autoAlpha: 0, duration: CINEMATIC_TIMING.gsap.duration.heroExit },
      CINEMATIC_TIMING.gsap.at.heroExit
    )
    .fromTo(
      ".v3-mosaic-card",
      { clipPath: "inset(48% 48% 48% 48%)", scale: 0.82, rotate: -2 },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        scale: 1,
        rotate: 0,
        duration: CINEMATIC_TIMING.gsap.duration.mosaicReveal,
        stagger: CINEMATIC_TIMING.gsap.stagger
      },
      CINEMATIC_TIMING.gsap.at.mosaicReveal
    )
    .to(
      ".v3-hero-mosaic",
      { autoAlpha: 0, scale: 1.08, duration: CINEMATIC_TIMING.gsap.duration.mosaicExit },
      CINEMATIC_TIMING.gsap.at.mosaicExit
    )
    .fromTo(
      ".v3-hero-mask",
      { clipPath: "inset(36% 42% 36% 42% round 1.5rem)", autoAlpha: 0 },
      {
        clipPath: "inset(0% 0% 0% 0% round 0rem)",
        autoAlpha: 1,
        duration: CINEMATIC_TIMING.gsap.duration.maskReveal
      },
      CINEMATIC_TIMING.gsap.at.heroMask
    )
    .fromTo(
      ".v3-mosaic-caption",
      { autoAlpha: 0, x: 24 },
      { autoAlpha: 1, x: 0, duration: CINEMATIC_TIMING.gsap.duration.captionReveal },
      CINEMATIC_TIMING.gsap.at.mosaicCaption
    )
    .to(
      ".v3-hero-landscape img",
      { scale: balanced ? 1.08 : 1.16, xPercent: -2, duration: CINEMATIC_TIMING.gsap.duration.landscapeMove },
      CINEMATIC_TIMING.gsap.at.heroMask
    )
    .fromTo(
      ".v3-terrain-shell",
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: CINEMATIC_TIMING.gsap.duration.terrainReveal },
      CINEMATIC_TIMING.gsap.at.terrainReveal
    )
    .fromTo(
      ".v3-camera-caption",
      { y: 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: CINEMATIC_TIMING.gsap.duration.captionReveal },
      CINEMATIC_TIMING.gsap.at.cameraCaption
    )
    .to(
      ".v3-camera-caption",
      { y: -24, autoAlpha: 0, duration: CINEMATIC_TIMING.gsap.duration.captionExit },
      CINEMATIC_TIMING.gsap.at.cameraCaptionExit
    );
}

function createPipelineTimeline(balanced = false) {
  const timeline = stageTimeline(".v3-pipeline-sequence", ".v3-pipeline-stage", balanced);
  timeline.fromTo(
    ".v3-pipeline-route",
    { scaleX: 0 },
    { scaleX: 1, duration: CINEMATIC_TIMING.gsap.duration.chapter },
    0
  );
  gsap.utils.toArray<HTMLElement>(".v3-pipeline-step").forEach((step, index, steps) => {
    const start = index / Math.max(steps.length, 1);
    timeline.fromTo(
      step,
      { autoAlpha: 0.22, y: 34, scale: 0.94 },
      { autoAlpha: 1, y: 0, scale: 1, duration: CINEMATIC_TIMING.gsap.duration.pipelineStep },
      start
    );
    if (index < steps.length - 1) {
      timeline.to(
        step,
        { autoAlpha: 0.38, y: -18, duration: CINEMATIC_TIMING.gsap.duration.pipelineStepExit },
        start + CINEMATIC_TIMING.gsap.duration.pipelineStep
      );
    }
  });
  timeline.to(
    ".v3-pipeline-media img",
    { scale: balanced ? 1.05 : 1.12, xPercent: -3, duration: CINEMATIC_TIMING.gsap.duration.chapter },
    0
  );
}

function createProjectTimeline(balanced = false) {
  const timeline = stageTimeline(".v3-project-sequence", ".v3-project-stage", balanced);
  let activeIndex = -1;
  const trigger = timeline.scrollTrigger;
  if (trigger) {
    trigger.vars.onUpdate = (self) => {
      const next = Math.min(PROJECT_COUNT - 1, Math.floor(self.progress * PROJECT_COUNT));
      if (next !== activeIndex) {
        activeIndex = next;
        window.dispatchEvent(new CustomEvent("observatory-project-change", { detail: next }));
      }
    };
  }
  timeline.to(
    ".v3-project-progress span",
    { scaleX: 1, duration: CINEMATIC_TIMING.gsap.duration.chapter },
    0
  );
  timeline.to(
    ".v3-project-media img",
    { scale: balanced ? 1.07 : 1.13, xPercent: -2, duration: CINEMATIC_TIMING.gsap.duration.chapter },
    0
  );
}

function createControlRoomTimeline(balanced = false) {
  const timeline = stageTimeline(".v3-control-sequence", ".v3-control-stage", balanced);
  timeline
    .fromTo(
      ".v3-terminal-panel",
      { xPercent: -8, autoAlpha: 0.35 },
      { xPercent: 0, autoAlpha: 1, duration: CINEMATIC_TIMING.gsap.duration.controlTerminal },
      0
    )
    .fromTo(
      ".v3-mandala-panel",
      { scale: 0.86, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: CINEMATIC_TIMING.gsap.duration.controlPanel },
      CINEMATIC_TIMING.gsap.at.mandalaReveal
    )
    .fromTo(
      ".v3-analysis-panel",
      { xPercent: 8, autoAlpha: 0 },
      { xPercent: 0, autoAlpha: 1, duration: CINEMATIC_TIMING.gsap.duration.controlPanel },
      CINEMATIC_TIMING.gsap.at.analysisReveal
    )
    .to(
      ".v3-control-backdrop img",
      { scale: balanced ? 1.03 : 1.08, duration: CINEMATIC_TIMING.gsap.duration.chapter },
      0
    );
  return timeline;
}

function createEditorialTimelines() {
  gsap.fromTo(
    ".v3-altitude-route span",
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: CINEMATIC_TIMING.gsap.ease.linear,
      scrollTrigger: { trigger: ".v3-journey", start: "top 72%", end: "bottom 32%", scrub: CINEMATIC_TIMING.gsap.scrub }
    }
  );
  gsap.utils.toArray<HTMLElement>(".v3-field-report").forEach((report) => {
    gsap.fromTo(
      report.querySelector(".v3-report-media"),
      { clipPath: "inset(0 100% 0 0)" },
      {
        clipPath: "inset(0 0% 0 0)",
        ease: CINEMATIC_TIMING.gsap.ease.linear,
        scrollTrigger: { trigger: report, start: "top 82%", end: "top 38%", scrub: CINEMATIC_TIMING.gsap.scrub }
      }
    );
  });
}
