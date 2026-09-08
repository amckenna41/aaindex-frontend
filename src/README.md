# `/src` — React frontend

Vite + React 18 + TypeScript SPA. Entry point is `main.tsx` → `App.tsx`, which
holds the router; every route except the Explorer is lazy-loaded behind
`<Suspense>`.

## Layout

```
main.tsx        Mount point
App.tsx         Routes + ErrorBoundary
index.css       Global styles / Tailwind layer
components/     Reusable UI, incl. layout/ (Layout, Navbar)
pages/          One file per route
lib/            Pure logic — no React, unit-tested directly
store/          Zustand global state (useAAIndexStore)
data/           Bundled aaindex1/2/3 JSON — also read by /api
types/          Shared TypeScript types
```

## Routes → pages

| Route | Page |
|---|---|
| `/explorer` (default) | `Explorer.tsx` — search, filter, browse records |
| `/records/:accession` | `RecordDetail.tsx` |
| `/compare` | `Comparator.tsx` |
| `/visualise` | `Visualiser.tsx` |
| `/sequence` | `SequenceAnalysis.tsx` |
| `/encode` | `Encode.tsx` |
| `/similarity` | `Similarity.tsx` — PCA over the whole database |
| `/about`, `/guide`, `/api-reference` | Static docs pages |

Unknown paths redirect to `/explorer`.

## `lib/` — where the actual work happens

Keep logic here, not in components: it stays testable without a DOM and, for a
few modules, runs unchanged inside the serverless functions.

- `search.ts` — Fuse.js full-text search
- `seqUtils.ts` — sequence parsing and encoders; **shared with `api/window.ts`**,
  so it is deliberately dependency-free
- `statsUtils.ts` — fold-based min/max/summary stats (avoids `Math.min(...xs)`
  blowing the argument limit on long sequences)
- `pca.ts` — dependency-free 20×20 Jacobi eigendecomposition for the similarity view
- `pysar.ts` — PySAR-style descriptors
- `csv.ts` — CSV/TSV writer with formula-injection escaping, shared with the API
- `exportUtils.ts` — browser download helpers (file-saver, html2canvas)
- `apiSpec.ts` — single source of truth for the public API, rendered by the API
  reference page and served by `/api/openapi`
- `aaindexFormat.ts`, `aminoAcids.ts`, `categories.ts` — canonical orderings,
  labels and badge colours
- `useUrlParam.ts` — keeps page state in the query string so any analysis is a link

## Conventions

- State that must survive navigation or be shared across pages goes in
  `store/useAAIndexStore.ts`; everything else stays local.
- `data/*.json` is the single dataset for both the UI and the API — never fork it.
- Charts use Recharts; components under `components/` should stay presentational.

Tests: `tests/unit/` for `lib/` and `store/`, `tests/integration/` for pages and
components.
