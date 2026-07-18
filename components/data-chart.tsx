"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import type { ChartPresentation } from "@/lib/api";
import { MOTION } from "@/lib/motion";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip, Legend);

export function DataChart({ presentation }: { presentation: ChartPresentation }) {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  const palette = {
    crimson: token("--crimson"),
    crimsonSoft: token("--crimson-soft"),
    indigo: token("--indigo"),
    indigoSoft: token("--indigo-soft"),
    grid: token("--line"),
    label: token("--muted")
  };
  const data = {
    labels: presentation.items.map((item) => item.label),
    datasets: [
      {
        label: presentation.title,
        data: presentation.items.map((item) => item.value),
        borderColor: presentation.kind === "line" ? palette.indigo : palette.crimson,
        backgroundColor: presentation.kind === "line" ? palette.indigoSoft : palette.crimsonSoft,
        pointBackgroundColor: palette.crimson,
        pointBorderColor: palette.crimson,
        borderWidth: 2,
        borderRadius: 7,
        tension: 0.34,
        fill: presentation.kind === "line"
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: MOTION.animationMs.disabled },
    interaction: { intersect: false, mode: "index" as const },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        backgroundColor: palette.indigo,
        titleFont: { family: "Manrope", size: 12 },
        bodyFont: { family: "Manrope", size: 12 }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: palette.label, font: { family: "Manrope", size: 10 } },
        border: { color: palette.grid }
      },
      y: {
        beginAtZero: true,
        grid: { color: palette.grid },
        ticks: { color: palette.label, font: { family: "Manrope", size: 10 } },
        border: { display: false }
      }
    }
  };

  const ariaLabel = `${presentation.title} chart`;
  return presentation.kind === "line"
    ? <Line data={data} options={options} role="img" aria-label={ariaLabel} />
    : <Bar data={data} options={options} role="img" aria-label={ariaLabel} />;
}
