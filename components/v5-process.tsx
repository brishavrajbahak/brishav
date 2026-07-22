"use client";

import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { pipeline, projects } from "@/lib/content";

const loanProject = projects[0];

export function V5Process() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const pauseScrollSyncRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (pauseScrollSyncRef.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        const index = Number((visible?.target as HTMLElement | undefined)?.dataset.phaseIndex);
        if (Number.isFinite(index)) setActive(index);
      },
      { rootMargin: "-28% 0px -48% 0px", threshold: [0.2, 0.55, 0.85] }
    );
    stepRefs.current.forEach((step) => step && observer.observe(step));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const resumeScrollSync = () => {
      pauseScrollSyncRef.current = false;
    };

    window.addEventListener("scroll", resumeScrollSync, { passive: true });
    return () => window.removeEventListener("scroll", resumeScrollSync);
  }, []);

  function move(direction: number) {
    pauseScrollSyncRef.current = true;
    setActive((current) => Math.min(pipeline.length - 1, Math.max(0, current + direction)));
  }

  return (
    <section id="process" className="v5-section v5-process section-anchor" aria-labelledby="process-title">
      <header className="v5-section-heading split">
        <div><span className="v5-kicker">02 / Process</span><h2 id="process-title">The denominator stays visible.</h2></div>
        <p>One Lending Club dataset changes shape as it moves from raw rows to the published 19.98% result.</p>
      </header>

      <div id="process-phase" className="v5-process-object" data-phase={active} aria-live="polite" aria-atomic="true">
        <div className="v5-process-visual" aria-hidden>
          <span className="v5-raw-grid" />
          <span className="v5-clean-columns" />
          <span className="v5-cohort-ring" />
          <span className="v5-risk-bars" />
          <span className="v5-dashboard-frame" />
          <strong>19.98%</strong>
        </div>
        <div className="v5-process-readout">
          <span>{pipeline[active].label}</span>
          <h3>{pipeline[active].step}</h3>
          <p>{pipeline[active].note}</p>
          <div><button type="button" onClick={() => move(-1)} disabled={active === 0} aria-label="Previous process phase" aria-controls="process-phase"><ArrowLeft aria-hidden size={17} /></button><span>{active + 1} / {pipeline.length}</span><button type="button" onClick={() => move(1)} disabled={active === pipeline.length - 1} aria-label="Next process phase" aria-controls="process-phase"><ArrowRight aria-hidden size={17} /></button></div>
        </div>
      </div>

      <div className="v5-process-steps">
        {pipeline.map((phase, index) => (
          <article key={phase.label} ref={(node) => { stepRefs.current[index] = node; }} data-phase-index={index} className={active === index ? "active" : ""}>
            <span>{String(index + 1).padStart(2, "0")}</span><div><h3>{phase.label}</h3><p>{phase.note}</p></div>
          </article>
        ))}
      </div>

      <div className="v5-methodology">
        <div className="v5-methodology-metrics">
          <span><strong>2,260,701</strong><small>raw records / 2007–2018</small></span>
          <span><strong>2,260,668</strong><small>cleaned loan rows</small></span>
          <span><strong>1,348,099</strong><small>final-outcome loans</small></span>
          <span><strong>269,360</strong><small>bad outcomes</small></span>
          <span><strong>1,078,739</strong><small>good outcomes</small></span>
          <span><strong>19.98%</strong><small>269,360 ÷ 1,348,099</small></span>
        </div>
        <div className="v5-exclusion-note">
          <span>Why 912,569 loans were excluded</span>
          <p>{loanProject.proof.methodology.exclusionReason}</p>
          <p>Including unresolved loans would distort a rate that claims to compare final repayment with final default.</p>
        </div>
      </div>

      <aside className="v5-correction-note">
        <span>The status check that changed the result</span>
        <blockquote>{loanProject.proof.correctionNote}</blockquote>
      </aside>
    </section>
  );
}
