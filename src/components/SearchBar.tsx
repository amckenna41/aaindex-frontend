import { useAAIndexStore } from '../store/useAAIndexStore'
import { useRef, useCallback, useState, useEffect } from 'react'

interface Props {
  resultCount: number
  totalCount: number
}

export default function SearchBar({ resultCount, totalCount }: Props) {
  const searchQuery = useAAIndexStore((s) => s.searchQuery)
  const setSearchQuery = useAAIndexStore((s) => s.setSearchQuery)
  const [localVal, setLocalVal] = useState(searchQuery)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync store → local when the store is cleared externally (e.g. DB switch).
  useEffect(() => {
    setLocalVal(searchQuery)
  }, [searchQuery])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setLocalVal(val)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setSearchQuery(val), 200)
    },
    [setSearchQuery],
  )

  const handleClear = () => {
    setLocalVal('')
    setSearchQuery('')
    if (timer.current) clearTimeout(timer.current)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          value={localVal}
          onChange={handleChange}
          placeholder="Search accession, description, category…"
          className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {localVal && (
          <button
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {localVal
          ? `${resultCount} of ${totalCount} results`
          : `${totalCount} records`}
      </p>
    </div>
  )
}

