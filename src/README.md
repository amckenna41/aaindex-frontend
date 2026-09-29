# `/src` — React frontend

Vite + React 18 + TypeScript SPA. Entry point is `main.tsx` → `App.tsx`, which
holds the router; every route except the Explorer is lazy-loaded behind
`<Suspense>`.

## Layout

```
main.tsx        Mount point
App.tsx         Routes + ErrorBoundary
index.css       Global styles / Tailwind layer
components/     Reusable UI, incl. layout/ (Layout, Navbar) and sequence/
                (the lazy-loaded Hydrophobic Moment, Pairwise Alignment and
                Contact Energy tabs of the Sequence Analysis page)
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
| `/sequence` | `SequenceAnalysis.tsx` — six tabs; the three matrix/moment tabs live in `components/sequence/` |
| `/encode` | `Encode.tsx` |
| `/similarity` | `Similarity.tsx` — PCA over the whole database |
| `/about`, `/guide`, `/api-reference` | Static docs pages |

Unknown paths redirect to `/explorer`.

## `lib/` — where the actual work happens

Keep logic here, not in components: it stays testable without a DOM and, for a
few modules, runs unchanged inside the serverless functions.

- `search.ts` — Fuse.js full-text search
- `seqUtils.ts` — sequence parsing, encoders, hydrophobic moment, composition and `regionsAbove` (runs over a
  threshold, for the sliding-window cutoff); **shared with `api/window.ts`**,
  so it is deliberately dependency-free
- `statsUtils.ts` — fold-based min/max/summary stats (avoids `Math.min(...xs)`
  blowing the argument limit on long sequences)
- `pca.ts` — dependency-free 20×20 Jacobi eigendecomposition for the similarity view
- `pysar.ts` — PySAR-style descriptors
- `csv.ts` — CSV/TSV writer, shared with the API. Text a spreadsheet would run as a formula (leading
  `=`, `+`, `-`, `@`, tab, CR) gets a `'` prefix — quoting alone does not stop Excel evaluating it
- `exportUtils.ts` — browser download helpers (file-saver)
- `chartExport.ts` — chart SVG/PNG export (serialises the Recharts SVG; PNG via canvas)
- `matrixUtils.ts` — AAIndex2 alignment (Gotoh, global/local, distance matrices scored as mean − value)
  and AAIndex3 contact profile; dependency-free like `seqUtils`
- `apiSpec.ts` — single source of truth for the public API, rendered by the API
  reference page and served by `/api/openapi`
- `snippets.ts` — curl / Python / R example calls built from `apiSpec.ts`
- `citation.ts` — parses AAIndex's free-text references and builds BibTeX, RIS, APA 7 and
  plain-text citations; books and chapters fall back to the raw text
- `aaindexFormat.ts`, `aminoAcids.ts`, `categories.ts` — canonical orderings,
  labels, badge colours and per-record `coverage`
- `useUrlParam.ts` — keeps page state in the query string so any analysis is a link

## Conventions

- State that must survive navigation or be shared across pages goes in
  `store/useAAIndexStore.ts`; everything else stays local. Limits shared by
  several components (e.g. `MAX_COMPARE`) are exported from the store too.
- `data/*.json` is the single dataset for both the UI and the API — never fork it.
- Charts use Recharts; components under `components/` should stay presentational.

Tests: `tests/unit/` for `lib/` and `store/`, `tests/integration/` for pages and
components.
