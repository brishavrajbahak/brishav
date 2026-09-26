# Authentic Proof-First Observatory V5

Brishav Rajbahak's portfolio is a five-section, light-first portfolio built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, D3 and selective Radix components.

The homepage is intentionally static-first: Hero, Work, Process, About and Contact. The D3 project mandala is the only extended sticky interaction. The terminal, contact form and loan dashboard load only when requested or approached. The static export remains compatible with the existing Cloudflare Pages Functions and Durable Object.

## Requirements

- Node.js 20.9 or newer
- npm

## Install and run

Install dependencies once after cloning, or whenever `package-lock.json` changes:

```powershell
npm.cmd ci
```

For development with hot reload:

```powershell
npm.cmd run dev
```

Open `http://localhost:3000`. You do not rebuild after every edit; Next.js recompiles automatically.

For a production-style preview with Pages Functions and the local rate limiter:

```powershell
npm.cmd run build
npm.cmd run start
```

Open `http://127.0.0.1:8788`. Rebuild only after source changes when using this exported preview.

## Public build variables

- `NEXT_PUBLIC_PREVIEW_DEPLOYMENT=1` for the noindex V5 preview.
- `NEXT_PUBLIC_PREVIEW_DEPLOYMENT=0` for production metadata.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` for the contact widget.
- `NEXT_PUBLIC_API_BASE` is optional; same-origin requests are the default.
- `NEXT_PUBLIC_PERSONAL_PHOTO` accepts one or more comma-separated approved workspace/notebook image paths. The current production build uses `/assets/images/brishav-workspace-code.jpg,/assets/images/brishav-workspace-desk.jpg`.
- `NEXT_PUBLIC_HEADLINE_APPROVED=1` confirms the reader-tested hero headline before production.

Provider secrets such as `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY` belong in `.dev.vars` locally or Cloudflare secrets. Never expose them through `NEXT_PUBLIC_*` values.

## Verification

```powershell
npm.cmd run verify
npm.cmd run test:e2e
npm.cmd run lighthouse:mobile
npm.cmd run lighthouse:desktop
```

`verify` runs ESLint, TypeScript, unit/component tests, the static export, strict CSP and bundle validation, and Pages Functions compilation. A production build intentionally fails until the approved personal photography and approved-headline flag are configured.

## Architecture

```text
app/                         App Router pages, theme tokens and five-section layout
app/dashboard/loan-default/ Published static D3 dashboard
components/v5-*              V5 sections and progressive enhancements
lib/content.ts               Typed identity, project proof and methodology
functions/api/v1/            Existing public Cloudflare Pages API contracts
workers/                     Existing Durable Object rate limiter
scripts/                     Asset, CSP, validation and preview tooling
tests/                       Unit, component, browser, accessibility and visual checks
out/                         Generated Cloudflare Pages export
```

The public API contracts remain unchanged:

- `GET /api/v1/playground/datasets`
- `POST /api/v1/playground/analyze`
- `POST /api/v1/contact`
- `POST /api/v1/analytics/event`

## Deployment

Cloudflare Pages uses `npm run build`, output directory `out`, and Node 20.9 or newer.

Current hosting:

- `https://brishavrajbahak.com.np` — V5 production portfolio, served by the `brishav-portfolio` Pages project.
- `https://v5.brishavrajbahak.com.np` — frozen, noindex V5 preview/reference deployment.
- `https://classic.brishavrajbahak.com.np` — preserved legacy portfolio, served by the separate `brishav-legacy` Pages project.

The accepted V5 implementation lives on `feature/observatory-v5-authentic-proof`; production was deployed from the verified V5 export after the approved workspace photos were added. The legacy bundle is preserved under `legacy-site/` with its CSS, JavaScript, data and image assets.

Preview deployment:

```powershell
$env:NEXT_PUBLIC_PREVIEW_DEPLOYMENT="1"
npm.cmd run build
npx wrangler pages deploy out --project-name=brishav-portfolio --branch=feature/observatory-v5-authentic-proof
```

Production deployment requires the approved build variables:

```powershell
$env:NEXT_PUBLIC_PREVIEW_DEPLOYMENT="0"
$env:NEXT_PUBLIC_PERSONAL_PHOTO="/assets/images/brishav-workspace-code.jpg,/assets/images/brishav-workspace-desk.jpg"
$env:NEXT_PUBLIC_HEADLINE_APPROVED="1"
npm.cmd run build
npx wrangler pages deploy out --project-name=brishav-portfolio --branch=main --commit-dirty=true
```

Legacy deployment:

```powershell
npx wrangler pages deploy legacy-site --project-name=brishav-legacy --branch=main --commit-dirty=true
```

Cloudflare DNS maps `classic` to `brishav-legacy.pages.dev`. Keep the legacy domain and the V5 reference domain separate from the production root domain.

After an accepted production cutover, keep `v5.brishavrajbahak.com.np` frozen and noindex for seven calendar days. Then tag the accepted commit, remove the Pages custom-domain association and preview branch control, delete the proxied `v5` CNAME, and verify the subdomain is unreachable or permanently redirects to production. Keep `classic.brishavrajbahak.com.np` available as the legacy reference site.

## Content policy

Published numbers include their cohort and denominator. The completed Loan Default Analysis, Financial Inclusion Gap Analysis and Loan Default Prediction projects each expose their repository-backed proof; the prediction project also links to its live Streamlit application. Resume actions remain hidden until a real PDF is configured. No stock or generated image may substitute for the required personal workspace photographs.

## License

This repository contains personal portfolio content. Reuse of the branding, writing, images or design requires permission.
