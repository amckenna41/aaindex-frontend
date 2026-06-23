import { useMemo, useState } from 'react'
import { AAIndex1DB } from '../types'
import { AA_ORDER_ALPHA, AA_FULL_NAMES } from '../lib/aminoAcids'
import { CATEGORY_COLOURS } from '../lib/categories'

import db1 from '../data/aaindex1.json'

const DB1 = db1 as unknown as AAIndex1DB

function stddev(vals: number[], mean: number): number {
  if (vals.length < 2) return 0
  return Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length)
}

interface AAStat { mean: number; min: number; max: number; std: number; n: number }

function computeCategoryStats(category: string): Record<string, AAStat> {
  const records = Object.values(DB1).filter((r) => r.category === category)
  const result: Record<string, AAStat> = {}
  for (const aa of AA_ORDER_ALPHA) {
    const vals = records
      .map((r) => r.values[aa])
      .filter((v): v is number => v != null && isFinite(v))
    if (!vals.length) continue
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    result[aa] = { mean, min: Math.min(...vals), max: Math.max(...vals), std: stddev(vals, mean), n: vals.length }
  }
  return result
}

const CATEGORIES = [...new Set(Object.values(DB1).map((r) => r.category))].sort()

export default function CategoryStats() {
  const [selected, setSelected] = useState(CATEGORIES[0])

  const stats = useMemo(() => computeCategoryStats(selected), [selected])
  const recordCount = useMemo(
    () => Object.values(DB1).filter((r) => r.category === selected).length,
    [selected],
  )

  // For each AA, the range bar width is relative to the max range in this category.
  const maxRange = useMemo(
    () => Math.max(...Object.values(stats).map((s) => s.max - s.min), 1),
    [stats],
  )

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-48 shrink-0 flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
          Category
        </span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelected(cat)}
            className={`text-left px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              selected === cat
                ? 'bg-indigo-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${CATEGORY_COLOURS[selected] ?? CATEGORY_COLOURS.other}`}>
            {selected}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {recordCount} indices · statistics across all 20 amino acids
          </span>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400 w-28">AA</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">Mean</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">Std dev</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">Min</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">Max</th>
                  <th className="px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400 w-40">Range</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">n</th>
                </tr>
              </thead>
              <tbody>
                {AA_ORDER_ALPHA.map((aa) => {
                  const s = stats[aa]
                  if (!s) return null
                  const rangeWidth = ((s.max - s.min) / maxRange) * 100
                  const zeroOffset = s.min < 0 ? ((-s.min) / (s.max - s.min)) * rangeWidth : 0
                  return (
                    <tr key={aa} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <td className="px-4 py-2 font-mono font-semibold">
                        {aa}
                        <span className="ml-1.5 text-xs text-gray-400 font-sans font-normal">
                          {AA_FULL_NAMES[aa] ?? ''}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-xs">{s.mean.toFixed(3)}</td>
                      <td className="px-4 py-2 text-right font-mono text-xs text-gray-500 dark:text-gray-400">±{s.std.toFixed(3)}</td>
                      <td className="px-4 py-2 text-right font-mono text-xs text-red-600 dark:text-red-400">{s.min.toFixed(3)}</td>
                      <td className="px-4 py-2 text-right font-mono text-xs text-green-600 dark:text-green-400">{s.max.toFixed(3)}</td>
                      <td className="px-4 py-2">
                        <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" style={{ width: '120px' }}>
                          <div
                            className="absolute top-0 h-full bg-indigo-400 dark:bg-indigo-500 rounded-full"
                            style={{ left: `${zeroOffset}%`, width: `${rangeWidth}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-gray-400">{s.n}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Statistics computed across all {recordCount} aaindex1 records in the <em>{selected}</em> category.
          n = number of indices with a value for that amino acid.
        </p>
      </div>
    </div>
  )
}
