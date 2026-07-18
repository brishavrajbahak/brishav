"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import {
  ArrowDown,
  ArrowRight,
  ArrowSquareOut,
  ChartLineUp,
  Cloud,
  Code,
  Database,
  EnvelopeSimple,
  GithubLogo,
  InstagramLogo,
  LinkedinLogo,
  List,
  MapPin,
  Sparkle,
  SunHorizon
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  insights,
  journey,
  navigation,
  pipeline,
  projects,
  resumeUrl,
  siteConfig,
  skills,
  type Skill
} from "@/lib/content";
import { fadeIn, fadeUp, indexedReveal } from "@/lib/motion";
import { scrollToSection } from "@/lib/utils";
import { ContactForm } from "./contact-form";
import { HeroPoster } from "./scene-posters";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "./ui/sheet";
import { TooltipProvider } from "./ui/tooltip";
import { useAdaptiveQuality } from "./use-adaptive-quality";

const HeroSceneExperience = dynamic(
  () => import("./scene-experiences").then((module) => module.HeroSceneExperience),
  { ssr: false }
);

const SharedCanvasLayer = dynamic(
  () => import("./scene-experiences").then((module) => module.SharedCanvasLayer),
  { ssr: false }
);

const ProjectsBoard = dynamic(
  () => import("./projects-board").then((module) => module.ProjectsBoard),
  { ssr: false }
);

const VisualizationLab = dynamic(
  () => import("./visualization-lab").then((module) => module.VisualizationLab),
  { ssr: false }
);

const skillIcons: Record<Skill, typeof Code> = {
  Python: Code,
  SQL: Database,
  "Power BI": ChartLineUp,
  Cloud
};

export function PortfolioExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = Boolean(useReducedMotion());
  const quality = useAdaptiveQuality();
  const [activeSection, setActiveSection] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (active?.target.id) setActiveSection(active.target.id);
      },
      { rootMargin: "-24% 0px -62%", threshold: [0.08, 0.22, 0.5] }
    );
    navigation.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !window.matchMedia("(pointer: fine)").matches) return;
    const handlePointer = (event: PointerEvent) => {
      root.style.setProperty("--pointer-x", `${event.clientX}px`);
      root.style.setProperty("--pointer-y", `${event.clientY}px`);
    };
    window.addEventListener("pointermove", handlePointer, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointer);
  }, []);

  useEffect(() => {
    if (quality === "poster" || sceneReady) return;
    const activate = () => setSceneReady(true);
    const events: Array<keyof WindowEventMap> = ["pointermove", "pointerdown", "keydown", "scroll"];
    events.forEach((event) => window.addEventListener(event, activate, { once: true, passive: true }));
    return () => events.forEach((event) => window.removeEventListener(event, activate));
  }, [quality, sceneReady]);

  function goTo(id: string) {
    scrollToSection(id, reducedMotion);
  }

  return (
    <TooltipProvider>
      <div ref={rootRef} className={`site-shell quality-${quality}`}>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <div className="pointer-spotlight" aria-hidden="true" />
        <div className="paper-grain" aria-hidden="true" />

        <header className="site-header">
          <button className="brand-mark" type="button" onClick={() => goTo("home")} aria-label="Brishav Rajbahak, return home">
            <span>{siteConfig.initials}</span>
            <span><strong>{siteConfig.name}</strong><small>Himalayan Data Observatory</small></span>
          </button>

          <nav className="desktop-navigation" aria-label="Primary navigation">
            {navigation.map(({ id, label }, index) => (
              <button
                key={id}
                type="button"
                className={activeSection === id ? "active" : ""}
                aria-current={activeSection === id ? "location" : undefined}
                onClick={() => goTo(id)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>{label}
              </button>
            ))}
          </nav>

          <div className="header-status"><SunHorizon aria-hidden size={18} /><span>Light observatory</span></div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="mobile-menu-trigger" type="button" aria-label="Open navigation"><List aria-hidden size={23} /></button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle>Navigate the observatory</SheetTitle>
              <SheetDescription>Jump to any section of Brishav Rajbahak&apos;s portfolio.</SheetDescription>
              <nav className="mobile-navigation" aria-label="Mobile navigation">
                {navigation.map(({ id, label }, index) => (
                  <button key={id} type="button" onClick={() => { setMobileOpen(false); goTo(id); }}>
                    <span>{String(index + 1).padStart(2, "0")}</span>{label}
                  </button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </header>

        <main id="main-content">
          <section id="home" className="hero-section section-anchor" aria-labelledby="hero-title" data-critters-container>
            <div className="hero-copy">
              <div className="availability-line">
                <span className="live-dot" aria-hidden />
                <span>{siteConfig.availability}</span>
              </div>
              <span className="hero-eyebrow">{siteConfig.eyebrow}</span>
              <h1 id="hero-title" className="hero-title">{siteConfig.headline}</h1>
              <p className="hero-description">{siteConfig.description}</p>
              <div className="hero-actions">
                <button className="primary-button" type="button" onClick={() => goTo("projects")}>
                  Enter the Dataverse <ArrowRight aria-hidden size={19} weight="bold" />
                </button>
                <button className="secondary-button" type="button" onClick={() => goTo("laboratory")}>
                  Explore live data
                </button>
                {resumeUrl ? <a className="secondary-button" href={resumeUrl}>Resume</a> : null}
              </div>
              <div className="skill-constellation" aria-label="Core skills">
                {skills.map(({ name, note }) => {
                  const Icon = skillIcons[name];
                  return <div key={name}><Icon aria-hidden size={21} weight="duotone" /><span><strong>{name}</strong><small>{note}</small></span></div>;
                })}
              </div>
            </div>

            <motion.div className="hero-observatory" initial="hidden" animate="visible" variants={fadeIn}>
              <div className="hero-scene-shell">
                {quality === "poster" || !sceneReady ? (
                  <div className="hero-scene" role="img" aria-label="Himalayan terrain with flowing data streams. Static reduced-motion view.">
                    <HeroPoster />
                  </div>
                ) : <HeroSceneExperience quality={quality} />}
                <div className="hero-coordinate-card" aria-hidden>
                  <span>27.7172° N</span><span>85.3240° E</span><small>Kathmandu / NPT</small>
                </div>
              </div>
              <div className="portrait-card">
                <div className="portrait-frame">
                  <Image
                    src="/assets/images/Brishav-768.webp"
                    alt="Brishav Rajbahak"
                    width={768}
                    height={768}
                    sizes="(max-width: 768px) 168px, 216px"
                  />
                </div>
                <div><span>Observer 01</span><strong>Brishav Rajbahak</strong><small>{siteConfig.location}</small></div>
              </div>
            </motion.div>

            <button className="scroll-cue" type="button" onClick={() => goTo("method")}>
              Continue to the method <ArrowDown aria-hidden size={17} />
            </button>
          </section>

          <section id="method" className="section method-section section-anchor" aria-labelledby="method-title">
            <motion.div className="section-heading split-heading" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={fadeUp}>
              <div><span className="section-index">02 / Analytical pipeline</span><h2 id="method-title">From raw signal to a decision someone can use.</h2></div>
              <p>Structure comes first. Each stage narrows uncertainty while keeping the analytical path visible and explainable.</p>
            </motion.div>
            <div className="pipeline-track" role="group" aria-label="Ingest, Cleanse, Explore, Model, Visualize, Impact">
              {pipeline.map(({ step, note }, index) => (
                <motion.article key={step} custom={index} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }} variants={indexedReveal}>
                  <span>{String(index + 1).padStart(2, "0")}</span><i aria-hidden /><h3>{step}</h3><p>{note}</p>
                </motion.article>
              ))}
            </div>
          </section>

          <DeferredExperience fallback={<ProjectsPlaceholder />}>
            <ProjectsBoard quality={quality} />
          </DeferredExperience>
          <DeferredExperience fallback={<LaboratoryPlaceholder />}>
            <VisualizationLab quality={quality} />
          </DeferredExperience>

          <section id="journey" className="section journey-section section-anchor" aria-labelledby="journey-title">
            <motion.div className="section-heading split-heading" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={fadeUp}>
              <div><span className="section-index">05 / Journey pipeline</span><h2 id="journey-title">Learning, applying, communicating, and launching.</h2></div>
              <p>A truthful progression from education to published portfolio work—without invented roles or experience.</p>
            </motion.div>
            <div className="journey-track">
              {journey.map((item, index) => (
                <motion.article key={item.label} custom={index} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={indexedReveal}>
                  <div className="journey-node"><span>{String(index + 1).padStart(2, "0")}</span></div>
                  <div><small>{item.year}</small><h3>{item.label}</h3><p>{item.copy}</p></div>
                </motion.article>
              ))}
            </div>
          </section>

          <section id="insights" className="section insights-section section-anchor" aria-labelledby="insights-title">
            <motion.div className="section-heading split-heading" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={fadeUp}>
              <div><span className="section-index">06 / Evidence logbook</span><h2 id="insights-title">Notes from the datasets behind the interface.</h2></div>
              <p>Three field notes derived from the curated tourism, loan-risk, and remittance demos already published with this portfolio.</p>
            </motion.div>
            <Accordion type="single" collapsible className="insight-logbook">
              {insights.map((insight, index) => (
                <AccordionItem key={insight.id} value={insight.id}>
                  <AccordionTrigger>
                    <span className="insight-number">{String(index + 1).padStart(2, "0")}</span>
                    <span><small>{insight.label}</small><strong>{insight.title}</strong></span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="insight-detail-grid">
                      <div><span>Data challenge</span><p>{insight.challenge}</p></div>
                      <div><span>Insight</span><p>{insight.insight}</p></div>
                      <div><span>Lesson</span><p>{insight.lesson}</p></div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section id="contact" className="section contact-section section-anchor" aria-labelledby="contact-title">
            <motion.div className="contact-copy" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={fadeUp}>
              <span className="section-index">07 / Contact uplink</span>
              <h2 id="contact-title">Have a question worth exploring?</h2>
              <p>Send a direct message through the protected contact channel, or connect through one of the verified profiles below.</p>
              <div className="contact-location"><MapPin aria-hidden size={19} weight="fill" /><span><strong>{siteConfig.location}</strong><small>Nepal Standard Time / UTC+05:45</small></span></div>
              <div className="social-links">
                <a href={`mailto:${siteConfig.email}`}><EnvelopeSimple aria-hidden size={19} /> Email</a>
                <a href={siteConfig.github} target="_blank" rel="noreferrer"><GithubLogo aria-hidden size={19} /> GitHub <ArrowSquareOut aria-hidden size={13} /></a>
                <a href={siteConfig.linkedin} target="_blank" rel="noreferrer"><LinkedinLogo aria-hidden size={19} /> LinkedIn <ArrowSquareOut aria-hidden size={13} /></a>
                <a href={siteConfig.instagram} target="_blank" rel="noreferrer"><InstagramLogo aria-hidden size={19} /> Instagram <ArrowSquareOut aria-hidden size={13} /></a>
              </div>
            </motion.div>
            <ContactForm />
          </section>
        </main>

        <footer>
          <div className="footer-brand"><Sparkle aria-hidden size={18} weight="fill" /><span><strong>{siteConfig.name}</strong><small>Data, evidence, and clear decisions.</small></span></div>
          <p>© {new Date().getFullYear()} Brishav Rajbahak. Built as a static-first Cloudflare portfolio.</p>
          <button type="button" onClick={() => goTo("home")}>Return to summit <ArrowRight aria-hidden size={15} /></button>
        </footer>

        {quality === "poster" || !sceneReady ? null : <SharedCanvasLayer rootRef={rootRef} quality={quality} />}
      </div>
    </TooltipProvider>
  );
}

function DeferredExperience({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const boundaryRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const boundary = boundaryRef.current;
    if (!boundary || active) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setActive(true);
        observer.disconnect();
      },
      { rootMargin: "700px 0px", threshold: 0.01 }
    );
    observer.observe(boundary);
    return () => observer.disconnect();
  }, [active]);

  return active ? <>{children}</> : <div ref={boundaryRef}>{fallback}</div>;
}

function ProjectsPlaceholder() {
  return (
    <section id="projects" className="section projects-section section-anchor deferred-section" aria-labelledby="projects-title" aria-busy="true">
      <div className="section-heading split-heading">
        <div><span className="section-index">03 / Mission board</span><h2 id="projects-title">Published work, clearly separated from work still underway.</h2></div>
        <p>Every status and result is tied to public evidence. Nothing unfinished is presented as delivered.</p>
      </div>
      <div className="deferred-project-list" aria-label="Project status summary">
        {projects.map((project) => (
          <article key={project.id}>
            <span>{project.status}</span>
            <h3>{project.title}</h3>
            <p>{project.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function LaboratoryPlaceholder() {
  return (
    <section id="laboratory" className="section lab-section section-anchor deferred-section" aria-labelledby="lab-title" aria-busy="true">
      <div className="section-heading split-heading">
        <div><span className="section-index">04 / Visualization laboratory</span><h2 id="lab-title">Explore the same evidence through different analytical lenses.</h2></div>
        <p>The backend contract stays fixed. Interactive charts load only when the laboratory approaches the viewport.</p>
      </div>
      <div className="deferred-panel"><span>Data signal</span><strong>Preparing the analytical workspace.</strong></div>
    </section>
  );
}
