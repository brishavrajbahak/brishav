import { DurableObject } from 'cloudflare:workers';

export class ContactRateLimiter extends DurableObject {
  async fetch(request) {
    if (request.method !== 'POST') {
      return json({ ok: false, code: 'METHOD_NOT_ALLOWED' }, 405, { Allow: 'POST' });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, code: 'INVALID_JSON' }, 400);
    }

    const limit = normalizePositiveInteger(body.limit, 5);
    const windowMs = normalizePositiveInteger(body.windowMs, 60_000);
    const now = Date.now();

    const state = (await this.ctx.storage.get('state')) || {
      count: 0,
      resetAt: now + windowMs,
    };

    if (now > state.resetAt) {
      state.count = 0;
      state.resetAt = now + windowMs;
    }

    state.count += 1;
    await this.ctx.storage.put('state', state);

    const remaining = Math.max(limit - state.count, 0);
    const retryAfter = Math.max(1, Math.ceil((state.resetAt - now) / 1000));

    return json({
      ok: true,
      allowed: state.count <= limit,
      remaining,
      retryAfter,
      resetAt: state.resetAt,
    });
  }
}

export default {
  async fetch() {
    return json({ ok: false, code: 'NOT_FOUND' }, 404);
  },
};

function normalizePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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
