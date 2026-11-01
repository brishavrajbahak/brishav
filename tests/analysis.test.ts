import { describe, expect, it } from "vitest";
import { derivePresentation, normalizeChartItems } from "@/lib/analysis";
import type { AnalysisResult } from "@/lib/api";

const result: AnalysisResult = {
  dataset: { id: "demo", label: "Demo", theme: "Test" },
  summary: "Summary",
  surpriseInsight: "Insight",
  metrics: [],
  charts: {
    comparison: { kind: "bar", eyebrow: "Compare", title: "Comparison", items: [{ label: "A", value: 10 }, { label: "B", value: 5 }] },
    trend: { kind: "line", eyebrow: "Trend", title: "Trend", items: [{ label: "2025", value: 8 }, { label: "2026", value: 12 }] }
  },
  mandalaFocus: [],
  records: [{ province: "A", arrivals: 10 }, { province: "B", arrivals: 20 }, { province: "C", arrivals: 20 }]
};

describe("analysis presentations", () => {
  it("keeps overview and trend visibly distinct", () => {
    expect(derivePresentation(result, "overview").title).toBe("Comparison");
    expect(derivePresentation(result, "trend").title).toBe("Trend");
  });

  it("derives a distribution from returned records", () => {
    const presentation = derivePresentation(result, "distribution");
    expect(presentation.eyebrow).toBe("Distribution");
    expect(presentation.title).toContain("Arrivals");
    expect(presentation.items.reduce((sum, item) => sum + item.value, 0)).toBe(3);
  });

  it("normalizes visual weights without changing values", () => {
    expect(normalizeChartItems([{ label: "A", value: 2 }, { label: "B", value: 4 }])).toEqual([
      { label: "A", value: 2, normalized: 0.5 },
      { label: "B", value: 4, normalized: 1 }
    ]);
  });
});
