import { bin, extent } from "d3";
import type { AnalysisMode, AnalysisResult, ChartItem, ChartPresentation } from "./api";

const NUMERIC_IGNORE = new Set(["year"]);

export function derivePresentation(result: AnalysisResult, mode: AnalysisMode): ChartPresentation {
  if (mode === "overview") {
    return {
      kind: result.charts.comparison.kind,
      eyebrow: "Overview",
      title: result.charts.comparison.title,
      items: result.charts.comparison.items
    };
  }

  if (mode === "trend") {
    return {
      kind: result.charts.trend.kind,
      eyebrow: "Trend / comparison",
      title: result.charts.trend.title,
      items: result.charts.trend.items
    };
  }

  const numericKey = firstUsefulNumericKey(result.records);
  if (!numericKey) {
    return {
      kind: "bar",
      eyebrow: "Distribution",
      title: `Ranked ${result.charts.comparison.title.toLowerCase()}`,
      items: [...result.charts.comparison.items].sort((a, b) => b.value - a.value)
    };
  }

  const values = result.records
    .map((record) => Number(record[numericKey]))
    .filter((value) => Number.isFinite(value));
  const [minimum = 0, maximum = 1] = extent(values);
  const buckets = bin().domain([minimum, maximum]).thresholds(Math.min(7, Math.max(3, values.length)))(values);

  return {
    kind: "bar",
    eyebrow: "Distribution",
    title: `${humanize(numericKey)} frequency`,
    items: buckets.map((bucket) => ({
      label: `${compact(bucket.x0)}–${compact(bucket.x1)}`,
      value: bucket.length
    }))
  };
}

function firstUsefulNumericKey(records: Array<Record<string, unknown>>) {
  const first = records[0];
  if (!first) return null;
  return (
    Object.keys(first).find(
      (key) => !NUMERIC_IGNORE.has(key) && records.some((record) => Number.isFinite(Number(record[key])))
    ) ?? null
  );
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function compact(value?: number) {
  if (value === undefined) return "?";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function normalizeChartItems(items: ChartItem[]) {
  const maximum = Math.max(...items.map((item) => Math.abs(item.value)), 1);
  return items.map((item) => ({ ...item, normalized: Math.abs(item.value) / maximum }));
}
