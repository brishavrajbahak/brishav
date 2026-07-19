"use client";

import { ArrowSquareOut, ChartBar } from "@phosphor-icons/react";
import { useState } from "react";
import { interfaceCopy } from "@/lib/content";

const bars = [
  { label: "Grade A", value: 6.04 },
  { label: "Grade B", value: 12.96 },
  { label: "Grade C", value: 22.51 },
  { label: "Grade D", value: 30.73 },
  { label: "Grade E", value: 38.78 },
  { label: "Grade F", value: 44.58 },
  { label: "Grade G", value: 49.67 }
] as const;

export function V5DashboardProof() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="v5-dashboard-proof">
      <div className="v5-dashboard-toolbar">
        <span><ChartBar aria-hidden size={18} /> Published grade comparison</span>
        <a href="/dashboard/loan-default/" target="_blank">Open in a new page <ArrowSquareOut aria-hidden size={15} /></a>
      </div>
      {loaded ? (
        <iframe title="Interactive Loan Default Analysis dashboard" src="/dashboard/loan-default/" loading="lazy" />
      ) : (
        <div className="v5-dashboard-preview">
          <div className="v5-preview-bars" role="img" aria-label="Published loan default rates rise from 6.04 percent for Grade A to 49.67 percent for Grade G">
            {bars.map((bar) => (
              <div key={bar.label}><span>{bar.label}</span><i style={{ width: `${bar.value * 1.8}%` }} /><strong>{bar.value}%</strong></div>
            ))}
          </div>
          <div className="v5-preview-action">
            <p>{interfaceCopy.loadingDashboard}</p>
            <button type="button" className="v5-button primary" onClick={() => setLoaded(true)}>Load interactive dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
}
