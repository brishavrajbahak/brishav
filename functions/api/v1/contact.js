import { sendAutoReply, sendNotification } from '../../lib/email/index.js';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const ALLOW_METHODS = 'POST, OPTIONS';
const DEFAULT_ALLOWED_ORIGIN = 'https://brishavrajbahak.com.np';
const localRateLimit = globalThis.__CONTACT_RATE_LIMIT__ ||= new Map();

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
  return json(
    context.request,
    context.env,
    { ok: false, code: 'METHOD_NOT_ALLOWED' },
    405,
    { Allow: ALLOW_METHODS },
  );
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!isAllowedOrigin(request, env)) {
    return json(request, env, { ok: false, code: 'ORIGIN_NOT_ALLOWED' }, 403);
  }

  const ip = normalizeClientIp(
    request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown',
  );

  const rateLimit = await checkRateLimit(env, ip);
  if (!rateLimit.ok) {
    console.error('Rate limiter unavailable for contact request.', { ip, detail: rateLimit.detail || 'unknown' });
    return json(request, env, { ok: false, code: 'SERVER_ERROR' }, 500);
  }

  if (!rateLimit.allowed) {
    return json(
      request,
      env,
      { ok: false, code: 'RATE_LIMITED' },
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

  const payload = normalizePayload(body.payload);
  const errors = validatePayload(payload);
  if (errors.length) {
    return json(request, env, { ok: false, code: 'VALIDATION_ERROR', errors }, 400);
  }

  if (payload.website) {
    return json(request, env, { ok: false, code: 'BOT_FAILED' }, 403);
  }

  const turnstile = await verifyTurnstile(body.turnstileToken, env, ip);
  if (!turnstile.ok) {
    return json(request, env, { ok: false, code: 'BOT_FAILED' }, 403);
  }

  try {
    await sendNotification(env, payload, {
      ip,
      userAgent: request.headers.get('user-agent') || '',
      submittedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Notification email failed:', error);
    return json(request, env, { ok: false, code: 'SERVER_ERROR' }, 500);
  }

  let autoReplySent = false;
  const autoReplyEnabled = String(env.AUTO_REPLY_ENABLED || 'true').trim().toLowerCase() !== 'false';
  if (autoReplyEnabled) {
    try {
      await sendAutoReply(env, payload);
      autoReplySent = true;
    } catch (error) {
      console.error('Auto-reply email failed after notification succeeded:', {
        email: payload.email,
        subject: payload.subject || '(No subject)',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return json(request, env, {
    ok: true,
    message: "Signal received. I'll be in touch soon.",
    autoReplySent,
  });
}

function normalizePayload(payload = {}) {
  return {
    name: String(payload.name || '').trim(),
    email: String(payload.email || '').trim(),
    subject: String(payload.subject || '').trim(),
    message: String(payload.message || '').trim(),
    website: String(payload.website || '').trim(),
  };
}

function validatePayload(payload) {
  const errors = [];
  if (payload.name.length < 2 || payload.name.length > 120) errors.push('Name must be 2-120 characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) || payload.email.length > 254) errors.push('Email is invalid.');
  if (payload.subject.length > 160) errors.push('Subject must be 160 characters or fewer.');
  if (payload.message.length < 10 || payload.message.length > 4000) errors.push('Message must be 10-4000 characters.');
  return errors;
}

async function checkRateLimit(env, ip) {
  if (env.CONTACT_RATE_LIMITER && typeof env.CONTACT_RATE_LIMITER.idFromName === 'function') {
    try {
      const id = env.CONTACT_RATE_LIMITER.idFromName(ip);
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

      if (!response.ok) {
        return { ok: false, detail: `durable-object-${response.status}` };
      }

      const data = await response.json();
      return {
        ok: true,
        allowed: Boolean(data.allowed),
        retryAfter: Number(data.retryAfter || 0),
      };
    } catch (error) {
      return {
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return checkLocalRateLimit(ip);
}

function checkLocalRateLimit(ip) {
  const now = Date.now();

  for (const [key, bucket] of localRateLimit.entries()) {
    if (!bucket || now > bucket.resetAt) localRateLimit.delete(key);
  }

  const bucket = localRateLimit.get(ip) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + WINDOW_MS;
  }

  bucket.count += 1;
  localRateLimit.set(ip, bucket);

  return {
    ok: true,
    allowed: bucket.count <= MAX_REQUESTS_PER_WINDOW,
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

async function verifyTurnstile(token, env, ip) {
  if ((env.SKIP_TURNSTILE_LOCAL || '').toLowerCase() === 'true') return { ok: true };
  if (!token || !env.TURNSTILE_SECRET_KEY) return { ok: false };

  const formData = new FormData();
  formData.append('secret', env.TURNSTILE_SECRET_KEY);
  formData.append('response', token);
  if (ip && ip !== 'unknown') formData.append('remoteip', ip);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  return { ok: Boolean(data.success), errors: data['error-codes'] || [] };
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
  const allowedOrigin = isAllowedOrigin(request, env) && origin ? origin : fallbackOrigin;

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
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
