# Contact API v1

Endpoint: `POST /api/v1/contact`

The browser sends JSON only. The frontend never sends email directly and never contains Resend or Turnstile secret keys.

## Request

```json
{
  "version": 1,
  "turnstileToken": "<token from Cloudflare Turnstile>",
  "payload": {
    "name": "Visitor Name",
    "email": "visitor@example.com",
    "subject": "Project idea",
    "message": "Message body",
    "website": ""
  }
}
```

`website` is a honeypot field and must be empty.

`subject` is optional. An empty subject is accepted and falls back to the existing server-side notification subject default.

## Responses

| Status | Code | Meaning |
| --- | --- | --- |
| 200 | none | Message accepted. `autoReplySent` may be `true` or `false`. |
| 400 | `VALIDATION_ERROR` | Invalid JSON, unsupported version, or invalid fields. |
| 403 | `BOT_FAILED` | Turnstile failed or honeypot was filled. |
| 403 | `ORIGIN_NOT_ALLOWED` | Origin is not in `ALLOWED_ORIGINS`. |
| 429 | `RATE_LIMITED` | More than 5 requests per minute from one IP. |
| 500 | `SERVER_ERROR` | Notification email failed. |

## Versioning

Keep optional additions inside `payload.metadata` first. If a future change requires new mandatory fields or changes response semantics, add `/api/v2/contact` instead of changing v1 in place.
