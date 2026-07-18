import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <span>404 / Signal lost</span>
      <h1>This path is beyond the observatory.</h1>
      <p>The portfolio is a focused single-page experience. Return to the live data signal.</p>
      <Link className="primary-button" href="/">Return home</Link>
    </main>
  );
}
