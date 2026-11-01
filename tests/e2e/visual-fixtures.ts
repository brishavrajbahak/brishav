export const visualCatalogResponse = {
  ok: true,
  datasets: [
    {
      id: "tourism",
      label: "Tourism Recovery Outlook",
      theme: "Tourism",
      description: "Illustrative provincial tourism indicators covering arrivals, average stay, and spend per visitor."
    },
    {
      id: "loan-risk",
      label: "Loan Risk Signal Demo",
      theme: "Loan Risk",
      description: "Illustrative borrower-level risk markers for repayment and default pressure analysis."
    },
    {
      id: "remittance",
      label: "Remittance Resilience Monitor",
      theme: "Remittance",
      description: "Illustrative provincial remittance dependency indicators covering household reliance and channel quality."
    }
  ]
};

export const visualAnalysisResponse = {
  ok: true,
  result: {
    dataset: { id: "tourism", label: "Tourism Recovery Outlook", theme: "Tourism" },
    summary: "Tourism demand is recovering unevenly, with Bagmati and Gandaki holding the largest arrival volumes while stay length remains strongest in Gandaki.",
    surpriseInsight: "The premium signal is not just volume. Bagmati Q2 pairs the highest occupancy with above-average visitor spend.",
    metrics: [
      { label: "Total arrivals", value: "81,500", note: "Across all provincial snapshots in the demo set." },
      { label: "Average spend", value: "$503", note: "Per visitor across the monitored slices." },
      { label: "Average stay", value: "3.2 days", note: "Longer stays often signal stronger local spend." },
      { label: "Top occupancy slice", value: "Bagmati Q2", note: "66% occupancy." }
    ],
    charts: {
      comparison: {
        kind: "bar",
        eyebrow: "Province comparison",
        title: "Arrivals by province",
        items: [
          { label: "Bagmati", value: 26200 },
          { label: "Gandaki", value: 21300 },
          { label: "Lumbini", value: 16200 },
          { label: "Koshi", value: 11300 },
          { label: "Sudurpashchim", value: 6500 }
        ]
      },
      trend: {
        kind: "line",
        eyebrow: "Quarter comparison",
        title: "Arrivals by quarter",
        items: [
          { label: "Q1", value: 37800 },
          { label: "Q2", value: 43700 }
        ]
      }
    },
    mandalaFocus: ["tourism", "analytics", "reporting"],
    records: [
      { province: "Bagmati", quarter: "Q1", arrivals: 12400, avg_stay_days: 3.6, spend_usd: 742, hotel_occupancy_pct: 62 },
      { province: "Bagmati", quarter: "Q2", arrivals: 13800, avg_stay_days: 3.8, spend_usd: 774, hotel_occupancy_pct: 66 },
      { province: "Gandaki", quarter: "Q1", arrivals: 9800, avg_stay_days: 4.4, spend_usd: 688, hotel_occupancy_pct: 58 },
      { province: "Gandaki", quarter: "Q2", arrivals: 11500, avg_stay_days: 4.6, spend_usd: 731, hotel_occupancy_pct: 63 },
      { province: "Lumbini", quarter: "Q1", arrivals: 7600, avg_stay_days: 2.9, spend_usd: 412, hotel_occupancy_pct: 49 }
    ]
  }
};
