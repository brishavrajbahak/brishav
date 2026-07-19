"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CINEMATIC_TIMING,
  cinematicChapters,
  type CinematicChapterId,
  type ExperienceTier,
  type MotionProfile
} from "@/lib/cinematic";
import { cinematicProgress } from "@/lib/progress-bus";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CHOREOGRAPHY_GROUP = "himalayan-observatory-v4";

export function CinematicScrollDirector({ tier }: { tier: ExperienceTier }) {
  useGSAP(() => {
    const media = gsap.matchMedia();
    const root = document.querySelector<HTMLElement>(".v3-site");
    const requestedHash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    const cleanupNavigation = installSectionNavigation();
    const cleanupRefresh = scheduleStableRefresh();

    if (tier !== "static") {
      media.add("(min-width: 1180px) and (prefers-reduced-motion: no-preference)", () =>
        installCinematicTimelines(
          tier === "balanced" ? CINEMATIC_TIMING.gsap.profiles.tablet : CINEMATIC_TIMING.gsap.profiles.desktop
        )
      );

      media.add(
        "(min-width: 768px) and (max-width: 1179px) and (prefers-reduced-motion: no-preference)",
        () => installCinematicTimelines(CINEMATIC_TIMING.gsap.profiles.tablet)
      );
    }

    const readyFrame = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      if (requestedHash) document.getElementById(requestedHash)?.scrollIntoView({ behavior: "auto", block: "start" });
      if (root) root.dataset.directorReady = "true";
    });

    return () => {
      window.cancelAnimationFrame(readyFrame);
      if (root) delete root.dataset.directorReady;
      cleanupNavigation();
      cleanupRefresh();
      media.revert();
    };
  }, { dependencies: [tier], revertOnUpdate: true });

  return null;
}

function installCinematicTimelines(profile: MotionProfile) {
  createHeroTimeline(profile);
  createPipelineTimeline(profile);
  createProjectTimeline(profile);
  createJourneyTimeline(profile);
  createInsightsTimeline(profile);
  const cleanupControl = installDeferredControlTimeline(profile);
  return cleanupControl;
}

function stageTimeline(channel: CinematicChapterId, section: string, profile: MotionProfile) {
  let nextMediaPreloaded = false;
  const timeline = gsap.timeline({
    defaults: { ease: CINEMATIC_TIMING.gsap.ease.linear },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: profile.scrub,
      invalidateOnRefresh: true,
      fastScrollEnd: profile.fastScrollEnd,
      preventOverlaps: CHOREOGRAPHY_GROUP,
      onLeaveBack: (trigger) => {
        trigger.animation?.progress(0);
        cinematicProgress.publish(channel, 0);
      }
    }
  });

  timeline.eventCallback("onUpdate", () => {
    const progress = timeline.progress();
    cinematicProgress.publish(channel, progress);
    if (!nextMediaPreloaded && progress >= 0.65) {
      nextMediaPreloaded = true;
      preloadFollowingChapter(channel);
    }
  });

  return timeline;
}

function createHeroTimeline(profile: MotionProfile) {
  const timeline = stageTimeline("home", ".v3-hero-sequence", profile);
  const cards = gsap.utils.toArray<HTMLElement>(".v3-mosaic-card");

  gsap.set(cards, { autoAlpha: 0, y: 46, scale: 0.88, rotate: -1.2 });
  gsap.set(".v3-hero-mask", { autoAlpha: 0, scale: 0.74 });
  gsap.set([".v3-terrain-shell", ".v3-camera-caption"], { autoAlpha: 0 });

  timeline
    .to(".v4-signal-contour span", { scaleX: 1, duration: CINEMATIC_TIMING.gsap.duration.signalDraw }, 0)
    .to(
      ".v3-hero-editorial",
      {
        yPercent: -18,
        autoAlpha: 0,
        duration: CINEMATIC_TIMING.gsap.duration.heroExit,
        ease: CINEMATIC_TIMING.gsap.ease.exit
      },
      CINEMATIC_TIMING.gsap.at.heroExit
    )
    .to(
      cards,
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        rotate: 0,
        duration: CINEMATIC_TIMING.gsap.duration.mosaicReveal,
        stagger: CINEMATIC_TIMING.gsap.stagger,
        ease: CINEMATIC_TIMING.gsap.ease.enter
      },
      CINEMATIC_TIMING.gsap.at.mosaicReveal
    )
    .fromTo(
      ".v3-mosaic-caption",
      { autoAlpha: 0, x: 24 },
      {
        autoAlpha: 1,
        x: 0,
        duration: CINEMATIC_TIMING.gsap.duration.captionReveal,
        ease: CINEMATIC_TIMING.gsap.ease.enter
      },
      CINEMATIC_TIMING.gsap.at.mosaicCaption
    )
    .to(
      ".v3-hero-mosaic",
      {
        autoAlpha: 0,
        scale: 1.035,
        duration: CINEMATIC_TIMING.gsap.duration.mosaicExit,
        ease: CINEMATIC_TIMING.gsap.ease.exit
      },
      CINEMATIC_TIMING.gsap.at.mosaicExit
    )
    .to(
      ".v3-hero-mask",
      {
        autoAlpha: 1,
        scale: 1,
        duration: CINEMATIC_TIMING.gsap.duration.maskReveal,
        ease: CINEMATIC_TIMING.gsap.ease.cinematic
      },
      CINEMATIC_TIMING.gsap.at.heroMask
    )
    .to(
      ".v3-hero-landscape img",
      {
        scale: profile.id === "tablet" ? 1.055 : 1.095,
        xPercent: -1.4,
        duration: CINEMATIC_TIMING.gsap.duration.landscapeMove
      },
      CINEMATIC_TIMING.gsap.at.heroMask
    )
    .to(
      ".v3-terrain-shell",
      { autoAlpha: 1, duration: CINEMATIC_TIMING.gsap.duration.terrainReveal },
      CINEMATIC_TIMING.gsap.at.terrainReveal
    )
    .fromTo(
      ".v3-camera-caption",
      { y: 26, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: CINEMATIC_TIMING.gsap.duration.captionReveal,
        ease: CINEMATIC_TIMING.gsap.ease.enter
      },
      CINEMATIC_TIMING.gsap.at.cameraCaption
    )
    .to(
      ".v3-camera-caption",
      {
        y: -18,
        autoAlpha: 0,
        duration: CINEMATIC_TIMING.gsap.duration.captionExit,
        ease: CINEMATIC_TIMING.gsap.ease.exit
      },
      CINEMATIC_TIMING.gsap.at.cameraCaptionExit
    );
}

function createPipelineTimeline(profile: MotionProfile) {
  const timeline = stageTimeline("method", ".v3-pipeline-sequence", profile);
  const phases = gsap.utils.toArray<HTMLElement>(".v4-pipeline-phase");
  const steps = gsap.utils.toArray<HTMLElement>(".v4-pipeline-nav button");

  gsap.set(phases, { autoAlpha: 0, x: 28 });
  gsap.set(phases[0], { autoAlpha: 1, x: 0 });
  gsap.set(steps, { autoAlpha: 0.48, x: 0 });
  gsap.set(steps[0], { autoAlpha: 1, x: 8 });

  timeline
    .to(".v4-pipeline-progress span", { scaleY: 1, duration: CINEMATIC_TIMING.gsap.duration.signalDraw }, 0)
    .to(
      ".v3-pipeline-media img",
      {
        scale: profile.id === "tablet" ? 1.035 : 1.065,
        xPercent: -1.5,
        duration: CINEMATIC_TIMING.gsap.duration.signalDraw
      },
      0
    )
    .to(".v4-pipeline-signal", { scaleX: 1, duration: CINEMATIC_TIMING.gsap.duration.signalDraw }, 0);

  phases.slice(1).forEach((phase, index) => {
    const start = (index + 1) / phases.length;
    timeline
      .to(
        phases[index],
        { autoAlpha: 0, x: -22, duration: CINEMATIC_TIMING.gsap.duration.pipelineStepExit, ease: CINEMATIC_TIMING.gsap.ease.exit },
        start - CINEMATIC_TIMING.gsap.offset.pipelineExit
      )
      .fromTo(
        phase,
        { autoAlpha: 0, x: 28 },
        { autoAlpha: 1, x: 0, duration: CINEMATIC_TIMING.gsap.duration.pipelineStep, ease: CINEMATIC_TIMING.gsap.ease.enter },
        start - CINEMATIC_TIMING.gsap.offset.pipelineEnter
      )
      .to(
        steps[index],
        { autoAlpha: 0.48, x: 0, duration: CINEMATIC_TIMING.gsap.duration.pipelineRailDim },
        start - CINEMATIC_TIMING.gsap.offset.pipelineRail
      )
      .to(
        steps[index + 1],
        { autoAlpha: 1, x: 8, duration: CINEMATIC_TIMING.gsap.duration.pipelineRailFocus },
        start - CINEMATIC_TIMING.gsap.offset.pipelineRail
      );
  });
}

function createProjectTimeline(profile: MotionProfile) {
  const timeline = stageTimeline("projects", ".v3-project-sequence", profile);
  const media = gsap.utils.toArray<HTMLElement>(".v3-project-media picture");
  const chapters = gsap.utils.toArray<HTMLElement>(".v4-project-chapter");

  gsap.set(media, { autoAlpha: 0, scale: 1.055 });
  gsap.set(chapters, { autoAlpha: 0, y: 32 });
  gsap.set(media[0], { autoAlpha: 1, scale: 1 });
  gsap.set(chapters[0], { autoAlpha: 1, y: 0 });

  timeline.to(
    ".v3-project-progress span",
    { scaleX: 1, duration: chapters.length * CINEMATIC_TIMING.gsap.duration.chapter },
    0
  );

  chapters.slice(1).forEach((chapter, index) => {
    const start = index + 1 - profile.overlap;
    timeline
      .to(media[index], { autoAlpha: 0, scale: 1.02, duration: profile.projectCrossfade }, start)
      .fromTo(
        media[index + 1],
        { autoAlpha: 0, scale: 1.055 },
        { autoAlpha: 1, scale: 1, duration: profile.projectCrossfade, ease: CINEMATIC_TIMING.gsap.ease.cinematic },
        start
      )
      .to(
        chapters[index],
        {
          autoAlpha: 0,
          y: -22,
          duration: profile.projectCrossfade * CINEMATIC_TIMING.gsap.ratio.projectExit,
          ease: CINEMATIC_TIMING.gsap.ease.exit
        },
        start
      )
      .fromTo(
        chapter,
        { autoAlpha: 0, y: 32 },
        { autoAlpha: 1, y: 0, duration: profile.projectCrossfade, ease: CINEMATIC_TIMING.gsap.ease.enter },
        start + profile.projectCrossfade * CINEMATIC_TIMING.gsap.offset.projectEnter
      );
  });

  timeline.to({}, { duration: CINEMATIC_TIMING.gsap.duration.chapter });
}

function createJourneyTimeline(profile: MotionProfile) {
  const timeline = stageTimeline("journey", ".v4-journey-sequence", profile);
  const milestones = gsap.utils.toArray<HTMLElement>(".v4-journey-milestone");

  gsap.set(milestones, { autoAlpha: 0, y: 32 });
  gsap.set(milestones[0], { autoAlpha: 1, y: 0 });
  timeline
    .to(
      ".v3-altitude-route span",
      { scaleY: 1, duration: milestones.length * CINEMATIC_TIMING.gsap.duration.chapter },
      0
    )
    .to(
      ".v3-journey-media img",
      {
        scale: profile.id === "tablet" ? 1.03 : 1.07,
        xPercent: -1.4,
        duration: milestones.length * CINEMATIC_TIMING.gsap.duration.chapter
      },
      0
    );

  milestones.slice(1).forEach((milestone, index) => {
    const start = index + 1 - profile.overlap;
    timeline
      .to(
        milestones[index],
        { autoAlpha: 0, y: -22, duration: CINEMATIC_TIMING.gsap.duration.journeyExit, ease: CINEMATIC_TIMING.gsap.ease.exit },
        start
      )
      .fromTo(
        milestone,
        { autoAlpha: 0, y: 32 },
        { autoAlpha: 1, y: 0, duration: CINEMATIC_TIMING.gsap.duration.journeyEnter, ease: CINEMATIC_TIMING.gsap.ease.enter },
        start + CINEMATIC_TIMING.gsap.offset.journeyEnter
      );
  });
  timeline.to({}, { duration: CINEMATIC_TIMING.gsap.duration.chapter });
}

function createInsightsTimeline(profile: MotionProfile) {
  const timeline = stageTimeline("insights", ".v4-insights-sequence", profile);
  const media = gsap.utils.toArray<HTMLElement>(".v4-insight-media");
  const reports = gsap.utils.toArray<HTMLElement>(".v4-insight-report");

  gsap.set([...media, ...reports], { autoAlpha: 0 });
  gsap.set([media[0], reports[0]], { autoAlpha: 1 });
  timeline.to(
    ".v4-insight-progress span",
    { scaleX: 1, duration: reports.length * CINEMATIC_TIMING.gsap.duration.chapter },
    0
  );

  reports.slice(1).forEach((report, index) => {
    const start = index + 1 - profile.overlap;
    timeline
      .to(
        [media[index], reports[index]],
        { autoAlpha: 0, y: -16, duration: CINEMATIC_TIMING.gsap.duration.insightExit, ease: CINEMATIC_TIMING.gsap.ease.exit },
        start
      )
      .fromTo(
        [media[index + 1], report],
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: CINEMATIC_TIMING.gsap.duration.insightEnter, ease: CINEMATIC_TIMING.gsap.ease.enter },
        start + CINEMATIC_TIMING.gsap.offset.insightEnter
      );
  });
  timeline.to({}, { duration: CINEMATIC_TIMING.gsap.duration.chapter });
}

function installDeferredControlTimeline(profile: MotionProfile) {
  let timeline: gsap.core.Timeline | null = null;
  let observer: MutationObserver | null = null;

  const install = () => {
    if (timeline || !document.querySelector('[data-control-ready="true"] .v3-control-sequence')) return;
    timeline = createControlRoomTimeline(profile);
    observer?.disconnect();
    window.requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  install();
  if (!timeline) {
    observer = new MutationObserver(install);
    const anchor = document.getElementById("laboratory");
    if (anchor) observer.observe(anchor, { childList: true, subtree: true });
  }

  return () => {
    observer?.disconnect();
    timeline?.scrollTrigger?.kill();
    timeline?.kill();
  };
}

function createControlRoomTimeline(profile: MotionProfile) {
  const timeline = stageTimeline("laboratory", '[data-control-ready="true"] .v3-control-sequence', profile);
  timeline
    .to(
      ".v3-control-backdrop img",
      { scale: profile.id === "tablet" ? 1.025 : 1.055, duration: CINEMATIC_TIMING.gsap.duration.controlSequence },
      0
    )
    .to(".v4-control-progress span", { scaleX: 1, duration: CINEMATIC_TIMING.gsap.duration.controlSequence }, 0)
    .to({}, { duration: CINEMATIC_TIMING.gsap.duration.controlSequence }, 0);
  return timeline;
}

function installSectionNavigation() {
  const triggers = cinematicChapters.flatMap((chapter) => {
    const section = document.getElementById(chapter.id);
    if (!section) return [];
    const activate = () => {
      cinematicProgress.setActiveSection(chapter.id);
      const hash = `#${chapter.id}`;
      if (window.location.hash !== hash) window.history.replaceState(null, "", hash);
    };
    return [
      ScrollTrigger.create({
        trigger: section,
        start: "top 38%",
        end: "bottom 38%",
        onEnter: activate,
        onEnterBack: activate
      })
    ];
  });
  return () => triggers.forEach((trigger) => trigger.kill());
}

function scheduleStableRefresh() {
  let cancelled = false;
  const refresh = () => {
    if (cancelled) return;
    window.requestAnimationFrame(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
  };
  void document.fonts.ready.then(refresh);
  const timer = window.setTimeout(refresh, 720);
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
  };
}

function preloadFollowingChapter(channel: CinematicChapterId) {
  const current = cinematicChapters.findIndex((chapter) => chapter.id === channel);
  const asset = cinematicChapters[current + 1]?.asset;
  if (!asset) return;
  const image = new Image();
  image.decoding = "async";
  image.src = `${asset.desktopBase}-1280.webp`;
}
