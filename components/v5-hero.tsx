import { ArrowDown, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { heroCandidates, siteConfig, skills } from "@/lib/content";

export function V5Hero() {
  return (
    <section id="home" className="v5-hero section-anchor" aria-labelledby="hero-title" data-critters-container>
      <div className="v5-hero-media" aria-hidden="true">
        <span className="v5-contour v5-contour-one" />
        <span className="v5-contour v5-contour-two" />
      </div>

      <div className="v5-hero-copy">
        <p className="v5-availability"><i aria-hidden />{siteConfig.availability}</p>
        <span className="v5-kicker">{siteConfig.name} / {siteConfig.eyebrow}</span>
        <h1 id="hero-title">{siteConfig.headline}</h1>
        <p className="v5-hero-description">{siteConfig.description}</p>
        <div className="v5-hero-actions">
          <a className="v5-button primary" href="#work">See the work <ArrowRight aria-hidden size={18} /></a>
          <a className="v5-button quiet" href="#process">How I checked the numbers</a>
        </div>
        <div className="v5-skill-strip" aria-label="Core skills">
          {skills.map((skill) => <span key={skill.name}><strong>{skill.name}</strong><small>{skill.note}</small></span>)}
        </div>
      </div>

      <aside className="v5-portrait-card">
        <picture>
          <source type="image/avif" srcSet="/assets/images/Brishav-portrait-480.avif 480w, /assets/images/Brishav-portrait-768.avif 768w" sizes="(max-width: 720px) 42vw, 24vw" />
          <source type="image/webp" srcSet="/assets/images/Brishav-portrait-480.webp 480w, /assets/images/Brishav-portrait-768.webp 768w" sizes="(max-width: 720px) 42vw, 24vw" />
          <img src="/assets/images/Brishav-portrait-480.webp" alt="Brishav Rajbahak" width="480" height="650" loading="lazy" decoding="async" />
        </picture>
        <span><small>Kathmandu, Nepal</small><strong>Still learning. Still iterating.</strong></span>
      </aside>

      <a className="v5-scroll-cue" href="#work"><ArrowDown aria-hidden size={18} /> Start with the proof</a>
      <div className="v5-headline-review" data-headline-candidates={heroCandidates.join(" | ")} hidden />
    </section>
  );
}
