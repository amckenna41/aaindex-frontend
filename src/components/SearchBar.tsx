import { useAAIndexStore } from '../store/useAAIndexStore'
import { useRef, useCallback } from 'react'

interface Props {
  resultCount: number
  totalCount: number
}

export default function SearchBar({ resultCount, totalCount }: Props) {
  const searchQuery = useAAIndexStore((s) => s.searchQuery)
  const setSearchQuery = useAAIndexStore((s) => s.setSearchQuery)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setSearchQuery(val), 200)
    },
    [setSearchQuery]
  )

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          defaultValue={searchQuery}
          onChange={handleChange}
          placeholder="Search accession, description, category…"
          className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('')
              const input = document.querySelector('input[type=text]') as HTMLInputElement
              if (input) input.value = ''
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {searchQuery
          ? `${resultCount} of ${totalCount} results`
          : `${totalCount} records`}
      </p>
    </div>
  )
}
