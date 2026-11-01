import { ArrowUp } from "@phosphor-icons/react/dist/ssr";
import { V5About } from "@/components/v5-about";
import { V5Contact } from "@/components/v5-contact";
import { V5Header } from "@/components/v5-header";
import { V5Hero } from "@/components/v5-hero";
import { V5Process } from "@/components/v5-process";
import { V5Work } from "@/components/v5-work";
import { siteConfig } from "@/lib/content";

export default function HomePage() {
  return (
    <div className="v5-site">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <V5Header />
      <main id="main-content">
        <V5Hero />
        <V5Work />
        <V5Process />
        <V5About />
        <V5Contact />
      </main>
      <footer className="v5-footer">
        <div><strong>{siteConfig.name}</strong><span>Built, checked, then checked again.</span></div>
        <p>© {new Date().getFullYear()} Brishav Rajbahak.</p>
        <a href="#home">Back to the top <ArrowUp aria-hidden size={15} /></a>
      </footer>
    </div>
  );
}
