# Changelog

All notable changes to this project are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.3.1] — 2026-09-29

### Added

- **Sliding Window: threshold line.** A dashed cutoff on the smoothed profile; every run of positions at or above it is shaded and listed with start, end, length and peak.
  - Kyte–Doolittle defaults to 1.6 — with a 19-residue window, the published cutoff for a likely transmembrane helix — with a note saying so. Other scales start at their own mean.
  - Type any value, or untick "Threshold line" to hide it. The setting is kept in the URL (`?thr=`, `off` to hide); changing the index resets a typed value to that scale's default.
  - The y-axis extends to the line, so it stays visible when no window reaches it.
  - The region logic is `regionsAbove()` in `src/lib/seqUtils.ts`.
- **API Reference: code examples.** Every endpoint shows a ready-to-run call in curl, Python (`requests`) and R (`httr2`), with a copy button. They are built from `src/lib/apiSpec.ts` by the new `src/lib/snippets.ts`, so they can't drift from the API.
- **API Reference: full-database downloads.** AAIndex1, 2 and 3 as JSON (every record with all its values) or as the AAIndex flat file. The data is imported only when a button is clicked, so it stays out of the page bundle.
- **Citations: RIS and a real APA 7.** A new `src/lib/citation.ts` parses AAIndex's free-text references (`Authors 'Title' Journal Vol, pages (Year)`) — 706 of 707 records.
  - **RIS** imports into Zotero, EndNote and Mendeley.
  - **APA** used to repeat the raw reference; it is now proper APA 7 with a PubMed link.
  - **BibTeX** now carries author, journal, volume and pages (`--` range), and uses `@misc` for books.
  - Books and chapters don't match the journal pattern: APA shows them as written, and RIS types them `GEN` with the full reference kept as a note.
  - Each format can be downloaded (`.bib`, `.ris`, `.txt`) as well as copied.
- **Guide: "Back to top" button** at the end of the page (hidden when printing).

### Fixed

- **Spreadsheet formula injection.** `csvCell` only quoted cells starting with `=`, `+`, `-` or `@`, and Excel still evaluates a quoted formula. Such text — and text starting with a tab or carriage return — now gets a `'` prefix. This mattered because a shared Encode link sets the sequence ID (`?id=`) that goes into the exported CSV. The API's `?format=csv|tsv` output uses the same function.
- **PubMed year** came from the first `<Year>` in the record, usually `DateCompleted` (when NLM indexed the paper). It now comes from `<PubDate>`, including free-text dates such as "1998 Dec-1999 Jan".
- **`/api/sequence` with PDB ids:**
  - RCSB headers (`1CRN_1|Chain A|CRAMBIN|…`) were split on whitespace, so the returned `id` was `1CRN_1|Chain`. They are now split on `|`.
  - Chain selection matched any word in the description, so asking for chain C also matched "Protein kinase C". It now matches the chain ids only, both label and author (`B[auth C]`).
- **Favourites with blocked storage.** Saving to `localStorage` wasn't guarded, so where storage is blocked (e.g. some embedding iframes) or full, the star did nothing. It now toggles; the choice just doesn't survive a reload.
- **Social previews** pointed at an SVG, which Twitter/X, Facebook, LinkedIn and Slack don't display. `public/og.png` (1200×630, rendered from `og.svg`) is used instead, with width/height tags.
- **`/api/encode`:** accessions are looked up with `Object.hasOwn` (not `in`, which also sees inherited keys) and de-duplicated, and the POST response no longer sends a `Cache-Control` header that CDNs ignore.

### Security

- **Content-Security-Policy and Permissions-Policy** on every route. Scripts are limited to the site plus the inline theme bootstrap, allowed by its SHA-256 hash; connections, images and fonts are limited to the site. Framing is still denied everywhere except `/records/`.
- **`X-XSS-Protection` removed.** It is deprecated and ignored by current browsers.
- **CI pins what it runs:** GitHub Actions to commit SHAs, and the deploy to `vercel@61.0.0` instead of `vercel@latest`.

### Changed

- **Node 24.** CI moved from Node 20, which Vercel deprecates on 1 October 2026, and `package.json` declares `"engines": { "node": "24.x" }` so Vercel runs the same version.
- **API version and User-Agent come from `package.json`.** `API_VERSION` and `USER_AGENT` in `api/_helpers.ts` replace the hardcoded `1.3.0` in `/api` and `/api/openapi` and three different User-Agent strings (1.0 / 1.1).

### Documentation

- **In-app guide:**
  - Section 3's Sliding Window steps describe the threshold line.
  - Section 9's export table adds the whole-database JSON and the citation downloads, and credits the flat file to About / API Reference rather than Explorer.
  - Section 10's URL table adds `thr`.
  - Section 11 gains "Code examples" and "Downloading the full database".
  - Section 12 gains "Citing an individual record".
- **About page:** the feature list covers the threshold line and the citation formats; the API and download sections point to the code examples and JSON downloads.
- **README:** features and API sections updated for the above.
- **`api/README.md`:** the file table was stale. It listed per-database files that were merged into `db.ts`, described `/api/sequence` as composition stats, and said every endpoint was GET-only. It now matches the code and documents `API_VERSION` / `USER_AGENT` and the upstream-parsing rules.
- **`src/README.md`:** documents `citation.ts`, `snippets.ts`, `regionsAbove` and the new CSV escaping.
- **`public/README.md`:** documents `og.png` and that it is rendered from `og.svg`.
- **`tests/README.md`:** describes what `config.test.ts` guards.

### Tests

- 100 more vitest tests than before this work (585 → 685), all passing alongside the 27 Playwright e2e tests, `tsc`, `eslint` and a production build. The production build was also served with the real `vercel.json` headers and every page loaded with no CSP violations or console errors.
- New: `tests/unit/citation.test.ts`, `tests/unit/snippets.test.ts`, `tests/unit/api/pubmed.test.ts` and `tests/integration/CitationHelper.test.tsx`.
- `tests/unit/csv.test.ts`, `exportUtils.test.ts` and `hardening.test.tsx` now expect the `'` prefix; a formula character mid-cell is still only quoted.
- `tests/unit/api/sequence.test.ts`: a clean RCSB entity id, chain selection by label or author id without matching the molecule name, and `pdbChains`.
- `tests/unit/api/encode.test.ts`: de-duplication, inherited keys rejected, no `Cache-Control` on POST.
- `tests/unit/seqUtils.test.ts`: `regionsAbove`.
- `tests/integration/SequenceAnalysis.test.tsx`: the Kyte–Doolittle default, threshold edits, and hiding the line.
- `tests/integration/docs.test.tsx`: the API Reference code examples and the full-database JSON download.
- `tests/unit/store.test.ts`: favourites toggle when storage throws.
- `tests/unit/config.test.ts`: the CSP carries the inline script's hash, never allows `'unsafe-inline'` scripts and denies framing; `X-XSS-Protection` is gone; `og:image` is an existing PNG; CI pins actions and the Vercel CLI and runs the Node major in `engines`.

---

## [1.3.0] — 2026-09-28

### Added

- **Sequence Analysis: three new tabs.** The AAIndex2 and AAIndex3 matrices were browsable but never applied to a sequence.
  - **Hydrophobic Moment** — helical wheel (up to 18 residues, coloured by value, arrow along the moment) plus a sliding-window μH / ⟨H⟩ profile; α-helix, 3₁₀-helix and β-strand periodicities.
  - **Pairwise Alignment** — global (Needleman–Wunsch) or local (Smith–Waterman) alignment with affine gaps (Gotoh) against any complete AAIndex2 matrix. Gap defaults scale to each matrix's spread, because AAIndex matrices use different units (its BLOSUM62 spans −6..16). Distance matrices (Grantham, Miyata…) are detected and scored as mean − value, which the user can override. Verified against the Durbin et al. textbook example (global 1, local 28).
  - **Contact Energy** — mean AAIndex3 contact value over all residue pairs, a per-residue profile and a ranking by residue type. This is labelled as a sequence-only estimate, since there is no structure.
  - Each tab is lazy-loaded, so the AAIndex2/3 data downloads only when its tab is opened.
- **Explorer sorting** — by accession, description, category or missing amino acids, synced to `?sort=`.
- **Encode: amino-acid composition panel** for the previewed sequence.
- **Visualiser: SVG export** alongside PNG.
- **Compare: colour legend** for the highest/lowest values per amino acid.
- **Encode: the selected example stays highlighted.**

### Changed

- **Chart PNG export no longer uses `html2canvas`** (about 200 kB of shipped output). `src/lib/chartExport.ts` serialises the chart's own SVG, redraws the HTML legend inside it, and rasterises through a canvas at 2×.
- **The compare limit lives in one place** (`MAX_COMPARE` in the store); the guide and About page read it too.

### Removed

- **The fixed compare drawer at the bottom of the screen.** The navbar's Compare badge and the Compare page's own controls cover it. The guide's steps that described the drawer were rewritten.

### Documentation

- **In-app guide:**
  - Section 2 gains "Sorting results".
  - Section 3 now describes six tabs, with new subsections for Hydrophobic Moment, Pairwise Alignment and Contact Energy.
  - Section 4 covers the Examples list and the composition panel.
  - Section 6 and the export table list SVG export and the 2× PNG with its legend.
  - The "What each page captures" table adds `sort` (Explorer) and `angle`, `seqA`, `seqB`, `mat`, `mode`, `cmat` (Sequence Analysis).
- **Guide corrections:** "Reading the comparison table" described per-column blue/red colouring and header-click sorting, neither of which exists. It now describes the per-row green/red highlighting and its legend. The toggle's name is also fixed ("z-score normalise").
- **README and About page:** the feature lists cover sorting, the three new Sequence tabs, the composition panel, the Compare legend and PNG/SVG export. A stray typo in the README intro ("suCENbstitution") is fixed.
- **`src/README.md`:** documents `components/sequence/`, `matrixUtils.ts`, `chartExport.ts`, the new `seqUtils` functions, `coverage` in `aminoAcids.ts`, and `MAX_COMPARE` living in the store. The html2canvas mention is removed.

### Tests

- 38 more vitest tests than before this work (547 → 585), all passing alongside the 27 Playwright e2e tests, `tsc`, `eslint` and a production build.
- `tests/unit/matrixUtils.test.ts`:
  - The Durbin et al. global (1) and local (28, AWGHE / AW-HE) alignments.
  - Self-alignment, a preference for one long gap, and alignment against an empty sequence.
  - Distance-matrix detection, and a non-empty local alignment under Grantham.
  - `isComplete`, `defaultGaps` and `cleanSequence`.
  - `contactProfile` checked against a brute-force O(n²) average.
- `tests/unit/seqUtils.test.ts`:
  - `hydrophobicMoment`: μ = 1 for alternating ±1 at 180°, zero for a uniform full turn, and missing values skipped.
  - `momentProfile`: edge windows are left empty.
  - `composition`.
- `tests/unit/chartExport.test.ts`:
  - The plot SVG is exported, not a legend icon.
  - The export has a background and `xmlns`.
  - The HTML legend is redrawn inside the SVG, including the fallback to a stroke-only icon's colour.
- `tests/unit/aminoAcids.test.ts`: `coverage`.
- `tests/unit/store.test.ts`: the cap follows `MAX_COMPARE`.
- `tests/unit/config.test.ts`: html2canvas must not be declared at all (this replaces the B2 check that it was a runtime dependency).
- Integration:
  - **Explorer:** `?sort=` hydrates alongside `?page=`, the missing-amino-acid sort puts sparse indices first, and changing the sort resets to page 1.
  - **Sequence Analysis:** each new tab renders, local mode changes the alignment, and the 2,000-residue cap is enforced.
  - **Encode:** composition counts, and the example highlight follows the loaded example and clears on upload.
  - **Compare:** the legend appears only for two or more records, and the z-score hint appears only for raw values.
  - **Visualiser:** the SVG button.
  - **Layout:** no compare drawer renders while records are queued.

---

## [1.2.0] — 2026-09-04

Audit remediation: 6 security findings, 8 bugs, 1 dependency advisory, plus the
features the audit identified as closing the gap between the API and the UI.

### Security

- **CSV formula injection through uploaded FASTA headers (S1)** — `csvCell()` existed and was correct but was only applied to one header row; every data-row builder interpolated values straight into a template literal. The sanitiser now lives in `src/lib/csv.ts` and every row builder routes through it: `Encode.exportLongCSV`, `Encode.exportSummaryCSV`, `seqUtils.exportEncodingAsCSV`, `exportValuesAsCSV`, `exportMatrixAsCSV`, the pySAR export, and the API's `?format=csv|tsv` responses. Numbers pass through unquoted so numeric exports are unchanged.
- **Unbounded work in `POST /api/encode` (S2)** — the `accessions` array had no length limit, so one request could build ~5.7 M objects. It is now capped at 50 — the same number already used as the implicit default — and anything larger is rejected with a 400.
- **Every error response cached at the edge for 24 hours (S3)** — `setCorsHeaders()` set `Cache-Control: s-maxage=86400` before any validation ran, so 400s, 404s, 405s and transient 502s all inherited a day-long CDN cache. Caching is now `setCacheHeaders()`, a separate call made only on 200 paths across every handler.
- **Prototype keys bypassed the not-found guard (S4)** — `DB1[accession]` with a raw URL param returned an inherited `Object.prototype` member for `/records/constructor`, which is truthy, so `dbName` was set, the not-found branch never ran, and `AminoAcidBarChart` threw — replacing the whole page with the error screen. Record lookup now uses `Object.hasOwn`, in `RecordDetail` and in all three API accession endpoints.
- **Raw error internals returned to clients (S5)** — `String(e)` handed callers whatever the fetch layer threw, including upstream hostnames. `api/pubmed/[pmid].ts` and `api/aaindex-updated.ts` now log server-side and return a fixed message.
- **Regex backtracking and an unrestricted "Try it" box (S6)** — `parseLastUpdated`'s pattern had overlapping classes (`\s` inside `[^<]`) and backtracked badly on long input with no `<`; it is now linear. The API reference's "Try it" box fetched whatever URL was typed into it; it now resolves the input and refuses anything that is not this origin's own `/api/...` path.

### Fixed

- **The embed feature could not work (B1)** — `RecordDetail` shipped a "Get embed code" button while `vercel.json` set `X-Frame-Options: DENY` on every route, so any pasted snippet rendered a blank box. Framing is now denied everywhere *except* `/records/*`, which carries `Content-Security-Policy: frame-ancestors *` and keeps the other security headers.
- **`html2canvas` was a runtime import declared as a devDependency (B2)** — it is 202 kB of shipped output and worked only because Vercel installs dev dependencies at build time; any `npm ci --omit=dev` broke the build. Moved to `dependencies`.
- **Lazy-loading of aaindex2/aaindex3 was completely defeated (B3)** — `RecordDetail` statically imported all three databases and `App` statically imported `RecordDetail`, so Rollup hoisted 2.7 MB of JSON into the entry chunk and the Explorer's dynamic imports resolved to already-shipped modules. `RecordDetail` now locates a record by loading one database at a time; routes are `React.lazy`; and `manualChunks` emits a chunk per database. **Entry chunk: 1,051 kB → 23 kB (283 kB → 7.6 kB gzip).**
- **Deep-linked page number was silently discarded (B4)** — the hydration effect read `?page=3` and the separate `useEffect(() => setPage(1), [filtered])` overwrote it in the same commit, so `?page=N` never worked on first load. Fixing this properly needed three changes, the last two found by running the e2e suite against the real app:
  - The page reset is now keyed on the filter criteria actually changing, not on a first-render flag.
  - **`<StrictMode>` defeats first-render refs.** React replays mount effects with the *same closure*, so on the replay the "have I hydrated yet?" ref was already `false` and the effect took the sync branch with pre-hydration values — calling `setSearchParams({})` and wiping the **entire** query string, not just the page. `Explorer` and `Encode` now compare a snapshot of the synced state instead of a boolean, which is idempotent under replay. In production builds StrictMode does not double-invoke, which is why the audit saw only the page symptom.
  - **Hydration is not a filter change.** Applying `?q=` from the URL changed the filter key over the following commit and tripped the reset, discarding `?page=N` on any link that combined the two. The effect now ignores the convergence onto the criteria the URL asked for, and resets only on genuine user changes afterwards.
- **Dark mode reset on every reload (B5)** — the toggle initialised from a class nothing set before React mounted and never persisted. The choice is now stored in `localStorage`, defaults to `prefers-color-scheme`, and is applied by an inline script in `index.html` so there is no flash of the wrong theme.
- **Long sequences overflowed the call stack (B6)** — `Math.min(...nums)` spreads an unbounded array into `arguments` and throws `RangeError`. Added `minOf`/`maxOf` folds in `statsUtils` and used them in `Encode` and `SequenceAnalysis`; uploads are capped at 5 MB; and the sequence table renders in 200-row chunks instead of every row at once.
- **"Try again" did not recover (B7)** — the `ErrorBoundary` cleared `hasError` without resetting the route or remounting the subtree, so a deterministic render error re-threw immediately. Replaced with "Reload" and "Back to Explorer", both of which actually reset.
- **Two unvalidated assumptions (B8)** — favourites parsed from `localStorage` were trusted to be an array, so a tampered value threw at store-init time before the `ErrorBoundary` could catch it; there is now an `Array.isArray` guard that also drops non-string entries. `api/index.ts` hardcoded `count: 566 / 94 / 47`; the counts are now derived with `Object.keys(db).length`.

### Dependencies

- **`react-router-dom` 6.30.x → 7.18.x (D1)** — GHSA-jjmj-jmhj-qwj2 (CVE-2026-53668) covers 6.30.2–6.30.4 with no patched release on the 6.x line. Practical exposure was nil (declarative mode, no user-supplied redirect target), but the advisory would have kept firing. `@remix-run/router` is gone entirely on v7.

### Added

- **`GET /api/window`** — the Kyte–Doolittle-style sliding-window profile, previously browser-only, exposed as an endpoint (`accession`, `sequence`, `window`, `format`) so it can be scripted and cited.
- **`GET /api/sequence`** — fetch a protein sequence by UniProt accession or PDB id (chain suffix supported, e.g. `1CRN_A`), so an analysis no longer requires a FASTA file on hand. Wired into the Encode and Sequence Analysis pages as a "Fetch by accession" box.
- **`GET /api/openapi`** — an OpenAPI 3.1 description generated from `src/lib/apiSpec.ts`, the same source the API Reference page renders, so the two cannot drift apart.
- **Property-space view (`/similarity`)** — every aaindex1 record projected onto the first two principal components of its 20 amino-acid values, coloured by category, with live Pearson-correlation nearest neighbours for any pinned record. PCA is a dependency-free Jacobi eigendecomposition in `src/lib/pca.ts`. Unlike the per-record `correlation_coefficients`, this covers the whole database.
- **`?format=csv|tsv`** on `/api/aaindex1`, `/api/aaindex2`, `/api/aaindex3`, `/api/search` and `/api/window`.
- **Shareable analysis URLs** — Sequence Analysis (tab, sequence, index, window size, heatmap selection) and Encode (index, single sequence) now sync to the query string via a new `useUrlParam` hook, with a "Copy shareable link" button. Values too long for a URL fall back to local state.
- **pySAR bridge** — "pySAR descriptor set" export from the Encode page emits a dataset CSV plus a config JSON naming the AAIndex indices and embedding their values, ready for [pySAR](https://github.com/amckenna41/pySAR).
- **Coverage badges on the record list** — indices with gaps for particular amino acids now carry an amber `⚠ n/20` badge in the Explorer, so a sparse index is visible before you open it.
- **Open Graph and Twitter card tags** plus a generated `og.svg`, so shared links no longer render bare.
- **`robots.txt` and `sitemap.xml`** — the sitemap is generated at build time from the bundled data (717 URLs), so it cannot drift.

### Documentation

- **In-app guide** — added section 7 "Property Space — Whole-Database Similarity", section 10 "Sharing & Reproducibility" (which page captures which query parameters, plus the embed snippet), and section 11 "API Access". Existing sections now cover fetch-by-accession, the pySAR export, the upload cap and chunked table, the coverage badges, and the share-link buttons; the export table lists the pySAR set and the `?format=csv|tsv` responses.
- **About page** — the "Developer API (planned)" section described a FastAPI backend that was never built and advertised two endpoints (`/api/compare`, `/api/stats`) that do not exist. It now documents the API that actually shipped and links to the reference page and the OpenAPI document. Record counts are derived with `Object.keys(db).length` instead of the hardcoded 566 / 94 / 47 — the same drift B8 fixed in `api/index.ts`.
- **README** — added an API endpoint table, a documentation pointer section, the new features, React Router v7, and the sitemap step in the build command.
- **Consistent naming** — the similarity page is "Property Space" in its heading, the guide, the README and the e2e smoke test; the nav keeps the shorter "Similarity" label.

### Internal

- **Playwright pointed at the wrong application.** `playwright.config.ts` used Vite's default port 5173 with `reuseExistingServer`, so when any other project's dev server held that port the entire e2e suite silently ran against *that* app and failed 27/27. The config now uses a dedicated port (`E2E_PORT`, default 5273), passes `--strictPort` so a clash fails loudly instead of drifting, and no longer reuses a pre-existing server.
- **Playwright artefacts** — `test-results/` and `playwright-report/` added to `.gitignore`.

- **`seqUtils` is now dependency-free** — `exportEncodingAsCSV` moved to `exportUtils.ts`. `api/window.ts` shares the sequence encoders, and a serverless function has no business importing `file-saver`, whose UMD wrapper is fragile under ESM. Guarded by a test.
- **`tsconfig.app.json` target/lib ES2020 → ES2022** — required for `Object.hasOwn` (S4). Browser support dates to 2021.
- **`eslint.config.js`** — config files and `scripts/` are now parsed by typescript-eslint, so `vite.config.ts`'s `manualChunks` function and the sitemap generator are actually linted rather than erroring out.

### Tests

- 164 new tests (392 → 556) plus 27 Playwright e2e tests, all green alongside a clean `tsc -b`, `eslint`, and production build.
- `tests/unit/api/hardening.test.ts` — error responses are never edge-cached while successes are; upstream internals stay server-side; the encode cap; prototype keys 404 across all three databases; derived `/api` counts; `?format=` behaviour.
- `tests/integration/routing-hardening.test.tsx` — `/records/constructor` and friends show "Record not found" without tripping the error boundary; `?page=3` survives first render while later filter changes still reset; theme persistence and `prefers-color-scheme` fallback; corrupted favourites values.
- `tests/integration/docs.test.tsx` — every guide contents link resolves to a real section and every section is listed, section numbers run 1..n with no gaps, About's counts match the bundled data and no longer advertise unbuilt endpoints, the API reference lists every endpoint in the shared spec, and the "Try it" box refuses an off-origin target without calling `fetch`.
- `tests/unit/config.test.ts` — `html2canvas` placement, the react-router major, the framing headers per route, and the API/browser module boundary (`seqUtils` free of `file-saver`, the CSV sanitiser shared rather than duplicated).
- `tests/unit/csv.test.ts`, `tests/unit/pca.test.ts`, `tests/unit/useUrlParam.test.tsx`, `tests/unit/hardening.test.tsx`, `tests/unit/api/window.test.ts`, `tests/unit/api/sequence.test.ts`, `tests/unit/api/openapi.test.ts`, `tests/integration/Similarity.test.tsx`.
- `Encode` and `SequenceAnalysis` integration tests now render inside a `MemoryRouter`, which those pages require now that they read the query string.
- **e2e** — `navigation.spec.ts` listed `/stats`, a route that does not exist; replaced with `/compare` and `/similarity`. Added smoke tests for a record page rendering, `/records/constructor` showing "Record not found" without tripping the error boundary, `?page=3` on first load, and the theme surviving a reload. API and sitemap paths are deliberately not covered there — the Playwright web server is `vite dev`, which serves neither — they are covered by the unit suite instead. **All 27 e2e tests run and pass.**
- **Deep-link tests now render under `<StrictMode>`**, matching how `main.tsx` mounts the app. The earlier tests passed against a bug that only appeared with StrictMode's effect replay; without this the suite gave false confidence.

---

## [Unreleased]

### Security

- **Response security headers** — added `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-XSS-Protection: 1; mode=block` to all routes via `vercel.json` headers config.
- **`/api/encode` DoS mitigation** — when no `accessions` array is supplied in the POST body the endpoint now defaults to the first **50** AAIndex1 records instead of all 566. This caps the maximum default response at ~50 KB rather than ~5 MB. Callers who need more records can supply an explicit `accessions` list (up to the full 566).
- **PubMed proxy cache size cap** — the in-memory abstract cache in `api/pubmed/[pmid].ts` now evicts the oldest entry via LRU when the map reaches 500 items, preventing unbounded memory growth in long-lived serverless instances.

### Added

- **`GET /api/aaindex-updated` source-freshness endpoint** (`api/aaindex-updated.ts`) — fetches the AAIndex source page (`genome.jp/aaindex`) and extracts its footer "Last updated" date, exposing it as JSON (edge-cached 24h). The About page now shows this date live at the bottom, falling back to the last known value (February 13, 2017) if the source is unreachable. Extraction logic is unit-tested in `tests/unit/api/aaindex-updated.test.ts`.
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
