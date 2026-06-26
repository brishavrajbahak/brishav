import { listDatasets } from '../../../lib/playground/catalog.js';

const ALLOW_METHODS = 'GET, OPTIONS';
const DEFAULT_ALLOWED_ORIGIN = 'https://brishavrajbahak.com.np';

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
  if (!isAllowedOrigin(context.request, context.env)) {
    return json(context.request, context.env, { ok: false, code: 'ORIGIN_NOT_ALLOWED' }, 403);
  }

  return json(context.request, context.env, {
    ok: true,
    datasets: listDatasets(),
  });
}

export async function onRequestPost(context) {
  return json(context.request, context.env, { ok: false, code: 'METHOD_NOT_ALLOWED' }, 405, { Allow: ALLOW_METHODS });
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
