import { useState } from 'react'

interface Endpoint {
  method: 'GET'
  path: string
  description: string
  params?: { name: string; type: string; description: string }[]
  example: string
  sampleResponse: string
}

const BASE = typeof window !== 'undefined' ? window.location.origin : ''

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api',
    description: 'API overview — lists all available databases, endpoints, and query parameters.',
    example: '/api',
    sampleResponse: JSON.stringify({
      name: 'AAIndex API',
      version: '1.0.0',
      databases: {
        aaindex1: { description: 'Amino acid physicochemical property indices', count: 566 },
        aaindex2: { description: 'Amino acid mutation matrices', count: 94 },
        aaindex3: { description: 'Amino acid contact potentials', count: 47 },
      },
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/search',
    description: 'Cross-database full-text search. Filters aaindex1, aaindex2, and aaindex3 in a single request and tags each hit with its source database — no need to query and merge the three list endpoints yourself.',
    params: [
      { name: 'q', type: 'string', description: 'Search term (required). Matched against accession codes and descriptions across all three databases.' },
      { name: 'limit', type: 'string', description: 'Maximum number of records to return (pagination).' },
      { name: 'offset', type: 'string', description: 'Number of records to skip (pagination).' },
    ],
    example: '/api/search?q=hydrophobicity',
    sampleResponse: JSON.stringify({
      query: 'hydrophobicity',
      count: 2,
      offset: 0,
      limit: 2,
      records: [
        { database: 'aaindex1', accession: 'KYTJ820101', description: 'Hydrophobicity index (Kyte-Doolittle, 1982)' },
        { database: 'aaindex3', accession: 'MOOG990101', description: 'Hydrophobicity-related contact potential' },
      ],
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/aaindex1',
    description: 'List all 566 AAIndex1 physicochemical property records. Returns accession, description, and category for each entry.',
    params: [
      { name: 'q', type: 'string', description: 'Full-text search across accession codes and descriptions.' },
      { name: 'category', type: 'string', description: 'Filter by category (e.g. hydrophobic, charge, sec_struct, volume, polar, solvent, flexibility).' },
    ],
    example: '/api/aaindex1?q=hydrophobicity&category=hydrophobic',
    sampleResponse: JSON.stringify({
      database: 'aaindex1',
      description: 'Amino acid physicochemical property indices',
      count: 2,
      records: [
        { accession: 'KYTJ820101', description: 'Hydrophobicity index (Kyte-Doolittle, 1982)', category: 'hydrophobic' },
        { accession: 'CIDH920105', description: 'Normalized hydrophobicity scales (Cid et al., 1992)', category: 'hydrophobic' },
      ],
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/aaindex1/{accession}',
    description: 'Retrieve the full AAIndex1 record for a specific accession code, including the complete 20-amino-acid value table and citation data.',
    params: [
      { name: 'accession', type: 'path', description: 'AAIndex1 accession code (case-insensitive, e.g. KYTJ820101).' },
    ],
    example: '/api/aaindex1/KYTJ820101',
    sampleResponse: JSON.stringify({
      accession: 'KYTJ820101',
      database: 'aaindex1',
      description: 'Hydrophobicity index (Kyte-Doolittle, 1982)',
      category: 'hydrophobic',
      pmid: '7108955',
      references: 'Kyte, J. and Doolittle, R.F. (1982) ...',
      values: { A: 1.8, R: -4.5, N: -3.5, D: -3.5, C: 2.5, Q: -3.5, E: -3.5, G: -0.4, H: -3.2, I: 4.5, L: 3.8, K: -3.9, M: 1.9, F: 2.8, P: -1.6, S: -0.8, T: -0.7, W: -0.9, Y: -1.3, V: 4.2 },
      correlation_coefficients: { CIDH920105: 0.978 },
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/aaindex2',
    description: 'List all 94 AAIndex2 amino acid mutation matrix records. Returns accession, description, and symmetry flag for each entry.',
    params: [
      { name: 'q', type: 'string', description: 'Full-text search across accession codes and descriptions.' },
    ],
    example: '/api/aaindex2?q=PAM',
    sampleResponse: JSON.stringify({
      database: 'aaindex2',
      description: 'Amino acid mutation matrices',
      count: 2,
      records: [
        { accession: 'ALTS910101', description: 'The PAM-120 matrix (Altschul, 1991)', is_symmetric: true },
        { accession: 'BLAM930101', description: 'Mutation data matrix (Blasquez-Manzanares et al., 1993)', is_symmetric: true },
      ],
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/aaindex2/{accession}',
    description: 'Retrieve the full AAIndex2 record for a specific accession, including the complete 20×20 substitution matrix.',
    params: [
      { name: 'accession', type: 'path', description: 'AAIndex2 accession code (e.g. HENS920102).' },
    ],
    example: '/api/aaindex2/HENS920102',
    sampleResponse: JSON.stringify({
      accession: 'HENS920102',
      database: 'aaindex2',
      description: 'Heniko and Henikoff (1992) BLOSUM-62 matrix',
      is_symmetric: true,
      row_order: ['A', 'R', 'N', '...'],
      col_order: ['A', 'R', 'N', '...'],
      matrix: { A: { A: 4, R: -1, N: -2, '...': '...' }, '...': '...' },
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/aaindex3',
    description: 'List all 47 AAIndex3 amino acid contact potential records. Returns accession, description, and symmetry flag.',
    params: [
      { name: 'q', type: 'string', description: 'Full-text search across accession codes and descriptions.' },
    ],
    example: '/api/aaindex3',
    sampleResponse: JSON.stringify({
      database: 'aaindex3',
      description: 'Amino acid contact potentials',
      count: 47,
      records: [
        { accession: 'TANS760101', description: 'Statistical potential (Tanaka-Scheraga, 1976)', is_symmetric: true },
      ],
    }, null, 2),
  },
  {
    method: 'GET',
    path: '/api/aaindex3/{accession}',
    description: 'Retrieve the full AAIndex3 record for a specific accession, including the complete contact potential matrix.',
    params: [
      { name: 'accession', type: 'path', description: 'AAIndex3 accession code (e.g. TANS760101).' },
    ],
    example: '/api/aaindex3/TANS760101',
    sampleResponse: JSON.stringify({
      accession: 'TANS760101',
      database: 'aaindex3',
      description: 'Statistical potential (Tanaka-Scheraga, 1976)',
      is_symmetric: true,
      matrix: { A: { A: -0.048, R: 0.101, '...': '...' }, '...': '...' },
    }, null, 2),
  },
]

function Badge({ type }: { type: string }) {
  const colour = type === 'path'
    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
  return (
    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${colour}`}>{type}</span>
  )
}

function TryIt({ path }: { path: string }) {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState(() => BASE + path.replace(/\{accession\}/, path.includes('aaindex1') ? 'KYTJ820101' : path.includes('aaindex2') ? 'HENS920102' : 'TANS760101'))

  const run = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(url)
      const json = await res.json()
      setResult(JSON.stringify(json, null, 2))
    } catch (e) {
      setResult(`Error: ${String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Try it</p>
      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 font-mono text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-0"
        />
        <button
          onClick={run}
          disabled={loading}
          className="shrink-0 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
      {result && (
        <pre className="mt-2 text-xs bg-gray-900 text-green-400 rounded p-3 overflow-x-auto max-h-64 overflow-y-auto">
          {result}
        </pre>
      )}
    </div>
  )
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false)

  const pathDisplay = ep.path.replace(/\{(\w+)\}/g, (_, p) =>
    `{${p}}`
  )

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
      >
        <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
          GET
        </span>
        <span className="font-mono text-sm text-gray-800 dark:text-gray-200 font-medium truncate">
          {pathDisplay}
        </span>
        <span className="ml-auto shrink-0 text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-4 bg-white dark:bg-gray-950 flex flex-col gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{ep.description}</p>

          {ep.params && ep.params.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Parameters</p>
              <div className="flex flex-col gap-2">
                {ep.params.map((p) => (
                  <div key={p.name} className="flex items-start gap-3 text-sm">
                    <code className="shrink-0 font-mono text-indigo-600 dark:text-indigo-400 text-xs bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                      {p.name}
                    </code>
                    <Badge type={p.type} />
                    <span className="text-gray-600 dark:text-gray-400 text-xs">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Example response</p>
            <pre className="text-xs bg-gray-900 text-green-400 rounded p-3 overflow-x-auto max-h-64 overflow-y-auto">
              {ep.sampleResponse}
            </pre>
          </div>

          <TryIt path={ep.example} />
        </div>
      )}
    </div>
  )
}

export default function APIReference() {
  const searchEndpoints = ENDPOINTS.filter((e) => e.path === '/api/search')
  const db1Endpoints = ENDPOINTS.filter((e) => e.path.includes('aaindex1') || e.path === '/api')
  const db2Endpoints = ENDPOINTS.filter((e) => e.path.includes('aaindex2'))
  const db3Endpoints = ENDPOINTS.filter((e) => e.path.includes('aaindex3'))

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">API Reference</h1>
        <p className="text-gray-600 dark:text-gray-400">
          REST API for the AAIndex database. All endpoints return JSON and support CORS — suitable for programmatic access from any origin.
        </p>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono">
            Base URL: {BASE || 'https://your-domain.vercel.app'}
          </span>
          <span className="text-xs px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
            Read-only · No auth required
          </span>
        </div>
      </div>

      {/* Overview section */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Overview</h2>
        <EndpointCard ep={ENDPOINTS[0]} />
      </section>

      {/* Search */}
      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Search</h2>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Full-text search across all three databases in a single request.</p>
        </div>
        {searchEndpoints.map((ep) => <EndpointCard key={ep.path} ep={ep} />)}
      </section>

      {/* AAIndex1 */}
      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">AAIndex1</h2>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">566 physicochemical property indices — hydrophobicity, charge, secondary structure propensity, etc.</p>
        </div>
        {db1Endpoints.slice(1).map((ep) => <EndpointCard key={ep.path} ep={ep} />)}
      </section>

      {/* AAIndex2 */}
      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">AAIndex2</h2>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">94 amino acid mutation matrices including PAM, BLOSUM, and custom substitution models.</p>
        </div>
        {db2Endpoints.map((ep) => <EndpointCard key={ep.path} ep={ep} />)}
      </section>

      {/* AAIndex3 */}
      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">AAIndex3</h2>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">47 pairwise contact potentials for protein structure analysis and folding energy calculations.</p>
        </div>
        {db3Endpoints.map((ep) => <EndpointCard key={ep.path} ep={ep} />)}
      </section>

      {/* Notes */}
      <section className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 text-sm text-indigo-800 dark:text-indigo-300 flex flex-col gap-2">
        <p className="font-semibold">Notes</p>
        <ul className="list-disc list-inside flex flex-col gap-1 text-xs">
          <li>All accession codes are case-insensitive (e.g. <code className="font-mono">kytj820101</code> and <code className="font-mono">KYTJ820101</code> are equivalent).</li>
          <li>List endpoints are cached for 24 hours at the edge. Detail endpoints are similarly cached.</li>
          <li>CORS is open (<code className="font-mono">Access-Control-Allow-Origin: *</code>) — no proxy required.</li>
          <li>The API is read-only. <code className="font-mono">POST</code>, <code className="font-mono">PUT</code>, and <code className="font-mono">DELETE</code> return <code className="font-mono">405 Method Not Allowed</code>.</li>
        </ul>
      </section>
    </div>
  )
}
