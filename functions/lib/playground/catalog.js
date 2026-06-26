const DATASET_CATALOG = {
  tourism: {
    id: 'tourism',
    label: 'Tourism Recovery Outlook',
    theme: 'Tourism',
    description: 'Illustrative provincial tourism indicators covering arrivals, average stay, and spend per visitor.',
    path: '/assets/data/demo/tourism.json',
    mandalaFocus: ['tourism', 'analytics', 'reporting'],
  },
  'loan-risk': {
    id: 'loan-risk',
    label: 'Loan Risk Signal Demo',
    theme: 'Loan Risk',
    description: 'Illustrative borrower-level risk markers for repayment and default pressure analysis.',
    path: '/assets/data/demo/loan-risk.json',
    mandalaFocus: ['loan-risk', 'analytics', 'modeling'],
  },
  remittance: {
    id: 'remittance',
    label: 'Remittance Resilience Monitor',
    theme: 'Remittance',
    description: 'Illustrative provincial remittance dependency indicators covering household reliance and channel quality.',
    path: '/assets/data/demo/remittance.json',
    mandalaFocus: ['remittance', 'reporting', 'storytelling'],
  },
};

export function listDatasets() {
  return Object.values(DATASET_CATALOG).map(dataset => ({
    id: dataset.id,
    label: dataset.label,
    theme: dataset.theme,
    description: dataset.description,
  }));
}

export async function loadDataset(datasetId, requestUrl) {
  const meta = DATASET_CATALOG[datasetId];
  if (!meta) return null;

  const response = await fetch(new URL(meta.path, requestUrl));
  if (!response.ok) {
    throw new Error(`Dataset fetch failed: ${datasetId}`);
  }

  const body = await response.json();
  return {
    ...meta,
    ...body,
  };
}

export function analyzeDataset(dataset, analysisType = 'overview') {
  if (!dataset) return null;
  if (!['overview', 'distribution', 'trend'].includes(analysisType)) return null;

  switch (dataset.id) {
    case 'tourism':
      return analyzeTourism(dataset, analysisType);
    case 'loan-risk':
      return analyzeLoanRisk(dataset, analysisType);
    case 'remittance':
      return analyzeRemittance(dataset, analysisType);
    default:
      return null;
  }
}

function analyzeTourism(dataset) {
  const totalArrivals = sum(dataset.records, 'arrivals');
  const averageSpend = average(dataset.records, 'spend_usd');
  const averageStay = average(dataset.records, 'avg_stay_days');
  const strongestOccupancy = [...dataset.records].sort((a, b) => b.hotel_occupancy_pct - a.hotel_occupancy_pct)[0];
  const arrivalsByProvince = groupedSum(dataset.records, 'province', 'arrivals');
  const arrivalsByQuarter = groupedSum(dataset.records, 'quarter', 'arrivals');

  return {
    dataset: datasetDescriptor(dataset),
    summary: 'Tourism demand is recovering unevenly, with Bagmati and Gandaki holding the largest arrival volumes while stay length remains strongest in Gandaki.',
    surpriseInsight: `The premium signal is not just volume. ${strongestOccupancy.province} ${strongestOccupancy.quarter} pairs the highest occupancy (${strongestOccupancy.hotel_occupancy_pct}%) with above-average visitor spend, which is a stronger commercial story than raw arrivals alone.`,
    metrics: [
      metric('Total arrivals', formatNumber(totalArrivals), 'Across all provincial snapshots in the demo set.'),
      metric('Average spend', `$${averageSpend.toFixed(0)}`, 'Per visitor across the monitored slices.'),
      metric('Average stay', `${averageStay.toFixed(1)} days`, 'Longer stays often signal stronger local spend.'),
      metric('Top occupancy slice', `${strongestOccupancy.province} ${strongestOccupancy.quarter}`, `${strongestOccupancy.hotel_occupancy_pct}% occupancy.`),
    ],
    charts: {
      comparison: chart('bar', 'Province comparison', 'Arrivals by province', arrivalsByProvince),
      trend: chart('line', 'Quarter comparison', 'Arrivals by quarter', arrivalsByQuarter),
    },
    mandalaFocus: dataset.mandalaFocus,
    records: dataset.records,
  };
}

function analyzeLoanRisk(dataset) {
  const defaultRate = percentage(dataset.records.filter(record => record.defaulted === 'Yes').length, dataset.records.length);
  const averageLoan = average(dataset.records, 'loan_amount_npr');
  const averageDelinquency = average(dataset.records, 'delinquency_days');
  const riskBySegment = groupedDefaultRate(dataset.records, 'segment');
  const delinquencyByProvince = groupedAverage(dataset.records, 'province', 'delinquency_days');
  const riskiestSegment = [...riskBySegment].sort((a, b) => b.value - a.value)[0];

  return {
    dataset: datasetDescriptor(dataset),
    summary: 'Default outcomes cluster where delinquency days stretch longest and income support is weaker, especially in microbusiness and informal segments.',
    surpriseInsight: `The premium takeaway is that ${riskiestSegment.label} is not just a high-default segment. It is also where payment stress appears before default formally lands, which makes it the best segment for early intervention.`,
    metrics: [
      metric('Default rate', `${defaultRate.toFixed(1)}%`, 'Share of borrowers marked as defaulted.'),
      metric('Average loan size', `NPR ${formatNumber(averageLoan.toFixed(0))}`, 'Mean exposure across the demo set.'),
      metric('Average delinquency', `${averageDelinquency.toFixed(0)} days`, 'Payment pressure proxy.'),
      metric('Riskiest segment', riskiestSegment.label, `${riskiestSegment.value.toFixed(1)}% default share.`),
    ],
    charts: {
      comparison: chart('bar', 'Segment risk', 'Default rate by segment', riskBySegment),
      trend: chart('bar', 'Provincial pressure', 'Average delinquency by province', delinquencyByProvince),
    },
    mandalaFocus: dataset.mandalaFocus,
    records: dataset.records,
  };
}

function analyzeRemittance(dataset) {
  const latestYear = Math.max(...dataset.records.map(record => record.year));
  const latestRecords = dataset.records.filter(record => record.year === latestYear);
  const averageDependency = average(latestRecords, 'household_dependency_pct');
  const averageTransfer = average(latestRecords, 'avg_transfer_usd');
  const weakestFormal = [...latestRecords].sort((a, b) => a.formal_channel_pct - b.formal_channel_pct)[0];
  const dependencyByProvince = latestRecords.map(record => ({ label: record.province, value: record.household_dependency_pct }));
  const transferByYear = groupedAverage(dataset.records, 'year', 'avg_transfer_usd');

  return {
    dataset: datasetDescriptor(dataset),
    summary: 'Remittance dependency is rising fastest in provinces where formal channel usage is weakest, increasing resilience risk even when transfer values improve slightly.',
    surpriseInsight: `The premium signal is the gap between dependence and channel quality. ${weakestFormal.province} carries the weakest formal-channel share (${weakestFormal.formal_channel_pct}%) while household dependence is still elevated, which means convenience may be masking system fragility.`,
    metrics: [
      metric('Average dependency', `${averageDependency.toFixed(1)}%`, `Latest-year household reliance across monitored provinces (${latestYear}).`),
      metric('Average transfer', `$${averageTransfer.toFixed(0)}`, 'Latest-year average transfer amount.'),
      metric('Weakest formal channel', weakestFormal.province, `${weakestFormal.formal_channel_pct}% formal-channel share.`),
      metric('Tracked year', String(latestYear), 'Most recent comparative slice used in the charts.'),
    ],
    charts: {
      comparison: chart('bar', 'Dependency view', `Household dependency by province (${latestYear})`, dependencyByProvince),
      trend: chart('line', 'Transfer trend', 'Average transfer by year', transferByYear),
    },
    mandalaFocus: dataset.mandalaFocus,
    records: dataset.records,
  };
}

function datasetDescriptor(dataset) {
  return {
    id: dataset.id,
    label: dataset.label,
    theme: dataset.theme,
  };
}

function metric(label, value, note) {
  return { label, value, note };
}

function chart(kind, eyebrow, title, items) {
  return { kind, eyebrow, title, items };
}

function groupedSum(records, key, valueKey) {
  const grouped = new Map();
  records.forEach(record => {
    grouped.set(record[key], (grouped.get(record[key]) || 0) + Number(record[valueKey] || 0));
  });
  return [...grouped.entries()].map(([label, value]) => ({ label, value: Number(value.toFixed(1)) }));
}

function groupedAverage(records, key, valueKey) {
  const grouped = new Map();
  records.forEach(record => {
    const bucket = grouped.get(record[key]) || { total: 0, count: 0 };
    bucket.total += Number(record[valueKey] || 0);
    bucket.count += 1;
    grouped.set(record[key], bucket);
  });
  return [...grouped.entries()].map(([label, bucket]) => ({
    label: String(label),
    value: Number((bucket.total / bucket.count).toFixed(1)),
  }));
}

function groupedDefaultRate(records, key) {
  const grouped = new Map();
  records.forEach(record => {
    const bucket = grouped.get(record[key]) || { total: 0, defaulted: 0 };
    bucket.total += 1;
    if (record.defaulted === 'Yes') bucket.defaulted += 1;
    grouped.set(record[key], bucket);
  });
  return [...grouped.entries()].map(([label, bucket]) => ({
    label: String(label),
    value: Number(percentage(bucket.defaulted, bucket.total).toFixed(1)),
  }));
}

function average(records, key) {
  return sum(records, key) / Math.max(records.length, 1);
}

function sum(records, key) {
  return records.reduce((total, record) => total + Number(record[key] || 0), 0);
}

function percentage(part, whole) {
  return (part / Math.max(whole, 1)) * 100;
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value));
}
