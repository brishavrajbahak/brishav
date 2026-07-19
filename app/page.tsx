import { CinematicHero } from "@/components/cinematic-hero";
import { PortfolioExperience } from "@/components/portfolio-experience";

export default function HomePage() {
  return <PortfolioExperience hero={<CinematicHero />} />;
}
