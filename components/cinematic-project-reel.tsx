"use client";

import { ArrowSquareOut, CheckCircle, CircleNotch, Funnel, Play } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { cinematicAssets, type CinematicAsset } from "@/lib/cinematic";
import { projects, type Project, type Skill } from "@/lib/content";
import { CinematicPicture } from "./cinematic-picture";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./ui/dialog";

const filters: Array<Skill | "All"> = ["All", "Python", "SQL", "Power BI", "Cloud"];
const projectAssets: CinematicAsset[] = [
  cinematicAssets.kathmanduGrid,
  cinematicAssets.contourRidge,
  cinematicAssets.summitDawn,
  cinematicAssets.observatoryWorkspace
];

export function CinematicProjectReel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [filter, setFilter] = useState<Skill | "All">("All");
  const filtered = useMemo(
    () => projects.filter((project) => filter === "All" || project.skills.includes(filter)),
    [filter]
  );

  useEffect(() => {
    const handleScrollSelection = (event: Event) => {
      const next = Number((event as CustomEvent<number>).detail);
      if (Number.isInteger(next)) setActiveIndex(Math.max(0, Math.min(projects.length - 1, next)));
    };
    const handleTerminalSelection = (event: Event) => {
      const id = String((event as CustomEvent<string>).detail || "");
      const next = projects.findIndex((project) => project.id === id);
      if (next >= 0) setActiveIndex(next);
    };
    window.addEventListener("observatory-project-change", handleScrollSelection);
    window.addEventListener("observatory-project-select", handleTerminalSelection);
    return () => {
      window.removeEventListener("observatory-project-change", handleScrollSelection);
      window.removeEventListener("observatory-project-select", handleTerminalSelection);
    };
  }, []);

  const activeProject = projects[activeIndex];

  return (
    <section id="projects" className="v3-projects section-anchor" aria-labelledby="projects-title">
      <div className="v3-project-sequence">
        <div className="v3-project-stage">
          <div className="v3-project-media" aria-hidden="true">
            {projectAssets.map((asset, index) => (
              <CinematicPicture
                key={asset.id}
                asset={asset}
                className={index === activeIndex ? "active" : ""}
                decorative
              />
            ))}
            <div className="v3-project-grade" />
          </div>

          <div className="v3-project-topline">
            <span>03 / Project reel</span>
            <span>{activeProject.number} of {projects.length.toString().padStart(2, "0")}</span>
          </div>

          <div className="v3-project-copy" aria-live="polite">
            <span className={`v3-project-status ${isProgress(activeProject) ? "progress" : "published"}`}>
              {isProgress(activeProject) ? <CircleNotch aria-hidden size={16} /> : <CheckCircle aria-hidden size={16} weight="fill" />}
              {activeProject.status}
            </span>
            <p className="v3-project-number">Mission {activeProject.number}</p>
            <h2 id="projects-title">{activeProject.title}</h2>
            <p className="v3-project-summary">{activeProject.summary}</p>
            {activeProject.id === "loan-default-analysis" ? (
              <div className="v3-evidence-metric">
                <strong>19.98%</strong>
                <span>repository-reported final-outcome default rate</span>
              </div>
            ) : (
              <div className="v3-evidence-note"><span>Evidence status</span><p>{activeProject.evidence}</p></div>
            )}
            <a href={activeProject.repository} target="_blank" rel="noreferrer" className="v3-inline-link">
              Inspect public evidence <ArrowSquareOut aria-hidden size={17} />
            </a>
          </div>

          <div className="v3-project-index" aria-label="Project chapters">
            {projects.map((project, index) => (
              <button
                key={project.id}
                type="button"
                className={index === activeIndex ? "active" : ""}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              >
                <span>{project.number}</span>
                <strong>{project.title}</strong>
              </button>
            ))}
          </div>

          <div className="v3-project-progress" aria-hidden><span /></div>
          <span className="v3-scroll-label"><Play aria-hidden size={13} weight="fill" /> Scroll to direct the reel</span>
        </div>
      </div>

      <div className="v3-project-accessible">
        <div className="v3-section-heading">
          <div><span>Accessible mission index</span><h3>Choose a briefing directly.</h3></div>
          <p>The same truthful content remains available without pinned motion or canvas interaction.</p>
        </div>
        <div className="v3-filter-row" role="group" aria-label="Filter projects by skill">
          <span><Funnel aria-hidden size={16} /> Filter signal</span>
          {filters.map((item) => (
            <button key={item} type="button" className={filter === item ? "active" : ""} aria-pressed={filter === item} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="v3-project-card-grid">
          {filtered.map((project) => <ProjectBriefingCard key={project.id} project={project} onActivate={() => setActiveIndex(projects.indexOf(project))} />)}
        </div>
      </div>
    </section>
  );
}

function ProjectBriefingCard({ project, onActivate }: { project: Project; onActivate: () => void }) {
  return (
    <article className="v3-project-card" onFocusCapture={onActivate} onPointerEnter={onActivate}>
      <div><span>{project.number}</span><span>{project.status}</span></div>
      <h4>{project.title}</h4>
      <p>{project.summary}</p>
      <div className="v3-tag-row">{project.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
      <Dialog>
        <DialogTrigger asChild><button type="button" onClick={onActivate}>Open briefing</button></DialogTrigger>
        <DialogContent>
          <span className="dialog-kicker">Mission {project.number} / {project.status}</span>
          <DialogTitle>{project.title}</DialogTitle>
          <DialogDescription>{project.briefing}</DialogDescription>
          <div className="dialog-evidence"><strong>Evidence note</strong><p>{project.evidence}</p></div>
          <a className="primary-button compact-button" href={project.repository} target="_blank" rel="noreferrer">
            View public repository <ArrowSquareOut aria-hidden size={17} />
          </a>
        </DialogContent>
      </Dialog>
    </article>
  );
}

function isProgress(project: Project) {
  return project.status === "In progress" || project.status === "In development";
}
