"use client";

import dynamic from "next/dynamic";
import {
  ArrowRight,
  ArrowSquareOut,
  Command,
  EnvelopeSimple,
  GithubLogo,
  InstagramLogo,
  LinkedinLogo,
  List,
  MapPin,
  SpeakerSlash,
  Sparkle,
  SunHorizon
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import {
  CINEMATIC_TIMING,
  cinematicAssets,
  experienceTierFromQuality,
  type CinematicChapterId
} from "@/lib/cinematic";
import { navigation, siteConfig } from "@/lib/content";
import { cinematicProgress } from "@/lib/progress-bus";
import { scrollToSection } from "@/lib/utils";
import { CinematicInsights } from "./cinematic-insights";
import { CinematicIntro } from "./cinematic-intro";
import { CinematicJourney } from "./cinematic-journey";
import { CinematicPipeline } from "./cinematic-pipeline";
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

export function PortfolioExperience({ hero }: { hero: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const quality = useAdaptiveQuality();
  const tier = experienceTierFromQuality(quality);
  const [activeSection, setActiveSection] = useState<CinematicChapterId>("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [directorReady, setDirectorReady] = useState(false);
  const [terrainReady, setTerrainReady] = useState(false);
  const [terrainVisible, setTerrainVisible] = useState(true);

  useEffect(() => cinematicProgress.subscribeActiveSection(setActiveSection), []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const handleAnchor = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const anchor = target?.closest<HTMLAnchorElement>(".v3-hero-actions a[href^='#'], .v3-scroll-cue[href^='#']");
      if (!anchor) return;
      const id = decodeURIComponent(anchor.hash.slice(1));
      if (!id || !document.getElementById(id)) return;
      event.preventDefault();
      scrollToSection(id, window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    };
    root.addEventListener("click", handleAnchor);
    return () => root.removeEventListener("click", handleAnchor);
  }, []);

  useEffect(() => {
    if (tier !== "static") return;
    const sections = navigation
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
      if (visible?.target.id) setActiveSection(visible.target.id as CinematicChapterId);
    }, { rootMargin: "-18% 0px -64% 0px", threshold: [0, 0.15, 0.4, 0.7] });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [tier]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !window.matchMedia("(pointer: fine)").matches) return;
    let pointerFrame = 0;
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 3;
    let previousScroll = window.scrollY;
    let previousTime = performance.now();
    let settleTimer = 0;

    const handlePointer = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (pointerFrame) return;
      pointerFrame = window.requestAnimationFrame(() => {
        pointerFrame = 0;
        if (root.classList.contains("is-fast-scrolling")) return;
        root.style.setProperty("--pointer-x", pointerX + "px");
        root.style.setProperty("--pointer-y", pointerY + "px");
      });
    };

    const handleScroll = () => {
      const now = performance.now();
      const elapsed = Math.max(1, now - previousTime);
      const velocity = Math.abs(window.scrollY - previousScroll) / elapsed;
      previousScroll = window.scrollY;
      previousTime = now;
      if (velocity > 1.2) root.classList.add("is-fast-scrolling");
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => root.classList.remove("is-fast-scrolling"), 140);
    };

    window.addEventListener("pointermove", handlePointer, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("scroll", handleScroll);
      window.cancelAnimationFrame(pointerFrame);
      window.clearTimeout(settleTimer);
    };
  }, []);

  useEffect(() => {
    if (tier === "static") return;
    const directorFrame = window.requestAnimationFrame(() => setDirectorReady(true));
    const activateTerrain = () => setTerrainReady(true);
    const idleWindow = window as typeof window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    let idleHandle: number | undefined;
    let terrainTimer: number | undefined;
    if (idleWindow.requestIdleCallback) {
      idleHandle = idleWindow.requestIdleCallback(activateTerrain, { timeout: CINEMATIC_TIMING.terrainIdleMs });
    } else {
      terrainTimer = window.setTimeout(activateTerrain, CINEMATIC_TIMING.terrainFallbackMs);
    }
    return () => {
      window.cancelAnimationFrame(directorFrame);
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (terrainTimer !== undefined) window.clearTimeout(terrainTimer);
    };
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
      <div ref={rootRef} className={`v3-site experience-${tier}`} data-active-section={activeSection}>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <CinematicIntro />
        <div className="v3-pointer-light" aria-hidden />

        <header className={activeSection === "home" ? "v3-header" : "v3-header compact"}>
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
          {hero}
          {tier !== "static" && terrainReady && terrainVisible ? (
            <div className="v4-hero-terrain-portal"><CinematicHeroTerrain tier={tier} /></div>
          ) : null}

          <CinematicPipeline />

          <CinematicProjectReel />
          <div id="laboratory" className="v3-control-anchor section-anchor">
            <DeferredRender rootMargin="900px" fallback={<ControlRoomPlaceholder />}>
              <DataControlRoom tier={tier} />
            </DeferredRender>
          </div>

          <CinematicJourney />
          <CinematicInsights />

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

        {directorReady && tier !== "static" ? <CinematicScrollDirector tier={tier} /> : null}
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

  return (
    <div ref={ref} className="v4-deferred-boundary" data-ready={active ? "true" : "false"}>
      {active ? children : fallback}
    </div>
  );
}

function ControlRoomPlaceholder() {
  return (
    <section className="v3-control-room" aria-busy="true">
      <div className="v3-control-sequence">
        <div className="v3-control-stage v3-control-placeholder" aria-hidden inert>
          <header className="v3-control-header">
            <div><span>04 / Data control room</span><h2>One signal. Every instrument in sync.</h2></div>
            <div className="v3-control-status">
              <span><i /> NPT --:--:--</span>
              <button type="button" tabIndex={-1}><SpeakerSlash aria-hidden size={17} />Interface sound off</button>
            </div>
          </header>
          <div className="v4-control-selector" role="tablist">
            <button type="button" role="tab" aria-selected="true" tabIndex={-1}>Terminal</button>
            <button type="button" role="tab" aria-selected="false" tabIndex={-1}>Mandala</button>
            <button type="button" role="tab" aria-selected="false" tabIndex={-1}>Analytics</button>
          </div>
          <p className="v4-control-system-status">Terminal ready. Choose an instrument or enter a command.</p>
          <div className="v3-control-grid v4-control-instruments v4-control-placeholder-grid" data-focus="terminal">
            <div className="v3-terminal-panel" data-instrument="terminal">
              <div className="v4-control-placeholder-surface">
                <Command aria-hidden size={24} />
                <span>Preparing synchronized instruments</span>
                <strong>Warming terminal, mandala, and analytical controls.</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
