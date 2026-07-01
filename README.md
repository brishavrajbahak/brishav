# Brishav Rajbahak Portfolio

Interactive portfolio website for Brishav Rajbahak, centered on data analysis, reporting, curated demos, and practical business-facing storytelling.

**Live website:** [brishavrajbahak.com.np](https://brishavrajbahak.com.np)

## Advanced V1

This branch introduces the Advanced V1 layer:

- enhanced desktop terminal with command registry
- SVG-based mandala visualization across skills, terminal, and playground
- curated playground with three Nepal-themed demo datasets
- privacy-friendly interaction events for terminal and playground usage
- build pipeline using `esbuild`

## Highlights

- Responsive portfolio with dedicated desktop and mobile experiences
- Interactive desktop terminal plus mobile Demo Mode card
- Signal mandala for skills, tools, and domain connections
- Curated playground demos: Tourism, Loan Risk, Remittance
- Cloudflare Pages hosting and Pages Functions backend
- Contact form protected by Cloudflare Turnstile
- Resend email delivery with Durable Object-backed contact rate limiting
- Versioned built assets and preview-branch badge support

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- esbuild
- Cloudflare Pages
- Cloudflare Pages Functions
- Cloudflare Turnstile
- Cloudflare Web Analytics beacon (optional public token)
- Resend

## Project Structure

```text
.
|-- public/
|   |-- assets/
|   |   |-- css/
|   |   |-- data/
|   |   |   |-- demo/
|   |   |   `-- mandala-config.json
|   |   `-- js/
|   |       |-- modules/
|   |       |-- advanced.js
|   |       |-- mobile-advanced.js
|   |       `-- build-meta.js
|   |-- index.html
|   `-- _headers
|-- functions/
|   |-- api/v1/
|   |   |-- analytics/
|   |   |-- contact.js
|   |   `-- playground/
|   `-- lib/
|-- workers/
|-- docs/
|-- build.js
|-- CHANGELOG.md
|-- package.json
`-- wrangler.toml
```

## Local Development

### Requirements

- Node.js
- Wrangler CLI via `npx`
- A Cloudflare account for Pages Functions and Turnstile testing

Install dependencies:

```bash
npm ci
```

Create local secrets:

```bash
cp .dev.vars.example .dev.vars
```

Run the Durable Object worker in one terminal:

```bash
npx wrangler dev --config workers/contact-rate-limiter/wrangler.toml
```

Run the site in a second terminal:

```bash
npm run dev
```

That script builds the advanced JS bundles and starts:

```text
http://localhost:8788
```

## Build Scripts

```bash
npm run build
npm run lint
npm run preview
npm run premerge
```

- `build` generates `advanced.js`, `mobile-advanced.js`, and `build-meta.js`
- `postbuild` validates `build-meta.js` and enforces the advanced JS budget of `< 250KB gzipped`
- `lint` validates the new modules, Functions routes, and build files
- `preview` builds and deploys the current branch to Cloudflare Pages
- `premerge` runs `npm ci`, `npm run lint`, and `npm run build`

### Bundle Budget Check

The bundle budget is enforced automatically during:

```bash
npm run build
```

That command triggers the `postbuild` validator, which checks the gzipped size of:

- `public/assets/js/advanced.js`
- `public/assets/js/mobile-advanced.js`

The combined advanced JS budget must remain under `250KB gzipped`.

## Environment and Public Config

Non-secret Pages values remain in [wrangler.toml](/D:/tr/wrangler.toml).

Encrypted Cloudflare Pages secrets still include:

```text
RESEND_API_KEY
TURNSTILE_SECRET_KEY
```

Public frontend config lives in:

[`public/assets/js/config.public.js`](/D:/tr/public/assets/js/config.public.js)

It currently contains:

- `TURNSTILE_SITE_KEY`
- optional `WEB_ANALYTICS_TOKEN`

The Turnstile site key and Web Analytics token are public values by design.

## New Endpoints

- `GET /api/v1/playground/datasets`
- `POST /api/v1/playground/analyze`
- `POST /api/v1/analytics/event`

The contact API stays unchanged:

- `POST /api/v1/contact`

## Analytics Notes

Page/session analytics can use the optional Cloudflare Web Analytics beacon.

Explicit interaction events are sent to `/api/v1/analytics/event`:

- `terminal_command`
- `mandala_view`
- `playground_open`
- `analyze_run`

## Before vs After V1

Before:

- one large desktop script
- static project and skills sections
- no demo analysis layer

After:

- modular advanced JS layer on top of the existing site
- terminal plus mandala as distinct brand interactions
- curated data playground tied to project themes

## Screenshots

Screenshots of terminal, mandala, and playground will be added to `main` after merge.

## V2 Roadmap

Deferred intentionally from Advanced V1:

- uploads
- R2
- D1
- Workers AI insights
- PDF export

## Security

- Never commit `.dev.vars`, `.env` files, or secret API keys
- Keep `SKIP_TURNSTILE_LOCAL=false` in production
- Verify the Resend sending domain and Turnstile hostname match the production domain
- Keep the optional analytics token public, but never place secrets in public config

## License

This repository contains personal portfolio content. Reuse of the branding, writing, images, or design requires permission.
