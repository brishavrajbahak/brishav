# Deploy to Cloudflare Pages

## Pages Project

- Project name: `brishav-portfolio`
- Output directory: `public`
- Root directory: `/`
- Build command in Cloudflare Pages: leave empty if built assets are committed

## Required Order

Deploy the Durable Object worker first:

```powershell
npx wrangler deploy --config workers/contact-rate-limiter/wrangler.toml
```

Then deploy the site:

```powershell
npm run build
npx wrangler pages deploy public --project-name=brishav-portfolio --branch=main
```

## Turnstile

- Put the public site key in [`public/assets/js/config.public.js`](/D:/tr/public/assets/js/config.public.js)
- Put the secret key in Cloudflare Pages secrets as `TURNSTILE_SECRET_KEY`

## Email

Required secret:

- `RESEND_API_KEY`

Plain-text config remains in [`wrangler.toml`](/D:/tr/wrangler.toml).

## Optional Analytics

If Cloudflare Web Analytics is enabled for the site, place the public token in:

- [`public/assets/js/config.public.js`](/D:/tr/public/assets/js/config.public.js)

That token is public and does not belong in a secret manager.

## Preview Deploys

For the advanced branch:

```powershell
npm run preview
```

The GitHub Actions workflow also builds and attempts preview deployment when secrets are available.
