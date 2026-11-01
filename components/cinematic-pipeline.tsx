"use client";

import { ArrowRight, ChartBar, CheckCircle, Database, Funnel, Gauge, Rows } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { cinematicAssets, indexFromProgress, scrollProgressForIndex } from "@/lib/cinematic";
import { pipeline } from "@/lib/content";
import { cinematicProgress } from "@/lib/progress-bus";
import { scrollSequenceToProgress } from "@/lib/utils";
import { CinematicPicture } from "./cinematic-picture";

const evidence = [
  { eyebrow: "Raw input", value: "Borrower records", detail: "SELECT * FROM borrower_records", icon: Database },
  { eyebrow: "Quality pass", value: "Duplicates removed", detail: "drop_duplicates() · fillna()", icon: Rows },
  { eyebrow: "Pattern scan", value: "Segments compared", detail: "groupby('segment')", icon: ChartBar },
  { eyebrow: "Model discipline", value: "Baseline first", detail: "Complexity follows evidence", icon: Funnel },
  { eyebrow: "Published result", value: "19.98%", detail: "Repository-reported final outcome rate", icon: Gauge },
  { eyebrow: "Decision output", value: "Signal to action", detail: "A reporting decision with context", icon: CheckCircle }
] as const;

export function CinematicPipeline() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => cinematicProgress.subscribe("method", (progress) => {
    setActiveIndex((current) => {
      const next = indexFromProgress(progress, pipeline.length);
      return current === next ? current : next;
    });
  }), []);

  function selectPhase(index: number) {
    setActiveIndex(index);
    scrollSequenceToProgress(
      ".v3-pipeline-sequence",
      scrollProgressForIndex(index, pipeline.length),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  return (
    <section id="method" className="v3-pipeline-sequence section-anchor" aria-labelledby="method-title">
      <div className="v3-pipeline-stage">
        <div className="v3-pipeline-media" aria-hidden>
          <CinematicPicture asset={cinematicAssets.contourRidge} decorative />
          <span />
        </div>

        <header className="v3-pipeline-heading">
          <span>02 / Signal pipeline</span>
          <h2 id="method-title">One signal, transformed with purpose.</h2>
          <p>Follow the same evidence as it becomes cleaner, more legible, and useful for a decision.</p>
        </header>

        <div className="v4-pipeline-console">
          <nav className="v4-pipeline-nav" aria-label="Analytical pipeline phases">
            <div className="v4-pipeline-progress" aria-hidden><span /></div>
            {pipeline.map(({ step }, index) => (
              <button
                key={step}
                type="button"
                className={index === activeIndex ? "active" : ""}
                aria-current={index === activeIndex ? "step" : undefined}
                onClick={() => selectPhase(index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </button>
            ))}
          </nav>

          <div className="v4-pipeline-viewport" aria-live="polite">
            <div className="v4-pipeline-signal" aria-hidden />
            {pipeline.map(({ step, note }, index) => {
              const item = evidence[index];
              const Icon = item.icon;
              return (
                <article
                  key={step}
                  className={index === activeIndex ? "v4-pipeline-phase active" : "v4-pipeline-phase"}
                  aria-hidden={index !== activeIndex}
                  inert={index !== activeIndex ? true : undefined}
                >
                  <div className="v4-pipeline-phase-index">
                    <span>Phase {String(index + 1).padStart(2, "0")}</span>
                    <Icon aria-hidden size={24} weight="duotone" />
                  </div>
                  <div className="v4-pipeline-evidence">
                    <span>{item.eyebrow}</span>
                    <strong>{item.value}</strong>
                    <code>{item.detail}</code>
                  </div>
                  <div className="v4-pipeline-copy">
                    <h3>{step}</h3>
                    <p>{note}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="v3-pipeline-readout">
          <span>Active transformation</span>
          <strong>{pipeline[activeIndex].step} <ArrowRight aria-hidden size={14} /> useful impact</strong>
        </div>
      </div>
    </section>
  );
}
