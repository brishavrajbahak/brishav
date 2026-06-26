const ALLOWED_EVENTS = new Set([
  'terminal_command',
  'mandala_view',
  'playground_open',
  'analyze_run',
]);

export function initAnalytics({ webAnalyticsToken = '' } = {}) {
  if (webAnalyticsToken) {
    loadCloudflareWebAnalytics(webAnalyticsToken);
  }

  return {
    trackEvent,
    bindDataEvents(root = document) {
      root.addEventListener('click', event => {
        const trigger = event.target.closest('[data-event]');
        if (!trigger) return;
        trackEvent(trigger.dataset.event, {
          source: trigger.dataset.eventSource || trigger.id || trigger.textContent?.trim().slice(0, 40) || 'unknown',
        });
      });
    },
  };
}

export function trackEvent(name, detail = {}) {
  if (!ALLOWED_EVENTS.has(name)) return;

  const payload = {
    version: 1,
    name,
    detail: sanitizeDetail(detail),
    path: window.location.pathname,
    referrer: document.referrer ? new URL(document.referrer).hostname : '',
    timestamp: new Date().toISOString(),
  };

  const body = JSON.stringify(payload);
  const blob = new Blob([body], { type: 'application/json' });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/v1/analytics/event', blob);
      return;
    }
  } catch {
    // Fallback below.
  }

  fetch('/api/v1/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}

function loadCloudflareWebAnalytics(token) {
  if (document.querySelector('script[data-cf-beacon]')) return;
  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.setAttribute('data-cf-beacon', JSON.stringify({ token }));
  document.head.appendChild(script);
}

function sanitizeDetail(detail) {
  return Object.fromEntries(
    Object.entries(detail || {})
      .slice(0, 6)
      .map(([key, value]) => [String(key).slice(0, 30), String(value).slice(0, 120)]),
  );
}
