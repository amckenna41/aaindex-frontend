import { useMemo, useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAAIndexStore } from '../store/useAAIndexStore'
import { buildSearchIndex } from '../lib/search'
import DBSwitcher from '../components/DBSwitcher'
import SearchBar from '../components/SearchBar'
import FilterPanel from '../components/FilterPanel'
import RecordCard from '../components/RecordCard'
import { AAIndex1DB, AAIndex2DB, AAIndex3DB, DBName } from '../types'

import db1 from '../data/aaindex1.json'

const DB1 = db1 as unknown as AAIndex1DB

const PAGE_SIZE = 20

// Lazy-loaded DB cache — populated on first switch to each DB.
const lazyCache: { aaindex2?: AAIndex2DB; aaindex3?: AAIndex3DB } = {}

export default function Explorer() {
  const { activeDB, searchQuery, categoryFilter, showOnlyFavourites, favourites, setBrowseList,
          setActiveDB, setSearchQuery, setCategoryFilter } = useAAIndexStore()
  const [page, setPage] = useState(1)
  const [jumpVal, setJumpVal] = useState('')
  const [lazyDB, setLazyDB] = useState<AAIndex2DB | AAIndex3DB | null>(null)
  const [lazyLoading, setLazyLoading] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const isFirstRender = useRef(true)

  // Single effect: hydrate from URL on first run, then sync state → URL on subsequent runs.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      const dbParam = searchParams.get('db')
      const qParam  = searchParams.get('q') || ''
      const catParam = searchParams.get('cat') || ''
      const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
      const validDBs: string[] = ['aaindex1', 'aaindex2', 'aaindex3']
      if (dbParam && validDBs.includes(dbParam)) setActiveDB(dbParam as DBName)
      if (qParam) setSearchQuery(qParam)
      if (catParam) setCategoryFilter(catParam)
      if (pageParam > 1) setPage(pageParam)
      return
    }
    const params: Record<string, string> = {}
    if (activeDB !== 'aaindex1') params.db = activeDB
    if (searchQuery) params.q = searchQuery
    if (categoryFilter) params.cat = categoryFilter
    if (page > 1) params.page = String(page)
    setSearchParams(params, { replace: true })
  }, [activeDB, searchQuery, categoryFilter, page])

  // Lazily import db2/db3 on first switch to that database.
  useEffect(() => {
    if (activeDB === 'aaindex1') { setLazyDB(null); return }
    const cached = lazyCache[activeDB as 'aaindex2' | 'aaindex3']
    if (cached) { setLazyDB(cached); return }

    let cancelled = false
    setLazyLoading(true)

    const mod = activeDB === 'aaindex2'
      ? import('../data/aaindex2.json')
      : import('../data/aaindex3.json')

    mod.then((m) => {
      if (cancelled) return
      const loaded = m.default as unknown as AAIndex2DB | AAIndex3DB
      lazyCache[activeDB as 'aaindex2' | 'aaindex3'] = loaded as never
      setLazyDB(loaded)
      setLazyLoading(false)
    })

    return () => { cancelled = true }
  }, [activeDB])

  const db: AAIndex1DB | AAIndex2DB | AAIndex3DB = activeDB === 'aaindex1' ? DB1 : (lazyDB ?? {} as AAIndex2DB)

  const allAccessions = useMemo(() => Object.keys(db), [db])

  const categories = useMemo(() => {
    if (activeDB !== 'aaindex1') return []
    return [...new Set(Object.values(DB1).map((r) => r.category))].sort()
  }, [activeDB])

  const fuseIndex = useMemo(() => buildSearchIndex(db), [db])

  const filtered = useMemo(() => {
    let accs = allAccessions

    if (searchQuery) {
      accs = fuseIndex.search(searchQuery).map((r) => r.item.accession)
    }

    if (categoryFilter && activeDB === 'aaindex1') {
      accs = accs.filter((acc) => DB1[acc]?.category === categoryFilter)
    }

    if (showOnlyFavourites && activeDB === 'aaindex1') {
      accs = accs.filter((acc) => favourites.includes(acc))
    }

    return accs
  }, [allAccessions, searchQuery, fuseIndex, categoryFilter, activeDB, showOnlyFavourites, favourites])

  // Reset page whenever the filtered set changes.
  useEffect(() => { setPage(1) }, [filtered])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageAccessions = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const jump = () => {
    const n = parseInt(jumpVal)
    if (n >= 1 && n <= totalPages) { setPage(n); setJumpVal('') }
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col gap-4">
        <DBSwitcher />
        <SearchBar resultCount={filtered.length} totalCount={allAccessions.length} />
        {activeDB === 'aaindex1' && <FilterPanel categories={categories} />}
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {lazyLoading && (
          <p className="text-sm text-gray-400 dark:text-gray-500 animate-pulse mb-4">Loading database…</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
          {pageAccessions.map((acc) => (
            <div key={acc} className="h-full" onClickCapture={() => setBrowseList(filtered)}>
              <RecordCard
                accession={acc}
                record={(db as Record<string, AAIndex1DB[string]>)[acc]}
                dbName={activeDB}
              />
            </div>
          ))}
          {!lazyLoading && pageAccessions.length === 0 && (
            <p className="col-span-2 text-gray-500 dark:text-gray-400 text-sm py-8 text-center">
              No records found.
            </p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-3 text-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ← Prev
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Next →
            </button>
            <div className="flex items-center gap-1 ml-2">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpVal}
                onChange={(e) => setJumpVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && jump()}
                placeholder="Go to…"
                className="w-20 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={jump}
                className="px-2 py-1.5 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Go
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
