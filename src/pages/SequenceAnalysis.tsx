import { useState, useMemo, lazy, Suspense } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, CartesianGrid,
} from 'recharts'
import { AAIndex1DB } from '../types'
import { encodeSequence, slidingWindowEncode, regionsAbove, VALID_AAS } from '../lib/seqUtils'
import { exportEncodingAsCSV } from '../lib/exportUtils'
import { AA_FULL_NAMES } from '../lib/aminoAcids'
import { minOf, maxOf } from '../lib/statsUtils'
import { useUrlParam } from '../lib/useUrlParam'
import ShareLink from '../components/ShareLink'
import SequenceFetch from '../components/SequenceFetch'
import SequenceInput from '../components/SequenceInput'

import db1 from '../data/aaindex1.json'
import RecordSelector from '../components/RecordSelector'

const DB1 = db1 as unknown as AAIndex1DB
const ALL_ACCS = Object.keys(DB1)

type Tab = 'encoder' | 'window' | 'heatmap' | 'moment' | 'align' | 'contact'

// Lazy so the AAIndex2/3 matrices only download when their tab is opened.
const MomentTab  = lazy(() => import('../components/sequence/MomentTab'))
const AlignTab   = lazy(() => import('../components/sequence/AlignTab'))
const ContactTab = lazy(() => import('../components/sequence/ContactTab'))

// ── Colour helpers ─────────────────────────────────────────────────────────────

function lerp(t: number, lo: string, hi: string): string {
  const p = (s: string) => [parseInt(s.slice(1,3),16), parseInt(s.slice(3,5),16), parseInt(s.slice(5,7),16)]
  const [ar,ag,ab] = p(lo)
  const [br,bg,bb] = p(hi)
  return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`
}

function heatColor(t: number): string {
  // t in [0,1]: ink-60 → white → signal blue
  if (t < 0.5) return lerp(t * 2, '#6F6F6E', '#ffffff')
  return lerp((t - 0.5) * 2, '#ffffff', '#2F5BFF')
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
    <div className="flex flex-col gap-12">
      <aside className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 items-start">
        <SequenceInput seq={seq} onChange={setSeq} />
        <SequenceFetch onLoad={(entries) => entries[0] && setSeq(entries[0].sequence)} />
        <RecordSelector accession={accession} onChange={setAccession} />
        <ShareLink />
      </aside>

      <div className="flex-1 min-w-0">
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
            <div>
              <p className="font-mono font-bold">{accession}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{DB1[accession]?.description}</p>
            </div>
            <button
              onClick={() => exportEncodingAsCSV(accession, seq, encoded)}
              disabled={!encoded.length}
              className="btn-text disabled:opacity-40"
            >
              ↓ CSV
            </button>
          </div>

          {!seq && (
            <p className="text-gray-400 dark:text-gray-500 text-center py-24">Enter a protein sequence to encode it.</p>
          )}

          {seq && (
            <div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3E3E1" />
                  <XAxis
                    dataKey="pos"
                    tick={{ fontSize: 10 }}
                    label={{ value: 'Position', position: 'insideBottom', offset: -2, fontSize: 11 }}
                    height={32}
                  />
                  <YAxis tick={{ fontSize: 11 }} width={55} />
                  {hasNeg && <ReferenceLine y={0} stroke="#A3A3A2" />}
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as { pos: number; aa: string; value: number | null }
                      return (
                        <div className="bg-paper dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs">
                          <div className="font-semibold">Pos {d.pos}: {AA_FULL_NAMES[d.aa] ?? d.aa} ({d.aa})</div>
                          <div>{d.value != null ? d.value.toFixed(4) : 'No data'}</div>
                        </div>
                      )
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2F5BFF"
                    dot={encoded.length <= 50 ? { r: 3, fill: '#2F5BFF' } : false}
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
                          : 'text-indigo-600 dark:text-indigo-400'
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

/** Kyte & Doolittle (1982): a 19-residue window averaging ≥ 1.6 marks a likely
 *  transmembrane helix. Other scales have no published cutoff, so they start at
 *  the scale's mean — "above average" — for the user to adjust. */
const KD = 'KYTJ820101'
const KD_THRESHOLD = 1.6

function suggestedThreshold(accession: string): number {
  if (accession === KD) return KD_THRESHOLD
  const vals = Object.values(DB1[accession]?.values ?? {}).filter((v): v is number => v != null)
  return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0
}

function WindowTab() {
  const [seq, setSeq] = useUrlParam('seq', 'MGSSHHHHHHSSGLVPRGSHMASMTGGQQMGRDLYDDDDKDPMSSLSSRRGKKLIRFRLRKKLVHQKEHQSGTQMLRPIFKKMKQHPQFLQKEVPQYLFYDLGMQLNKDDQRTTQYQLLGQDGNFLQLRN')
  const [accession, setAccession] = useUrlParam('acc', 'KYTJ820101') // Kyte-Doolittle
  const [windowParam, setWindowParam] = useUrlParam('w', '9')
  const parsedWindow = parseInt(windowParam, 10)
  const windowSize = Number.isInteger(parsedWindow) && parsedWindow >= 3 && parsedWindow <= 25 && parsedWindow % 2 === 1
    ? parsedWindow
    : 9
  const setWindowSize = (n: number) => setWindowParam(String(n))
  // 'auto' = the scale's suggested cutoff, 'off' = hidden, otherwise a number.
  const [thrParam, setThrParam] = useUrlParam('thr', 'auto')
  const parsedThr = parseFloat(thrParam)
  const threshold = thrParam === 'off' ? null
    : Number.isFinite(parsedThr) ? parsedThr
    : suggestedThreshold(accession)
  const setAccessionAndThreshold = (acc: string) => {
    setAccession(acc)
    if (thrParam !== 'off') setThrParam('auto') // a typed cutoff rarely suits a different scale
  }

  const encoded = useMemo(
    () => (seq ? encodeSequence(seq, DB1[accession]?.values ?? {}) : []),
    [seq, accession]
  )
  const windowed = useMemo(() => slidingWindowEncode(encoded, windowSize), [encoded, windowSize])
  const regions = useMemo(
    () => (threshold === null ? [] : regionsAbove(windowed, threshold)),
    [windowed, threshold]
  )

  const chartData = windowed.map((e) => ({ pos: e.pos, aa: e.aa, value: e.value }))
  const allVals = windowed.map((e) => e.value).filter((v): v is number => v !== null)
  const hasNeg = allVals.some((v) => v < 0)

  return (
    <div className="flex flex-col gap-12">
      <aside className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 items-start">
        <SequenceInput seq={seq} onChange={setSeq} />
        <SequenceFetch onLoad={(entries) => entries[0] && setSeq(entries[0].sequence)} />
        <RecordSelector accession={accession} onChange={setAccessionAndThreshold} />
        <div>
          <span className="label mb-1 block">
            Window size: {windowSize}
          </span>
          <input
            type="range"
            min={3}
            max={25}
            step={2}
            value={windowSize}
            onChange={(e) => setWindowSize(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>3</span><span>25</span>
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 label mb-1">
            <input
              type="checkbox"
              checked={threshold !== null}
              onChange={(e) => setThrParam(e.target.checked ? 'auto' : 'off')}
              className=""
            />
            Threshold line
          </label>
          {threshold !== null && (
            <input
              type="number"
              step={0.1}
              aria-label="Threshold value"
              value={threshold}
              onChange={(e) => setThrParam(e.target.value === '' ? 'auto' : e.target.value)}
              className="w-full text-sm px-2 py-1 rounded-sm border border-gray-200 dark:border-gray-800 bg-transparent"
            />
          )}
          {accession === KD && threshold !== null && (
            <p className="text-xs text-gray-400 mt-1">
              Kyte–Doolittle: a window of 19 averaging ≥ 1.6 suggests a transmembrane helix.
            </p>
          )}
        </div>
        <button
          onClick={() => exportEncodingAsCSV(accession, seq, windowed)}
          disabled={!windowed.length}
          className="btn-text disabled:opacity-40"
        >
          ↓ CSV
        </button>
        <ShareLink />
      </aside>

      <div className="flex-1 min-w-0">
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <div className="mb-4">
            <p className="font-mono font-bold">{accession}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{DB1[accession]?.description}</p>
            <p className="text-xs text-gray-400 mt-1">Sliding window of {windowSize} residues (averaged)</p>
          </div>

          {!seq && (
            <p className="text-gray-400 dark:text-gray-500 text-center py-24">Enter a protein sequence above.</p>
          )}

          {seq && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E3E1" />
                <XAxis
                  dataKey="pos"
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Sequence position', position: 'insideBottom', offset: -2, fontSize: 11 }}
                  height={32}
                />
                <YAxis tick={{ fontSize: 11 }} width={55} />
                {hasNeg && <ReferenceLine y={0} stroke="#A3A3A2" strokeDasharray="4 2" />}
                {regions.map((r) => (
                  <ReferenceArea key={r.start} x1={r.start} x2={r.end} fill="#A3A3A2" fillOpacity={0.15} />
                ))}
                {threshold !== null && (
                  <ReferenceLine
                    y={threshold}
                    ifOverflow="extendDomain" // keep the cutoff visible even when no window reaches it
                    stroke="#A3A3A2"
                    strokeDasharray="6 3"
                    label={{ value: `threshold ${threshold}`, position: 'insideTopRight', fontSize: 10, fill: '#6F6F6E' }}
                  />
                )}
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload as { pos: number; aa: string; value: number | null }
                    return (
                      <div className="bg-paper dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs">
                        <div className="font-semibold">Pos {d.pos}: {d.aa}</div>
                        <div>{d.value != null ? d.value.toFixed(4) : 'No data'}</div>
                      </div>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="currentColor"
                  dot={false}
                  connectNulls={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {seq && threshold !== null && (
            <div className="mt-4">
              <p className="label mb-2">
                {regions.length
                  ? `${regions.length} region${regions.length === 1 ? '' : 's'} at or above ${threshold}`
                  : `No region reaches ${threshold}`}
              </p>
              {regions.length > 0 && (
                <table className="text-xs w-full max-w-md">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400">
                      <th className="font-medium pr-4">Start</th>
                      <th className="font-medium pr-4">End</th>
                      <th className="font-medium pr-4">Length</th>
                      <th className="font-medium">Peak</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-gray-700 dark:text-gray-300">
                    {regions.map((r) => (
                      <tr key={r.start}>
                        <td className="pr-4">{r.start}</td>
                        <td className="pr-4">{r.end}</td>
                        <td className="pr-4">{r.length}</td>
                        <td>{r.peak.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
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
    <div className="flex flex-col gap-12">
      <aside className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 items-start">
        <SequenceInput seq={seq} onChange={setSeq} />
        <div>
          <span className="label mb-1 block">
            Indices ({selected.length} selected)
          </span>
          <input
            type="text"
            placeholder="Filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-2 py-1.5 mb-1 rounded-sm border border-gray-200 dark:border-gray-800 bg-transparent text-xs focus:ring-2 focus:ring-indigo-500"
          />
          <div className="border border-gray-200 dark:border-gray-700 rounded overflow-y-auto max-h-48">
            {filteredAccs.map((a) => (
              <label
                key={a}
                className="flex items-center gap-2 px-2 py-1 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(a)}
                  onChange={() => toggle(a)}
                  className=""
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
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="label">Multi-property Heatmap</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Each row = one AAIndex1 property. Each column = one sequence position. Colour normalised per row.
              </p>
            </div>
          </div>

          {(!seq || !selected.length || !matrix) && (
            <p className="text-gray-400 dark:text-gray-500 text-center py-24">
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
                            ? 'repeating-linear-gradient(45deg, #A3A3A2 0, #A3A3A2 1px, transparent 0, transparent 50%)'
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
                  style={{ background: 'linear-gradient(to right, #6F6F6E, #ffffff, #2F5BFF)' }}
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
  { id: 'moment',  label: 'Hydrophobic Moment', desc: 'Helical wheel and Eisenberg hydrophobic moment — how amphipathic a helix or strand is.' },
  { id: 'align',   label: 'Pairwise Alignment', desc: 'Align two sequences with any AAIndex2 substitution matrix (global or local, affine gaps).' },
  { id: 'contact', label: 'Contact Energy',     desc: 'Score a sequence against an AAIndex3 contact potential, averaged over all residue pairs.' },
]

export default function SequenceAnalysis() {
  const [tabParam, setTabParam] = useUrlParam('tab', 'encoder')
  const tab = (TABS.some((t) => t.id === tabParam) ? tabParam : 'encoder') as Tab
  const setTab = (t: Tab) => setTabParam(t)

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <p className="label">Sequence analysis</p>
        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight">Sequence</h1>
      </header>

      {/* Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-x-6 gap-y-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 whitespace-nowrap pb-3 -mb-px text-sm border-b ${
                tab === t.id
                  ? 'border-indigo-600 text-ink dark:border-indigo-400 dark:text-gray-100'
                  : 'border-transparent text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          {TABS.find((t) => t.id === tab)?.desc}
        </p>
      </div>

      {tab === 'encoder' && <EncoderTab />}
      {tab === 'window' && <WindowTab />}
      {tab === 'heatmap' && <HeatmapTab />}
      <Suspense fallback={<p className="text-gray-400 dark:text-gray-500 py-24 text-center">Loading…</p>}>
        {tab === 'moment' && <MomentTab />}
        {tab === 'align' && <AlignTab />}
        {tab === 'contact' && <ContactTab />}
      </Suspense>
    </div>
  )
}
