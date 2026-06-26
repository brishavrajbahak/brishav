import { analyzeDataset, loadDataset } from '../../../lib/playground/catalog.js';

const ALLOW_METHODS = 'POST, OPTIONS';
const DEFAULT_ALLOWED_ORIGIN = 'https://brishavrajbahak.com.np';
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 15;

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

  const ip = normalizeClientIp(
    request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown',
  );
  const rateLimit = await checkRateLimit(env, `playground:${ip}`);
  if (!rateLimit.ok) {
    return json(request, env, { ok: false, code: 'SERVER_ERROR' }, 500);
  }
  if (!rateLimit.allowed) {
    return json(
      request,
      env,
      { ok: false, code: 'RATE_LIMITED', errors: ['Too many playground requests. Try again shortly.'] },
      429,
      { 'Retry-After': String(rateLimit.retryAfter || 60) },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(request, env, { ok: false, code: 'VALIDATION_ERROR', errors: ['Body must be valid JSON.'] }, 400);
  }

  if (body.version !== 1) {
    return json(request, env, { ok: false, code: 'VALIDATION_ERROR', errors: ['Unsupported API version.'] }, 400);
  }

  const datasetId = String(body.datasetId || '').trim().toLowerCase();
  const analysisType = String(body.analysisType || 'overview').trim().toLowerCase();

  if (!datasetId) {
    return json(request, env, { ok: false, code: 'VALIDATION_ERROR', errors: ['datasetId is required.'] }, 400);
  }

  if (!['overview', 'distribution', 'trend'].includes(analysisType)) {
    return json(request, env, { ok: false, code: 'VALIDATION_ERROR', errors: ['Unsupported analysis type.'] }, 400);
  }

  let dataset;
  try {
    dataset = await loadDataset(datasetId, request.url);
  } catch {
    return json(request, env, { ok: false, code: 'SERVER_ERROR', errors: ['Dataset could not be loaded.'] }, 500);
  }

  if (!dataset) {
    return json(request, env, { ok: false, code: 'VALIDATION_ERROR', errors: ['Unknown datasetId.'] }, 400);
  }

  const result = analyzeDataset(dataset, analysisType);
  if (!result) {
    return json(request, env, { ok: false, code: 'VALIDATION_ERROR', errors: ['Dataset analysis failed.'] }, 400);
  }

  return json(request, env, {
    ok: true,
    result,
  });
}

async function checkRateLimit(env, key) {
  if (env.CONTACT_RATE_LIMITER && typeof env.CONTACT_RATE_LIMITER.idFromName === 'function') {
    try {
      const id = env.CONTACT_RATE_LIMITER.idFromName(key);
      const stub = env.CONTACT_RATE_LIMITER.get(id);
      const response = await stub.fetch('https://contact-rate-limiter.internal/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: MAX_REQUESTS_PER_WINDOW,
          windowMs: WINDOW_MS,
        }),
      });

      if (!response.ok) return { ok: false };
      const data = await response.json();
      return {
        ok: true,
        allowed: Boolean(data.allowed),
        retryAfter: Number(data.retryAfter || 0),
      };
    } catch {
      return { ok: false };
    }
  }

  return { ok: true, allowed: true };
}

function normalizeClientIp(value) {
  return String(value || 'unknown').split(',')[0].trim() || 'unknown';
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
