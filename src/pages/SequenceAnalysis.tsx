import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts'
import { AAIndex1DB } from '../types'
import { encodeSequence, slidingWindowEncode, VALID_AAS } from '../lib/seqUtils'
import { exportEncodingAsCSV } from '../lib/exportUtils'
import { AA_FULL_NAMES } from '../lib/aminoAcids'
import { minOf, maxOf } from '../lib/statsUtils'
import { useUrlParam } from '../lib/useUrlParam'
import ShareLink from '../components/ShareLink'
import SequenceFetch from '../components/SequenceFetch'

import db1 from '../data/aaindex1.json'
import RecordSelector from '../components/RecordSelector'

const DB1 = db1 as unknown as AAIndex1DB
const ALL_ACCS = Object.keys(DB1)

type Tab = 'encoder' | 'window' | 'heatmap'

// ── Colour helpers ─────────────────────────────────────────────────────────────

function lerp(t: number, lo: string, hi: string): string {
  const p = (s: string) => [parseInt(s.slice(1,3),16), parseInt(s.slice(3,5),16), parseInt(s.slice(5,7),16)]
  const [ar,ag,ab] = p(lo)
  const [br,bg,bb] = p(hi)
  return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`
}

function heatColor(t: number): string {
  // t in [0,1]: blue → white → red
  if (t < 0.5) return lerp(t * 2, '#3b82f6', '#ffffff')
  return lerp((t - 0.5) * 2, '#ffffff', '#ef4444')
}

// ── Shared record selector sidebar ────────────────────────────────────────────

// ── Sequence input ─────────────────────────────────────────────────────────────

function SequenceInput({ seq, onChange }: { seq: string; onChange: (s: string) => void }) {
  const upper = seq.toUpperCase()
  const invalid = [...new Set(upper.split('').filter((c) => c.trim() && !VALID_AAS.has(c)))]

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Protein sequence (single-letter code)
      </span>
      <textarea
        value={seq}
        onChange={(e) => onChange(e.target.value.replace(/\s/g, ''))}
        placeholder="e.g. ACDEFGHIKLMNPQRSTVWY"
        rows={3}
        className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{upper.length} residues</span>
        {invalid.length > 0 && (
          <span className="text-amber-600 dark:text-amber-400">
            Unknown chars: {invalid.join(', ')} (will show as missing)
          </span>
        )}
      </div>
    </div>
  )
}

// ── Tab: Sequence Encoder ──────────────────────────────────────────────────────

function EncoderTab() {
  const [seq, setSeq] = useUrlParam('seq', 'ACDEFGHIKLMNPQRSTVWY')
  const [accession, setAccession] = useUrlParam('acc', ALL_ACCS[0])

  const encoded = useMemo(
    () => (seq ? encodeSequence(seq, DB1[accession]?.values ?? {}) : []),
    [seq, accession]
  )

  const chartData = encoded.map((e) => ({ pos: e.pos, aa: e.aa, value: e.value }))
  const allVals = encoded.map((e) => e.value).filter((v): v is number => v !== null)
  const hasNeg = allVals.some((v) => v < 0)

  return (
    <div className="flex gap-6">
      <aside className="w-56 shrink-0 flex flex-col gap-4">
        <SequenceInput seq={seq} onChange={setSeq} />
        <SequenceFetch onLoad={(entries) => entries[0] && setSeq(entries[0].sequence)} />
        <RecordSelector accession={accession} onChange={setAccession} />
        <ShareLink />
      </aside>

      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
            <div>
              <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{accession}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{DB1[accession]?.description}</p>
            </div>
            <button
              onClick={() => exportEncodingAsCSV(accession, seq, encoded)}
              disabled={!encoded.length}
              className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
            >
              ↓ CSV
            </button>
          </div>

          {!seq && (
            <p className="text-gray-400 text-sm text-center py-12">Enter a protein sequence to encode it.</p>
          )}

          {seq && (
            <div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="pos"
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Position', position: 'insideBottom', offset: -2, fontSize: 11 }}
                    height={32}
                  />
                  <YAxis tick={{ fontSize: 11 }} width={55} />
                  {hasNeg && <ReferenceLine y={0} stroke="#9ca3af" />}
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as { pos: number; aa: string; value: number | null }
                      return (
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs shadow">
                          <div className="font-semibold">Pos {d.pos}: {AA_FULL_NAMES[d.aa] ?? d.aa} ({d.aa})</div>
                          <div>{d.value != null ? d.value.toFixed(4) : 'No data'}</div>
                        </div>
                      )
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    dot={encoded.length <= 50 ? { r: 3, fill: '#6366f1' } : false}
                    connectNulls={false}
                    strokeWidth={1.5}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Sequence strip */}
              {encoded.length <= 100 && (
                <div className="flex mt-2 gap-px overflow-x-auto">
                  {encoded.map((e) => (
                    <div
                      key={e.pos}
                      className={`text-center text-xs font-mono shrink-0 w-6 py-0.5 rounded-sm ${
                        e.value == null
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                          : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                      }`}
                      title={`Pos ${e.pos}: ${e.value?.toFixed(4) ?? 'missing'}`}
                    >
                      {e.aa}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Sliding Window ────────────────────────────────────────────────────────

function WindowTab() {
  const [seq, setSeq] = useUrlParam('seq', 'MGSSHHHHHHSSGLVPRGSHMASMTGGQQMGRDLYDDDDKDPMSSLSSRRGKKLIRFRLRKKLVHQKEHQSGTQMLRPIFKKMKQHPQFLQKEVPQYLFYDLGMQLNKDDQRTTQYQLLGQDGNFLQLRN')
  const [accession, setAccession] = useUrlParam('acc', 'KYTJ820101') // Kyte-Doolittle
  const [windowParam, setWindowParam] = useUrlParam('w', '9')
  const parsedWindow = parseInt(windowParam, 10)
  const windowSize = Number.isInteger(parsedWindow) && parsedWindow >= 3 && parsedWindow <= 25 && parsedWindow % 2 === 1
    ? parsedWindow
    : 9
  const setWindowSize = (n: number) => setWindowParam(String(n))

  const encoded = useMemo(
    () => (seq ? encodeSequence(seq, DB1[accession]?.values ?? {}) : []),
    [seq, accession]
  )
  const windowed = useMemo(() => slidingWindowEncode(encoded, windowSize), [encoded, windowSize])

  const chartData = windowed.map((e) => ({ pos: e.pos, aa: e.aa, value: e.value }))
  const allVals = windowed.map((e) => e.value).filter((v): v is number => v !== null)
  const hasNeg = allVals.some((v) => v < 0)

  return (
    <div className="flex gap-6">
      <aside className="w-56 shrink-0 flex flex-col gap-4">
        <SequenceInput seq={seq} onChange={setSeq} />
        <SequenceFetch onLoad={(entries) => entries[0] && setSeq(entries[0].sequence)} />
        <RecordSelector accession={accession} onChange={setAccession} />
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1 block">
            Window size: {windowSize}
          </span>
          <input
            type="range"
            min={3}
            max={25}
            step={2}
            value={windowSize}
            onChange={(e) => setWindowSize(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>3</span><span>25</span>
          </div>
        </div>
        <button
          onClick={() => exportEncodingAsCSV(accession, seq, windowed)}
          disabled={!windowed.length}
          className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
        >
          ↓ CSV
        </button>
        <ShareLink />
      </aside>

      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="mb-4">
            <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{accession}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{DB1[accession]?.description}</p>
            <p className="text-xs text-gray-400 mt-1">Sliding window of {windowSize} residues (averaged)</p>
          </div>

          {!seq && (
            <p className="text-gray-400 text-sm text-center py-12">Enter a protein sequence above.</p>
          )}

          {seq && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="pos"
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Sequence position', position: 'insideBottom', offset: -2, fontSize: 11 }}
                  height={32}
                />
                <YAxis tick={{ fontSize: 11 }} width={55} />
                {hasNeg && <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 2" />}
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload as { pos: number; aa: string; value: number | null }
                    return (
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs shadow">
                        <div className="font-semibold">Pos {d.pos}: {d.aa}</div>
                        <div>{d.value != null ? d.value.toFixed(4) : 'No data'}</div>
                      </div>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  dot={false}
                  connectNulls={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Multi-property Heatmap ────────────────────────────────────────────────

function HeatmapTab() {
  const [seq, setSeq] = useUrlParam('seq', 'ACDEFGHIKLMNPQRSTVWY')
  const [filter, setFilter] = useState('')
  const [idxParam, setIdxParam] = useUrlParam('idx', ALL_ACCS.slice(0, 6).join(','))
  const selected = useMemo(
    () => idxParam.split(',').filter((a) => a && Object.hasOwn(DB1, a)),
    [idxParam],
  )
  const setSelected = (next: string[]) => setIdxParam(next.join(','))

  const filteredAccs = useMemo(
    () => ALL_ACCS.filter((a) =>
      a.toLowerCase().includes(filter.toLowerCase()) ||
      DB1[a].description.toLowerCase().includes(filter.toLowerCase())
    ),
    [filter]
  )

  const toggle = (acc: string) =>
    setSelected(selected.includes(acc) ? selected.filter((a) => a !== acc) : [...selected, acc])

  const upper = seq.toUpperCase()

  // For each selected index, encode the sequence
  const matrix = useMemo(() => {
    if (!upper || !selected.length) return null
    return selected.map((acc) => {
      const values = DB1[acc]?.values ?? {}
      const row = upper.split('').map((aa) =>
        VALID_AAS.has(aa) && aa in values && isFinite(values[aa]) ? values[aa] : null
      )
      const nums = row.filter((v): v is number => v !== null)
      const min = minOf(nums) ?? 0
      const max = maxOf(nums) ?? 1
      const range = max - min || 1
      return { acc, row, min, max, range }
    })
  }, [upper, selected])

  const cellW = Math.max(6, Math.min(24, Math.floor(700 / Math.max(upper.length, 1))))
  const cellH = 28

  return (
    <div className="flex gap-6">
      <aside className="w-56 shrink-0 flex flex-col gap-4">
        <SequenceInput seq={seq} onChange={setSeq} />
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1 block">
            Indices ({selected.length} selected)
          </span>
          <input
            type="text"
            placeholder="Filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-2 py-1.5 mb-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="border border-gray-200 dark:border-gray-700 rounded overflow-y-auto max-h-48">
            {filteredAccs.map((a) => (
              <label
                key={a}
                className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(a)}
                  onChange={() => toggle(a)}
                  className="accent-indigo-600"
                />
                <span className="text-xs font-mono truncate" title={DB1[a].description}>{a}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-1 mt-1">
            <button onClick={() => setSelected([])} className="text-xs text-gray-500 hover:text-red-500">Clear</button>
            <span className="text-gray-300">·</span>
            <button onClick={() => setSelected(filteredAccs.slice(0, 10))} className="text-xs text-gray-500 hover:text-indigo-500">Top 10</button>
          </div>
        </div>
        <ShareLink />
      </aside>

      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Multi-property Heatmap</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Each row = one AAIndex1 property. Each column = one sequence position. Colour normalised per row.
              </p>
            </div>
          </div>

          {(!seq || !selected.length || !matrix) && (
            <p className="text-gray-400 text-sm text-center py-12">
              {!seq ? 'Enter a sequence.' : 'Select at least one index.'}
            </p>
          )}

          {matrix && seq && selected.length > 0 && (
            <div className="overflow-x-auto">
              {/* Position labels */}
              {upper.length <= 100 && (
                <div className="flex mb-1" style={{ paddingLeft: 100 }}>
                  {upper.split('').map((aa, i) => (
                    <div
                      key={i}
                      className="text-center font-mono shrink-0"
                      style={{ width: cellW, fontSize: 9 }}
                    >
                      {aa}
                    </div>
                  ))}
                </div>
              )}

              {matrix.map(({ acc, row, min, range }) => (
                <div key={acc} className="flex items-center mb-px">
                  <div
                    className="shrink-0 font-mono text-xs text-gray-600 dark:text-gray-400 text-right pr-2 truncate"
                    style={{ width: 100 }}
                    title={DB1[acc]?.description}
                  >
                    {acc}
                  </div>
                  {row.map((v, i) => {
                    const t = v != null ? (v - min) / range : null
                    return (
                      <div
                        key={i}
                        className="shrink-0 border-r border-b border-white dark:border-gray-800"
                        style={{
                          width: cellW,
                          height: cellH,
                          backgroundColor: t != null ? heatColor(t) : undefined,
                          backgroundImage: t == null
                            ? 'repeating-linear-gradient(45deg, #9ca3af 0, #9ca3af 1px, transparent 0, transparent 50%)'
                            : undefined,
                          backgroundSize: t == null ? '4px 4px' : undefined,
                        }}
                        title={`${acc} × pos${i+1} (${upper[i]}): ${v != null ? v.toFixed(3) : 'NA'}`}
                      />
                    )
                  })}
                </div>
              ))}

              {/* Colour legend */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-500">Low</span>
                <div
                  className="h-3 w-24 rounded"
                  style={{ background: 'linear-gradient(to right, #3b82f6, #ffffff, #ef4444)' }}
                />
                <span className="text-xs text-gray-500">High</span>
                <span className="text-xs text-gray-400 ml-2">(per-row normalised)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; desc: string }[] = [
  { id: 'encoder', label: 'Sequence Encoder', desc: 'Encode a sequence using an AAIndex1 property and export as CSV or line plot.' },
  { id: 'window',  label: 'Sliding Window',   desc: 'Smoothed property profile via a sliding window average — classic Kyte-Doolittle style.' },
  { id: 'heatmap', label: 'Multi-property Heatmap', desc: 'Encode against multiple indices simultaneously. Colour is normalised per row.' },
]

export default function SequenceAnalysis() {
  const [tabParam, setTabParam] = useUrlParam('tab', 'encoder')
  const tab = (TABS.some((t) => t.id === tabParam) ? tabParam : 'encoder') as Tab
  const setTab = (t: Tab) => setTabParam(t)

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              tab === t.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {TABS.find((t) => t.id === tab)?.desc}
      </p>

      {tab === 'encoder' && <EncoderTab />}
      {tab === 'window' && <WindowTab />}
      {tab === 'heatmap' && <HeatmapTab />}
    </div>
  )
}
