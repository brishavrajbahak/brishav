# Brishav Rajbahak Portfolio

This is my portfolio site for [brishavrajbahak.com.np](https://brishavrajbahak.com.np).

I built it to present myself as a `Data Analyst` and `Data Science Aspirant` without hiding behind generic portfolio templates. The desktop experience leans into an interactive terminal and a signal mandala because those two pieces communicate how I think: structured inputs, deliberate exploration, and visible relationships between tools, domains, and outcomes.

I kept the mobile path intentionally lighter. On mobile I care more about clarity, speed, and a clean project/storytelling path than about preserving every desktop effect.

## What is in Advanced V1

Advanced V1 adds three things on top of the earlier portfolio baseline:

- a desktop terminal driven by a command registry
- an SVG mandala that maps skills, tools, and domains
- a curated demo playground with fixed datasets

The playground is intentionally demo-only. I chose fixed datasets because I wanted deterministic outputs that I can explain end to end in an interview. I did not want fake "AI analysis" theater or a black-box upload flow I could not defend.

## Current feature set

- desktop terminal with commands like `help`, `whoami --deep`, `projects --detail`, `mandala`, and `analyze loan-risk`
- mobile Demo Mode card that opens the same curated playground without the terminal layer
- mandala rendering in the skills section, terminal, and playground
- three built-in demo datasets:
  - Tourism
  - Loan Risk
  - Remittance
- contact form protected by Turnstile
- Cloudflare Pages Functions backend
- Resend email delivery
- Durable Object-backed contact rate limiting
- optional Cloudflare Web Analytics event tracking

## Why the playground is fixed

The datasets are fixed on purpose.

- I can explain every field and every output.
- The API surface stays narrow and easier to harden.
- The charts and summary text stay deterministic.
- The UI stays honest about being a curated demo rather than a live model.

That tradeoff is worth it for this version.

## Project structure

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
|-- package.json
`-- wrangler.toml
```

## Local development

### Requirements

- Node.js 22+
- `npx` for Wrangler commands
- a Cloudflare account if I want to test Pages Functions, Turnstile, or preview deploys

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

Run the site in another terminal:

```bash
npm run dev
```

That rebuilds the advanced bundles and serves the site locally through Wrangler Pages.

## Build scripts

```bash
npm run build
npm run lint
npm run preview
npm run premerge
```

- `build` bundles `advanced.js`, `mobile-advanced.js`, and regenerates `build-meta.js`
- `postbuild` runs automatically and checks the combined advanced bundle budget
- `lint` validates the frontend modules, Functions routes, and build files
- `preview` builds and deploys the current branch to Cloudflare Pages
- `premerge` runs `npm ci`, `npm run lint`, and `npm run build`

## Bundle budget

I enforce the advanced bundle budget during build:

```bash
npm run build
```

That runs the postbuild validator and checks the gzipped size of:

- `public/assets/js/advanced.js`
- `public/assets/js/mobile-advanced.js`

The combined target stays under `250KB gzipped`.

## Public config and secrets

Non-secret Pages values live in [`wrangler.toml`](/D:/tr/wrangler.toml).

Public frontend config lives in [`public/assets/js/config.public.js`](/D:/tr/public/assets/js/config.public.js).

That file can safely contain:

- `TURNSTILE_SITE_KEY`
- `WEB_ANALYTICS_TOKEN`

Secrets belong in Cloudflare Pages secrets instead:

- `RESEND_API_KEY`
- `TURNSTILE_SECRET_KEY`

## API routes

Advanced V1 adds:

- `GET /api/v1/playground/datasets`
- `POST /api/v1/playground/analyze`
- `POST /api/v1/analytics/event`

The contact API stays:

- `POST /api/v1/contact`

## Interaction analytics

I keep tracking narrow and explicit. These events can be sent to `/api/v1/analytics/event`:

- `terminal_command`
- `mandala_view`
- `playground_open`
- `analyze_run`

## Known limitations in this version

This branch is intentionally narrow.

- The playground is demo-only.
- There are no uploads.
- There is no R2, D1, Workers AI, or PDF export.
- The fallback in-memory contact limiter is only isolate-local when Durable Objects are unavailable.

## Screenshots

Screenshots of terminal, mandala, and playground will be added to `main` after merge.

## V2 ideas I deliberately deferred

- uploads
- persisted results
- R2
- D1
- Workers AI summaries
- PDF export

## Security notes

- Never commit `.dev.vars`, `.env`, or provider secrets.
- Turnstile site keys are public. The matching secret key is not.
- The contact form depends on the production hostname being allowed in Turnstile.
- The strict CSP in `public/_headers` is part of the deployed security boundary, not a nice-to-have.

## License

This repository contains personal portfolio content. Reuse of the branding, writing, images, or design requires permission.
