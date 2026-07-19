import { cinematicAssets } from "@/lib/cinematic";
import { resumeUrl, siteConfig, skills } from "@/lib/content";
import { CinematicPicture } from "./cinematic-picture";

export function CinematicHero() {
  return (
    <section id="home" className="v3-hero-sequence section-anchor" aria-labelledby="hero-title" data-critters-container>
      <div className="v3-hero-stage">
        <div className="v3-hero-landscape" aria-hidden>
          <CinematicPicture asset={cinematicAssets.summitDawn} eager decorative />
          <span className="v3-hero-vignette" />
        </div>

        <div className="v3-hero-editorial">
          <div className="v3-availability"><i aria-hidden /><span>{siteConfig.availability}</span></div>
          <span className="v3-eyebrow">{siteConfig.eyebrow} &middot; Kathmandu 27.7172&deg; N</span>
          <h1 id="hero-title">Turning Data Into <em>Cinematic Stories.</em></h1>
          <p>{siteConfig.description}</p>
          <div className="v3-hero-actions">
            <a href="#projects">Enter the Dataverse <ArrowGlyph /></a>
            <a href="#laboratory">Open the control room</a>
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
          <div className="v3-mosaic-caption"><MountainGlyph /><span>Signals rise from context.<br />Stories begin with evidence.</span></div>
        </div>

        <div className="v3-hero-mask" aria-hidden>
          <CinematicPicture asset={cinematicAssets.summitDawn} className="v3-hero-mask-media" decorative />
          <strong>BR</strong>
        </div>
        <div className="v4-signal-contour" aria-hidden><span /></div>
        <div className="v3-camera-caption"><span>Follow the illuminated contour</span><strong>From raw signal to useful impact.</strong></div>
        <a className="v3-scroll-cue" href="#method">Direct the journey <DownGlyph /></a>
      </div>
    </section>
  );
}

function ArrowGlyph() {
  return <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function DownGlyph() {
  return <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 4v15M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function MountainGlyph() {
  return <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m2 19 6.2-10 3.4 5L15 8l7 11H2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
