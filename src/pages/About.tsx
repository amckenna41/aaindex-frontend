import { useState, useEffect } from 'react'
import { downloadAAIndex } from '../lib/aaindexFormat'
import { AAIndex1DB, AAIndex2DB, AAIndex3DB } from '../types'
import db1 from '../data/aaindex1.json'
import db2 from '../data/aaindex2.json'
import db3 from '../data/aaindex3.json'

const DBS = {
  aaindex1: { db: db1 as unknown as AAIndex1DB, label: 'AAIndex1', count: 566, desc: 'Scalar physicochemical indices' },
  aaindex2: { db: db2 as unknown as AAIndex2DB, label: 'AAIndex2', count: 94,  desc: 'Substitution matrices' },
  aaindex3: { db: db3 as unknown as AAIndex3DB, label: 'AAIndex3', count: 47,  desc: 'Contact potential matrices' },
} as const

function DownloadCard({ name }: { name: keyof typeof DBS }) {
  const [loading, setLoading] = useState(false)
  const { db, label, count, desc } = DBS[name]

  const handleDownload = () => {
    setLoading(true)
    // Yield to the browser to render the loading state before blocking serialization
    setTimeout(() => {
      downloadAAIndex(db, name)
      setLoading(false)
    }, 0)
  }

  return (
    <div className="flex items-center justify-between gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
      <div>
        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{label}</span>
        <span className="text-gray-400 dark:text-gray-500 text-xs ml-2">({count} records)</span>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc} · flat-file format</p>
      </div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="shrink-0 text-sm px-4 py-1.5 rounded border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Building…' : '↓ Download'}
      </button>
    </div>
  )
}

export default function About() {
  // Pulled live from the source database footer (genome.jp/aaindex); falls back to
  // the last known value if the proxy endpoint is unreachable.
  const [lastUpdated, setLastUpdated] = useState('February 13, 2017')
  useEffect(() => {
    fetch('/api/aaindex-updated')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.lastUpdated) setLastUpdated(d.lastUpdated) })
      .catch(() => { /* keep fallback */ })
  }, [])

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8 py-4">
      <div>
        <h1 className="text-2xl font-bold mb-2">About AAIndex Explorer</h1>
        <p className="text-gray-600 dark:text-gray-400">
          An interactive browser for the AAIndex database — a collection of amino acid physicochemical properties
          and protein structure / function parameters.
        </p>
      </div>

      <section className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-lg">The AAIndex Database</h2>
        <div className="flex flex-col gap-3 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">AAIndex1</span>
            <span className="text-gray-400 dark:text-gray-500 ml-2">(566 records)</span>
            <p className="mt-1">
              A collection of published numerical indices representing physicochemical and biochemical properties of amino acids,
              such as hydrophobicity, polarity, charge, and secondary structure preference.
            </p>
          </div>
          <div>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">AAIndex2</span>
            <span className="text-gray-400 dark:text-gray-500 ml-2">(94 records)</span>
            <p className="mt-1">
              Amino acid substitution matrices — 20×20 matrices capturing the likelihood of one amino acid being
              replaced by another during evolution (e.g. PAM, BLOSUM series).
            </p>
          </div>
          <div>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">AAIndex3</span>
            <span className="text-gray-400 dark:text-gray-500 ml-2">(47 records)</span>
            <p className="mt-1">
              Statistical amino acid pair contact potentials — matrices capturing the propensity of amino acid
              pairs to be in contact in protein structures.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-sm mb-1">Database version</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AAIndex version 9.2 (last updated February 2017). The aaindex Python package parses the flat-file
            distribution from{' '}
            <a href="https://www.genome.jp/aaindex/" target="_blank" rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline">genome.jp/aaindex</a>.
            Records that differ between v9.1 and v9.2 are noted in the individual record references field.
          </p>
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-lg">What this app provides</h2>
        <ul className="text-sm text-gray-700 dark:text-gray-300 flex flex-col gap-2 list-disc list-inside">
          <li>Browse, search, and filter all 707 records across all three databases</li>
          <li>Star/favourite records and filter to your personal set</li>
          <li>Shareable deep-linked URLs for every record</li>
          <li>Interactive bar charts with z-score normalisation toggle and missing-value indicators</li>
          <li>Diverging colour heatmaps for AAIndex2/3 substitution matrices</li>
          <li>Side-by-side comparator for up to 4 records (raw or z-score normalised)</li>
          <li>Radar chart fingerprint visualisation</li>
          <li>Sequence Encoder — encode a protein sequence using any AAIndex1 index to a numerical vector</li>
          <li>Sliding window analysis — Kyte-Doolittle-style smoothed property profiles</li>
          <li>Multi-property heatmap — sequence × N indices feature engineering view</li>
          <li>Correlation network graph — force-directed visualisation of correlated records</li>
          <li>Scatter plot explorer — any two indices vs amino acids, with Pearson r</li>
          <li>Redundancy filter — find all indices correlated above a threshold</li>
          <li>Similar records panel — top 5 correlated and anti-correlated records on each detail page</li>
          <li>PubMed abstract fetch — pull the abstract for any PMID directly from NCBI</li>
          <li>Citation helper — one-click BibTeX, APA, and plain-text citations</li>
          <li>Category statistics — mean/min/max/stddev per amino acid across any category</li>
          <li>Embeddable widget — copy an iframe snippet for any record detail page</li>
          <li>CSV and JSON export for any record, encoding, or comparison</li>
          <li>Dark mode support</li>
        </ul>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-lg">Developer API (planned)</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          A FastAPI backend is planned to expose the following endpoints for programmatic access:
        </p>
        <div className="flex flex-col gap-3 text-xs font-mono">
          {[
            { method: 'POST', path: '/api/encode', desc: 'Encode a protein sequence with a given accession. Body: {"sequence": "ACDEF...", "accession": "KYTJ820101"}' },
            { method: 'POST', path: '/api/compare', desc: 'Bulk encoding for feature engineering. Body: {"sequence": "ACDEF...", "accessions": ["KYTJ820101", "EISD840101"]}' },
            { method: 'GET',  path: '/api/records/{accession}/similar?threshold=0.8', desc: 'Records correlated above threshold.' },
            { method: 'GET',  path: '/api/stats?category=hydrophobic', desc: 'Mean/min/max/std per amino acid for a category.' },
            { method: 'GET',  path: '/api/pubmed/{pmid}', desc: 'Proxied, cached PubMed abstract.' },
          ].map(({ method, path, desc }) => (
            <div key={path} className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${method === 'POST' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'}`}>
                  {method}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400">{path}</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-sans">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col gap-4">
        <div>
          <h2 className="font-semibold text-lg">Download Databases</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Download the full database files in the standard AAIndex flat-file format
            (same as <a href="https://github.com/amckenna41/aaindex/tree/main/aaindex/data" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">amckenna41/aaindex</a>).
            Each file is reconstructed from the bundled JSON data.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <DownloadCard name="aaindex1" />
          <DownloadCard name="aaindex2" />
          <DownloadCard name="aaindex3" />
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-lg">Links & Resources</h2>
        <div className="flex flex-col gap-2 text-sm">
          {[
            { href: 'https://www.genome.jp/aaindex/', label: 'genome.jp/aaindex — Original AAIndex Database ↗' },
            { href: 'https://pypi.org/project/aaindex/', label: 'PyPI: aaindex Python package ↗' },
            { href: 'https://github.com/amckenna41/aaindex', label: 'GitHub: amckenna41/aaindex ↗' },
            { href: 'https://aaindex.readthedocs.io', label: 'ReadTheDocs — aaindex documentation ↗' },
            { href: 'https://doi.org/10.1093/nar/28.1.374', label: 'Reference: Kawashima & Kanehisa (2000), doi:10.1093/nar/28.1.374 ↗' },
          ].map(({ href, label }) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline">
              {label}
            </a>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="font-semibold text-lg mb-2">Author</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Built by{' '}
          <a href="https://github.com/amckenna41" target="_blank" rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-mono">
            amckenna41 ↗
          </a>
          . The underlying data is provided by the{' '}
          <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">aaindex</code>{' '}
          Python package, which parses and exposes the full AAIndex database.
        </p>
      </section>

      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        AAIndex database last updated: {lastUpdated} · source{' '}
        <a href="https://www.genome.jp/aaindex/" target="_blank" rel="noopener noreferrer"
          className="hover:underline">genome.jp/aaindex</a>
      </p>
    </div>
  )
}
