import { useState } from 'react'

export interface FetchedEntry {
  id: string
  description: string
  sequence: string
  length: number
}

interface Props {
  onLoad: (entries: FetchedEntry[], sourceLabel: string) => void
}

/** Pulls a sequence straight from UniProt or the PDB, so an analysis doesn't
 *  require having a FASTA file to hand. */
export default function SequenceFetch({ onLoad }: Props) {
  const [id, setId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchSeq = async () => {
    const trimmed = id.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/sequence?id=${encodeURIComponent(trimmed)}`)
      const json = await res.json()
      if (!res.ok) {
        setError(typeof json?.error === 'string' ? json.error : 'Lookup failed')
        return
      }
      onLoad(json.entries as FetchedEntry[], `${trimmed} (${json.source})`)
    } catch {
      setError('Could not reach the sequence service')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Fetch by accession
      </span>
      <div className="flex gap-1">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchSeq()}
          placeholder="P01308 or 1CRN_A"
          aria-label="UniProt or PDB accession"
          className="flex-1 min-w-0 px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={fetchSeq}
          disabled={loading || !id.trim()}
          className="shrink-0 px-2.5 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40"
        >
          {loading ? '…' : 'Fetch'}
        </button>
      </div>
      <p className="text-xs text-gray-400">UniProt accession or PDB id (chain optional).</p>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
