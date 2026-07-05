import { initAnalytics } from './analytics.js';
import { renderMandala } from './mandala.js';
import { createPlaygroundClient } from './playground-client.js';
import { initTerminalRuntime } from './terminal-runtime.js';

window.addEventListener('load', async () => {
  document.documentElement.classList.add('advanced-v1');
  document.body.classList.add('advanced-v1');

  const analytics = initAnalytics({
    webAnalyticsToken: window.CONTACT_PUBLIC_CONFIG?.WEB_ANALYTICS_TOKEN || '',
  });
  analytics.bindDataEvents(document);

  const buildMeta = window.__BUILD_META__ || {};
  hydratePreviewBadge(buildMeta);
  hydrateProjectImpact();

  const playground = createPlaygroundClient({ analytics, mobile: false });
  await playground.init();

  initTerminalRuntime({
    analytics,
    buildMeta,
    openPlayground() {
      playground.open({ source: 'terminal' });
    },
    openAndAnalyze(datasetId) {
      playground.openAndAnalyze(datasetId, 'terminal');
    },
  });

  await renderMandala(document.getElementById('skillsMandala'), {
    title: 'Advanced Signal Mandala',
    subtitle: 'Skills, tools, and applied domains arranged as one operating map.',
    focusIds: ['brishav', 'analytics', 'python', 'sql', 'loan-risk'],
    ariaLabel: 'Skills mandala',
  });

  document.querySelectorAll('[data-scroll-insights]').forEach(button => {
    button.addEventListener('click', () => {
      document.getElementById('insight-logs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});

function hydratePreviewBadge(buildMeta) {
  const footerBadge = document.getElementById('footerPreviewBadge');
  if (!footerBadge) return;
  if (buildMeta.isPreview) {
    footerBadge.hidden = false;
    footerBadge.textContent = buildMeta.version || 'v1-advanced-preview';
  }
}

function hydrateProjectImpact() {
  document.querySelectorAll('[data-project-impact]').forEach(block => {
    block.classList.add('project-impact-live');
  });
}
