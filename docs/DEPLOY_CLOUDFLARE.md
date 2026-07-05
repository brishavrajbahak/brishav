# Cloudflare Deploy Notes

This is the deployment order I use for this project.

## Project

- Pages project: `brishav-portfolio`
- output directory: `public`
- repo-local Wrangler comes from `package.json`

## Deploy order

Deploy the Durable Object worker first:

```powershell
npx wrangler deploy --config workers/contact-rate-limiter/wrangler.toml
```

Then deploy the site:

```powershell
npm run build
npx wrangler pages deploy public --project-name=brishav-portfolio --branch=main
```

## Preview deploy

For the advanced branch:

```powershell
npm run preview
```

The GitHub Actions workflow also builds the branch and can deploy a preview when the Cloudflare token is available.

## Turnstile

- public site key: [`public/assets/js/config.public.js`](/D:/tr/public/assets/js/config.public.js)
- secret key: Cloudflare Pages secret `TURNSTILE_SECRET_KEY`

If the Pages preview hostname is not in the Turnstile allowlist, I use the production domain for the full contact-form regression and note that in the PR.

## Email

Required secret:

- `RESEND_API_KEY`

## What I verify after deploy

- desktop terminal
- mobile Demo Mode
- mandala rendering
- playground datasets and analyze route
- analytics events
- contact form on an allowed hostname
