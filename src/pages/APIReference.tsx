import { useState } from 'react'
import { ENDPOINTS, type Endpoint } from '../lib/apiSpec'

const BASE = typeof window !== 'undefined' ? window.location.origin : ''

function Badge({ type }: { type: string }) {
  const colour = type === 'path'
    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
  return (
    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${colour}`}>{type}</span>
  )
}

function samplePath(path: string): string {
  return path.replace(/\{accession\}/, path.includes('aaindex1') ? 'KYTJ820101' : path.includes('aaindex2') ? 'HENS920102' : 'TANS760101')
    .replace(/\{pmid\}/, '7108955')
}

/** The box only ever calls this site's own API. It used to fetch whatever URL
 *  was typed in, which made it a small open request proxy for no benefit. */
function resolveApiUrl(input: string): string | null {
  try {
    const url = new URL(input, BASE || window.location.origin)
    if (url.origin !== (BASE || window.location.origin)) return null
    if (!url.pathname.startsWith('/api')) return null
    return url.toString()
  } catch {
    return null
  }
}

function TryIt({ path }: { path: string }) {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState(() => BASE + samplePath(path))

  const run = async () => {
    const target = resolveApiUrl(url)
    if (!target) {
      setResult('Only this site\u2019s own /api/... paths can be called from here.')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(target)
      const text = await res.text()
      try {
        setResult(JSON.stringify(JSON.parse(text), null, 2))
      } catch {
        setResult(text) // csv/tsv responses aren't JSON
      }
    } catch {
      setResult('Request failed — check the path and try again.')
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
        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded ${
          ep.method === 'POST'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
        }`}>
          {ep.method}
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
                    <Badge type={p.in === 'path' ? 'path' : p.type} />
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

          {ep.method === 'GET' && <TryIt path={ep.example} />}
        </div>
      )}
    </div>
  )
}

export default function APIReference() {
  const pick = (...paths: string[]) =>
    paths.map((path) => ENDPOINTS.find((e) => e.path === path)).filter((e): e is Endpoint => !!e)

  const Section = ({ title, blurb, eps }: { title: string; blurb?: string; eps: Endpoint[] }) => (
    <section className="flex flex-col gap-2">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h2>
        {blurb && <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{blurb}</p>}
      </div>
      {eps.map((ep) => <EndpointCard key={`${ep.method} ${ep.path}`} ep={ep} />)}
    </section>
  )

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">API Reference</h1>
        <p className="text-gray-600 dark:text-gray-400">
          REST API for the AAIndex database. Endpoints return JSON (list endpoints also speak
          <code className="font-mono mx-1">?format=csv</code> and <code className="font-mono">tsv</code>) and support CORS —
          suitable for programmatic access from any origin.
        </p>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono">
            Base URL: {BASE || 'https://your-domain.vercel.app'}
          </span>
          <span className="text-xs px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
            No auth required
          </span>
          <a
            href="/api/openapi"
            className="text-xs px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:underline"
          >
            OpenAPI 3.1 spec ↗
          </a>
        </div>
      </div>

      <Section title="Overview" eps={pick('/api', '/api/openapi')} />

      <Section
        title="Search"
        blurb="Full-text search across all three databases in a single request."
        eps={pick('/api/search')}
      />

      <Section
        title="Sequence analysis"
        blurb="Encode a sequence against one or many indices, and pull sequences straight from UniProt or the PDB."
        eps={pick('/api/window', '/api/encode', '/api/sequence')}
      />

      <Section
        title="AAIndex1"
        blurb="Physicochemical property indices — hydrophobicity, charge, secondary structure propensity, etc."
        eps={pick('/api/aaindex1', '/api/aaindex1/{accession}')}
      />

      <Section
        title="AAIndex2"
        blurb="Amino acid mutation matrices including PAM, BLOSUM, and custom substitution models."
        eps={pick('/api/aaindex2', '/api/aaindex2/{accession}')}
      />

      <Section
        title="AAIndex3"
        blurb="Pairwise contact potentials for protein structure analysis and folding energy calculations."
        eps={pick('/api/aaindex3', '/api/aaindex3/{accession}')}
      />

      <Section
        title="Metadata"
        blurb="Upstream release date and the PubMed proxy behind each record's abstract."
        eps={pick('/api/aaindex-updated', '/api/pubmed/{pmid}')}
      />

      {/* Notes */}
      <section className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 text-sm text-indigo-800 dark:text-indigo-300 flex flex-col gap-2">
        <p className="font-semibold">Notes</p>
        <ul className="list-disc list-inside flex flex-col gap-1 text-xs">
          <li>All accession codes are case-insensitive (e.g. <code className="font-mono">kytj820101</code> and <code className="font-mono">KYTJ820101</code> are equivalent).</li>
          <li>Successful responses are cached for 24 hours at the edge. Errors are never cached.</li>
          <li>List endpoints accept <code className="font-mono">?format=csv</code> or <code className="font-mono">?format=tsv</code> as well as the default JSON.</li>
          <li>CORS is open (<code className="font-mono">Access-Control-Allow-Origin: *</code>) — no proxy required.</li>
          <li>Everything except <code className="font-mono">/api/encode</code> is read-only; other methods return <code className="font-mono">405 Method Not Allowed</code>.</li>
          <li>This page and <a className="underline" href="/api/openapi">/api/openapi</a> are generated from the same source, so they cannot drift apart.</li>
        </ul>
      </section>
    </div>
  )
}
