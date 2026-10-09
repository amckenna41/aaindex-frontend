import { useState } from 'react'
import { saveAs } from 'file-saver'
import { ENDPOINTS, type Endpoint } from '../lib/apiSpec'
import { snippet, SNIPPET_LANGS, type SnippetLang } from '../lib/snippets'
import { downloadAAIndex } from '../lib/aaindexFormat'
import type { AAIndex1DB, AAIndex2DB, AAIndex3DB } from '../types'

const BASE = typeof window !== 'undefined' ? window.location.origin : ''
const SNIPPET_BASE = BASE || 'https://aaindex.vercel.app'

// Loaded on click, so the ~2 MB of data stays out of this page's bundle.
const LOADERS = {
  aaindex1: () => import('../data/aaindex1.json'),
  aaindex2: () => import('../data/aaindex2.json'),
  aaindex3: () => import('../data/aaindex3.json'),
} as const
type DBName = keyof typeof LOADERS

function Badge({ type }: { type: string }) {
  return (
    <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{type}</span>
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
    <div className="flex flex-col gap-3">
      <p className="label">Try it</p>
      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 font-mono text-[13px] px-3 py-2 border border-gray-200 dark:border-gray-800 bg-transparent focus:ring-2 focus:ring-indigo-500 min-w-0"
        />
        <button
          onClick={run}
          disabled={loading}
          className="btn-primary shrink-0"
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
      {result && (
        <pre className="text-[13px] font-mono bg-gray-50 dark:bg-gray-900 rounded-sm p-4 overflow-x-auto max-h-72 overflow-y-auto">
          {result}
        </pre>
      )}
    </div>
  )
}

function Snippets({ ep }: { ep: Endpoint }) {
  const [lang, setLang] = useState<SnippetLang>('curl')
  const [copied, setCopied] = useState(false)
  const code = snippet(ep, lang, SNIPPET_BASE)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked — the code is still selectable.
    }
  }

  return (
    <div>
      <div className="flex items-baseline gap-4 mb-3">
        <p className="label">Code</p>
        {SNIPPET_LANGS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLang(l.id)}
            aria-pressed={lang === l.id}
            className={`text-sm underline-offset-[6px] ${
              lang === l.id
                ? 'text-indigo-600 dark:text-indigo-400 underline'
                : 'text-gray-500 dark:text-gray-400 hover:text-ink dark:hover:text-gray-100'
            }`}
          >
            {l.label}
          </button>
        ))}
        <button onClick={copy} className="ml-auto btn-text">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="text-[13px] font-mono bg-gray-50 dark:bg-gray-900 rounded-sm p-4 overflow-x-auto">{code}</pre>
    </div>
  )
}

function DatabaseDownload({ name, label }: { name: DBName; label: string }) {
  const [busy, setBusy] = useState(false)

  const download = async (format: 'json' | 'flat') => {
    setBusy(true)
    try {
      const db = (await LOADERS[name]()).default
      if (format === 'json') {
        saveAs(new Blob([JSON.stringify(db)], { type: 'application/json' }), `${name}.json`)
      } else {
        downloadAAIndex(db as unknown as AAIndex1DB | AAIndex2DB | AAIndex3DB, name)
      }
    } finally {
      setBusy(false)
    }
  }

  const btn = 'btn-text'
  return (
    <div className="flex items-baseline justify-between gap-3 py-4">
      <span className="font-mono text-sm">{label}</span>
      <div className="flex gap-6">
        <button disabled={busy} onClick={() => download('json')} className={btn}>↓ JSON</button>
        <button disabled={busy} onClick={() => download('flat')} className={btn}>↓ AAIndex flat file</button>
      </div>
    </div>
  )
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false)

  const pathDisplay = ep.path.replace(/\{(\w+)\}/g, (_, p) =>
    `{${p}}`
  )

  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group w-full flex items-baseline gap-4 py-4 text-left"
      >
        <span className="shrink-0 w-10 font-mono text-xs text-gray-400 dark:text-gray-500">
          {ep.method}
        </span>
        <span className="font-mono text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
          {pathDisplay}
        </span>
        <span aria-hidden className="ml-auto shrink-0 text-gray-400 dark:text-gray-500 text-[10px]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="pb-10 pl-14 flex flex-col gap-8">
          <p className="text-gray-600 dark:text-gray-400">{ep.description}</p>

          {ep.params && ep.params.length > 0 && (
            <div>
              <p className="label mb-2">Parameters</p>
              <div className="flex flex-col gap-2">
                {ep.params.map((p) => (
                  <div key={p.name} className="flex items-baseline gap-3 text-sm">
                    <code className="shrink-0 font-mono text-[13px]">
                      {p.name}
                    </code>
                    <Badge type={p.in === 'path' ? 'path' : p.type} />
                    <span className="text-gray-500 dark:text-gray-400">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="label mb-2">Example response</p>
            <pre className="text-[13px] font-mono bg-gray-50 dark:bg-gray-900 rounded-sm p-4 overflow-x-auto max-h-72 overflow-y-auto">
              {ep.sampleResponse}
            </pre>
          </div>

          <Snippets ep={ep} />

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
    <section className="flex flex-col">
      <div className="flex flex-col gap-2 pb-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="label">{title}</h2>
        {blurb && <p className="text-sm text-gray-500 dark:text-gray-400">{blurb}</p>}
      </div>
      {eps.map((ep) => <EndpointCard key={`${ep.method} ${ep.path}`} ep={ep} />)}
    </section>
  )

  return (
    <div className="flex flex-col gap-16">
      {/* Header */}
      <header className="flex flex-col gap-4">
        <p className="label">Developers</p>
        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight">API Reference</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
          REST API for the AAIndex database. Endpoints return JSON (list endpoints also speak
          <code className="font-mono mx-1">?format=csv</code> and <code className="font-mono">tsv</code>) and support CORS —
          suitable for programmatic access from any origin.
        </p>
        <div className="flex items-baseline gap-x-3 gap-y-2 flex-wrap text-sm text-gray-500 dark:text-gray-400">
          <span className="font-mono">Base URL: {BASE || 'https://your-domain.vercel.app'}</span>
          <span aria-hidden className="text-gray-300 dark:text-gray-700">·</span>
          <span>No auth required</span>
          <span aria-hidden className="text-gray-300 dark:text-gray-700">·</span>
          <a href="/api/openapi" className="btn-text">
            OpenAPI 3.1 spec ↗
          </a>
        </div>
      </header>

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

      <section className="flex flex-col">
        <div className="flex flex-col gap-2 pb-4">
          <h2 className="label">Download the full database</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Every record with all its values, straight from the data this API serves — for offline work or bulk
            analysis without paging through the list endpoints.
          </p>
        </div>
        <div className="border-y border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
          <DatabaseDownload name="aaindex1" label="AAIndex1" />
          <DatabaseDownload name="aaindex2" label="AAIndex2" />
          <DatabaseDownload name="aaindex3" label="AAIndex3" />
        </div>
      </section>

      {/* Notes */}
      <section className="flex flex-col gap-4 text-gray-600 dark:text-gray-400">
        <h2 className="label">Notes</h2>
        <ul className="list-disc pl-5 flex flex-col gap-2 marker:text-gray-300 dark:marker:text-gray-700">
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
