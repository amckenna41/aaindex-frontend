import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import { AAIndex3DB } from '../../types'
import { cleanSequence, contactProfile, isComplete, Matrix } from '../../lib/matrixUtils'
import { slidingWindowEncode } from '../../lib/seqUtils'
import { AA_FULL_NAMES } from '../../lib/aminoAcids'
import { useUrlParam } from '../../lib/useUrlParam'
import SequenceInput from '../SequenceInput'
import SequenceFetch from '../SequenceFetch'
import RecordSelector from '../RecordSelector'
import ShareLink from '../ShareLink'
import db3 from '../../data/aaindex3.json'

const DB3 = db3 as unknown as AAIndex3DB
const USABLE: AAIndex3DB = Object.fromEntries(
  Object.entries(DB3).filter(([, r]) => isComplete(r.matrix as Matrix)),
)
const DEFAULT_MATRIX = 'MIYS960102' // Miyazawa–Jernigan 1996, buried environment
const MAX_LENGTH = 20000

export default function ContactTab() {
  const [seq, setSeq] = useUrlParam('seq', 'MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG')
  const [matParam, setMat] = useUrlParam('cmat', DEFAULT_MATRIX)
  const mat = Object.hasOwn(USABLE, matParam) ? matParam : DEFAULT_MATRIX
  const matrix = USABLE[mat].matrix as Matrix

  const cleaned = cleanSequence(seq)
  const tooLong = cleaned.seq.length > MAX_LENGTH
  const profile = useMemo(
    () => (cleaned.seq && !tooLong ? contactProfile(cleaned.seq, matrix) : null),
    [cleaned.seq, tooLong, matrix],
  )
  // Per-residue values depend only on residue type, so smooth them to show regions.
  const smoothed = useMemo(
    () => (profile ? slidingWindowEncode(profile.perResidue, 9) : []),
    [profile],
  )
  const chartData = profile?.perResidue.map((r, i) => ({ ...r, smooth: smoothed[i]?.value ?? null })) ?? []

  // Residue types ranked by how favourably they pair with the rest of this sequence.
  const byType = useMemo(() => {
    if (!profile) return []
    const seen = new Map<string, { value: number; count: number }>()
    for (const r of profile.perResidue) {
      if (r.value == null) continue
      const e = seen.get(r.aa)
      if (e) e.count++
      else seen.set(r.aa, { value: r.value, count: 1 })
    }
    return [...seen.entries()].map(([aa, e]) => ({ aa, ...e })).sort((x, y) => x.value - y.value)
  }, [profile])

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <aside className="md:w-56 shrink-0 flex flex-col gap-4">
        <SequenceInput seq={seq} onChange={setSeq} />
        <SequenceFetch onLoad={(entries) => entries[0] && setSeq(entries[0].sequence)} />
        <RecordSelector accession={mat} onChange={setMat} db={USABLE} label="AAIndex3 matrix" />
        <ShareLink />
      </aside>

      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{mat}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{DB3[mat].description}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-4">
            Sequence-only estimate: without a structure we don't know which residues touch, so the
            matrix value is averaged over every residue pair. Read the sign and units from the record —
            for energy potentials, lower usually means a more favourable contact.
          </p>

          {cleaned.dropped > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">{cleaned.dropped} non-standard residues ignored.</p>
          )}
          {tooLong && <p className="text-sm text-red-500">Sequences are limited to {MAX_LENGTH} residues.</p>}
          {!cleaned.seq && <p className="text-gray-400 text-sm text-center py-12">Enter a protein sequence.</p>}

          {profile && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
                <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mean pair value</p>
                  <p className="font-mono font-semibold">{profile.meanPair != null ? profile.meanPair.toFixed(4) : '—'}</p>
                </div>
                <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Residues</p>
                  <p className="font-mono font-semibold">{cleaned.seq.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pairs averaged</p>
                  <p className="font-mono font-semibold">{profile.pairsCounted.toLocaleString()}</p>
                </div>
              </div>

              <h3 className="text-sm font-semibold mb-1">Per-residue profile</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Mean value of each residue against every other residue in the sequence; the darker line is a 9-residue moving average.
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="pos" tick={{ fontSize: 10 }} height={32}
                    label={{ value: 'Position', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={60} />
                  {profile.meanPair != null && <ReferenceLine y={profile.meanPair} stroke="#9ca3af" strokeDasharray="4 2" />}
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as { pos: number; aa: string; value: number | null; smooth: number | null }
                      return (
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs shadow">
                          <div className="font-semibold">Pos {d.pos}: {AA_FULL_NAMES[d.aa] ?? d.aa}</div>
                          <div>Residue: {d.value?.toFixed(4) ?? '—'}</div>
                          <div>Window: {d.smooth?.toFixed(4) ?? '—'}</div>
                        </div>
                      )
                    }}
                  />
                  <Line type="stepAfter" dataKey="value" stroke="#a5b4fc" dot={false} strokeWidth={1} connectNulls={false} />
                  <Line type="monotone" dataKey="smooth" stroke="#4f46e5" dot={false} strokeWidth={2} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>

              <h3 className="text-sm font-semibold mt-5 mb-2">By residue type (lowest first)</h3>
              <div className="flex flex-wrap gap-1.5">
                {byType.map((t) => (
                  <span
                    key={t.aa}
                    title={`${AA_FULL_NAMES[t.aa]} × ${t.count}`}
                    className="font-mono text-xs px-2 py-1 rounded bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800"
                  >
                    <b>{t.aa}</b> {t.value.toFixed(3)}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
