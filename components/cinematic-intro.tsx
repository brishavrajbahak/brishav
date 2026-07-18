"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import {
  CINEMATIC_TIMING,
  INTRO_SESSION_KEY,
  resolveIntroState,
  type IntroState
} from "@/lib/cinematic";

export function CinematicIntro() {
  const [introState, setIntroState] = useState<IntroState>("returning");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const navigatorWithHints = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    const usesStaticOpening =
      window.innerWidth < 768 ||
      Boolean(navigatorWithHints.connection?.saveData) ||
      (navigatorWithHints.deviceMemory !== undefined && navigatorWithHints.deviceMemory <= 2);
    const completed = sessionStorage.getItem(INTRO_SESSION_KEY) === "complete";
    const next = resolveIntroState({ completed, reducedMotion });
    if (usesStaticOpening || window.location.hash || next !== "first-session") {
      queueMicrotask(() => setIntroState(next));
      return;
    }

    queueMicrotask(() => {
      setIntroState(next);
      setVisible(true);
    });
    const timer = window.setTimeout(() => finish("returning"), CINEMATIC_TIMING.introMs);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish("skipped");
    };
    window.addEventListener("keydown", handleKey);

    function finish(state: IntroState) {
      sessionStorage.setItem(INTRO_SESSION_KEY, "complete");
      setIntroState(state);
      setVisible(false);
      window.clearTimeout(timer);
    }

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  function skipIntro() {
    sessionStorage.setItem(INTRO_SESSION_KEY, "complete");
    setIntroState("skipped");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="v3-intro" data-intro-state={introState} role="dialog" aria-label="Cinematic introduction">
      <div className="v3-intro-landscape" aria-hidden />
      <div className="v3-intro-monogram" aria-hidden>BR</div>
      <p>Turning Data Into Cinematic Stories.</p>
      <button type="button" onClick={skipIntro} autoFocus>
        Skip introduction <ArrowRight aria-hidden size={17} weight="bold" />
      </button>
      <span className="v3-intro-progress" aria-hidden />
    </div>
  );
}
