import { ArrowLeft, ChartBar } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { V5Header } from "@/components/v5-header";

export default function NotFound() {
  return (
    <div className="v5-site">
      <V5Header />
      <main className="v5-not-found">
        <span>404 / This route does not exist</span>
        <ChartBar aria-hidden size={50} weight="duotone" />
        <h1>I checked the path. There is nothing here.</h1>
        <p>The page may have moved, or the address may be incomplete. The project evidence is still available from the main page.</p>
        <div><Link className="v5-button primary" href="/"><ArrowLeft aria-hidden size={17} />Go home</Link><Link className="v5-button quiet" href="/#work">See the work</Link></div>
      </main>
    </div>
  );
}
