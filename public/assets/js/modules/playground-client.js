import { renderMandala } from './mandala.js';

export function createPlaygroundClient({ analytics, mobile = false } = {}) {
  const state = {
    datasets: [],
    selectedDatasetId: '',
    selectedMode: 'overview',
    activeResult: null,
  };

  const modal = document.getElementById('playgroundModal');
  const closeBtn = document.getElementById('playgroundClose');
  const datasetList = document.getElementById('playgroundDatasetList');
  const datasetSelect = document.getElementById('playgroundDatasetSelect');
  const runBtn = document.getElementById('playgroundRunBtn');
  const summary = document.getElementById('playgroundSummary');
  const metrics = document.getElementById('playgroundMetrics');
  const charts = document.getElementById('playgroundCharts');
  const mandalaHost = document.getElementById('playgroundMandala');
  const exportBtn = document.getElementById('playgroundExportCsv');
  const modeButtons = Array.from(document.querySelectorAll('[data-analysis-mode]'));

  let lastFocus = null;

  async function init() {
    bindOpeners();
    bindModalControls();
    bindAnalysisModes();
    bindExport();
    try {
      await loadDatasets();
    } catch (error) {
      console.error('Playground dataset bootstrap failed:', error);
      renderBootstrapFailure();
    }
  }

  function bindOpeners() {
    document.querySelectorAll('[data-open-playground]').forEach(button => {
      button.addEventListener('click', () => {
        open({ source: button.dataset.eventSource || button.id || 'cta' });
      });
    });
  }

  function bindModalControls() {
    closeBtn?.addEventListener('click', close);
    modal?.addEventListener('click', event => {
      if (event.target === modal) close();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && modal?.classList.contains('open')) close();
    });
    runBtn?.addEventListener('click', () => runSelectedAnalysis());
  }

  function bindAnalysisModes() {
    modeButtons.forEach(button => {
      button.addEventListener('click', () => {
        state.selectedMode = button.dataset.analysisMode;
        modeButtons.forEach(item => item.classList.toggle('active', item === button));
      });
    });
  }

  function bindExport() {
    exportBtn?.addEventListener('click', () => {
      if (!state.activeResult?.records?.length) return;
      const csv = toCsv(state.activeResult.records);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `${state.activeResult.dataset.id}-overview.csv`;
      link.click();
      URL.revokeObjectURL(href);
    });
  }

  async function loadDatasets() {
    const response = await fetch('/api/v1/playground/datasets');
    const data = await readJson(response);
    if (!response.ok || !data?.ok || !Array.isArray(data.datasets)) {
      throw new Error('Dataset catalog request failed.');
    }
    state.datasets = data.datasets || [];
    state.selectedDatasetId = state.datasets[0]?.id || '';
    renderDatasetOptions();
  }

  function renderDatasetOptions() {
    if (datasetSelect) {
      datasetSelect.innerHTML = state.datasets
        .map(dataset => `<option value="${dataset.id}">${dataset.label}</option>`)
        .join('');
      datasetSelect.value = state.selectedDatasetId;
      datasetSelect.addEventListener('change', () => {
        state.selectedDatasetId = datasetSelect.value;
        highlightDatasetCard();
      });
    }

    if (datasetList) {
      datasetList.innerHTML = state.datasets
        .map(dataset => `
          <button type="button" class="playground-dataset-card${dataset.id === state.selectedDatasetId ? ' active' : ''}" data-dataset-id="${dataset.id}">
            <span class="playground-dataset-theme">${dataset.theme}</span>
            <strong>${dataset.label}</strong>
            <span>${dataset.description}</span>
          </button>
        `)
        .join('');

      datasetList.querySelectorAll('[data-dataset-id]').forEach(card => {
        card.addEventListener('click', () => {
          state.selectedDatasetId = card.dataset.datasetId;
          if (datasetSelect) datasetSelect.value = state.selectedDatasetId;
          highlightDatasetCard();
        });
      });
    }

    highlightDatasetCard();
  }

  function highlightDatasetCard() {
    if (runBtn) runBtn.disabled = !state.selectedDatasetId;
    datasetList?.querySelectorAll('[data-dataset-id]').forEach(card => {
      card.classList.toggle('active', card.dataset.datasetId === state.selectedDatasetId);
    });
  }

  async function runSelectedAnalysis() {
    if (!state.selectedDatasetId) return;
    if (runBtn) runBtn.disabled = true;

    try {
      const response = await fetch('/api/v1/playground/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: 1,
          datasetId: state.selectedDatasetId,
          analysisType: state.selectedMode,
        }),
      });

      const data = await readJson(response);
      if (!response.ok || !data?.ok || !data.result) {
        window.showToast?.(data?.errors?.[0] || 'Playground request failed.', 'error');
        return;
      }

      state.activeResult = data.result;
      renderResult(data.result);
      analytics?.trackEvent('analyze_run', { dataset: state.selectedDatasetId, mode: state.selectedMode });
    } catch (error) {
      console.error('Playground analysis failed:', error);
      window.showToast?.('Playground request failed.', 'error');
    } finally {
      if (runBtn) runBtn.disabled = !state.selectedDatasetId;
    }
  }

  async function renderResult(result) {
    summary.innerHTML = `
      <div class="playground-summary-theme">${result.dataset.theme}</div>
      <h3>${result.dataset.label}</h3>
      <p>${result.summary}</p>
      <div class="playground-surprise">${result.surpriseInsight}</div>
    `;

    metrics.innerHTML = result.metrics
      .map(metric => `
        <article class="playground-metric-card">
          <span>${metric.label}</span>
          <strong>${metric.value}</strong>
          <small>${metric.note}</small>
        </article>
      `)
      .join('');

    charts.innerHTML = '';
    charts.appendChild(renderSimpleChart(result.charts.comparison, 'bar'));
    charts.appendChild(renderSimpleChart(result.charts.trend, result.charts.trend.kind || 'line'));

    await renderMandala(mandalaHost, {
      title: 'Dataset Signal Map',
      subtitle: 'Highlighted signals behind this analysis path.',
      focusIds: result.mandalaFocus,
      compact: true,
      pulseId: result.mandalaFocus[0],
      ariaLabel: `${result.dataset.label} signal mandala`,
    });
  }

  function open({ source = 'unknown', datasetId } = {}) {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    analytics?.trackEvent('playground_open', { source, mode: mobile ? 'mobile' : 'desktop' });

    if (datasetId) {
      state.selectedDatasetId = datasetId;
      if (datasetSelect) datasetSelect.value = datasetId;
      highlightDatasetCard();
      if (state.datasets.some(dataset => dataset.id === datasetId)) {
        window.setTimeout(() => runSelectedAnalysis(), 60);
      }
    }

    closeBtn?.focus();
  }

  function close() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    lastFocus?.focus?.();
  }

  return {
    init,
    open,
    openAndAnalyze(datasetId, source = 'terminal') {
      open({ datasetId, source });
    },
  };

  function renderBootstrapFailure() {
    state.datasets = [];
    state.selectedDatasetId = '';
    if (datasetList) datasetList.innerHTML = '';
    if (datasetSelect) datasetSelect.innerHTML = '<option value="">Unavailable</option>';
    if (runBtn) runBtn.disabled = true;
    if (exportBtn) exportBtn.disabled = true;
    summary.innerHTML = `
      <div class="playground-summary-theme">Bootstrap failed</div>
      <h3>Dataset catalog unavailable.</h3>
      <p>The advanced playground could not load its curated demo datasets right now.</p>
    `;
  }
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function renderSimpleChart(chart, kind) {
  const card = document.createElement('article');
  card.className = 'playground-chart-card';
  const maxValue = Math.max(...chart.items.map(item => item.value), 1);

  card.innerHTML = `
    <div class="playground-chart-header">
      <span>${chart.eyebrow || 'Signal view'}</span>
      <strong>${chart.title}</strong>
    </div>
  `;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 420 220');
  svg.setAttribute('class', 'playground-chart-svg');

  if (kind === 'line') {
    const points = chart.items.map((item, index) => {
      const x = 40 + (index * 320) / Math.max(chart.items.length - 1, 1);
      const y = 170 - (item.value / maxValue) * 110;
      return { x, y, label: item.label, value: item.value };
    });

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' '));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'var(--cyan)');
    path.setAttribute('stroke-width', '3');
    svg.appendChild(path);

    points.forEach(point => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(point.x));
      circle.setAttribute('cy', String(point.y));
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', 'var(--pink)');
      svg.appendChild(circle);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String(point.x));
      label.setAttribute('y', '198');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('class', 'chart-axis-label');
      label.textContent = point.label;
      svg.appendChild(label);
    });
  } else {
    chart.items.forEach((item, index) => {
      const barWidth = 54;
      const gap = 18;
      const x = 36 + index * (barWidth + gap);
      const height = (item.value / maxValue) * 120;
      const y = 168 - height;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(x));
      rect.setAttribute('y', String(y));
      rect.setAttribute('width', String(barWidth));
      rect.setAttribute('height', String(height));
      rect.setAttribute('rx', '12');
      rect.setAttribute('fill', index % 2 === 0 ? 'var(--cyan)' : 'var(--pink)');
      rect.setAttribute('fill-opacity', '0.82');
      svg.appendChild(rect);

      const value = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      value.setAttribute('x', String(x + barWidth / 2));
      value.setAttribute('y', String(y - 8));
      value.setAttribute('text-anchor', 'middle');
      value.setAttribute('class', 'chart-value-label');
      value.textContent = String(item.value);
      svg.appendChild(value);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', String(x + barWidth / 2));
      label.setAttribute('y', '198');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('class', 'chart-axis-label');
      label.textContent = item.label;
      svg.appendChild(label);
    });
  }

  card.appendChild(svg);
  return card;
}

function toCsv(records) {
  const headers = Object.keys(records[0] || {});
  const lines = [
    headers.join(','),
    ...records.map(record =>
      headers
        .map(header => JSON.stringify(record[header] ?? ''))
        .join(','),
    ),
  ];
  return lines.join('\n');
}
