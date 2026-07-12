# Changelog

All notable changes to this project are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Security

- **Response security headers** — added `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-XSS-Protection: 1; mode=block` to all routes via `vercel.json` headers config.
- **`/api/encode` DoS mitigation** — when no `accessions` array is supplied in the POST body the endpoint now defaults to the first **50** AAIndex1 records instead of all 566. This caps the maximum default response at ~50 KB rather than ~5 MB. Callers who need more records can supply an explicit `accessions` list (up to the full 566).
- **PubMed proxy cache size cap** — the in-memory abstract cache in `api/pubmed/[pmid].ts` now evicts the oldest entry via LRU when the map reaches 500 items, preventing unbounded memory growth in long-lived serverless instances.

### Added

- **`GET /api/search` cross-database search endpoint** (`api/search.ts`) — full-text search across aaindex1, aaindex2, and aaindex3 in a single request. Matches the `q` term against accession codes and descriptions and tags each hit with its source `database`, removing the need for clients to query the three list endpoints and merge results. Supports `limit`/`offset` pagination. Documented in the in-app API Reference and covered by `tests/unit/api/search.test.ts`.
- **Explorer URL persistence** — the search query (`q`), active database (`db`), category filter (`cat`), and page number (`page`) are now reflected in the URL as query parameters and hydrated on load. Explorer views can be bookmarked and shared as direct links.
- **App-level `ErrorBoundary`** (`src/components/ErrorBoundary.tsx`) — wraps the entire application so that uncaught render errors produce a "Something went wrong / Try again" recovery screen instead of a blank white page.
- **Rejected sequence reporting in Encode** — the FASTA and plain-text parsers now track sequences that were silently skipped during upload. When rejections occur, an amber warning panel lists each skipped entry with its ID and the specific reason (empty body, no standard amino acid characters found, or the exact unexpected characters encountered). The panel is also cleared when the loaded file is removed.
- **Shared `RecordSelector` component** (`src/components/RecordSelector.tsx`) — the record-filter listbox that previously existed as an identical private function in both `Encode.tsx` and `SequenceAnalysis.tsx` is now a single shared component imported by both pages.

### Changed

- **`Visualiser` lazy-loads AAIndex2/AAIndex3 data** — `aaindex2.json` and `aaindex3.json` are no longer eagerly imported at the module level. They are fetched dynamically the first time the user switches to the Matrix heatmap chart type. This reduces the initial JavaScript bundle by approximately 30% for users who only use the bar/radar/scatter charts.
- **`SearchBar` is now a fully controlled input** — replaced the uncontrolled `defaultValue` + `document.querySelector` clear-button pattern with a `useState`/`useEffect`-managed controlled input. The clear button now reliably resets only the search bar regardless of other text inputs on the page.

### Fixed

- **`statsUtils.ts` was missing** — `tests/unit/statsUtils.test.ts` imported `categoryStats` from `src/lib/statsUtils` which did not exist, causing the entire test suite to fail with a module-not-found error on start-up. The file has been created with a correct implementation.
- **`exportMatrixAsCSV` crash on empty matrix** — `Object.keys(matrix[rows[0]])` would throw `TypeError` when called with an empty matrix object. A guard now returns early when `rows.length === 0`.
- **`exportComparisonAsCSV` crash on missing accession** — `Object.keys(records[accessions[0]])` would throw when the first accession was absent from the records map. A guard now returns early when `accessions` is empty or `records[accessions[0]]` is undefined.
- **CSV formula-injection quoting** — `exportComparisonAsCSV` now wraps cell values that contain commas, double-quotes, newlines, or formula-trigger characters (`=`, `+`, `-`, `@`, `|`) in double-quotes, preventing spreadsheet formula injection when exported CSVs are opened in Excel or Google Sheets.
- **`Visualiser.downloadPNG` silent failure** — the `<a>` element created for the PNG download was never appended to the DOM before `.click()` was called. Firefox ignores detached-element clicks; the element is now briefly appended and then removed, matching the correct browser download pattern.
- **Dead `useRef` in `SequenceAnalysis.EncoderTab`** — `const ref = useRef<HTMLDivElement>(null)` was declared and assigned to a `<div>` but never read or consumed. The declaration, `useRef` import, and `ref={ref}` attribute have been removed.
- **Explorer lazy DB load race condition** — rapidly switching databases (e.g. aaindex1 → aaindex2 → aaindex1 before the import resolved) could leave `lazyLoading` stuck as `true` and set stale data. The effect cleanup now sets a `cancelled` flag so stale `.then()` callbacks are discarded.
- **`PropertyScatter` shape prop typed as `any`** — replaced `props: any` with an explicit inline interface `{ cx?: number; cy?: number; payload?: { aa: string } }`, restoring type safety.

### Tests

- Added `tests/unit/api/search.test.ts`: covers the `/api/search` endpoint — required-`q` 400, cross-database hits, per-record `database` tagging, case-insensitive matching, accession-code matching, `limit`/`offset` pagination, empty-result handling, and 405/204/CORS behaviour.
- Updated `tests/unit/api/encode.test.ts`: two tests that expected 566 default-encoded accessions now correctly expect 50, matching the new cap.
- Added `tests/unit/exportUtils.test.ts`: crash-guard tests for `exportComparisonAsCSV` (empty array, missing record) and `exportMatrixAsCSV` (empty matrix); CSV quoting tests for accessions containing commas or formula characters.
- Added `tests/integration/Encode.test.tsx`: tests for rejected-sequence display (panel shown with reasons, count, cleared on remove), and clear-button behaviour (restores empty state, clears rejected panel).
