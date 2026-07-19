"use client";

import { ArrowSquareOut, CheckCircle, CircleNotch } from "@phosphor-icons/react";
import { line } from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import { projects } from "@/lib/content";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";

const projectPoints = [
  [50, 13],
  [83, 43],
  [50, 79],
  [17, 43]
] as const;

const skillPoints = [
  { label: "Python", point: [31, 27] },
  { label: "SQL", point: [69, 27] },
  { label: "Power BI", point: [69, 63] },
  { label: "Cloud", point: [31, 63] }
] as const;

export function V5SignalMandala() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const activeProject = projects[activeIndex];
  const path = useMemo(() => line<[number, number]>().x((point) => point[0]).y((point) => point[1]), []);

  useEffect(() => {
    const stage = document.querySelector<HTMLElement>(".v5-work-cinematic");
    const cinematicMode = window.matchMedia("(min-width: 981px) and (prefers-reduced-motion: no-preference)");
    if (!stage || !cinematicMode.matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const bounds = stage.getBoundingClientRect();
      const distance = Math.max(1, bounds.height - window.innerHeight);
      const progress = Math.min(0.999, Math.max(0, -bounds.top / distance));
      const next = Math.min(projects.length - 1, Math.floor(progress * projects.length));
      setActiveIndex((current) => current === next ? current : next);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  function select(index: number, focus = false) {
    setActiveIndex(index);
    if (focus) buttonRefs.current[index]?.focus();
  }

  function openBriefing(index: number) {
    select(index);
    lastTriggerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : buttonRefs.current[index];
    setOpen(true);
  }

  function changeDialog(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) window.requestAnimationFrame(() => lastTriggerRef.current?.focus());
  }

  function handleKey(index: number, event: React.KeyboardEvent<HTMLButtonElement>) {
    if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "Home") return select(0, true);
      if (event.key === "End") return select(projects.length - 1, true);
      const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      select((index + direction + projects.length) % projects.length, true);
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openBriefing(index);
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeDialog}>
      <div className="v5-mandala" aria-label="Project relationship map">
        <div className="v5-mandala-copy">
          <span>Selected project / {activeProject.number}</span>
          <h3>{activeProject.title}</h3>
          <p>{activeProject.summary}</p>
          <button type="button" className="v5-text-button" onClick={() => openBriefing(activeIndex)}>Read the proof</button>
        </div>

        <div className="v5-mandala-visual">
          <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
            <circle cx="50" cy="46" r="35" />
            <circle cx="50" cy="46" r="23" />
            {projectPoints.map((point, index) => (
              <path key={index} d={path([[50, 46], [point[0], point[1]]]) || undefined} className={index === activeIndex ? "active" : ""} />
            ))}
            {skillPoints.map(({ point }, index) => (
              <path key={`skill-${index}`} d={path([[50, 46], [point[0], point[1]]]) || undefined} className="skill-link" />
            ))}
          </svg>
          <span className="v5-mandala-center" aria-hidden>BR</span>
          {skillPoints.map(({ label, point }) => (
            <span key={label} className="v5-mandala-skill" style={{ left: `${point[0]}%`, top: `${point[1]}%` }} aria-hidden>{label}</span>
          ))}
          {projects.map((project, index) => {
            const point = projectPoints[index];
            return (
              <button
                key={project.id}
                ref={(node) => { buttonRefs.current[index] = node; }}
                type="button"
                className={index === activeIndex ? "v5-mandala-node active" : "v5-mandala-node"}
                style={{ left: `${point[0]}%`, top: `${point[1]}%` }}
                tabIndex={index === activeIndex ? 0 : -1}
                aria-describedby={`mandala-summary-${project.id}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onFocus={() => select(index)}
                onClick={() => openBriefing(index)}
                onKeyDown={(event) => handleKey(index, event)}
              >
                <span>{project.number}</span><strong>{project.title}</strong>
              </button>
            );
          })}
        </div>

        <div className="v5-sr-only" aria-live="polite">
          {projects.map((project) => <p key={project.id} id={`mandala-summary-${project.id}`}>{project.title}. {project.status}. {project.summary}</p>)}
        </div>
      </div>

      <DialogContent className="v5-proof-dialog">
        <DialogTitle>{activeProject.title}</DialogTitle>
        <DialogDescription>{activeProject.briefing}</DialogDescription>
        <span className="v5-dialog-status">
          {activeProject.status === "Published" || activeProject.status === "Live system" ? <CheckCircle aria-hidden size={17} /> : <CircleNotch aria-hidden size={17} />}
          {activeProject.status}
        </span>
        <div className="v5-proof-columns">
          <div><h4>Business impact</h4><ul>{activeProject.proof.businessImpact.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div><h4>What I delivered</h4><ul>{activeProject.proof.delivered.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
        <div className="v5-methodology-note">
          <h4>Methodology</h4>
          <p>{activeProject.proof.methodology.source} / {activeProject.proof.methodology.dateRange}</p>
          <p>{activeProject.proof.methodology.cohort}</p>
        </div>
        <a className="v5-button primary" href={activeProject.repository} target="_blank" rel="noreferrer">Open repository <ArrowSquareOut aria-hidden size={16} /></a>
      </DialogContent>
    </Dialog>
  );
}
