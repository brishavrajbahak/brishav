import { initAnalytics } from './analytics.js';
import { renderMandala } from './mandala.js';
import { createPlaygroundClient } from './playground-client.js';

window.addEventListener('load', async () => {
  document.documentElement.classList.add('advanced-v1');
  document.body.classList.add('advanced-v1');

  const analytics = initAnalytics({
    webAnalyticsToken: window.CONTACT_PUBLIC_CONFIG?.WEB_ANALYTICS_TOKEN || '',
  });
  analytics.bindDataEvents(document);

  const buildMeta = window.__BUILD_META__ || {};
  const footerBadge = document.getElementById('footerPreviewBadge');
  if (footerBadge && buildMeta.isPreview) {
    footerBadge.hidden = false;
    footerBadge.textContent = buildMeta.version || 'v1-advanced-preview';
  }

  const playground = createPlaygroundClient({ analytics, mobile: true });
  await playground.init();

  await renderMandala(document.getElementById('mobileMandalaPreview'), {
    compact: true,
    title: 'Demo Signal Map',
    subtitle: 'A reduced preview of the desktop mandala.',
    focusIds: ['brishav', 'tourism', 'loan-risk', 'remittance'],
    ariaLabel: 'Reduced mobile mandala',
  });
});
