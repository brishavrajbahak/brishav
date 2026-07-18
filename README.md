# Himalayan Data Observatory

Brishav Rajbahak's production portfolio is a light-theme, cinematic data experience built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Motion, D3, Chart.js, and React Three Fiber.

The site is statically exported to `out/` for Cloudflare Pages. The existing Pages Functions and Durable Object worker remain responsible for the playground, contact form, analytics, Turnstile verification, email delivery, and rate limiting.

## Requirements

- Node.js 20.9 or newer (`.nvmrc` uses Node 22)
- npm

## Install and run

Install dependencies once after cloning, or whenever `package-lock.json` changes:

```powershell
npm.cmd ci
```

For frontend development with hot reload:

```powershell
npm.cmd run dev
```

Open `http://localhost:3000`. You do not need to rebuild after every edit; the development server recompiles automatically.

For the production-style integrated preview, including Pages Functions and the local rate-limiter worker:

```powershell
npm.cmd run build
npm.cmd run start
```

Open `http://127.0.0.1:8788`. Build again only after source changes when using this production preview.

## Environment

Copy the example files when testing integrations locally:

```powershell
Copy-Item .env.example .env.local
Copy-Item .dev.vars.example .dev.vars
```

Public frontend values:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `NEXT_PUBLIC_API_BASE` (optional; same-origin is the default)
- `NEXT_PUBLIC_RESUME_URL` (optional; the resume action stays hidden when unset)

Provider secrets such as `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY` belong in `.dev.vars` locally or Cloudflare secrets in production. Never expose them through `NEXT_PUBLIC_*` variables.

## Verification

```powershell
npm.cmd run verify
npm.cmd run test:e2e
npm.cmd run lighthouse:mobile
npm.cmd run lighthouse:desktop
```

`verify` runs ESLint, TypeScript, unit tests, the static production export, bundle/CSP validation, and Pages Functions compilation.

## Architecture

```text
app/                    Next.js App Router entry and design system
components/             Accessible sections, charts, forms, and 3D views
lib/                    Typed content, API normalization, motion, and analysis
public/assets/data/     Curated deterministic demo datasets
functions/api/v1/       Existing Cloudflare Pages API contracts
workers/                Existing Durable Object rate limiter
scripts/                CSP, bundle, and integrated-preview tooling
tests/                  Unit, component, browser, accessibility, and visual tests
out/                    Generated static Cloudflare Pages output
```

The public API contracts remain:

- `GET /api/v1/playground/datasets`
- `POST /api/v1/playground/analyze`
- `POST /api/v1/contact`
- `POST /api/v1/analytics/event`

## Deployment

Cloudflare Pages must use:

- Build command: `npm run build`
- Output directory: `out`
- Node.js: 20.9 or newer

Preview deploys from the premium feature branch are marked `noindex`. Production cutover should happen only after the CI acceptance checks pass; the previous Pages deployment remains the rollback point.

## Content policy

Project claims are evidence-led. Loan Default Prediction remains labelled **In development** until published evidence exists, and the resume action stays hidden until a real PDF URL is configured.

## License

This repository contains personal portfolio content. Reuse of the branding, writing, images, or design requires permission.
