"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { cinematicAssets, indexFromProgress, scrollProgressForIndex } from "@/lib/cinematic";
import { insights } from "@/lib/content";
import { cinematicProgress } from "@/lib/progress-bus";
import { scrollSequenceToProgress } from "@/lib/utils";
import { CinematicPicture } from "./cinematic-picture";

const reportAssets = [cinematicAssets.summitDawn, cinematicAssets.kathmanduGrid, cinematicAssets.dataHorizon] as const;
const reportEvidence = [
  { value: "13,800", label: "Bagmati Q2 arrivals in the curated tourism demo" },
  { value: "63 days", label: "highest delinquency marker in the illustrative loan-risk sample" },
  { value: "47% / 46%", label: "Karnali dependency / formal channel in the 2023 remittance demo" }
] as const;

export function CinematicInsights() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => cinematicProgress.subscribe("insights", (progress) => {
    setActiveIndex((current) => {
      const next = indexFromProgress(progress, insights.length);
      return current === next ? current : next;
    });
  }), []);

  function selectInsight(index: number) {
    setActiveIndex(index);
    scrollSequenceToProgress(
      ".v4-insights-sequence",
      scrollProgressForIndex(index, insights.length),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  return (
    <section id="insights" className="v3-insights v4-insights-sequence section-anchor" aria-labelledby="insights-title">
      <div className="v4-insights-stage">
        <div className="v4-insight-media-stack" aria-hidden>
          {reportAssets.map((asset, index) => (
            <CinematicPicture
              key={asset.id}
              asset={asset}
              className={index === activeIndex ? "v4-insight-media active" : "v4-insight-media"}
              decorative
            />
          ))}
          <div className="v4-insight-grade" />
        </div>

        <header className="v4-insights-heading">
          <span>06 / Field reports</span>
          <h2 id="insights-title">Readings from evidence already inside the observatory.</h2>
        </header>

        <div className="v4-insight-report-stack" aria-live="polite">
          {insights.map((insight, index) => (
            <article
              key={insight.id}
              className={index === activeIndex ? "v4-insight-report active" : "v4-insight-report"}
              aria-hidden={index !== activeIndex}
              inert={index !== activeIndex ? true : undefined}
              tabIndex={index === activeIndex ? 0 : -1}
            >
              <CinematicPicture asset={reportAssets[index]} className="v4-insight-mobile-media" decorative />
              <span>{String(index + 1).padStart(2, "0")} / {insight.label}</span>
              <h3>{insight.title}</h3>
              <div><small>Data challenge</small><p>{insight.challenge}</p></div>
              <div><small>Signal worth noticing</small><p>{insight.insight}</p></div>
              <div><small>Analytical lesson</small><p>{insight.lesson}</p></div>
              <aside><strong>{reportEvidence[index].value}</strong><span>{reportEvidence[index].label}</span></aside>
            </article>
          ))}
        </div>

        <nav className="v4-insight-index" aria-label="Field reports">
          {insights.map((insight, index) => (
            <button
              key={insight.id}
              type="button"
              className={index === activeIndex ? "active" : ""}
              aria-current={index === activeIndex ? "step" : undefined}
              onClick={() => selectInsight(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{insight.label}</strong>
              <ArrowRight aria-hidden size={14} />
            </button>
          ))}
        </nav>
        <div className="v4-insight-progress" aria-hidden><span /></div>
      </div>
    </section>
  );
}
