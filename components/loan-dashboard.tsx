"use client";

import { scaleBand, scaleLinear } from "d3";
import { useMemo, useState } from "react";

type View = "grade" | "term" | "purpose";
type Datum = { label: string; value: number; note: string };

const views: Record<View, { title: string; summary: string; data: Datum[] }> = {
  grade: {
    title: "Default rate by grade",
    summary: "The published rate rises from 6.04% for Grade A to 49.67% for Grade G.",
    data: [
      { label: "A", value: 6.04, note: "Lowest published grade rate" },
      { label: "B", value: 12.96, note: "Published grade rate" },
      { label: "C", value: 22.51, note: "Published grade rate" },
      { label: "D", value: 30.73, note: "Published grade rate" },
      { label: "E", value: 38.78, note: "Published grade rate" },
      { label: "F", value: 44.58, note: "Published grade rate" },
      { label: "G", value: 49.67, note: "Highest published grade rate" }
    ]
  },
  term: {
    title: "Default rate by term",
    summary: "The 60-month rate is roughly twice the published 36-month rate.",
    data: [
      { label: "36 months", value: 16.02, note: "Published term rate" },
      { label: "60 months", value: 32.45, note: "Published term rate" }
    ]
  },
  purpose: {
    title: "A high-risk purpose segment",
    summary: "Small-business loans show a 29.86% published rate among purposes with at least 1,000 loans.",
    data: [
      { label: "All final outcomes", value: 19.98, note: "Published cohort rate" },
      { label: "Small business", value: 29.86, note: "Purpose segment with at least 1,000 loans" }
    ]
  }
};

export function LoanDashboard() {
  const [view, setView] = useState<View>("grade");
  const selected = views[view];
  const chart = useMemo(() => {
    const width = 760;
    const height = 330;
    const margin = { top: 28, right: 30, bottom: 70, left: 48 };
    const x = scaleBand().domain(selected.data.map((item) => item.label)).range([margin.left, width - margin.right]).padding(0.28);
    const y = scaleLinear().domain([0, 55]).nice().range([height - margin.bottom, margin.top]);
    return { width, height, margin, x, y };
  }, [selected]);

  return (
    <div className="loan-dashboard">
      <div className="loan-dashboard-tabs" role="tablist" aria-label="Loan dashboard view">
        {(Object.keys(views) as View[]).map((key) => (
          <button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => setView(key)}>{key === "grade" ? "Grade" : key === "term" ? "Term" : "Purpose"}</button>
        ))}
      </div>
      <div className="loan-dashboard-heading"><span>Published proof</span><h2>{selected.title}</h2><p>{selected.summary}</p></div>
      <div className="loan-dashboard-chart">
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-labelledby="loan-chart-title loan-chart-description">
          <title id="loan-chart-title">{selected.title}</title>
          <desc id="loan-chart-description">{selected.summary}</desc>
          {[0, 10, 20, 30, 40, 50].map((tick) => <g key={tick}><line x1={chart.margin.left} x2={chart.width - chart.margin.right} y1={chart.y(tick)} y2={chart.y(tick)} /><text x={chart.margin.left - 9} y={chart.y(tick) + 4} textAnchor="end">{tick}%</text></g>)}
          {selected.data.map((item) => {
            const x = chart.x(item.label) || 0;
            const y = chart.y(item.value);
            return <g key={item.label}><rect x={x} y={y} width={chart.x.bandwidth()} height={chart.y(0) - y} rx="8" /><text className="value" x={x + chart.x.bandwidth() / 2} y={y - 9} textAnchor="middle">{item.value}%</text><text className="label" x={x + chart.x.bandwidth() / 2} y={chart.height - 38} textAnchor="middle">{item.label}</text></g>;
          })}
        </svg>
      </div>
      <table>
        <caption>{selected.title} data</caption>
        <thead><tr><th scope="col">Segment</th><th scope="col">Default rate</th><th scope="col">Note</th></tr></thead>
        <tbody>{selected.data.map((item) => <tr key={item.label}><th scope="row">{item.label}</th><td>{item.value}%</td><td>{item.note}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
