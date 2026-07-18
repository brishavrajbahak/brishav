"use client";

import dynamic from "next/dynamic";
import {
  ArrowDown,
  ArrowRight,
  ArrowSquareOut,
  Command,
  EnvelopeSimple,
  GithubLogo,
  InstagramLogo,
  LinkedinLogo,
  List,
  MapPin,
  Mountains,
  Sparkle,
  SunHorizon
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { CINEMATIC_TIMING, cinematicAssets, experienceTierFromQuality } from "@/lib/cinematic";
import { insights, journey, navigation, pipeline, resumeUrl, siteConfig, skills } from "@/lib/content";
import { scrollToSection } from "@/lib/utils";
import { CinematicIntro } from "./cinematic-intro";
import { CinematicPicture } from "./cinematic-picture";
import { CinematicProjectReel } from "./cinematic-project-reel";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "./ui/sheet";
import { TooltipProvider } from "./ui/tooltip";
import { useAdaptiveQuality } from "./use-adaptive-quality";

const CinematicHeroTerrain = dynamic(
  () => import("./cinematic-hero-terrain").then((module) => module.CinematicHeroTerrain),
  { ssr: false }
);

const CinematicScrollDirector = dynamic(
  () => import("./cinematic-scroll-director").then((module) => module.CinematicScrollDirector),
  { ssr: false }
);

const DataControlRoom = dynamic(
  () => import("./data-control-room").then((module) => module.DataControlRoom),
  { loading: () => <ControlRoomPlaceholder /> }
);

const ContactForm = dynamic(
  () => import("./contact-form").then((module) => module.ContactForm),
  { ssr: false, loading: () => <div className="v3-contact-form-placeholder">Preparing the secure contact channel…</div> }
);

export function PortfolioExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const quality = useAdaptiveQuality();
  const tier = experienceTierFromQuality(quality);
  const [activeSection, setActiveSection] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [directorReady, setDirectorReady] = useState(false);
  const [terrainReady, setTerrainReady] = useState(false);
  const [terrainVisible, setTerrainVisible] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (active?.target.id) setActiveSection(active.target.id);
      },
      { rootMargin: "-18% 0px -70%", threshold: [0.03, 0.14, 0.4] }
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
    if (tier === "static") return;
    const activate = () => {
      setDirectorReady(true);
      setTerrainReady(true);
    };
    const idleWindow = window as typeof window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (idleWindow.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(activate, { timeout: 1100 });
      return () => idleWindow.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(activate, 420);
    return () => window.clearTimeout(timer);
  }, [tier]);

  useEffect(() => {
    const hero = document.getElementById("home");
    if (!hero || tier === "static") return;
    const observer = new IntersectionObserver(([entry]) => setTerrainVisible(entry.isIntersecting), {
      rootMargin: "180px 0px",
      threshold: 0.01
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [tier]);

  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!id) return;
    const restoreHash = () => document.getElementById(id)?.scrollIntoView({ behavior: "auto", block: "start" });
    const frame = window.requestAnimationFrame(restoreHash);
    const timer = window.setTimeout(restoreHash, CINEMATIC_TIMING.hashRestoreMs);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [directorReady]);

  function goTo(id: string) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollToSection(id, reducedMotion);
  }

  return (
    <TooltipProvider>
      <div ref={rootRef} className={`v3-site experience-${tier}`}>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <CinematicIntro />
        <div className="v3-pointer-light" aria-hidden />

        <header className="v3-header">
          <button type="button" className="v3-brand" onClick={() => goTo("home")}>
            <span>{siteConfig.initials}</span>
            <span><strong>{siteConfig.name}</strong><small>Himalayan Data Observatory</small></span>
          </button>
          <nav className="v3-desktop-nav" aria-label="Primary navigation">
            {navigation.map(({ id, label }, index) => (
              <button key={id} type="button" className={activeSection === id ? "active" : ""} aria-current={activeSection === id ? "location" : undefined} onClick={() => goTo(id)}>
                <span>{String(index + 1).padStart(2, "0")}</span>{label}
              </button>
            ))}
          </nav>
          <div className="v3-header-status"><SunHorizon aria-hidden size={17} /><span>{tier} / light</span></div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><button type="button" className="v3-mobile-menu" aria-label="Open navigation"><List aria-hidden size={23} /></button></SheetTrigger>
            <SheetContent>
              <SheetTitle>Navigate the observatory</SheetTitle>
              <SheetDescription>Jump directly to any chapter in Brishav Rajbahak&apos;s portfolio.</SheetDescription>
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
          <section id="home" className="v3-hero-sequence section-anchor" aria-labelledby="hero-title" data-critters-container>
            <div className="v3-hero-stage">
              <div className="v3-hero-landscape" aria-hidden>
                <CinematicPicture asset={cinematicAssets.summitDawn} eager decorative />
                <span className="v3-hero-vignette" />
              </div>

              <div className="v3-hero-editorial">
                <div className="v3-availability"><i aria-hidden /><span>{siteConfig.availability}</span></div>
                <span className="v3-eyebrow">{siteConfig.eyebrow} · Kathmandu 27.7172° N</span>
                <h1 id="hero-title">Turning Data Into <em>Cinematic Stories.</em></h1>
                <p>{siteConfig.description}</p>
                <div className="v3-hero-actions">
                  <button type="button" onClick={() => goTo("projects")}>Enter the Dataverse <ArrowRight aria-hidden size={18} weight="bold" /></button>
                  <button type="button" onClick={() => goTo("laboratory")}>Open the control room</button>
                  {resumeUrl ? <a href={resumeUrl}>Resume</a> : null}
                </div>
                <div className="v3-skill-line" aria-label="Core skills">
                  {skills.map((skill) => <span key={skill.name}><strong>{skill.name}</strong><small>{skill.note}</small></span>)}
                </div>
              </div>

              <div className="v3-hero-mosaic" aria-label="Portrait of Brishav Rajbahak framed by Himalayan data landscapes">
                <div className="v3-mosaic-card portrait">
                  <picture>
                    <source
                      type="image/webp"
                      srcSet="/assets/images/Brishav-portrait-480.webp 480w, /assets/images/Brishav-portrait-768.webp 768w"
                      sizes="36vw"
                    />
                    <img
                      src="/assets/images/Brishav-portrait-768.webp"
                      alt="Brishav Rajbahak"
                      width={768}
                      height={1040}
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                  <span><small>Observer 01</small><strong>Brishav Rajbahak</strong></span>
                </div>
                <CinematicPicture asset={cinematicAssets.contourRidge} className="v3-mosaic-card ridge" decorative />
                <CinematicPicture asset={cinematicAssets.kathmanduGrid} className="v3-mosaic-card city" decorative />
                <div className="v3-mosaic-caption"><Mountains aria-hidden size={18} /><span>Signals rise from context.<br />Stories begin with evidence.</span></div>
              </div>

              <div className="v3-hero-mask" aria-hidden>
                <CinematicPicture asset={cinematicAssets.summitDawn} className="v3-hero-mask-media" decorative />
                <strong>BR</strong>
              </div>
              {terrainReady && terrainVisible ? <CinematicHeroTerrain tier={tier} /> : null}
              <div className="v3-camera-caption"><span>Follow the illuminated contour</span><strong>From raw signal to useful impact.</strong></div>
              <button type="button" className="v3-scroll-cue" onClick={() => goTo("method")}>Direct the journey <ArrowDown aria-hidden size={16} /></button>
            </div>
          </section>

          <section id="method" className="v3-pipeline-sequence section-anchor" aria-labelledby="method-title">
            <div className="v3-pipeline-stage">
              <div className="v3-pipeline-media" aria-hidden><CinematicPicture asset={cinematicAssets.contourRidge} decorative /><span /></div>
              <div className="v3-pipeline-heading">
                <span>02 / Signal pipeline</span>
                <h2 id="method-title">Every useful decision starts as an unshaped signal.</h2>
                <p>Travel the same evidence through six visible transformations.</p>
              </div>
              <div className="v3-pipeline-route" aria-hidden />
              <ol className="v3-pipeline-steps" aria-label="Analytical pipeline">
                {pipeline.map(({ step, note }, index) => (
                  <li key={step} className="v3-pipeline-step">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <h3>{step}</h3>
                    <p>{note}</p>
                    <code>{pipelineEvidence[index]}</code>
                  </li>
                ))}
              </ol>
              <div className="v3-pipeline-readout"><span>Live route</span><strong>Ingest → Cleanse → Explore → Model → Visualize → Impact</strong></div>
            </div>
          </section>

          <CinematicProjectReel />
          <div id="laboratory" className="v3-control-anchor section-anchor">
            <DeferredRender rootMargin="900px" fallback={<ControlRoomPlaceholder />}>
              <DataControlRoom tier={tier} />
            </DeferredRender>
          </div>

          <section id="journey" className="v3-journey section-anchor" aria-labelledby="journey-title">
            <div className="v3-journey-media" aria-hidden><CinematicPicture asset={cinematicAssets.contourRidge} decorative /></div>
            <div className="v3-journey-content">
              <div className="v3-section-heading light">
                <div><span>05 / Altitude route</span><h2 id="journey-title">The path rises through practice, not invented titles.</h2></div>
                <p>A truthful route from education to published analytical work and a live portfolio platform.</p>
              </div>
              <div className="v3-altitude-map">
                <div className="v3-altitude-route" aria-hidden><span /></div>
                {journey.map((item, index) => (
                  <article key={item.label}>
                    <div><span>{String(index + 1).padStart(2, "0")}</span></div>
                    <small>{item.year}</small><h3>{item.label}</h3><p>{item.copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="insights" className="v3-insights section-anchor" aria-labelledby="insights-title">
            <div className="v3-section-heading">
              <div><span>06 / Field reports</span><h2 id="insights-title">Three readings from the evidence already inside the observatory.</h2></div>
              <p>Large editorial notes replace generic cards; every number is labeled as curated demo evidence.</p>
            </div>
            <div className="v3-report-list">
              {insights.map((insight, index) => (
                <article key={insight.id} className="v3-field-report">
                  <CinematicPicture asset={reportAssets[index]} className="v3-report-media" decorative />
                  <div className="v3-report-copy">
                    <span>{String(index + 1).padStart(2, "0")} / {insight.label}</span>
                    <h3>{insight.title}</h3>
                    <div><small>Data challenge</small><p>{insight.challenge}</p></div>
                    <div><small>Signal worth noticing</small><p>{insight.insight}</p></div>
                    <div><small>Analytical lesson</small><p>{insight.lesson}</p></div>
                    <aside><strong>{reportEvidence[index].value}</strong><span>{reportEvidence[index].label}</span></aside>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="contact" className="v3-contact section-anchor" aria-labelledby="contact-title">
            <div className="v3-contact-horizon" aria-hidden><CinematicPicture asset={cinematicAssets.dataHorizon} decorative /></div>
            <div className="v3-contact-content">
              <div className="v3-contact-copy">
                <span>07 / Sunrise horizon</span>
                <h2 id="contact-title">Have a question worth exploring?</h2>
                <p>Send a message through the protected contact channel, or connect through a verified profile.</p>
                <div className="v3-contact-location"><MapPin aria-hidden size={19} weight="fill" /><span><strong>{siteConfig.location}</strong><small>Nepal Standard Time / UTC+05:45</small></span></div>
                <div className="v3-social-links">
                  <a href={`mailto:${siteConfig.email}`}><EnvelopeSimple aria-hidden size={19} /> Email</a>
                  <a href={siteConfig.github} target="_blank" rel="noreferrer"><GithubLogo aria-hidden size={19} /> GitHub <ArrowSquareOut aria-hidden size={13} /></a>
                  <a href={siteConfig.linkedin} target="_blank" rel="noreferrer"><LinkedinLogo aria-hidden size={19} /> LinkedIn <ArrowSquareOut aria-hidden size={13} /></a>
                  <a href={siteConfig.instagram} target="_blank" rel="noreferrer"><InstagramLogo aria-hidden size={19} /> Instagram <ArrowSquareOut aria-hidden size={13} /></a>
                </div>
              </div>
              <DeferredRender rootMargin="650px" fallback={<div className="v3-contact-form-placeholder">The secure contact channel loads as you approach.</div>}>
                <ContactForm />
              </DeferredRender>
            </div>
          </section>
        </main>

        <footer className="v3-footer">
          <div><Sparkle aria-hidden size={18} weight="fill" /><span><strong>{siteConfig.name}</strong><small>Data, evidence, and clear decisions.</small></span></div>
          <p>© {new Date().getFullYear()} Brishav Rajbahak. Static-first on Cloudflare.</p>
          <button type="button" onClick={() => goTo("home")}>Return to summit <ArrowRight aria-hidden size={15} /></button>
        </footer>

        {directorReady ? <CinematicScrollDirector /> : null}
      </div>
    </TooltipProvider>
  );
}

function DeferredRender({
  children,
  fallback,
  rootMargin
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
  rootMargin: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || active) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setActive(true);
      observer.disconnect();
    }, { rootMargin, threshold: 0.01 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [active, rootMargin]);

  return active ? <>{children}</> : <div ref={ref}>{fallback}</div>;
}

function ControlRoomPlaceholder() {
  return (
    <section className="v3-control-placeholder" aria-busy="true">
      <Command aria-hidden size={24} />
      <span>04 / Data control room</span>
      <strong>Warming terminal, mandala, and analytical instruments.</strong>
    </section>
  );
}

const pipelineEvidence = [
  "SELECT * FROM borrower_records",
  "df.drop_duplicates().fillna()",
  "df.groupby('segment')",
  "baseline before complexity",
  "19.98% published outcome rate",
  "signal → reporting decision"
] as const;

const reportAssets = [cinematicAssets.summitDawn, cinematicAssets.kathmanduGrid, cinematicAssets.dataHorizon] as const;
const reportEvidence = [
  { value: "13,800", label: "Bagmati Q2 arrivals in the curated tourism demo" },
  { value: "63 days", label: "highest delinquency marker in the illustrative loan-risk sample" },
  { value: "47% / 46%", label: "Karnali dependency / formal channel in the 2023 remittance demo" }
] as const;
