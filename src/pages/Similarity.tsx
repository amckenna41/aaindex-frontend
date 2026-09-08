import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { AAIndex1DB } from '../types'
import { AA_ORDER_ALPHA } from '../lib/aminoAcids'
import { pca2 } from '../lib/pca'
import { pearsonR } from '../lib/seqUtils'
import { categoryColour } from '../lib/categories'
import ShareLink from '../components/ShareLink'

import db1 from '../data/aaindex1.json'

const DB1 = db1 as unknown as AAIndex1DB

// Distinct enough to tell a dozen categories apart at scatter-point size.
const CATEGORY_DOT: Record<string, string> = {
  hydrophobic: '#2563eb',
  charge:      '#dc2626',
  sec_struct:  '#9333ea',
  volume:      '#16a34a',
  polar:       '#ca8a04',
  composition: '#ea580c',
  solvent:     '#0d9488',
  geometry:    '#4f46e5',
  mutability:  '#db2777',
  flexibility: '#65a30d',
  meta:        '#6b7280',
  observable:  '#64748b',
  other:       '#94a3b8',
}

interface Point {
  accession: string
  description: string
  category: string
  x: number
  y: number
}

export default function Similarity() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selected, setSelected] = useState<string | null>(() => {
    const acc = searchParams.get('acc')?.toUpperCase()
    return acc && Object.hasOwn(DB1, acc) ? acc : null
  })
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('cat') ?? '')

  const accessions = useMemo(() => Object.keys(DB1), [])

  const categories = useMemo(
    () => [...new Set(Object.values(DB1).map((r) => r.category))].sort(),
    [],
  )

  // One PCA over the whole database — computed once, then filtered for display,
  // so the axes stay comparable whichever category you're looking at.
  const { points, explained } = useMemo(() => {
    const matrix = accessions.map((acc) =>
      AA_ORDER_ALPHA.map((aa) => {
        const v = DB1[acc].values[aa]
        return v != null && isFinite(v) ? v : null
      }),
    )
    const result = pca2(matrix)
    const pts: Point[] = accessions.map((acc, i) => ({
      accession: acc,
      description: DB1[acc].description,
      category: DB1[acc].category,
      x: result.scores[i]?.[0] ?? 0,
      y: result.scores[i]?.[1] ?? 0,
    }))
    return { points: pts, explained: result.explained }
  }, [accessions])

  const shown = useMemo(
    () => (categoryFilter ? points.filter((p) => p.category === categoryFilter) : points),
    [points, categoryFilter],
  )

  // Nearest neighbours by correlation across the 20 amino-acid values. The
  // per-record correlation_coefficients only cover part of the database.
  const neighbours = useMemo(() => {
    if (!selected) return []
    const target = AA_ORDER_ALPHA.map((aa) => DB1[selected].values[aa])
    const valid = target.map((v) => v != null && isFinite(v))
    return accessions
      .filter((acc) => acc !== selected)
      .map((acc) => {
        const other = AA_ORDER_ALPHA.map((aa) => DB1[acc].values[aa])
        const xs: number[] = []
        const ys: number[] = []
        for (let i = 0; i < target.length; i++) {
          if (!valid[i]) continue
          const o = other[i]
          if (o == null || !isFinite(o)) continue
          xs.push(target[i])
          ys.push(o)
        }
        return { accession: acc, r: xs.length >= 3 ? pearsonR(xs, ys) : 0 }
      })
      .sort((a, b) => Math.abs(b.r) - Math.abs(a.r))
      .slice(0, 12)
  }, [selected, accessions])

  const select = (acc: string | null) => {
    setSelected(acc)
    const params: Record<string, string> = {}
    if (acc) params.acc = acc
    if (categoryFilter) params.cat = categoryFilter
    setSearchParams(params, { replace: true })
  }

  const filterBy = (cat: string) => {
    setCategoryFilter(cat)
    const params: Record<string, string> = {}
    if (selected) params.acc = selected
    if (cat) params.cat = cat
    setSearchParams(params, { replace: true })
  }

  return (
    <div className="flex gap-6">
      <aside className="w-64 shrink-0 flex flex-col gap-4">
        <div>
          <h1 className="font-semibold mb-1">Property Space</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Every aaindex1 record projected onto the first two principal components of
            its 20 amino-acid values. Indices that measure the same thing land together.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Category
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => filterBy(e.target.value)}
            className="px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All categories ({points.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1">
          <span>PC1 explains {(explained[0] * 100).toFixed(1)}% of variance</span>
          <span>PC2 explains {(explained[1] * 100).toFixed(1)}%</span>
          <span>{shown.length} of {points.length} records shown</span>
        </div>

        {selected && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Most correlated with {selected}
            </span>
            <ul className="flex flex-col gap-0.5 max-h-80 overflow-y-auto">
              {neighbours.map((n) => (
                <li key={n.accession}>
                  <button
                    onClick={() => select(n.accession)}
                    className="w-full flex items-center gap-2 text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    title={DB1[n.accession].description}
                  >
                    <span className={`shrink-0 font-mono text-xs ${n.r >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                      {n.r > 0 ? '+' : ''}{n.r.toFixed(2)}
                    </span>
                    <span className="font-mono text-xs truncate">{n.accession}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate(`/records/${selected}`)}
              className="text-sm px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Open {selected}
            </button>
          </div>
        )}

        <ShareLink />
      </aside>

      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <ResponsiveContainer width="100%" height={520}>
            <ScatterChart margin={{ top: 8, right: 16, bottom: 32, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                dataKey="x"
                tick={{ fontSize: 11 }}
                label={{ value: `PC1 (${(explained[0] * 100).toFixed(1)}%)`, position: 'insideBottom', offset: -16, fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                tick={{ fontSize: 11 }}
                width={55}
                label={{ value: `PC2 (${(explained[1] * 100).toFixed(1)}%)`, angle: -90, position: 'insideLeft', fontSize: 11 }}
              />
              <ZAxis range={[36, 36]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const p = payload[0].payload as Point
                  return (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs shadow max-w-xs">
                      <div className="font-mono font-semibold">{p.accession}</div>
                      <div className="text-gray-500 dark:text-gray-400">{p.description}</div>
                      <div className="mt-1">
                        <span className={`px-1.5 py-0.5 rounded ${categoryColour(p.category)}`}>{p.category}</span>
                      </div>
                    </div>
                  )
                }}
              />
              <Scatter
                data={shown}
                onClick={(p: unknown) => select((p as Point).accession)}
                className="cursor-pointer"
              >
                {shown.map((p) => (
                  <Cell
                    key={p.accession}
                    fill={CATEGORY_DOT[p.category] ?? CATEGORY_DOT.other}
                    fillOpacity={selected && p.accession !== selected ? 0.45 : 0.85}
                    stroke={p.accession === selected ? '#111827' : 'none'}
                    strokeWidth={p.accession === selected ? 2 : 0}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          <div className="flex flex-wrap gap-2 mt-3">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => filterBy(categoryFilter === c ? '' : c)}
                className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  categoryFilter === c
                    ? 'border-gray-400 dark:border-gray-500'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_DOT[c] ?? CATEGORY_DOT.other }} />
                <span className="text-gray-600 dark:text-gray-400">{c}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Click a point to pin it and list its nearest neighbours by Pearson correlation
          across all 20 values — computed live, so it covers every record rather than only
          the pairs AAIndex ships coefficients for.
        </p>
      </div>
    </div>
  )
}
