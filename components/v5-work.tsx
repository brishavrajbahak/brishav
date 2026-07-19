import { ArrowSquareOut, CheckCircle, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { projects } from "@/lib/content";
import { V5DashboardProof } from "./v5-dashboard-proof";
import { V5MandalaLoader } from "./v5-mandala-loader";
import { V5TerminalLauncher } from "./v5-terminal-launcher";

export function V5Work() {
  return (
    <section id="work" className="v5-section v5-work section-anchor" aria-labelledby="work-title">
      <header className="v5-section-heading">
        <span className="v5-kicker">01 / Work</span>
        <h2 id="work-title">The projects, with the proof left in.</h2>
        <p>Published results show their definitions. Unfinished work says exactly where it stands.</p>
      </header>

      <div className="v5-work-cinematic">
        <div className="v5-work-sticky">
          <V5MandalaLoader />
        </div>
      </div>

      <div className="v5-work-tools">
        <p>The mandala is the main interaction. The terminal is here only if you want the command-line version.</p>
        <V5TerminalLauncher />
      </div>

      <div className="v5-project-list" aria-label="Project evidence">
        {projects.map((project) => (
          <article key={project.id} id={`project-${project.id}`} className="v5-project-card">
            <div className="v5-project-topline">
              <span>Project {project.number}</span>
              <span className={project.status === "Published" || project.status === "Live system" ? "published" : "progress"}>
                {project.status === "Published" || project.status === "Live system" ? <CheckCircle aria-hidden size={16} /> : <CircleNotch aria-hidden size={16} />}
                {project.status}
              </span>
            </div>
            <h3>{project.title}</h3>
            <p className="v5-project-summary">{project.summary}</p>
            <div className="v5-proof-columns">
              <div><h4>Business impact</h4><ul>{project.proof.businessImpact.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><h4>What I delivered</h4><ul>{project.proof.delivered.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
            {project.proof.metrics.length ? (
              <div className="v5-project-metrics">
                {project.proof.metrics.slice(0, 3).map((metric) => <span key={metric.label}><strong>{metric.value}</strong><small>{metric.label}</small></span>)}
              </div>
            ) : null}
            <div className="v5-project-footer">
              <span>{project.tools.join(" / ")}</span>
              <a href={project.repository} target="_blank" rel="noreferrer">Repository <ArrowSquareOut aria-hidden size={15} /></a>
            </div>
          </article>
        ))}
      </div>

      <V5DashboardProof />
    </section>
  );
}
