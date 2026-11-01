import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { LoanDashboard } from "@/components/loan-dashboard";

export const metadata: Metadata = {
  title: "Loan Default Analysis Dashboard | Brishav Rajbahak",
  description: "Published Lending Club final-outcome default rates with the cohort definition kept visible."
};

export default function LoanDefaultDashboardPage() {
  return (
    <main className="dashboard-page">
      <header className="dashboard-page-header">
        <Link href="/#work"><ArrowLeft aria-hidden size={16} />Back to the portfolio</Link>
        <div><span>Loan Default Analysis / published proof</span><h1>The rate only means something when the outcome is finished.</h1><p>These charts use 1,348,099 Lending Club loans with a final repayment or default outcome.</p></div>
        <a href="https://github.com/brishavrajbahak/loan-default-analysis" target="_blank" rel="noreferrer">Inspect the repository <ArrowSquareOut aria-hidden size={15} /></a>
      </header>
      <LoanDashboard />
      <section className="dashboard-method">
        <div><span>Numerator</span><strong>269,360</strong><p>Charged Off, Default and policy Charged Off.</p></div>
        <div><span>Denominator</span><strong>1,348,099</strong><p>Loans with a final good or bad outcome.</p></div>
        <div><span>Excluded</span><strong>912,569</strong><p>Current, late or grace-period loans without a final outcome.</p></div>
      </section>
    </main>
  );
}
