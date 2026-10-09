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
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          type="text"
          value={localVal}
          onChange={handleChange}
          placeholder="Search accession, description, category…"
          className="w-full pr-16 py-2 bg-transparent border-0 border-b border-gray-300 dark:border-gray-700 !rounded-none text-lg placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-indigo-600 dark:focus:border-indigo-400 focus-visible:outline-none"
        />
        {localVal && (
          <button
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-0 top-1/2 -translate-y-1/2 btn-text"
          >
            Clear
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
        {localVal
          ? `${resultCount} of ${totalCount} results`
          : `${totalCount} records`}
      </p>
    </div>
  )
}
