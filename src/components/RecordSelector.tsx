import { useState, useMemo } from 'react'
import { AAIndex1DB } from '../types'
import db1 from '../data/aaindex1.json'

const DB1 = db1 as unknown as AAIndex1DB
const ALL_ACCS = Object.keys(DB1)

interface Props {
  accession: string
  onChange: (a: string) => void
  /** Number of visible rows in the listbox. Defaults to 8. */
  size?: number
}

export default function RecordSelector({ accession, onChange, size = 8 }: Props) {
  const [filter, setFilter] = useState('')
  const filtered = useMemo(
    () =>
      ALL_ACCS.filter(
        (a) =>
          a.toLowerCase().includes(filter.toLowerCase()) ||
          DB1[a].description.toLowerCase().includes(filter.toLowerCase()),
      ),
    [filter],
  )

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        AAIndex1 record
      </span>
      <input
        type="text"
        placeholder="Filter records…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <select
        value={accession}
        onChange={(e) => onChange(e.target.value)}
        size={size}
        className="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {filtered.map((a) => (
          <option key={a} value={a} title={DB1[a].description}>
            {a}
          </option>
        ))}
      </select>
      <p
        className="text-xs text-gray-500 dark:text-gray-400 italic truncate"
        title={DB1[accession]?.description}
      >
        {DB1[accession]?.description}
      </p>
    </div>
  )
}
