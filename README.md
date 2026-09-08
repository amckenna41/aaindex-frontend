# AAIndex Explorer

<p align="center"><img src="public/aaindex_explorer_logo.png" alt="AAIndex Explorer logo" width="50%"></p>

**[aaindex.vercel.app](https://aaindex.vercel.app/)**

An interactive browser for the [AAIndex database](https://www.genome.jp/aaindex/) — a curated collection of amino acid physicochemical properties, substitution matrices, and contact potentials used in protein structure and function research.

## Introduction

AAIndex is a database of numerical indices and matrices describing amino acid properties. This app makes it searchable, visualisable, and usable for sequence feature engineering — without writing any code.

The database is bundled from the [`aaindex`](https://github.com/amckenna41/aaindex) Python package and covers **707 records** across three sub-databases:

| Database | Records | Contents |
|----------|---------|----------|
| **AAIndex1** | 566 | Scalar physicochemical indices covering hydrophobicity, polarity, charge, flexibility, solvent accessibility, and secondary-structure preference |
| **AAIndex2** | 94 | Amino acid substitution matrices, including PAM, BLOSUM, and other evolutionary scoring models |
| **AAIndex3** | 47 | Statistical contact-potential matrices that model amino acid interactions in protein structures |

* 🧬 The original `aaindex` source code is available [here][aaindex].
* 💻 A quick Colab notebook demo of `aaindex` is available [here][demo]. 
* 📝 A **Medium** article that dives deeper into the AAindex and the `aaindex` software itself is available [here][medium].

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
- **Property Space** (`/similarity`) — the whole of AAIndex1 projected onto its first two principal components, coloured by category, with live nearest-neighbour correlations for any pinned record
- **Fetch by accession** — pull a sequence straight from UniProt or the PDB, no FASTA file needed
- **pySAR descriptor export** — dataset CSV plus config JSON, ready for [pySAR](https://github.com/amckenna41/pySAR)
- Coverage badges — indices with gaps for particular amino acids are flagged in the list before you open them
- PubMed abstract fetch via NCBI
- Citation helper — BibTeX, APA, and plain-text formats
- Category statistics — mean/min/max/stddev per amino acid across any category
- Shareable analysis URLs — Explorer, Sequence Analysis and Encode all keep their state in the query string, so any view or analysis is a link
- Favourites, CSV/JSON export, dark mode
- Embeddable iframe widget per record
- App-level error boundary — runtime errors show a recovery screen instead of a blank page

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Routing | React Router v7 |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Search | Fuse.js (fuzzy) |
| State | Zustand |
| API | Vercel Serverless Functions (`@vercel/node`) |
| Testing | Vitest + Testing Library, Playwright (e2e) |
| Deploy | Vercel |

## API

A read-only REST API is served from `/api`; see the in-app [API Reference](https://aaindex.vercel.app/api-reference) or the machine-readable [OpenAPI 3.1 spec](https://aaindex.vercel.app/api/openapi) (both generated from the same source).

| Endpoint | Purpose |
|----------|---------|
| `GET /api` | Overview — databases, endpoints, live record counts |
| `GET /api/openapi` | OpenAPI 3.1 description |
| `GET /api/search?q=` | Cross-database full-text search |
| `GET /api/aaindex{1,2,3}` | List records (`q`, `category`, `limit`, `offset`) |
| `GET /api/aaindex{1,2,3}/{accession}` | Full record |
| `GET /api/window` | Sliding-window property profile for a sequence |
| `GET /api/sequence?id=` | Fetch a sequence by UniProt or PDB accession |
| `POST /api/encode` | Encode a sequence against up to 50 indices |
| `GET /api/aaindex-updated` | Upstream "last updated" date |
| `GET /api/pubmed/{pmid}` | PubMed abstract proxy |

List endpoints and `/api/window` also accept `?format=csv` or `?format=tsv`.

## Sources

- **AAIndex database** — Kawashima S. & Kanehisa M. (2000). AAindex: amino acid index database. *Nucleic Acids Research*, 28(1), 374. [doi:10.1093/nar/28.1.374](https://doi.org/10.1093/nar/28.1.374)
- **Canonical source** — [genome.jp/aaindex](https://www.genome.jp/aaindex/) (Kyoto University Bioinformatics Center)
- **Parsed data** — [`aaindex`](https://pypi.org/project/aaindex/) Python package ([GitHub](https://github.com/amckenna41/aaindex), [Docs](https://aaindex.readthedocs.io))

## Documentation

- **In-app guide** — [/guide](https://aaindex.vercel.app/guide) walks through every page, the export formats, shareable URLs, and API access.
- **API reference** — [/api-reference](https://aaindex.vercel.app/api-reference) with a live "Try it" box, plus the [OpenAPI 3.1 spec](https://aaindex.vercel.app/api/openapi).
- **Changelog** — [CHANGELOG.md](CHANGELOG.md).


Contact ✉️
---------
If you have any questions or comments, please contact amckenna41@qub.ac.uk or raise an issue on the [Issues][Issues] tab.

License
-------
Distributed under the MIT License. See `LICENSE` for more details.  

References
----------
\[1\]: Shuichi Kawashima, Minoru Kanehisa, AAindex: Amino Acid index database, Nucleic Acids Research, Volume 28, Issue 1, 1 January 2000, Page 374, https://doi.org/10.1093/nar/28.1.374 <br>
\[2\]: https://www.genome.jp/aaindex/ <br>
\[3\]: Nakai, K., Kidera, A., and Kanehisa, M.; Cluster analysis of amino acid indices for prediction of protein structure and function. Protein Eng. 2, 93-100 (1988). [PMID:3244698] <br>
\[4\]: Tomii, K. and Kanehisa, M.; Analysis of amino acid indices and mutation matrices for sequence comparison and structure prediction of proteins. Protein Eng. 9, 27-36 (1996). [PMID:9053899] <br>
\[5\]: Kawashima, S., Ogata, H., and Kanehisa, M.; AAindex: amino acid index database. Nucleic Acids Res. 27, 368-369 (1999). [PMID:9847231] <br>
\[6\]: Kawashima, S. and Kanehisa, M.; AAindex: amino acid index database. Nucleic Acids Res. 28, 374 (2000). [PMID:10592278] <br>
\[7\]: Kawashima, S., Pokarowski, P., Pokarowska, M., Kolinski, A., Katayama, T., and Kanehisa, M.; AAindex: amino acid index database, progress report 2008. Nucleic Acids Res. 36, D202-D205 (2008). [PMID:17998252] 

[<img src="https://img.shields.io/github/stars/amckenna41/aaindex?color=green&label=star%20it%20on%20GitHub" width="132" height="20" alt="Star it on GitHub">](https://github.com/amckenna41/aaindex)


<a href="https://www.buymeacoffee.com/amckenna41" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>


[Back to top](#TOP)


[python]: https://www.python.org/downloads/release/python-360/
[aaindex]: https://github.com/amckenna41/aaindex
[requests]: https://requests.readthedocs.io/en/latest/
[numpy]: https://numpy.org/
[PyPi]: https://pypi.org/project/aaindex/
[demo]: https://colab.research.google.com/drive/1dccV_n1BRMiU8W13F9PPXbSaFzvOdQLC?usp=sharing
[medium]: https://medium.com/@ajmckenna69/aaindex-a63de37ec118
[Issues]: https://github.com/amckenna41/aaindex/issues
[readthedocs]: https://aaindex.readthedocs.io/en/latest/
[changelog]: https://github.com/amckenna41/aaindex/blob/main/CHANGELOG.md