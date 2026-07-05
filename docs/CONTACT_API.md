# Contact API Notes

The browser never sends email directly. It sends JSON to `POST /api/v1/contact`, and the backend handles Turnstile verification plus email delivery.

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

Notes:

- `website` is a honeypot field and should stay empty
- `subject` is optional
- empty subjects are handled downstream as no-subject submissions

## Response behavior

| Status | Code | Meaning |
| --- | --- | --- |
| 200 | none | Message accepted. `autoReplySent` may still be `false`. |
| 400 | `VALIDATION_ERROR` | Invalid JSON, unsupported version, or bad fields. |
| 403 | `BOT_FAILED` | Turnstile failed or honeypot was filled. |
| 403 | `ORIGIN_NOT_ALLOWED` | Origin is not in `ALLOWED_ORIGINS`. |
| 429 | `RATE_LIMITED` | Too many requests from one IP in the active window. |
| 500 | `SERVER_ERROR` | Notification delivery failed. |

## Rate limiting

The real production path uses the Durable Object binding.

There is also a local fallback map in the Worker. That fallback is isolate-local only. It is useful for local execution and as a temporary safety net, but it is not distributed protection across Cloudflare isolates.

## Versioning

I want to keep v1 stable. If I ever need new mandatory fields or different semantics, I should add `/api/v2/contact` rather than mutate the current contract in place.
