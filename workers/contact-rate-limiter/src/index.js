import { DurableObject } from 'cloudflare:workers';

export class ContactRateLimiter extends DurableObject {
  async fetch(request) {
    if (request.method !== 'POST') {
      return json({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405, {
        Allow: 'POST',
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'INVALID_JSON' }, 400);
    }

    const key = String(body.key || 'unknown').trim() || 'unknown';
    const limit = clampNumber(body.limit, 1, 1000, 5);
    const windowMs = clampNumber(body.windowMs, 1_000, 3_600_000, 60_000);
    const now = Date.now();

    const current = await this.ctx.storage.get(['count', 'resetAt']);
    const resetAt = Number(current.resetAt || 0);
    let count = Number(current.count || 0);

    if (!resetAt || now >= resetAt) {
      count = 0;
    }

    count += 1;
    const nextResetAt = !resetAt || now >= resetAt ? now + windowMs : resetAt;

    await this.ctx.storage.put({
      key,
      count,
      resetAt: nextResetAt,
    });

    return json({
      ok: true,
      key,
      allowed: count <= limit,
      remaining: Math.max(limit - count, 0),
      retryAfter: Math.max(Math.ceil((nextResetAt - now) / 1000), 1),
      resetAt: nextResetAt,
    });
  }
}

export default {
  fetch() {
    return json({ ok: false, error: 'NOT_FOUND' }, 404);
  },
};

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  });
}
