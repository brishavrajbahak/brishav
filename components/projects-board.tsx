"use client";

import { ArrowSquareOut, CheckCircle, CircleNotch, Cube, Funnel } from "@phosphor-icons/react";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { projects, type Project, type Skill } from "@/lib/content";
import { fadeUp, indexedReveal } from "@/lib/motion";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { MissionPoster } from "./scene-posters";
import type { SceneQuality } from "@/lib/adaptive-quality";

const filters: Array<Skill | "All"> = ["All", "Python", "SQL", "Power BI", "Cloud"];

const MissionSceneExperience = dynamic(
  () => import("./scene-experiences").then((module) => module.MissionSceneExperience),
  { ssr: false }
);

export function ProjectsBoard({ quality }: { quality: SceneQuality }) {
  const [filter, setFilter] = useState<Skill | "All">("All");
  const [selectedId, setSelectedId] = useState(projects[0].id);
  const filtered = useMemo(
    () => projects.filter((project) => filter === "All" || project.skills.includes(filter)),
    [filter]
  );
  const selected = projects.find((project) => project.id === selectedId) ?? projects[0];

  function selectProject(id: string) {
    setSelectedId(id);
    const card = document.querySelector<HTMLElement>(`[data-project-card="${id}"]`);
    card?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  return (
    <section id="projects" className="section projects-section section-anchor" aria-labelledby="projects-title">
      <motion.div className="section-heading split-heading" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={fadeUp}>
        <div>
          <span className="section-index">03 / Mission board</span>
          <h2 id="projects-title">Published work, clearly separated from work still underway.</h2>
        </div>
        <p>Every status and result is tied to public evidence. Nothing unfinished is presented as delivered.</p>
      </motion.div>

      <div className="project-filter-bar" role="group" aria-label="Filter projects by skill">
        <span><Funnel aria-hidden size={16} /> Filter signal</span>
        <div>
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? "active" : ""}
              aria-pressed={filter === item}
              onClick={() => {
                setFilter(item);
                const next = projects.find((project) => item === "All" || project.skills.includes(item));
                if (next) setSelectedId(next.id);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mission-layout">
        <div className="mission-scene-shell">
          <div className="scene-label">
            <span><Cube aria-hidden size={16} /> Mission topology</span>
            <small>{quality === "poster" ? "Adaptive poster" : "Drag-free selectable 3D"}</small>
          </div>
          {quality === "poster" ? (
            <div className="mission-scene" role="img" aria-label="Project mission topology. Static reduced-motion view.">
              <MissionPoster />
            </div>
          ) : (
            <MissionSceneExperience
              quality={quality}
              projectIds={projects.map((project) => project.id)}
              selectedId={selected.id}
              onSelect={selectProject}
            />
          )}
          <p className="scene-selection" aria-live="polite">Selected mission: <strong>{selected.title}</strong></p>
        </div>

        <div className="project-list">
          {filtered.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              selected={project.id === selected.id}
              onSelect={() => setSelectedId(project.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  index,
  selected,
  onSelect
}: {
  project: Project;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const truthfulStatus = project.status === "In development" || project.status === "In progress";
  return (
    <motion.article
      data-project-card={project.id}
      className={`project-card ${selected ? "selected" : ""}`}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={indexedReveal}
      onFocusCapture={onSelect}
      onPointerEnter={onSelect}
    >
      <div className="project-card-topline">
        <span className="project-number">{project.number}</span>
        <span className={`status-chip ${truthfulStatus ? "status-progress" : "status-published"}`}>
          {truthfulStatus ? <CircleNotch aria-hidden size={14} /> : <CheckCircle aria-hidden size={14} weight="fill" />}
          {project.status}
        </span>
      </div>
      <h3>{project.title}</h3>
      <p>{project.summary}</p>
      <div className="project-tags" role="group" aria-label="Skills used">
        {project.skills.map((skill) => <span key={skill}>{skill}</span>)}
      </div>
      <div className="project-actions">
        <Dialog>
          <DialogTrigger asChild>
            <button type="button" className="text-button" onClick={onSelect}>Open briefing</button>
          </DialogTrigger>
          <DialogContent>
            <span className="dialog-kicker">Mission {project.number} / {project.status}</span>
            <DialogTitle>{project.title}</DialogTitle>
            <DialogDescription>{project.briefing}</DialogDescription>
            <div className="dialog-evidence"><strong>Evidence note</strong><p>{project.evidence}</p></div>
            <div className="project-tags">
              {project.tools.map((tool) => <span key={tool}>{tool}</span>)}
            </div>
            <a className="primary-button compact-button" href={project.repository} target="_blank" rel="noreferrer">
              View public repository <ArrowSquareOut aria-hidden size={17} />
            </a>
          </DialogContent>
        </Dialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <a className="icon-link" href={project.repository} target="_blank" rel="noreferrer" aria-label={`Open ${project.title} repository`}>
              <ArrowSquareOut aria-hidden size={18} />
            </a>
          </TooltipTrigger>
          <TooltipContent>Open verified source</TooltipContent>
        </Tooltip>
      </div>
    </motion.article>
  );
}
