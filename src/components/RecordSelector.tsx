import { useState, useMemo } from 'react'
import { AAIndex1DB } from '../types'
import db1 from '../data/aaindex1.json'

const DB1 = db1 as unknown as AAIndex1DB
const ALL_ACCS = Object.keys(DB1)

interface Props {
  accession: string
  /** Records to pick from. Defaults to AAIndex1. */
  db?: Record<string, { description: string }>
  label?: string
  onChange: (a: string) => void
  /** Number of visible rows in the listbox. Defaults to 8. */
  size?: number
}

export default function RecordSelector({ accession, onChange, size = 8, db = DB1, label = 'AAIndex1 record' }: Props) {
  const [filter, setFilter] = useState('')
  const accs = useMemo(() => (db === DB1 ? ALL_ACCS : Object.keys(db)), [db])
  const filtered = useMemo(
    () =>
      accs.filter(
        (a) =>
          a.toLowerCase().includes(filter.toLowerCase()) ||
          db[a].description.toLowerCase().includes(filter.toLowerCase()),
      ),
    [filter, accs, db],
  )

  return (
    <div className="flex flex-col gap-1">
      <span className="label">
        {label}
      </span>
      <input
        type="text"
        placeholder="Filter records…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full px-2 py-1.5 rounded-sm border border-gray-200 dark:border-gray-800 bg-transparent text-xs focus:ring-2 focus:ring-indigo-500"
      />
      <select
        value={accession}
        onChange={(e) => onChange(e.target.value)}
        size={size}
        className="w-full rounded-sm border border-gray-200 dark:border-gray-800 bg-transparent text-xs focus:ring-2 focus:ring-indigo-500"
      >
        {filtered.map((a) => (
          <option key={a} value={a} title={db[a].description}>
            {a}
          </option>
        ))}
      </select>
      <p
        className="text-xs text-gray-500 dark:text-gray-400 italic truncate"
        title={db[accession]?.description}
      >
        {db[accession]?.description}
      </p>
    </div>
  )
}
