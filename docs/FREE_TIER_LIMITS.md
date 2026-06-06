# Free Tier Limits

This setup is designed for `$0/month` portfolio traffic.

| Service | Use | Practical limit |
| --- | --- | --- |
| Cloudflare Pages | Static hosting and CDN | Free for this portfolio use case |
| Pages Functions | `/api/v1/contact` | Free daily request quota is enough for portfolio traffic |
| Turnstile | Bot check | Free |
| Resend | Notification and auto-reply emails | Plan assumes roughly 2 emails per valid contact submission |

With auto-reply enabled, each contact submission sends two emails: one owner notification and one visitor reply. Disable auto-reply through `AUTO_REPLY_ENABLED=false` if you need to reduce email volume.
