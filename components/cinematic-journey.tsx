"use client";

import { Mountains } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { cinematicAssets, indexFromProgress, scrollProgressForIndex } from "@/lib/cinematic";
import { journey } from "@/lib/content";
import { cinematicProgress } from "@/lib/progress-bus";
import { scrollSequenceToProgress } from "@/lib/utils";
import { CinematicPicture } from "./cinematic-picture";

export function CinematicJourney() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => cinematicProgress.subscribe("journey", (progress) => {
    setActiveIndex((current) => {
      const next = indexFromProgress(progress, journey.length);
      return current === next ? current : next;
    });
  }), []);

  function selectMilestone(index: number) {
    setActiveIndex(index);
    scrollSequenceToProgress(
      ".v4-journey-sequence",
      scrollProgressForIndex(index, journey.length),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  return (
    <section id="journey" className="v3-journey v4-journey-sequence section-anchor" aria-labelledby="journey-title">
      <div className="v4-journey-stage">
        <div className="v3-journey-media" aria-hidden>
          <CinematicPicture asset={cinematicAssets.contourRidge} decorative />
        </div>
        <div className="v4-journey-grade" aria-hidden />

        <header className="v4-journey-heading">
          <span>05 / Altitude route</span>
          <h2 id="journey-title">The path rises through practice.</h2>
          <p>Education becomes applied work, then evidence-led storytelling and a live portfolio platform.</p>
        </header>

        <div className="v4-journey-route" aria-label="Journey milestones">
          <div className="v3-altitude-route" aria-hidden><span /></div>
          {journey.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={index === activeIndex ? "active" : ""}
              aria-current={index === activeIndex ? "step" : undefined}
              onClick={() => selectMilestone(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <small>{item.year}</small>
            </button>
          ))}
        </div>

        <div className="v4-journey-milestones" aria-live="polite">
          {journey.map((item, index) => (
            <article
              key={item.label}
              className={index === activeIndex ? "v4-journey-milestone active" : "v4-journey-milestone"}
              aria-hidden={index !== activeIndex}
              inert={index !== activeIndex ? true : undefined}
            >
              <Mountains aria-hidden size={28} weight="duotone" />
              <span>Altitude {String((index + 1) * 1250).padStart(4, "0")} m</span>
              <small>{item.year}</small>
              <h3>{item.label}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
