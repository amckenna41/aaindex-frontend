import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { AAIndex1DB } from '../../types'
import { encodeSequence, hydrophobicMoment, momentProfile } from '../../lib/seqUtils'
import { minOf, maxOf } from '../../lib/statsUtils'
import { useUrlParam } from '../../lib/useUrlParam'
import SequenceInput from '../SequenceInput'
import SequenceFetch from '../SequenceFetch'
import RecordSelector from '../RecordSelector'
import ShareLink from '../ShareLink'
import db1 from '../../data/aaindex1.json'

const DB1 = db1 as unknown as AAIndex1DB

const ANGLES = [
  { deg: 100, label: 'α-helix (100°)' },
  { deg: 120, label: '3₁₀-helix (120°)' },
  { deg: 160, label: 'β-strand (160°)' },
  { deg: 180, label: 'Ideal β (180°)' },
]
const WHEEL_MAX = 18 // five turns of an α-helix; more residues overlap on the wheel

const label = 'label'

function lerpColour(t: number): string {
  // Low → ink-40, high → signal blue (hydrophobic end of most hydrophobicity scales).
  const lo = [163, 163, 162], hi = [47, 91, 255]
  const c = lo.map((v, i) => Math.round(v + (hi[i] - v) * t))
  return `rgb(${c.join(',')})`
}

function HelicalWheel({ residues, values, angle, direction, moment }: {
  residues: string
  values: (number | null)[]
  angle: number
  direction: number
  moment: number
}) {
  const size = 300, c = size / 2, r = 110, dot = 15
  const lo = minOf(values.filter((v): v is number => v != null)) ?? 0
  const hi = maxOf(values.filter((v): v is number => v != null)) ?? 1
  const pts = [...residues].map((aa, k) => {
    // Angle 0 points up; residues advance clockwise.
    const a = ((k * angle - 90) * Math.PI) / 180
    return { aa, k, x: c + r * Math.cos(a), y: c + r * Math.sin(a), v: values[k] }
  })
  const dir = ((direction - 90) * Math.PI) / 180
  // Fixed length: the arrow shows direction only. Typical μH values are a small
  // fraction of the scale maximum, so a proportional arrow shrinks to a dot;
  // the magnitude is printed beside the wheel instead.
  const len = moment > 1e-9 ? r * 0.6 : 0

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-xs mx-auto"
      role="img"
      aria-label={`Helical wheel of ${residues.length} residues with the hydrophobic moment vector`}
    >
      <circle cx={c} cy={c} r={r} fill="none" className="stroke-gray-200 dark:stroke-gray-700" strokeDasharray="3 3" />
      <polyline
        points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth={1}
      />
      {len > 0 && (
        <g className="text-rose-600 dark:text-rose-400">
          <defs>
            <marker id="moment-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
            </marker>
          </defs>
          <line
            x1={c} y1={c} x2={c + len * Math.cos(dir)} y2={c + len * Math.sin(dir)}
            stroke="currentColor" strokeWidth={3} markerEnd="url(#moment-arrow)"
          />
        </g>
      )}
      {pts.map((p) => (
        <g key={p.k}>
          <circle
            cx={p.x} cy={p.y} r={dot}
            fill={p.v == null ? '#D6D6D4' : lerpColour(hi > lo ? (p.v - lo) / (hi - lo) : 0.5)}
            className="stroke-white dark:stroke-gray-900"
            strokeWidth={2}
          >
            <title>{`${p.aa}${p.k + 1}: ${p.v == null ? 'no data' : p.v.toFixed(3)}`}</title>
          </circle>
          <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill="#fff" fontFamily="monospace">
            {p.aa}
          </text>
          <text
            x={c + (r + dot + 9) * Math.cos(((p.k * angle - 90) * Math.PI) / 180)}
            y={c + (r + dot + 9) * Math.sin(((p.k * angle - 90) * Math.PI) / 180)}
            textAnchor="middle" dominantBaseline="central" fontSize={9}
            className="fill-gray-400"
          >
            {p.k + 1}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default function MomentTab() {
  const [seq, setSeq] = useUrlParam('seq', 'GIGAVLKVLTTGLPALISWIKRKRQQ') // melittin
  const [accession, setAccession] = useUrlParam('acc', 'EISD840101') // Eisenberg consensus
  const [angleParam, setAngleParam] = useUrlParam('angle', '100')
  const [windowParam, setWindowParam] = useUrlParam('w', '11')
  const [start, setStart] = useState(1)

  const angle = ANGLES.some((a) => String(a.deg) === angleParam) ? Number(angleParam) : 100
  const w = parseInt(windowParam, 10)
  const windowSize = Number.isInteger(w) && w >= 5 && w <= 25 && w % 2 === 1 ? w : 11

  const values = DB1[accession]?.values ?? {}
  const encoded = useMemo(() => (seq ? encodeSequence(seq, values) : []), [seq, values])
  const profile = useMemo(() => momentProfile(encoded, windowSize, angle), [encoded, windowSize, angle])

  // Wheel segment: up to 18 residues from the chosen start.
  const maxStart = Math.max(1, encoded.length - Math.min(WHEEL_MAX, encoded.length) + 1)
  const s0 = Math.min(start, maxStart)
  const segment = encoded.slice(s0 - 1, s0 - 1 + WHEEL_MAX)
  const segVals = segment.map((e) => e.value)
  const segMoment = hydrophobicMoment(segVals, angle)

  const peak = profile.reduce<{ pos: number; moment: number } | null>(
    (best, p) => (p.moment != null && (!best || p.moment > best.moment) ? { pos: p.pos, moment: p.moment } : best),
    null,
  )

  return (
    <div className="flex flex-col gap-12">
      <aside className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 items-start">
        <SequenceInput seq={seq} onChange={(s) => { setSeq(s); setStart(1) }} />
        <SequenceFetch onLoad={(entries) => { if (entries[0]) { setSeq(entries[0].sequence); setStart(1) } }} />
        <RecordSelector accession={accession} onChange={setAccession} />
        <label className="flex flex-col gap-1">
          <span className={label}>Periodicity</span>
          <select
            value={angle}
            onChange={(e) => setAngleParam(e.target.value)}
            className="w-full px-2 py-1.5 rounded-sm border border-gray-200 dark:border-gray-800 bg-transparent text-xs focus:ring-2 focus:ring-indigo-500"
          >
            {ANGLES.map((a) => <option key={a.deg} value={a.deg}>{a.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>Profile window: {windowSize}</span>
          <input
            type="range" min={5} max={25} step={2} value={windowSize}
            onChange={(e) => setWindowParam(e.target.value)}
            className="w-full"
          />
        </label>
        <ShareLink />
      </aside>

      <div className="min-w-0 flex flex-col gap-12">
        {!encoded.length && (
          <p className="text-gray-400 dark:text-gray-500 text-center py-24">
            Enter a protein sequence.
          </p>
        )}

        {encoded.length > 0 && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                <div>
                  <h2 className="label">Helical wheel</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Residues {s0}–{s0 + segment.length - 1} · {angle}° per residue · arrow = moment direction
                  </p>
                </div>
                {encoded.length > WHEEL_MAX && (
                  <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    Start
                    <input
                      type="number" min={1} max={maxStart} value={s0}
                      onChange={(e) => setStart(Math.max(1, Math.min(maxStart, Number(e.target.value) || 1)))}
                      className="w-20 px-2 py-1 rounded-sm border border-gray-200 dark:border-gray-800 bg-transparent"
                    />
                  </label>
                )}
              </div>
              <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
                <HelicalWheel
                  residues={segment.map((e) => e.aa).join('')}
                  values={segVals}
                  angle={angle}
                  direction={segMoment?.direction ?? 0}
                  moment={segMoment?.moment ?? 0}
                />
                <dl className="grid grid-cols-2 md:grid-cols-1 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Mean hydrophobic moment μH</dt>
                    <dd className="font-mono font-semibold">{segMoment ? segMoment.moment.toFixed(3) : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Mean value ⟨H⟩</dt>
                    <dd className="font-mono font-semibold">{segMoment ? segMoment.meanH.toFixed(3) : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Residues with data</dt>
                    <dd className="font-mono">{segMoment?.n ?? 0} / {segment.length}</dd>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="h-2.5 w-16 rounded" style={{ background: `linear-gradient(to right, ${lerpColour(0)}, ${lerpColour(1)})` }} />
                    low → high
                  </div>
                </dl>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
              <h2 className="label">Moment profile</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                μH and ⟨H⟩ over a sliding window of {windowSize}, plotted at the window centre.
                {peak && <> Peak μH {peak.moment.toFixed(3)} at residue {peak.pos}.</>}
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={profile} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3E3E1" />
                  <XAxis dataKey="pos" tick={{ fontSize: 10 }} height={32}
                    label={{ value: 'Window centre', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={50} />
                  <Tooltip formatter={(v: number) => (v != null ? v.toFixed(3) : '—')} labelFormatter={(p) => `Residue ${p}`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="moment" name="μH" stroke="#2F5BFF" dot={false} strokeWidth={2} connectNulls={false} />
                  <Line type="monotone" dataKey="meanH" name="⟨H⟩" stroke="#2F5BFF" dot={false} strokeWidth={1.5} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
