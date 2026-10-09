import { useMemo, useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAAIndexStore } from '../store/useAAIndexStore'
import { buildSearchIndex } from '../lib/search'
import DBSwitcher from '../components/DBSwitcher'
import SearchBar from '../components/SearchBar'
import FilterPanel from '../components/FilterPanel'
import RecordCard from '../components/RecordCard'
import { AAIndex1DB, AAIndex2DB, AAIndex3DB, DBName } from '../types'
import { coverage } from '../lib/aminoAcids'

import db1 from '../data/aaindex1.json'

const DB1 = db1 as unknown as AAIndex1DB

const PAGE_SIZE = 20
const VALID_DBS: string[] = ['aaindex1', 'aaindex2', 'aaindex3']

// `db1Only` sorts need per-record fields that only aaindex1 has.
const SORTS = [
  { id: 'relevance', label: 'Default order' },
  { id: 'accession', label: 'Accession (A–Z)' },
  { id: 'name',      label: 'Description (A–Z)' },
  { id: 'category',  label: 'Category', db1Only: true },
  { id: 'missing',   label: 'Missing amino acids (most first)', db1Only: true },
] as const
type SortId = typeof SORTS[number]['id']

// Lazy-loaded DB cache — populated on first switch to each DB.
const lazyCache: { aaindex2?: AAIndex2DB; aaindex3?: AAIndex3DB } = {}

export default function Explorer() {
  const { activeDB, searchQuery, categoryFilter, showOnlyFavourites, favourites, setBrowseList,
          setActiveDB, setSearchQuery, setCategoryFilter } = useAAIndexStore()
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortId>('relevance')
  const [jumpVal, setJumpVal] = useState('')
  const [lazyDB, setLazyDB] = useState<AAIndex2DB | AAIndex3DB | null>(null)
  const [lazyLoading, setLazyLoading] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  // Last state snapshot written to the URL. A plain "is this the first run?"
  // ref is not enough: StrictMode replays mount effects with the *same* closure,
  // so the replay would take the sync branch with pre-hydration values and wipe
  // the whole query string. Comparing snapshots makes the effect idempotent.
  const syncedRef = useRef<string | null>(null)

  // Single effect: hydrate from URL on first run, then sync state → URL after.
  useEffect(() => {
    const snapshot = JSON.stringify([activeDB, searchQuery, categoryFilter, page, sort])

    if (syncedRef.current === null) {
      syncedRef.current = snapshot
      const dbParam = searchParams.get('db')
      const qParam  = searchParams.get('q') || ''
      const catParam = searchParams.get('cat') || ''
      const sortParam = searchParams.get('sort')
      const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
      if (dbParam && VALID_DBS.includes(dbParam)) setActiveDB(dbParam as DBName)
      if (qParam) setSearchQuery(qParam)
      if (catParam) setCategoryFilter(catParam)
      if (pageParam > 1) setPage(pageParam)
      if (SORTS.some((o) => o.id === sortParam)) setSort(sortParam as SortId)
      return
    }

    if (syncedRef.current === snapshot) return
    syncedRef.current = snapshot

    const params: Record<string, string> = {}
    if (activeDB !== 'aaindex1') params.db = activeDB
    if (searchQuery) params.q = searchQuery
    if (categoryFilter) params.cat = categoryFilter
    if (page > 1) params.page = String(page)
    if (sort !== 'relevance') params.sort = sort
    setSearchParams(params, { replace: true })
  }, [activeDB, searchQuery, categoryFilter, page, sort])

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

    const is1 = activeDB === 'aaindex1'
    const desc = (acc: string) => (db as Record<string, { description: string }>)[acc]?.description ?? ''
    const byAcc = (a: string, b: string) => a.localeCompare(b)
    switch (sort) {
      case 'accession': return [...accs].sort(byAcc)
      case 'name':      return [...accs].sort((a, b) => desc(a).localeCompare(desc(b)) || byAcc(a, b))
      case 'category':  return is1 ? [...accs].sort((a, b) => DB1[a].category.localeCompare(DB1[b].category) || byAcc(a, b)) : accs
      case 'missing':   return is1 ? [...accs].sort((a, b) => coverage(DB1[a].values) - coverage(DB1[b].values) || byAcc(a, b)) : accs
      default:          return accs
    }
  }, [allAccessions, searchQuery, fuseIndex, categoryFilter, activeDB, showOnlyFavourites, favourites, sort, db])

  // Reset to page 1 when the filter criteria actually change. Keyed on the
  // criteria rather than on "is this the first render?", because StrictMode
  // replays mount effects and a first-render flag would not survive it.
  const filterKey = `${activeDB}|${searchQuery}|${categoryFilter}|${showOnlyFavourites}`

  // The criteria the URL asked for. Hydration reaches this over a couple of
  // commits, and converging on it is not a user filter change — treating it as
  // one is what discarded a deep-linked ?page=N.
  const urlFilterKey = useRef(
    `${VALID_DBS.includes(searchParams.get('db') ?? '') ? searchParams.get('db') : 'aaindex1'}` +
    `|${searchParams.get('q') ?? ''}|${searchParams.get('cat') ?? ''}|false`,
  )
  const settled = useRef(filterKey === urlFilterKey.current)
  const lastFilterKey = useRef(filterKey)

  useEffect(() => {
    if (lastFilterKey.current === filterKey) return
    lastFilterKey.current = filterKey
    if (!settled.current) {
      if (filterKey === urlFilterKey.current) settled.current = true
      return
    }
    setPage(1)
  }, [filterKey])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageAccessions = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const jump = () => {
    const n = parseInt(jumpVal)
    if (n >= 1 && n <= totalPages) { setPage(n); setJumpVal('') }
  }

  const dot = <span aria-hidden className="text-gray-300 dark:text-gray-700">·</span>

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <p className="label">Amino acid index database</p>
        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight">Explorer</h1>
      </header>

      <div className="flex flex-col gap-6">
        <SearchBar resultCount={filtered.length} totalCount={allAccessions.length} />
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-3">
          <DBSwitcher />
          {dot}
          <div className="flex items-baseline gap-2">
            <label htmlFor="explorer-sort" className="label">
              Sort by
            </label>
            <select
              id="explorer-sort"
              value={activeDB !== 'aaindex1' && (sort === 'category' || sort === 'missing') ? 'relevance' : sort}
              onChange={(e) => { setSort(e.target.value as SortId); setPage(1) }}
              className="bg-transparent border-0 p-0 pr-6 text-sm text-ink dark:text-gray-100 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {SORTS.filter((o) => !('db1Only' in o) || activeDB === 'aaindex1').map((o) => (
                <option key={o.id} value={o.id}>{o.id === 'relevance' && searchQuery ? 'Best match' : o.label}</option>
              ))}
            </select>
          </div>
          {activeDB === 'aaindex1' && <>{dot}<FilterPanel categories={categories} /></>}
        </div>
      </div>

      <div>
        {lazyLoading && (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-24 text-center">Loading database…</p>
        )}

        <div className="border-t border-gray-200 dark:border-gray-800">
          {pageAccessions.map((acc) => (
            <div key={acc} onClickCapture={() => setBrowseList(filtered)}>
              <RecordCard
                accession={acc}
                record={(db as Record<string, AAIndex1DB[string]>)[acc]}
                dbName={activeDB}
              />
            </div>
          ))}
          {!lazyLoading && pageAccessions.length === 0 && (
            <p className="text-gray-400 dark:text-gray-500 py-24 text-center">
              {showOnlyFavourites && favourites.length === 0 ? 'No favourites yet.' : 'No records found.'}
            </p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-baseline justify-between gap-6 pt-10 text-sm">
            <div className="flex items-baseline gap-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-text"
              >
                ← Prev
              </button>
              <span className="text-gray-500 dark:text-gray-400 tabular-nums">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-text"
              >
                Next →
              </button>
            </div>
            <div className="flex items-baseline gap-3">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpVal}
                onChange={(e) => setJumpVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && jump()}
                placeholder="Go to…"
                className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-800 bg-transparent text-sm tabular-nums focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={jump} className="btn-text">
                Go
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
