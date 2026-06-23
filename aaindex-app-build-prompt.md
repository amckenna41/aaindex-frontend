# AAIndex Explorer — Claude Code Build Prompt

> **How to use this file**: paste the entire contents into Claude Code and it will scaffold and build the full application. Each section is self-contained so you can also hand Claude Code individual phases if you prefer iterative builds.

---

## Project overview

Build a React web application called **AAIndex Explorer** — an interactive frontend for the [`aaindex`](https://github.com/amckenna41/aaindex) Python package and the underlying AAIndex database (<https://www.genome.jp/aaindex/>).

The app must let users browse, search, compare, and visualise amino acid physicochemical indices from all three AAIndex databases without writing any code. It is a **fully static SPA** — all data is bundled as JSON at build time, no backend required for v1.

---

## Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React 18 + TypeScript | Component model, ecosystem, TS for data shape safety |
| Build tool | Vite 5 | Fast HMR, native ESM, easy static deploy |
| Routing | React Router v6 | URL-driven navigation, shareable record URLs |
| State | Zustand | Minimal boilerplate, no provider wrapping |
| Search | Fuse.js | Fuzzy client-side search, works offline |
| Charts | Recharts | Composable, React-native, good for bar + radar |
| Matrix viz | Custom SVG heatmap component | Full control over 20×20 cell colour scale |
| Styling | Tailwind CSS v3 | Utility-first, responsive, dark mode via `dark:` |
| Export | Native browser APIs + `file-saver` | CSV/JSON download, no heavy deps |
| Linting | ESLint + Prettier | Code quality |
| Deployment target | Vercel (static) | Zero-config, matches existing iso3166-flags pattern |

---

## Repository initialisation

```bash
npm create vite@latest aaindex-app -- --template react-ts
cd aaindex-app
npm install react-router-dom zustand fuse.js recharts file-saver
npm install -D tailwindcss postcss autoprefixer @types/file-saver
npx tailwindcss init -p
```

`tailwind.config.js`:
```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: { extend: {} },
  plugins: [],
}
```

`src/index.css` — add at top:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Data setup

### Extracting the JSON files

The `aaindex` pip package ships three parsed JSON files. Extract them and copy into `src/data/`:

```bash
pip install aaindex
python - <<'EOF'
import json, importlib.resources as ir
import aaindex
pkg = ir.files(aaindex)
for name in ['aaindex1', 'aaindex2', 'aaindex3']:
    src = pkg.joinpath(f'data/{name}.json')
    data = json.loads(src.read_text())
    with open(f'src/data/{name}.json', 'w') as f:
        json.dump(data, f)
    print(f'Wrote {name}.json — {len(data)} records')
EOF
```

If the path above doesn't match the installed package layout, fall back to:
```bash
python -c "import aaindex; print(aaindex.__file__)"
```
Then locate `*.json` files in the package directory and copy them to `src/data/`.

### Data shapes (TypeScript interfaces)

Create `src/types/index.ts`:

```ts
// AAIndex1 — amino acid physicochemical index
export interface AAIndex1Record {
  description: string
  references: string
  notes: string
  pmid: string
  category: string
  correlation_coefficients: Record<string, number>
  values: Record<string, number>   // 20 AA single-letter codes + '-'
}

export type AAIndex1DB = Record<string, AAIndex1Record>

// AAIndex2 — substitution matrix (symmetric or non-symmetric)
export interface AAIndex2Record {
  description: string
  references: string
  notes: string
  pmid: string
  matrix: Record<string, Record<string, number>>
}

export type AAIndex2DB = Record<string, AAIndex2Record>

// AAIndex3 — contact potential matrix (same structure as AAIndex2)
export type AAIndex3Record = AAIndex2Record
export type AAIndex3DB = Record<string, AAIndex3Record>

export type DBName = 'aaindex1' | 'aaindex2' | 'aaindex3'
```

---

## Zustand store

Create `src/store/useAAIndexStore.ts`:

```ts
import { create } from 'zustand'
import { DBName } from '../types'

interface AAIndexState {
  activeDB: DBName
  setActiveDB: (db: DBName) => void

  selectedAccessions: string[]          // for comparator (max 4)
  addToCompare: (acc: string) => void
  removeFromCompare: (acc: string) => void
  clearCompare: () => void

  categoryFilter: string
  setCategoryFilter: (cat: string) => void

  searchQuery: string
  setSearchQuery: (q: string) => void
}

export const useAAIndexStore = create<AAIndexState>((set) => ({
  activeDB: 'aaindex1',
  setActiveDB: (db) => set({ activeDB: db, categoryFilter: '', searchQuery: '' }),

  selectedAccessions: [],
  addToCompare: (acc) =>
    set((s) => ({
      selectedAccessions: s.selectedAccessions.includes(acc) || s.selectedAccessions.length >= 4
        ? s.selectedAccessions
        : [...s.selectedAccessions, acc],
    })),
  removeFromCompare: (acc) =>
    set((s) => ({ selectedAccessions: s.selectedAccessions.filter((a) => a !== acc) })),
  clearCompare: () => set({ selectedAccessions: [] }),

  categoryFilter: '',
  setCategoryFilter: (cat) => set({ categoryFilter: cat }),

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
}))
```

---

## Search utility

Create `src/lib/search.ts`:

```ts
import Fuse from 'fuse.js'
import { AAIndex1DB, AAIndex2DB } from '../types'

type SearchItem = { accession: string; description: string; category?: string }

export function buildSearchIndex(db: AAIndex1DB | AAIndex2DB): Fuse<SearchItem> {
  const items: SearchItem[] = Object.entries(db).map(([accession, rec]) => ({
    accession,
    description: rec.description,
    category: (rec as any).category ?? '',
  }))
  return new Fuse(items, {
    keys: ['accession', 'description', 'category'],
    threshold: 0.35,
    includeScore: true,
  })
}
```

---

## Export utility

Create `src/lib/exportUtils.ts`:

```ts
import { saveAs } from 'file-saver'

export function exportValuesAsCSV(accession: string, values: Record<string, number>) {
  const header = 'amino_acid,value'
  const rows = Object.entries(values).map(([aa, v]) => `${aa},${v}`)
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
  saveAs(blob, `${accession}_values.csv`)
}

export function exportRecordAsJSON(accession: string, record: object) {
  const blob = new Blob([JSON.stringify({ [accession]: record }, null, 2)], {
    type: 'application/json',
  })
  saveAs(blob, `${accession}.json`)
}

export function exportComparisonAsCSV(
  accessions: string[],
  records: Record<string, Record<string, number>>
) {
  const aas = Object.keys(records[accessions[0]])
  const header = ['amino_acid', ...accessions].join(',')
  const rows = aas.map((aa) => [aa, ...accessions.map((a) => records[a][aa] ?? '')].join(','))
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
  saveAs(blob, `comparison_${accessions.join('_')}.csv`)
}
```

---

## Project file structure

```
aaindex-app/
├── public/
│   └── favicon.svg                  # DNA/helix icon recommended
├── src/
│   ├── data/
│   │   ├── aaindex1.json
│   │   ├── aaindex2.json
│   │   └── aaindex3.json
│   ├── types/
│   │   └── index.ts
│   ├── store/
│   │   └── useAAIndexStore.ts
│   ├── lib/
│   │   ├── search.ts
│   │   └── exportUtils.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Layout.tsx
│   │   ├── SearchBar.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── RecordCard.tsx
│   │   ├── DBSwitcher.tsx
│   │   ├── AminoAcidBarChart.tsx
│   │   ├── MatrixHeatmap.tsx
│   │   ├── CompareChart.tsx
│   │   ├── RadarChart.tsx
│   │   ├── ExportButton.tsx
│   │   └── CompareDrawer.tsx
│   ├── pages/
│   │   ├── Explorer.tsx
│   │   ├── RecordDetail.tsx
│   │   ├── Comparator.tsx
│   │   ├── Visualiser.tsx
│   │   └── About.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## Routing (`src/App.tsx`)

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Explorer from './pages/Explorer'
import RecordDetail from './pages/RecordDetail'
import Comparator from './pages/Comparator'
import Visualiser from './pages/Visualiser'
import About from './pages/About'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/explorer" replace />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/records/:accession" element={<RecordDetail />} />
          <Route path="/compare" element={<Comparator />} />
          <Route path="/visualise" element={<Visualiser />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

---

## Pages — detailed specifications

### Page 1: Explorer (`/explorer`)

**Purpose**: Entry point. Browse and search all records across all three databases.

**Layout**: Two-column. Left sidebar (280px) contains DB switcher + filters. Right main panel contains search bar + paginated record list (20 records per page).

**DB switcher** (`DBSwitcher.tsx`): Three tab-style buttons — `AAIndex1 (566)`, `AAIndex2 (94)`, `AAIndex3 (47)`. Clicking resets search and filters.

**Filter panel** (`FilterPanel.tsx`): For AAIndex1 only, show a `<select>` of unique categories derived from all records. Categories include: `charge`, `composition`, `geometry`, `hydrophobicity`, `meta`, `mutability`, `other`, `polarity`, `sec_struct`, `shape`, `solvent`, `volume`. Selecting a category filters the list.

**Search bar** (`SearchBar.tsx`): Text input wired to Fuse.js. Searches across `accession`, `description`, and `category` fields. Debounce 200ms. Show result count. Clear button.

**Record card** (`RecordCard.tsx`): Each card shows:
- Accession number (monospace, bold, links to `/records/:accession`)
- Description (truncated at 80 chars)
- Category badge (colour-coded by category for AAIndex1, plain for AAIndex2/3)
- Mini sparkline of the 20 amino acid values (for AAIndex1 only — a tiny inline SVG bar chart, ~120×24px)
- "Add to compare" button (disabled + green check if already added; disabled if 4 already selected)

**Pagination**: Previous/Next buttons, page indicator. Jump-to-page input.

---

### Page 2: Record Detail (`/records/:accession`)

**Purpose**: Full view of a single record. URL is shareable and deep-linkable.

**Detect DB**: Check accession against all three databases in order (aaindex1 → aaindex2 → aaindex3) to determine which DB the record belongs to.

**For AAIndex1 records**, show:

1. **Header section**: Accession number, full description, category badge, PMID link (`https://pubmed.ncbi.nlm.nih.gov/{pmid}`), reference text, notes (if non-empty).

2. **Amino acid bar chart** (`AminoAcidBarChart.tsx`): Recharts `BarChart` with 20 bars (one per amino acid, excluding `-`). X-axis: single-letter AA codes. Y-axis: index values. Bars coloured by value (Recharts `Cell` with a linear colour interpolation from min→max). Tooltip shows AA full name + value. Responsive container.

3. **Correlation coefficients table**: If `correlation_coefficients` is non-empty, show a table of correlated accession numbers and their coefficients, each accession linkable to its own detail page.

4. **Compare & Export controls**: "Add to compare" button (links to `/compare`), "Export values CSV" button, "Export record JSON" button.

**For AAIndex2/3 records**, show:

1. **Header section**: Same as above (without category).

2. **Matrix heatmap** (`MatrixHeatmap.tsx`): 20×20 SVG grid. Rows and columns labelled with single-letter AA codes. Cell colour: diverging scale — blue for most negative, white at zero, red for most positive (compute min/max across all cells). Hover tooltip: `AA1 / AA2 : value`. Click a cell to highlight the entire row and column. Export matrix as CSV button.

3. **Raw matrix table**: Collapsible `<details>` element containing the full 20×20 numeric table for copy-paste use.

---

### Page 3: Comparator (`/compare`)

**Purpose**: Side-by-side comparison of 2–4 AAIndex1 records.

**Empty state**: If `selectedAccessions` is empty, show a prompt: "Add records to compare from the Explorer." Link back to `/explorer`.

**Selection chips**: Row of accession chips at the top with an ✕ to remove each. "Clear all" button.

**Grouped bar chart** (`CompareChart.tsx`): Recharts `BarChart` in grouped mode. X-axis: 20 amino acid single-letter codes. One bar group per amino acid, one bar per selected record (up to 4). Each record has a distinct colour (use a fixed palette: indigo, emerald, amber, rose). Legend shows accession → description mapping. Responsive container, full width.

**Values table**: Below the chart, a table where rows = amino acids, columns = selected accessions. Cells show the raw value. Highlight the max value per row in light green, min value in light red.

**Export**: "Export comparison CSV" button (uses `exportComparisonAsCSV`).

---

### Page 4: Visualiser (`/visualise`)

**Purpose**: Free-form chart builder. User picks any record and chart type.

**Controls panel** (top or left sidebar):
- DB switcher (AAIndex1 only for bar/radar; AAIndex2/3 for heatmap)
- Record selector: searchable `<select>` or combobox listing all accessions with descriptions
- Chart type toggle: `Bar` | `Radar` | `Heatmap`

**Bar chart**: Same as Record Detail bar chart but full-width with axis labels.

**Radar chart** (`RadarChart.tsx`): Recharts `RadarChart`. 20 spokes, one per amino acid. Values normalised 0–1 relative to the min/max of that record. Useful for showing property "fingerprints". Overlay up to 2 records for comparison.

**Heatmap**: Same `MatrixHeatmap` component as Record Detail, larger render.

**Export**: "Download as PNG" (use `recharts` `toDataURL` method or `html2canvas` on the chart container). "Download values as CSV".

---

### Page 5: About (`/about`)

Static page. Include:
- What the AAIndex database is (summary of the three sections)
- What this app provides
- Link to the `aaindex` PyPI package and GitHub repo
- Link to ReadTheDocs documentation
- Link to the original genome.jp AAIndex database
- Link to the reference paper (Kawashima & Kanehisa 2000, doi:10.1093/nar/28.1.374)
- Author credit (amckenna41) with GitHub link

---

## Components — detailed specifications

### `Navbar.tsx`

Sticky top navbar. Left: "AAIndex Explorer" logo/text (links to `/explorer`). Right: nav links — Explorer, Compare (with badge showing count of selected records if >0), Visualiser, About. Dark mode toggle button (sun/moon icon, toggles `dark` class on `<html>`). Responsive: hamburger menu on mobile.

### `MatrixHeatmap.tsx`

Props: `matrix: Record<string, Record<string, number>>`, `title?: string`

Implementation notes:
- Render as SVG for crisp scaling
- Cell size: 22px × 22px; total grid = 440×440px + 30px labels on each axis
- Colour scale: compute `min` and `max` across all non-null cells; interpolate linearly. Use diverging scale: `#2166ac` (blue) at min → `#f7f7f7` (white) at 0 → `#d6604d` (red) at max. If all values are positive (contact potentials can be), use a single-direction scale instead.
- Hover state: highlight hovered cell with a 1.5px darker border; show tooltip `{row_aa} / {col_aa} = {value}`
- Click: highlight entire row and column with a semi-transparent overlay
- AA ordering: `ARNDCQEGHILKMFPSTWYV` (standard AAIndex order)

### `AminoAcidBarChart.tsx`

Props: `values: Record<string, number>`, `accession: string`, `height?: number`

Implementation notes:
- Filter out the `-` key before rendering
- Sort bars by standard AA order: `ACDEFGHIKLMNPQRSTVWY`
- Use `Recharts ResponsiveContainer + BarChart`
- Colour bars using Recharts `Cell`: interpolate a colour ramp from `#93c5fd` (light blue) at min to `#1d4ed8` (dark blue) at max; negative values (rare in AAIndex1 but possible) use a red ramp
- Custom tooltip: show full amino acid name (maintain a lookup map of single-letter → full name) and value rounded to 4 decimal places

### `CompareChart.tsx`

Props: `accessions: string[]`, `records: Record<string, AAIndex1Record>`

Implementation notes:
- Use `Recharts GroupedBarChart`
- Fixed colour palette per position: `['#6366f1', '#10b981', '#f59e0b', '#f43f5e']`
- Legend: map each accession to a short label (first 20 chars of description)
- Tooltip: show all values for the hovered amino acid group

### `RecordCard.tsx`

Props: `accession: string`, `record: AAIndex1Record | AAIndex2Record`, `dbName: DBName`

The mini sparkline for AAIndex1: render an inline SVG (120×24px). Map the 20 amino acid values (sorted by AA order) to bar heights within the SVG viewBox. Normalise to fill the height. No axes or labels — purely decorative at this scale.

Category badge colour map (Tailwind classes):

```ts
const categoryColours: Record<string, string> = {
  hydrophobicity: 'bg-blue-100 text-blue-800',
  charge:         'bg-red-100 text-red-800',
  sec_struct:     'bg-purple-100 text-purple-800',
  volume:         'bg-green-100 text-green-800',
  polarity:       'bg-yellow-100 text-yellow-800',
  composition:    'bg-orange-100 text-orange-800',
  solvent:        'bg-teal-100 text-teal-800',
  geometry:       'bg-indigo-100 text-indigo-800',
  mutability:     'bg-pink-100 text-pink-800',
  shape:          'bg-lime-100 text-lime-800',
  meta:           'bg-gray-100 text-gray-800',
  other:          'bg-slate-100 text-slate-800',
}
```

### `CompareDrawer.tsx`

A fixed bottom bar (or collapsible panel) that appears when ≥1 record is in `selectedAccessions`. Shows chips of selected accession codes, a "View comparison" button (navigates to `/compare`), and a "Clear" button. Z-index above content, does not obscure page footer.

---

## Amino acid full-name lookup

Add this constant to `src/lib/aminoAcids.ts`:

```ts
export const AA_FULL_NAMES: Record<string, string> = {
  A: 'Alanine',    R: 'Arginine',    N: 'Asparagine', D: 'Aspartate',
  C: 'Cysteine',   Q: 'Glutamine',   E: 'Glutamate',  G: 'Glycine',
  H: 'Histidine',  I: 'Isoleucine',  L: 'Leucine',    K: 'Lysine',
  M: 'Methionine', F: 'Phenylalanine', P: 'Proline',  S: 'Serine',
  T: 'Threonine',  W: 'Tryptophan',  Y: 'Tyrosine',   V: 'Valine',
}

export const AA_ORDER = ['A','R','N','D','C','Q','E','G','H','I','L','K','M','F','P','S','T','W','Y','V']
export const AA_ORDER_ALPHA = ['A','C','D','E','F','G','H','I','K','L','M','N','P','Q','R','S','T','V','W','Y']
```

---

## Styling conventions

- Use Tailwind utility classes throughout. No custom CSS files beyond `index.css`.
- Dark mode: toggle `dark` class on `document.documentElement`. All components use `dark:` variants.
- Colour palette for UI chrome:
  - Background: `bg-white dark:bg-gray-950`
  - Surface cards: `bg-gray-50 dark:bg-gray-900`
  - Borders: `border-gray-200 dark:border-gray-800`
  - Primary text: `text-gray-900 dark:text-gray-100`
  - Muted text: `text-gray-500 dark:text-gray-400`
  - Primary accent: `text-indigo-600 dark:text-indigo-400`
- Fonts: system font stack (no Google Fonts import). Monospace for accession numbers: `font-mono`.
- Responsive breakpoints: `sm:` (640px) for sidebar collapse, `lg:` (1024px) for full two-column layout.

---

## Performance notes

- Lazy-load the three JSON files with `React.lazy` + dynamic import so the initial bundle only loads the active DB.
- Build the Fuse.js index once per DB change using `useMemo`.
- Virtualise the record list if pagination is removed in future — use `@tanstack/react-virtual` (optional).
- The `MatrixHeatmap` SVG should use `React.memo` — 20×20 = 400 cells, re-rendering on every hover is expensive without memoisation. Keep hover state local to the component.

---

## `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',            // change to '/aaindex-app/' if deploying to GitHub Pages sub-path
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          search: ['fuse.js'],
        },
      },
    },
  },
})
```

---

## Vercel deployment

Add `vercel.json` to the project root to handle SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Deploy with:
```bash
npm run build
npx vercel --prod
```

Or connect the GitHub repo to Vercel for automatic deploys on push to `main`.

---

## Optional: FastAPI backend (v2)

If you later want to expose the Python package's native methods (e.g. to enable server-side search or add new endpoints), scaffold a backend alongside the frontend:

```
api/
├── main.py
├── requirements.txt
└── Dockerfile
```

`api/main.py`:
```python
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from aaindex import aaindex1, aaindex2, aaindex3

app = FastAPI(title="AAIndex API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

DBS = {'aaindex1': aaindex1, 'aaindex2': aaindex2, 'aaindex3': aaindex3}

@app.get("/api/{db}/records")
def list_records(db: str):
    return DBS[db].record_codes()

@app.get("/api/{db}/records/{accession}")
def get_record(db: str, accession: str):
    return dict(DBS[db][accession])

@app.get("/api/{db}/search")
def search(db: str, q: str = Query(...)):
    return DBS[db].search(q)
```

Point the Vite frontend at this API by adding `VITE_API_URL=http://localhost:8000` to `.env.local` and reading it via `import.meta.env.VITE_API_URL`.

---

## Build phases (suggested order for Claude Code)

Work through these phases sequentially. Each phase produces a runnable app.

### Phase 1 — Scaffold & data
1. Initialise Vite + React + TypeScript project
2. Install all dependencies listed above
3. Configure Tailwind
4. Extract and place all three JSON files in `src/data/`
5. Create TypeScript interfaces in `src/types/index.ts`
6. Create Zustand store
7. Create `src/lib/search.ts`, `src/lib/exportUtils.ts`, `src/lib/aminoAcids.ts`
8. Implement `App.tsx` routing
9. Implement `Navbar.tsx` and `Layout.tsx` (Outlet wrapper)
10. Verify `npm run dev` starts without errors

### Phase 2 — Explorer page
1. Implement `DBSwitcher.tsx`
2. Implement `SearchBar.tsx` with Fuse.js
3. Implement `FilterPanel.tsx` (category filter, AAIndex1 only)
4. Implement `RecordCard.tsx` with mini sparkline SVG
5. Implement `Explorer.tsx` with pagination (20 records/page)
6. Implement `CompareDrawer.tsx` (fixed bottom bar)
7. Verify browsing, searching, and filtering work for all three DBs

### Phase 3 — Record Detail page
1. Implement `AminoAcidBarChart.tsx`
2. Implement `MatrixHeatmap.tsx`
3. Implement `RecordDetail.tsx` (auto-detects DB from accession)
4. Wire PMID external links, correlation coefficient table links
5. Wire export buttons using `exportUtils.ts`
6. Verify deep-linking to `/records/CHOP780206` and `/records/ALTS910101` works

### Phase 4 — Comparator page
1. Implement `CompareChart.tsx`
2. Implement `Comparator.tsx`
3. Wire "Add to compare" flow from RecordCard → store → CompareDrawer → Comparator
4. Implement comparison values table (min/max row highlighting)
5. Wire "Export comparison CSV" button

### Phase 5 — Visualiser & About pages
1. Implement `RadarChart.tsx`
2. Implement `Visualiser.tsx` with record selector combobox and chart type toggle
3. Implement PNG download for charts
4. Implement `About.tsx` (static content)
5. Final responsive QA on mobile breakpoints
6. Dark mode QA

### Phase 6 — Polish & deploy
1. Add `<title>` and `<meta description>` updates per route (use `react-helmet-async`)
2. Add a 404 / not-found page for unknown accessions
3. Add loading skeleton components for perceived performance
4. Add `vercel.json`
5. Run `npm run build` and fix any type errors
6. Deploy to Vercel

---

## Acceptance criteria

The app is complete when:
- [ ] All 566 AAIndex1 records are browsable, searchable, and filterable by category
- [ ] All 94 AAIndex2 and 47 AAIndex3 records are browsable and searchable
- [ ] Every record has a shareable URL (`/records/{accession}`) that renders correctly on direct load
- [ ] AAIndex1 bar chart renders with correct amino acid values from the JSON
- [ ] AAIndex2/3 heatmap renders a 20×20 matrix with correct diverging colour scale
- [ ] Comparator accepts 2–4 AAIndex1 records and renders a grouped bar chart
- [ ] CSV export produces a valid file for values, record JSON, and comparison
- [ ] Dark mode toggles correctly across all pages
- [ ] `npm run build` completes without TypeScript errors
- [ ] App is deployed and publicly accessible on Vercel
