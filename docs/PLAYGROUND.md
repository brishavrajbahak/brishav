# Playground

## Purpose

The Advanced V1 playground is a curated demo layer that shows how Brishav frames signal, summary metrics, and reporting-ready conclusions without relying on opaque AI output.

## Scope

Advanced V1 keeps the playground intentionally narrow:

- exactly three datasets
- no uploads
- no persistence
- no R2
- no D1
- no Workers AI
- no PDF export

## Datasets

- `tourism`
- `loan-risk`
- `remittance`

Each dataset is stored statically in:

- [`public/assets/data/demo`](/D:/tr/public/assets/data/demo)

## Endpoints

- `GET /api/v1/playground/datasets`
- `POST /api/v1/playground/analyze`

### Analyze request

```json
{
  "version": 1,
  "datasetId": "loan-risk",
  "analysisType": "overview"
}
```

### Supported analysis types

- `overview`
- `distribution`
- `trend`

## Response shape

The analyze endpoint returns:

- dataset descriptor
- summary text
- surprise insight
- metric cards
- chart-ready payloads
- mandala focus node IDs
- full dataset records for CSV export

## Hardening

The analyze route follows the existing API patterns:

- origin checks
- controlled input validation
- Durable Object-backed request limiting
- predictable JSON errors

## Verification Notes

- Validate the playground catalog and analyze routes on the Cloudflare Pages preview URL, not only through local static serving.
- Confirm analytics events tied to playground open and analyze actions through the browser network tab or Cloudflare logs.

## V2 Roadmap

Potential future additions:

- upload support
- persisted results
- Workers AI summaries
- richer chart comparisons
- export variants beyond CSV
