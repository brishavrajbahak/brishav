import { ArrowSquareOut, EnvelopeSimple, GithubLogo, InstagramLogo, LinkedinLogo, MapPin } from "@phosphor-icons/react/dist/ssr";
import { siteConfig } from "@/lib/content";
import { V5ContactLoader } from "./v5-contact-loader";

export function V5Contact() {
  return (
    <section id="contact" className="v5-contact section-anchor" aria-labelledby="contact-title">
      <picture className="v5-contact-media">
        <source type="image/avif" srcSet="/assets/cinematic/data-horizon-768.avif 768w, /assets/cinematic/data-horizon-1280.avif 1280w" sizes="100vw" />
        <source type="image/webp" srcSet="/assets/cinematic/data-horizon-768.webp 768w, /assets/cinematic/data-horizon-1280.webp 1280w" sizes="100vw" />
        <img src="/assets/cinematic/data-horizon-768.webp" alt="" width="768" height="432" loading="lazy" decoding="async" />
      </picture>
      <div className="v5-contact-grid">
        <div className="v5-contact-copy">
          <span className="v5-kicker">04 / Contact</span>
          <h2 id="contact-title">If the work interests you, write to me.</h2>
          <p>The form is protected by Turnstile and rate limiting. You can also use one of the verified links below.</p>
          <div className="v5-location"><MapPin aria-hidden size={18} /><span><strong>{siteConfig.location}</strong><small>Nepal Standard Time / UTC+05:45</small></span></div>
          <nav className="v5-socials" aria-label="Social links">
            <a href={`mailto:${siteConfig.email}`}><EnvelopeSimple aria-hidden size={18} />Email</a>
            <a href={siteConfig.github} target="_blank" rel="noreferrer"><GithubLogo aria-hidden size={18} />GitHub<ArrowSquareOut aria-hidden size={12} /></a>
            <a href={siteConfig.linkedin} target="_blank" rel="noreferrer"><LinkedinLogo aria-hidden size={18} />LinkedIn<ArrowSquareOut aria-hidden size={12} /></a>
            <a href={siteConfig.instagram} target="_blank" rel="noreferrer"><InstagramLogo aria-hidden size={18} />Instagram<ArrowSquareOut aria-hidden size={12} /></a>
          </nav>
        </div>
        <V5ContactLoader />
      </div>
    </section>
  );
}
