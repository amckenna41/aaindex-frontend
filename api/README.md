# `/api` — Vercel serverless functions

Public REST API for the AAIndex databases. Each `.ts` file is one Vercel
function and the filename is the route (`api/search.ts` → `/api/search`). The
exception is `db.ts`: rewrites in `vercel.json` send all six
`/api/aaindex{1,2,3}[/{accession}]` URLs to it, which keeps the deployment under
the Hobby plan's 12-function limit. Every endpoint is GET-only except
`POST /api/encode`; all are CORS-open, and 200 responses are cached at the edge
for a day.

## Files

| File | Route | Purpose |
|---|---|---|
| `index.ts` | `/api` | Overview: databases, endpoints, record counts (derived from bundled data) |
| `openapi.ts` | `/api/openapi` | OpenAPI 3.1 document generated from `src/lib/apiSpec.ts` |
| `search.ts` | `/api/search` | Cross-database full-text search, hits tagged with source DB |
| `db.ts` | `/api/aaindexN`, `/api/aaindexN/{accession}` | List/filter a database, or return one record |
| `window.ts` | `/api/window` | Sliding-window property profile over a sequence |
| `sequence.ts` | `/api/sequence` | Fetch a sequence by UniProt accession or PDB id (optional chain, e.g. `1CRN_A`) |
| `encode.ts` | `POST /api/encode` | Encode a sequence against up to 50 aaindex1 indices |
| `aaindex-updated.ts` | `/api/aaindex-updated` | Upstream "last updated" date from genome.jp |
| `pubmed/[pmid].ts` | `/api/pubmed/{pmid}` | Proxied PubMed abstract lookup |
| `_helpers.ts` | — | Shared CORS/cache/405 headers, `?format=csv\|tsv` handling, and `API_VERSION` / `USER_AGENT` (read from `package.json`) |

Files prefixed with `_` are not routed by Vercel.

## Conventions

- **Data source**: the same JSON in `src/data/` the frontend uses — no database,
  no build step, no drift between UI and API.
- **Shared logic**: encoders live in `src/lib/seqUtils.ts` and the CSV writer in
  `src/lib/csv.ts`, imported by both the browser and these functions. Note the
  `.js` extensions on relative imports — required for Node ESM.
- **Spec**: `src/lib/apiSpec.ts` is the single source of truth for the documented
  surface; `/api/openapi`, the in-app API reference and its curl/Python/R examples
  all render from it.
- **Version**: never hardcode it — use `API_VERSION` from `_helpers.ts`, and
  `USER_AGENT` for every upstream request.
- **Upstream parsing**: `sequence.ts` reads RCSB headers as pipe-delimited
  (`1CRN_1|Chains A, B[auth C]|…`) and matches a requested chain against both label
  and author ids (`pdbChains`); `pubmed/[pmid].ts` takes the year from `<PubDate>`,
  not the first `<Year>` (which is usually `DateCompleted`).
- **Errors**: 400 for bad params, 404 for unknown accessions, 405 for the wrong
  method. Caching headers are only set on successful GETs, so a transient
  upstream failure is never cached.

Tests live in `tests/unit/api/`.
