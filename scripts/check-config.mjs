import { readFileSync } from 'node:fs';

const headers = readFileSync('public/_headers', 'utf8');
const pagesWrangler = readFileSync('wrangler.toml', 'utf8');
const workerWrangler = readFileSync('workers/contact-rate-limiter/wrangler.toml', 'utf8');
const indexHtml = readFileSync('public/index.html', 'utf8');

for (const value of [
  'Content-Security-Policy:',
  "script-src 'self' https://challenges.cloudflare.com https://cdnjs.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  '/api/*',
  'Cache-Control: no-store',
]) {
  if (!headers.includes(value)) {
    throw new Error(`Missing expected header configuration: ${value}`);
  }
}

for (const value of [
  'pages_build_output_dir = "public"',
  '[[durable_objects.bindings]]',
  'name = "CONTACT_RATE_LIMITER"',
  'class_name = "ContactRateLimiter"',
  'script_name = "brishav-contact-rate-limiter"',
]) {
  if (!pagesWrangler.includes(value)) {
    throw new Error(`Missing expected Pages Wrangler config: ${value}`);
  }
}

for (const value of [
  'name = "brishav-contact-rate-limiter"',
  'main = "src/index.js"',
  'new_sqlite_classes = [ "ContactRateLimiter" ]',
]) {
  if (!workerWrangler.includes(value)) {
    throw new Error(`Missing expected DO worker config: ${value}`);
  }
}

const inlineScriptMatches = indexHtml.match(/<script(?![^>]*\ssrc=)[^>]*>/g) || [];
if (inlineScriptMatches.length > 0) {
  throw new Error(`Inline script tags remain in public/index.html (${inlineScriptMatches.length} found).`);
}

console.log('Header and config checks passed.');
