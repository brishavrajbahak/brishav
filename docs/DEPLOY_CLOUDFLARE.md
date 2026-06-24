# Deploy To Cloudflare Pages

## Cloudflare Pages

1. Push this folder to GitHub.
2. Create a Cloudflare Pages project from the GitHub repo.
3. Leave the build command empty.
4. Set output directory to `public`.
5. Keep the root directory as `/`.
6. Attach `brishavrajbahak.com.np` as the custom domain.

## Contact Rate Limiter Worker

Deploy the shared Durable Object Worker before preview or production Pages deploys:

```powershell
npx wrangler deploy --config workers/contact-rate-limiter/wrangler.toml
```

## Turnstile

1. Create a Turnstile widget for `brishavrajbahak.com.np`.
2. Put the public site key in `public/assets/js/config.public.js`. The site key is safe to expose publicly.
3. Put the secret key in Cloudflare Pages environment variables as `TURNSTILE_SECRET_KEY`.

## Resend

1. Create a Resend account.
2. Verify the sending domain `brishavrajbahak.com.np` in Resend.
3. Add the DKIM/SPF DNS records Resend gives you in Cloudflare DNS.
4. Add `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, and `AUTO_REPLY_FROM_EMAIL` in Cloudflare Pages environment variables.

## Environment Variables

Use `.dev.vars.example` as the template. Do not commit `.dev.vars`.

Plain-text values are defined in `wrangler.toml` under `[vars]`.

Required production secrets:

```text
TURNSTILE_SECRET_KEY=...
RESEND_API_KEY=...
```

## Local Dev

Run:

```powershell
npx wrangler pages dev public
```

For local API testing without Turnstile, set `SKIP_TURNSTILE_LOCAL=true` in `.dev.vars`. Keep it `false` in production.

## Smoke Test

1. Open the deployed site.
2. Submit a valid contact message.
3. Confirm the owner notification arrives.
4. Confirm the visitor auto-reply arrives when `AUTO_REPLY_ENABLED=true`.
5. Confirm browser Network tab shows only the Turnstile site key and never secret env values.
