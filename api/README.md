# `/api` — Vercel serverless functions

Public REST API for the AAIndex databases. Each `.ts` file is one Vercel
function; the filename is the route (`api/search.ts` → `/api/search`,
`api/aaindex1/[accession].ts` → `/api/aaindex1/{accession}`). All endpoints are
GET-only, CORS-open, and cached at the edge for a day on 200 responses.

## Files

| File | Route | Purpose |
|---|---|---|
| `index.ts` | `/api` | Overview: databases, endpoints, record counts (derived from bundled data) |
| `openapi.ts` | `/api/openapi` | OpenAPI 3 document generated from `src/lib/apiSpec.ts` |
| `search.ts` | `/api/search` | Cross-database full-text search, hits tagged with source DB |
| `aaindex1.ts` / `aaindex2.ts` / `aaindex3.ts` | `/api/aaindexN` | List/filter a database |
| `aaindexN/[accession].ts` | `/api/aaindexN/{accession}` | Single record |
| `window.ts` | `/api/window` | Sliding-window property profile over a sequence |
| `sequence.ts` | `/api/sequence` | Sequence composition / summary stats |
| `encode.ts` | `/api/encode` | Encode a sequence as an index-derived feature vector |
| `aaindex-updated.ts` | `/api/aaindex-updated` | Data provenance / last-updated info |
| `pubmed/[pmid].ts` | `/api/pubmed/{pmid}` | Proxied PubMed abstract lookup |
| `_helpers.ts` | — | Shared CORS/cache/405 headers and `?format=csv\|tsv` parsing |

Files prefixed with `_` are not routed by Vercel.

## Conventions

- **Data source**: the same JSON in `src/data/` the frontend uses — no database,
  no build step, no drift between UI and API.
- **Shared logic**: encoders live in `src/lib/seqUtils.ts` and the CSV writer in
  `src/lib/csv.ts`, imported by both the browser and these functions. Note the
  `.js` extensions on relative imports — required for Node ESM.
- **Spec**: `src/lib/apiSpec.ts` is the single source of truth for the documented
  surface; both `/api/openapi` and the in-app API reference page render from it.
- **Errors**: 400 for bad params, 404 for unknown accessions, 405 for non-GET.
  Caching headers are only set on success paths, so a transient upstream failure
  is never cached.

Tests live in `tests/unit/api/`.
