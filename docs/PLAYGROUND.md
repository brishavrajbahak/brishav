# Playground Notes

I built the playground to show how I frame analysis, not to pretend I have a live AI system behind the site.

## What it is

The playground is a curated demo layer with three fixed datasets:

- `tourism`
- `loan-risk`
- `remittance`

Each one exists to show a different analysis style:

- tourism: recovery and commercial signal framing
- loan risk: pressure, default, and early intervention logic
- remittance: dependency, channel quality, and resilience framing

## Why it is fixed

I kept the dataset list fixed because that gives me three advantages:

- the API is much easier to harden
- the outputs stay deterministic
- I can explain every chart and every summary line without hand-waving

That matters more to me than adding uploads just to make the feature look bigger.

## Endpoints

- `GET /api/v1/playground/datasets`
- `POST /api/v1/playground/analyze`

Example request:

```json
{
  "version": 1,
  "datasetId": "loan-risk",
  "analysisType": "overview"
}
```

Supported analysis types:

- `overview`
- `distribution`
- `trend`

## What the response contains

The analyze route returns:

- dataset metadata
- summary text
- one polished surprise insight
- metric cards
- chart-ready payloads
- mandala focus node IDs
- records for CSV export

## Hardening expectations

The analyze route is intentionally narrow:

- fixed dataset allowlist
- fixed analysis-mode allowlist
- origin checks
- JSON-only requests
- predictable error responses
- Durable Object-backed rate limiting when available

## How I verify it

I do not treat local static serving as enough. I verify the playground on the actual Cloudflare Pages preview URL, including:

- dataset catalog load
- analyze requests
- modal behavior
- analytics events
- mobile Demo Mode access
