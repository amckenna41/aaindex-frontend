import { useEffect, useState } from 'react'

interface PubMedData {
  title: string
  abstract: string
  authors: string
  journal: string
  year: string
}

const cache = new Map<string, PubMedData>()

async function fetchAbstract(pmid: string): Promise<PubMedData> {
  if (cache.has(pmid)) return cache.get(pmid)!
  const res = await fetch(`/api/pubmed/${pmid}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const json = await res.json() as PubMedData & { pmid: string }
  const data: PubMedData = {
    title: json.title ?? '',
    abstract: json.abstract ?? '',
    authors: json.authors ?? '',
    journal: json.journal ?? '',
    year: json.year ?? '',
  }
  cache.set(pmid, data)
  return data
}

interface Props {
  pmid: string
}

export default function PubMedAbstract({ pmid }: Props) {
  const [data, setData] = useState<PubMedData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open || !pmid) return
    if (cache.has(pmid)) { setData(cache.get(pmid)!); return }
    setLoading(true)
    setError(null)
    fetchAbstract(pmid)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [open, pmid])

  if (!pmid) return null

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="label">PubMed Abstract</h2>
        <button onClick={() => setOpen((o) => !o)} className="btn-text">
          {open ? 'Hide' : 'Load abstract'}
        </button>
      </div>

      {!open && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          PMID: <span className="font-mono">{pmid}</span> — click "Load abstract" to fetch from NCBI PubMed.
        </p>
      )}

      {open && loading && (
        <p className="text-sm text-gray-400 dark:text-gray-500">Fetching from NCBI…</p>
      )}

      {open && error && (
        <p className="text-sm text-red-600 dark:text-red-400">Failed to fetch abstract: {error}</p>
      )}

      {open && data && !loading && (
        <div className="flex flex-col gap-3">
          {data.title && <p className="font-medium leading-snug">{data.title}</p>}
          {(data.authors || data.journal || data.year) && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {[data.authors, data.journal, data.year].filter(Boolean).join(' · ')}
            </p>
          )}
          <pre className="whitespace-pre-wrap font-sans text-body max-h-96 overflow-y-auto text-gray-700 dark:text-gray-300">
            {data.abstract}
          </pre>
          <a
            href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-text self-start"
          >
            View on PubMed ↗
          </a>
        </div>
      )}
    </section>
  )
}
