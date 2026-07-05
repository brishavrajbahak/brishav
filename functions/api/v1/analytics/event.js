const ALLOW_METHODS = 'POST, OPTIONS';
const DEFAULT_ALLOWED_ORIGIN = 'https://brishavrajbahak.com.np';
const ALLOWED_EVENTS = new Set(['terminal_command', 'mandala_view', 'playground_open', 'analyze_run']);

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: ALLOW_METHODS,
      ...corsHeaders(context.request, context.env),
    },
  });
}

export async function onRequestGet(context) {
  return json(context.request, context.env, { ok: false, code: 'METHOD_NOT_ALLOWED' }, 405, { Allow: ALLOW_METHODS });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!isAllowedOrigin(request, env)) {
    return json(request, env, { ok: false, code: 'ORIGIN_NOT_ALLOWED' }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(request, env, { ok: false, code: 'VALIDATION_ERROR', errors: ['Body must be valid JSON.'] }, 400);
  }

  const name = String(body.name || '').trim();
  if (!ALLOWED_EVENTS.has(name)) {
    return json(request, env, { ok: false, code: 'VALIDATION_ERROR', errors: ['Unsupported event name.'] }, 400);
  }

  console.log('analytics_event', {
    name,
    detail: sanitizeDetail(body.detail),
    path: String(body.path || request.url).slice(0, 120),
    timestamp: String(body.timestamp || new Date().toISOString()).slice(0, 50),
  });

  return json(request, env, { ok: true }, 202);
}

function sanitizeDetail(detail) {
  return Object.fromEntries(
    Object.entries(detail || {})
      .slice(0, 6)
      .map(([key, value]) => [String(key).slice(0, 30), String(value).slice(0, 100)]),
  );
}

function isAllowedOrigin(request, env) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  if (!allowed.length) return true;
  return allowed.includes(origin);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('origin');
  const configuredOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  const fallbackOrigin = configuredOrigins[0] || DEFAULT_ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(request, env) && origin ? origin : fallbackOrigin,
    'Access-Control-Allow-Methods': ALLOW_METHODS,
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(request, env, body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request, env),
      ...extraHeaders,
    },
  });
}
