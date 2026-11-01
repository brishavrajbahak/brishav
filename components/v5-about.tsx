import Image from "next/image";
import { personalStory, journey } from "@/lib/content";

const routePoints = "8,82 31,58 56,68 78,31 94,16";

export function V5About() {
  return (
    <section id="about" className="v5-section v5-about section-anchor" aria-labelledby="about-title">
      <div className="v5-about-intro">
        <span className="v5-kicker">03 / About</span>
        <h2 id="about-title">This part is not polished on purpose.</h2>
        <p>{personalStory.about}</p>
      </div>

      {personalStory.approvedPhotos.length ? (
        <div className="v5-personal-photos">
          {personalStory.approvedPhotos.map((photo, index) => (
            <figure className="v5-personal-photo" key={photo}>
              <Image src={photo} alt={`Brishav's real workspace, photo ${index + 1}`} width={1200} height={900} />
              <figcaption>{index === 0 ? "Loan-default dashboard work." : "A real working space, not a generated scene."}</figcaption>
            </figure>
          ))}
        </div>
      ) : null}

      <div className="v5-altitude-route">
        <svg viewBox="0 0 100 100" role="img" aria-labelledby="route-title route-description" preserveAspectRatio="none">
          <title id="route-title">Brishav&apos;s learning route</title>
          <desc id="route-description">A rising path connecting education, applied projects, business intelligence storytelling and the portfolio launch.</desc>
          <polyline className="route-shadow" points={routePoints} />
          <polyline className="route-line" points={routePoints} pathLength="1" />
        </svg>
        <ol>
          {journey.map((milestone, index) => (
            <li key={milestone.label} style={{ left: `${[8, 31, 56, 78][index]}%`, top: `${[82, 58, 68, 31][index]}%` }}>
              <span>{milestone.year}</span><strong>{milestone.label}</strong><p>{milestone.copy}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="v5-field-notes">
        <blockquote>{personalStory.rule}</blockquote>
        <p>{personalStory.reflection}</p>
      </div>
    </section>
  );
}
