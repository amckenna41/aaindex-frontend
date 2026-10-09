import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAAIndexStore } from '../store/useAAIndexStore'
import { exportComparisonAsCSV } from '../lib/exportUtils'
import CompareChart from '../components/CompareChart'
import ExportButton from '../components/ExportButton'
import { AAIndex1DB } from '../types'
import { AA_ORDER_ALPHA } from '../lib/aminoAcids'
import { zScoreNormalise } from '../lib/seqUtils'

import db1 from '../data/aaindex1.json'

const DB1 = db1 as unknown as AAIndex1DB

const PALETTE = ['#2F5BFF', 'currentColor', '#9A9A98', '#2F5BFF55']

export default function Comparator() {
  const { selectedAccessions, removeFromCompare, clearCompare, normalise, setNormalise, addToCompare } = useAAIndexStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [copied, setCopied] = useState(false)

  // Capture initial URL ids once (during render, before effects)
  const initialIds = useRef(searchParams.get('ids'))
  // Skip the first sync run when we loaded from URL (store hasn't updated yet at that point)
  const syncSkipsLeft = useRef(initialIds.current ? 1 : 0)

  // Hydrate store from URL on mount
  useEffect(() => {
    const raw = initialIds.current
    if (!raw) return
    const accs = raw.split(',').filter((a) => a in DB1).slice(0, 4)
    clearCompare()
    accs.forEach(addToCompare)
    setNormalise(searchParams.get('norm') === 'zscore')
  }, []) 

  // Sync store → URL on every state change
  useEffect(() => {
    if (syncSkipsLeft.current > 0) { syncSkipsLeft.current--; return }
    const params: Record<string, string> = {}
    if (selectedAccessions.length) params.ids = selectedAccessions.join(',')
    if (normalise) params.norm = 'zscore'
    setSearchParams(params, { replace: true })
  }, [selectedAccessions, normalise, setSearchParams])

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Show empty state only when there's genuinely nothing (not during URL hydration)
  if (selectedAccessions.length === 0 && !initialIds.current) {
    return (
      <div className="text-center py-24 flex flex-col items-center gap-4">
        <p className="text-gray-400 dark:text-gray-500">No records selected</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">Add records from the Explorer to compare them here.</p>
        <Link to="/explorer" className="btn-primary mt-4">
          Go to Explorer →
        </Link>
      </div>
    )
  }

  if (selectedAccessions.length === 0) return null // brief hydration tick

  const records = Object.fromEntries(
    selectedAccessions.filter((acc) => acc in DB1).map((acc) => [acc, DB1[acc]])
  )

  // Apply z-score normalisation per record when toggled
  const displayRecords = normalise
    ? Object.fromEntries(
        Object.entries(records).map(([acc, r]) => [
          acc,
          { ...r, values: zScoreNormalise(r.values as Record<string, number>) },
        ])
      )
    : records

  const valRecords = Object.fromEntries(
    Object.entries(records).map(([acc, r]) => [acc, r.values])
  )

  const amber = 'text-gray-500 dark:text-gray-400'

  return (
    <div className="flex flex-col gap-16">
      <header className="flex flex-col gap-6">
        <p className="label">Comparator</p>
        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight">Compare records</h1>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3 text-sm">
          <label className="flex items-baseline gap-2 cursor-pointer text-gray-500 dark:text-gray-400">
            <input
              type="checkbox"
              checked={normalise}
              onChange={(e) => setNormalise(e.target.checked)}
            />
            z-score normalise
          </label>
          <button onClick={handleCopy} className="btn-text">
            {copied ? '✓ Copied' : 'Share'}
          </button>
          <button onClick={clearCompare} className="btn-text">
            Clear all
          </button>
        </div>
        {normalise && (
          <p className={`text-sm ${amber}`}>
            Values are z-score normalised per record. Raw values differ across records; normalisation centres each to mean=0, std=1 for fair visual comparison.
          </p>
        )}
      </header>

      {/* Columns: one per record, hairline-divided, snap-scrolling on narrow screens */}
      <div className="overflow-x-auto snap-x snap-mandatory -mx-6 px-6 sm:mx-0 sm:px-0">
        <div className="grid grid-flow-col auto-cols-[minmax(14rem,1fr)] divide-x divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800">
          {selectedAccessions.map((acc, i) => (
            <div key={acc} className="snap-start flex flex-col gap-3 py-6 px-6 first:pl-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-sm flex items-baseline gap-2">
                  <span aria-hidden className="inline-block w-2 h-2" style={{ background: PALETTE[i % PALETTE.length] }} />
                  <Link to={`/records/${acc}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">{acc}</Link>
                </span>
                <button
                  onClick={() => removeFromCompare(acc)}
                  className="btn-text"
                  aria-label={`Remove ${acc}`}
                >
                  Remove
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">{DB1[acc]?.description}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">{DB1[acc]?.category}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <section className="flex flex-col gap-6">
        <h2 className="label">Grouped Bar Chart {normalise && <span>(z-score)</span>}</h2>
        <CompareChart accessions={selectedAccessions} records={displayRecords as AAIndex1DB} />
      </section>

      {/* Values table */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="label">Values Table {normalise && <span>(z-score)</span>}</h2>
          {selectedAccessions.length > 1 && (
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
              <span><span className="text-indigo-600 dark:text-indigo-400">Blue</span> Highest value for that amino acid across indices</span>
              <span><span className="text-gray-400 dark:text-gray-500 underline underline-offset-4">Underlined</span> Lowest value for that amino acid across indices</span>
              {!normalise && <span className={amber}>Raw scales differ; enable z-score to compare fairly</span>}
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="text-sm w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-2 pr-4 font-normal text-gray-400 dark:text-gray-500">AA</th>
                {selectedAccessions.map((acc) => (
                  <th key={acc} className="text-right py-2 px-3 font-mono font-normal text-gray-500 dark:text-gray-400">
                    {acc}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AA_ORDER_ALPHA.map((aa) => {
                const vals = selectedAccessions.map((acc) => displayRecords[acc]?.values[aa] ?? null)
                const defined = vals.filter((v): v is number => v != null)
                const rowMin = defined.length ? Math.min(...defined) : null
                const rowMax = defined.length ? Math.max(...defined) : null

                return (
                  <tr key={aa} className="border-b border-gray-200 dark:border-gray-800">
                    <td className="py-2 pr-4 font-mono">{aa}</td>
                    {vals.map((v, i) => (
                      <td
                        key={i}
                        className={`py-2 px-3 text-right font-mono ${
                          v === rowMax && defined.length > 1
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : v === rowMin && defined.length > 1
                            ? 'text-gray-400 dark:text-gray-500 underline underline-offset-4'
                            : ''
                        }`}
                      >
                        {v != null ? v.toFixed(4) : '—'}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Export */}
      <div>
        <ExportButton
          onClick={() => exportComparisonAsCSV(selectedAccessions, valRecords as Record<string, Record<string, number>>)}
          label="Export comparison CSV (raw values)"
        />
      </div>
    </div>
  )
}
