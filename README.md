# AAIndex Explorer

**[aaindex.vercel.app](https://aaindex.vercel.app/)**

An interactive browser for the [AAIndex database](https://www.genome.jp/aaindex/) — a curated collection of amino acid physicochemical properties, substitution matrices, and contact potentials used in protein structure and function research.

## What it is

AAIndex is a database of numerical indices and matrices describing amino acid properties. This app makes it searchable, visualisable, and usable for sequence feature engineering — without writing any code.

The database is bundled from the [`aaindex`](https://github.com/amckenna41/aaindex) Python package (v9.2, last updated February 2017) and covers **707 records** across three sub-databases:

| Database | Records | Contents |
|----------|---------|----------|
| **AAIndex1** | 566 | Scalar physicochemical indices (hydrophobicity, polarity, charge, secondary structure preference, …) |
| **AAIndex2** | 94 | Amino acid substitution matrices (PAM, BLOSUM series, …) |
| **AAIndex3** | 47 | Statistical contact potential matrices |

## Features

- Browse, search, and filter all 707 records
- Record detail pages with interactive bar charts, z-score normalisation, and missing-value indicators
- Diverging colour heatmaps for AAIndex2/3 matrices
- Side-by-side comparator for up to 4 records
- Radar chart fingerprint visualisation
- **Sequence Encoder** — upload a FASTA or plain-text file and encode each sequence using any AAIndex1 index; invalid/non-AA sequences are flagged with specific rejection reasons
- Sliding window analysis (Kyte-Doolittle-style smoothed property profiles)
- Multi-property heatmap (sequence × N indices feature engineering view)
- Correlation network graph — force-directed visualisation of correlated records
- Scatter plot explorer — any two indices vs amino acids, with Pearson r
- Redundancy filter — find all indices correlated above a threshold
- Similar records panel — top 5 correlated/anti-correlated neighbours per record
- PubMed abstract fetch via NCBI
- Citation helper — BibTeX, APA, and plain-text formats
- Category statistics — mean/min/max/stddev per amino acid across any category
- Explorer search state (query, category, database, and page) reflected in the URL — fully bookmarkable and shareable filter views
- Favourites, CSV/JSON export, dark mode
- Embeddable iframe widget per record
- App-level error boundary — runtime errors show a recovery screen instead of a blank page

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Routing | React Router v6 |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Search | Fuse.js (fuzzy) |
| State | Zustand |
| API | Vercel Serverless Functions (`@vercel/node`) |
| Testing | Vitest + Testing Library, Playwright (e2e) |
| Deploy | Vercel |

## Sources

- **AAIndex database** — Kawashima S. & Kanehisa M. (2000). AAindex: amino acid index database. *Nucleic Acids Research*, 28(1), 374. [doi:10.1093/nar/28.1.374](https://doi.org/10.1093/nar/28.1.374)
- **Canonical source** — [genome.jp/aaindex](https://www.genome.jp/aaindex/) (Kyoto University Bioinformatics Center)
- **Parsed data** — [`aaindex`](https://pypi.org/project/aaindex/) Python package ([GitHub](https://github.com/amckenna41/aaindex), [Docs](https://aaindex.readthedocs.io))

## Development

```bash
npm install
npm run dev        # dev server at localhost:5173
npm run test       # unit tests
npm run test:e2e   # Playwright e2e tests
npm run build      # production build
```

## Author

[amckenna41](https://github.com/amckenna41)
