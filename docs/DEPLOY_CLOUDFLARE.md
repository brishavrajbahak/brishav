# Deploy To Cloudflare Pages

## Cloudflare Pages

1. Push this folder to GitHub.
2. Create a Cloudflare Pages project from the GitHub repo.
3. Leave the build command empty.
4. Set output directory to `public`.
5. Keep the root directory as `/`.
6. Attach `brishavrajbahak.com.np` as the custom domain.

## Contact Rate Limiter Worker

This Pages project binds to a separate Durable Object Worker for production-safe rate limiting.

Deploy it before deploying Pages:

```bash
npx wrangler deploy --config workers/contact-rate-limiter/wrangler.toml
```

The Pages project Wrangler file binds `CONTACT_RATE_LIMITER` to the Worker named `brishav-contact-rate-limiter`.

## Turnstile

1. Create a Turnstile widget for `brishavrajbahak.com.np`.
2. Put the public site key in `public/assets/js/config.public.js`.
3. Put the secret key in Cloudflare Pages environment variables as `TURNSTILE_SECRET_KEY`.

## Resend

1. Create a Resend account.
2. Verify the sending domain `brishavrajbahak.com.np` in Resend.
3. Add the DKIM/SPF DNS records Resend gives you in Cloudflare DNS.
4. Add `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, and `AUTO_REPLY_FROM_EMAIL` in Cloudflare Pages environment variables.

## MailChannels (optional)

If you prefer MailChannels over Resend:

1. Set `EMAIL_PROVIDER=mailchannels`.
2. Keep `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, and `AUTO_REPLY_FROM_EMAIL`.
3. Do not set `RESEND_API_KEY` for that provider path.

## Environment Variables

Use `.dev.vars.example` as the template. Do not commit `.dev.vars`.

Required production values:

```text
EMAIL_PROVIDER=resend
RESEND_API_KEY=...
CONTACT_TO_EMAIL=contact@brishavrajbahak.com.np
CONTACT_FROM_EMAIL="Portfolio Contact <noreply@brishavrajbahak.com.np>"
AUTO_REPLY_FROM_EMAIL="Brishav Rajbahak <noreply@brishavrajbahak.com.np>"
TURNSTILE_SECRET_KEY=...
AUTO_REPLY_ENABLED=true
ALLOWED_ORIGINS=https://brishavrajbahak.com.np
```

## Local Dev

Run:

```powershell
npx wrangler pages dev public
```

For local development with the external Durable Object:

1. Start the Durable Object Worker in one terminal:

```powershell
npx wrangler dev --config workers/contact-rate-limiter/wrangler.toml
```

2. Start Pages dev in another terminal and bind the local Durable Object:

```powershell
npx wrangler pages dev public --do CONTACT_RATE_LIMITER=ContactRateLimiter@brishav-contact-rate-limiter
```

For local API testing without Turnstile, set `SKIP_TURNSTILE_LOCAL=true` in `.dev.vars`. Keep it `false` in production.

## Smoke Test

1. Open the deployed site.
2. Submit a valid contact message.
3. Confirm the owner notification arrives.
4. Confirm the visitor auto-reply arrives when `AUTO_REPLY_ENABLED=true`.
5. Confirm browser Network tab shows only the Turnstile site key and never secret env values.
