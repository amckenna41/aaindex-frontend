import { useEffect, useState } from 'react'

const cache = new Map<string, string>()

async function fetchAbstract(pmid: string): Promise<string> {
  if (cache.has(pmid)) return cache.get(pmid)!
  const res = await fetch(`/api/pubmed/${pmid}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const json = await res.json() as { abstract: string }
  cache.set(pmid, json.abstract)
  return json.abstract
}

interface Props {
  pmid: string
}

export default function PubMedAbstract({ pmid }: Props) {
  const [abstract, setAbstract] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open || !pmid) return
    if (cache.has(pmid)) { setAbstract(cache.get(pmid)!); return }
    setLoading(true)
    setError(null)
    fetchAbstract(pmid)
      .then(setAbstract)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [open, pmid])

  if (!pmid) return null

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">PubMed Abstract</h2>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          {open ? 'Hide' : 'Load abstract'}
        </button>
      </div>

      {!open && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          PMID: {pmid} — click "Load abstract" to fetch from NCBI PubMed.
        </p>
      )}

      {open && loading && (
        <p className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">Fetching from NCBI…</p>
      )}

      {open && error && (
        <p className="text-xs text-red-500">Failed to fetch: {error}</p>
      )}

      {open && abstract && !loading && (
        <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto mt-2">
          {abstract}
        </pre>
      )}
    </div>
  )
}
