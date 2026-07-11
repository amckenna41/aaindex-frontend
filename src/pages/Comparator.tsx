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

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e']

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
      <div className="text-center py-20">
        <p className="text-xl font-semibold mb-2">No records selected</p>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Add records from the Explorer to compare them here.</p>
        <Link
          to="/explorer"
          className="inline-block bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700"
        >
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header chips */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-semibold">Comparing:</span>
        {selectedAccessions.map((acc, i) => (
          <span
            key={acc}
            className="flex items-center gap-1 text-sm px-3 py-1 rounded-full font-mono"
            style={{ backgroundColor: PALETTE[i % PALETTE.length] + '22', color: PALETTE[i % PALETTE.length] }}
          >
            {acc}
            <button
              onClick={() => removeFromCompare(acc)}
              className="ml-1 hover:opacity-60"
              aria-label={`Remove ${acc}`}
            >
              ✕
            </button>
          </span>
        ))}
        <button onClick={clearCompare} className="text-sm text-gray-500 hover:text-red-600 ml-2">
          Clear all
        </button>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {copied ? '✓ Copied' : '🔗 Share'}
          </button>

        {/* Normalisation toggle */}
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={normalise}
            onChange={(e) => setNormalise(e.target.checked)}
            className="accent-indigo-600"
          />
          z-score normalise
        </label>
        </div>
      </div>

      {normalise && (
        <p className="text-xs text-amber-600 dark:text-amber-400 -mt-2">
          Values are z-score normalised per record. Raw values differ across records; normalisation centres each to mean=0, std=1 for fair visual comparison.
        </p>
      )}

      {/* Chart */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Grouped Bar Chart {normalise && <span className="text-xs font-normal text-amber-500">(z-score)</span>}</h2>
        <CompareChart accessions={selectedAccessions} records={displayRecords as AAIndex1DB} />
      </div>

      {/* Values table */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Values Table {normalise && <span className="text-xs font-normal text-amber-500">(z-score)</span>}</h2>
        <div className="overflow-x-auto">
          <table className="text-sm w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">AA</th>
                {selectedAccessions.map((acc, i) => (
                  <th
                    key={acc}
                    className="text-right py-2 px-3 font-mono font-medium"
                    style={{ color: PALETTE[i % PALETTE.length] }}
                  >
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
                  <tr key={aa} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <td className="py-1.5 pr-4 font-mono font-semibold">{aa}</td>
                    {vals.map((v, i) => (
                      <td
                        key={i}
                        className={`py-1.5 px-3 text-right font-mono text-xs rounded ${
                          v === rowMax && defined.length > 1
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : v === rowMin && defined.length > 1
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
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
      </div>

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
