import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { AAIndex1DB } from '../types'
import { AA_ORDER_ALPHA } from '../lib/aminoAcids'
import { pca2 } from '../lib/pca'
import { pearsonR } from '../lib/seqUtils'
import ShareLink from '../components/ShareLink'

import db1 from '../data/aaindex1.json'

const DB1 = db1 as unknown as AAIndex1DB

// Quiet palette: points are ink-40; the pinned record carries the accent.
const DOT = '#A3A3A2'

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
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-3 max-w-2xl">
        <p className="label">Similarity</p>
        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight">Property Space</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Every aaindex1 record projected onto the first two principal components of
          its 20 amino-acid values. Indices that measure the same thing land together.
        </p>
      </header>
      <aside className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 items-start">

        <div className="flex flex-col gap-1">
          <span className="label">
            Category
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => filterBy(e.target.value)}
            className="px-2 py-1.5 rounded-sm border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500"
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
            <span className="label">
              Most correlated with {selected}
            </span>
            <ul className="flex flex-col gap-0.5 max-h-80 overflow-y-auto">
              {neighbours.map((n) => (
                <li key={n.accession}>
                  <button
                    onClick={() => select(n.accession)}
                    className="w-full flex items-baseline gap-4 text-left py-1.5 border-b border-gray-200 dark:border-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title={DB1[n.accession].description}
                  >
                    <span className={`shrink-0 font-mono text-xs ${n.r >= 0 ? '' : 'text-gray-400 dark:text-gray-500'}`}>
                      {n.r > 0 ? '+' : ''}{n.r.toFixed(2)}
                    </span>
                    <span className="font-mono text-xs truncate">{n.accession}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate(`/records/${selected}`)}
              className="btn-primary self-start"
            >
              Open {selected}
            </button>
          </div>
        )}

        <ShareLink />
      </aside>

      <div className="min-w-0 flex flex-col gap-12">
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <ResponsiveContainer width="100%" height={520}>
            <ScatterChart margin={{ top: 8, right: 16, bottom: 32, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E3E1" />
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
                    <div className="bg-paper dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs max-w-xs">
                      <div className="font-mono font-semibold">{p.accession}</div>
                      <div className="text-gray-500 dark:text-gray-400">{p.description}</div>
                      <div className="mt-1">
                        <span className="text-gray-400">{p.category}</span>
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
                    fill={p.accession === selected ? '#2F5BFF' : DOT}
                    fillOpacity={p.accession === selected ? 1 : 0.7}
                    stroke={p.accession === selected ? 'currentColor' : 'none'}
                    strokeWidth={p.accession === selected ? 2 : 0}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-6">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => filterBy(categoryFilter === c ? '' : c)}
                aria-pressed={categoryFilter === c}
                className={`text-sm underline-offset-[6px] ${
                  categoryFilter === c
                    ? 'text-indigo-600 dark:text-indigo-400 underline'
                    : 'text-gray-500 dark:text-gray-400 hover:text-ink dark:hover:text-gray-100'
                }`}
              >
                {c}
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
