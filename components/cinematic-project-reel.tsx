"use client";

import {
  ArrowSquareOut,
  CheckCircle,
  CircleNotch,
  Funnel,
  ListDashes,
  Play
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cinematicAssets,
  indexFromProgress,
  scrollProgressForIndex,
  type CinematicAsset
} from "@/lib/cinematic";
import { projects, type Project, type Skill } from "@/lib/content";
import { cinematicProgress } from "@/lib/progress-bus";
import { scrollSequenceToProgress } from "@/lib/utils";
import { CinematicPicture } from "./cinematic-picture";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "./ui/sheet";

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
  const directProject = useCallback((index: number) => {
    setActiveIndex(index);
    scrollSequenceToProgress(
      ".v3-project-sequence",
      scrollProgressForIndex(index, projects.length),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  useEffect(() => cinematicProgress.subscribe("projects", (progress) => {
    setActiveIndex((current) => {
      const next = indexFromProgress(progress, projects.length);
      return current === next ? current : next;
    });
  }), []);

  useEffect(() => {
    const handleTerminalSelection = (event: Event) => {
      const id = String((event as CustomEvent<string>).detail || "");
      const next = projects.findIndex((project) => project.id === id);
      if (next >= 0) directProject(next);
    };
    window.addEventListener("observatory-project-select", handleTerminalSelection);
    return () => window.removeEventListener("observatory-project-select", handleTerminalSelection);
  }, [directProject]);

  const activeProject = projects[activeIndex];

  return (
    <Sheet>
      <section id="projects" className="v3-projects section-anchor" aria-labelledby="projects-title">
        <h2 id="projects-title" className="v4-sr-only">Project reel</h2>
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
              <span>Mission {activeProject.number} of {projects.length.toString().padStart(2, "0")}</span>
            </div>

            <div className="v4-project-chapter-stack">
              {projects.map((project, index) => (
                <article
                  key={project.id}
                  className={index === activeIndex ? "v4-project-chapter active" : "v4-project-chapter"}
                  aria-hidden={index !== activeIndex}
                  inert={index !== activeIndex ? true : undefined}
                >
                  <span className={isProgress(project) ? "v3-project-status progress" : "v3-project-status published"}>
                    {isProgress(project)
                      ? <CircleNotch aria-hidden size={16} />
                      : <CheckCircle aria-hidden size={16} weight="fill" />}
                    {project.status}
                  </span>
                  <p className="v3-project-number">Mission {project.number}</p>
                  <h2>{project.title}</h2>
                  <p className="v3-project-summary">{project.summary}</p>
                  {project.id === "loan-default-analysis" ? (
                    <div className="v3-evidence-metric">
                      <strong>19.98%</strong>
                      <span>repository-reported final-outcome default rate</span>
                    </div>
                  ) : (
                    <div className="v3-evidence-note"><span>Evidence status</span><p>{project.evidence}</p></div>
                  )}
                  <a href={project.repository} target="_blank" rel="noreferrer" className="v3-inline-link">
                    Inspect public evidence <ArrowSquareOut aria-hidden size={17} />
                  </a>
                </article>
              ))}
            </div>

            <nav className="v3-project-index" aria-label="Project chapters">
              {projects.map((project, index) => (
                <button
                  key={project.id}
                  type="button"
                  className={index === activeIndex ? "active" : ""}
                  aria-current={index === activeIndex ? "step" : undefined}
                  onClick={() => directProject(index)}
                >
                  <span>{project.number}</span>
                  <strong>{project.title}</strong>
                </button>
              ))}
              <SheetTrigger asChild>
                <button type="button" className="v4-mission-drawer-trigger">
                  <ListDashes aria-hidden size={17} />
                  Browse all missions
                </button>
              </SheetTrigger>
            </nav>

            <div className="v3-project-progress" aria-hidden><span /></div>
            <span className="v3-scroll-label"><Play aria-hidden size={13} weight="fill" /> Scroll to direct the reel</span>
          </div>
        </div>

        <div className="v4-mobile-project-index">
          <div>
            <span>Mission index</span>
            <h3>Choose a briefing directly.</h3>
          </div>
          <Accordion type="single" collapsible>
            {projects.map((project) => (
              <AccordionItem key={project.id} value={project.id}>
                <AccordionTrigger>
                  <span>{project.number}</span>
                  <strong>{project.title}</strong>
                  <small>{project.status}</small>
                </AccordionTrigger>
                <AccordionContent>
                  <p>{project.briefing}</p>
                  <div className="v3-tag-row">{project.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
                  <a href={project.repository} target="_blank" rel="noreferrer">
                    View repository <ArrowSquareOut aria-hidden size={15} />
                  </a>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <SheetContent className="v4-mission-sheet">
        <SheetTitle>Mission archive</SheetTitle>
        <SheetDescription>Filter the published and in-progress work, then direct the reel to a selected briefing.</SheetDescription>
        <div className="v3-filter-row" role="group" aria-label="Filter projects by skill">
          <span><Funnel aria-hidden size={16} /> Filter signal</span>
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? "active" : ""}
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="v4-mission-list">
          {filtered.map((project) => (
            <ProjectBriefingCard
              key={project.id}
              project={project}
              onActivate={() => directProject(projects.indexOf(project))}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ProjectBriefingCard({ project, onActivate }: { project: Project; onActivate: () => void }) {
  return (
    <article className="v4-mission-card">
      <div><span>Mission {project.number}</span><span>{project.status}</span></div>
      <h3>{project.title}</h3>
      <p>{project.briefing}</p>
      <div className="v4-mission-evidence"><strong>Evidence note</strong><p>{project.evidence}</p></div>
      <div className="v3-tag-row">{project.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
      <div className="v4-mission-card-actions">
        <SheetClose asChild><button type="button" onClick={onActivate}>Direct this mission</button></SheetClose>
        <a href={project.repository} target="_blank" rel="noreferrer" aria-label={"Open " + project.title + " repository"}>
          <ArrowSquareOut aria-hidden size={17} />
        </a>
      </div>
    </article>
  );
}

function isProgress(project: Project) {
  return project.status === "In progress" || project.status === "In development";
}
