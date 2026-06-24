# Brishav Rajbahak Portfolio

Personal portfolio website for Brishav Rajbahak, focused on data analysis, business intelligence, dashboards, reporting, and early-stage data science portfolio work.

**Live website:** [brishavrajbahak.com.np](https://brishavrajbahak.com.np)

## Highlights

- Responsive portfolio with dedicated desktop and mobile experiences
- Interactive desktop terminal and data-themed canvas effects
- Lightweight mobile bundle with expensive desktop effects disabled
- Responsive WebP portrait images
- Cloudflare Pages hosting and Pages Functions backend
- Contact form protected by Cloudflare Turnstile
- Email delivery and automatic replies through Resend
- Server-side validation, honeypot protection, origin checks, and Durable Object rate limiting
- Versioned static assets and production cache headers

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- Cloudflare Pages
- Cloudflare Pages Functions
- Cloudflare Turnstile
- Resend

## Project Structure

```text
.
|-- public/                  # Deployable website
|   |-- assets/
|   |   |-- css/
|   |   |-- images/
|   |   `-- js/
|   |-- index.html
|   `-- _headers
|-- functions/               # Cloudflare Pages Functions
|   |-- api/v1/contact.js
|   `-- lib/email/
|-- shared/                  # Contact API schema
|-- workers/                 # Standalone Worker for shared Durable Objects
|-- docs/                    # Deployment and API documentation
|-- .dev.vars.example        # Environment variable template
`-- wrangler.toml            # Cloudflare Pages configuration
```

## Mobile Performance

The site detects viewports of `768px` or less before first paint and loads a dedicated mobile script.

The mobile version:

- Does not download or initialize the interactive terminal
- Disables canvas animations, particles, audio, parallax, and magnetic effects
- Uses system fonts instead of downloading Google Fonts
- Loads syntax highlighting only when code approaches the viewport
- Uses optimized `480w` and `768w` WebP images
- Skips the simulated desktop loading sequence
- Preserves navigation, contact form, Turnstile, and accessibility behavior

## Local Development

### Requirements

- Node.js
- Wrangler CLI
- A Cloudflare account for Functions and Turnstile testing

Install or invoke Wrangler through `npx`, then create a local secrets file:

```bash
cp .dev.vars.example .dev.vars
```

Replace the placeholder values in `.dev.vars`. This file is ignored by Git.

Run the complete site with Pages Functions:

```bash
npx wrangler dev --config workers/contact-rate-limiter/wrangler.toml
```

In a second terminal:

```bash
npx wrangler pages dev public --do CONTACT_RATE_LIMITER=ContactRateLimiter@brishav-contact-rate-limiter
```

Open:

```text
http://localhost:8788
```

For local API testing without Turnstile, use:

```text
SKIP_TURNSTILE_LOCAL=true
```

Never enable this setting in production.

## Environment Variables

Non-secret configuration lives in `wrangler.toml` under `[vars]`.

The Pages project expects these plain-text values:

```text
EMAIL_PROVIDER=resend
CONTACT_TO_EMAIL=contact@brishavrajbahak.com.np
CONTACT_FROM_EMAIL=Portfolio Contact <noreply@brishavrajbahak.com.np>
AUTO_REPLY_FROM_EMAIL=Brishav Rajbahak <noreply@brishavrajbahak.com.np>
AUTO_REPLY_ENABLED=true
AUTO_REPLY_SUBJECT=Thanks for reaching out
ALLOWED_ORIGINS=https://brishavrajbahak.com.np
SKIP_TURNSTILE_LOCAL=false
```

Add these as encrypted secrets in Cloudflare Pages:

```text
RESEND_API_KEY
TURNSTILE_SECRET_KEY
```

The Turnstile site key is public by design and is configured in:

```text
public/assets/js/config.public.js
```

## Contact Flow

1. The visitor completes the contact form and Turnstile challenge.
2. The browser submits JSON to `POST /api/v1/contact`.
3. The Pages Function validates the request, origin, honeypot, rate limit, and Turnstile token.
4. Resend delivers the notification to `contact@brishavrajbahak.com.np`.
5. A neutral receipt confirmation is sent to the visitor without echoing their submitted message.

See [docs/CONTACT_API.md](docs/CONTACT_API.md) for the API contract.

## Deployment

The Cloudflare Pages project name is:

```text
brishav-portfolio
```

Deploy the current production files:

```bash
npx wrangler pages deploy public \
  --project-name=brishav-portfolio \
  --branch=main

Deploy the rate-limit Durable Object Worker before preview or production deploys:

```bash
npx wrangler deploy --config workers/contact-rate-limiter/wrangler.toml
```
```

The custom production domain is:

```text
https://brishavrajbahak.com.np
```

See [docs/DEPLOY_CLOUDFLARE.md](docs/DEPLOY_CLOUDFLARE.md) for the full setup guide.

## Security

- Never commit `.dev.vars`, `.env` files, Resend API keys, or the Turnstile secret.
- Keep `SKIP_TURNSTILE_LOCAL=false` in production.
- Verify that the Resend sending domain and Turnstile hostname match the production domain.
- The public Turnstile site key is safe to include in frontend code.

## License

This repository contains a personal portfolio and its original content. Reuse of the design, branding, images, or personal content requires permission.
