import { useMemo, useState } from 'react'
import { AAIndex2DB } from '../../types'
import {
  align, cleanSequence, defaultGaps, isComplete, looksLikeDistance, Matrix, MAX_ALIGN_LENGTH,
} from '../../lib/matrixUtils'
import { useUrlParam } from '../../lib/useUrlParam'
import SequenceInput from '../SequenceInput'
import RecordSelector from '../RecordSelector'
import ShareLink from '../ShareLink'
import db2 from '../../data/aaindex2.json'

const DB2 = db2 as unknown as AAIndex2DB
// Matrices with missing standard pairs are left out rather than guessing at the gaps.
const USABLE: AAIndex2DB = Object.fromEntries(
  Object.entries(DB2).filter(([, r]) => isComplete(r.matrix as Matrix)),
)
const DEFAULT_MATRIX = 'HENS920102' // BLOSUM62
const LINE = 60

const label = 'label'
const input = 'w-full px-2 py-1.5 rounded-sm border border-gray-200 dark:border-gray-800 bg-transparent text-xs focus:ring-2 focus:ring-indigo-500'

function Stat({ name, value }: { name: string; value: string }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-800 py-3">
      <p className="text-xs text-gray-500 dark:text-gray-400">{name}</p>
      <p className="font-mono font-semibold">{value}</p>
    </div>
  )
}

export default function AlignTab() {
  const [seqA, setSeqA] = useUrlParam('seqA', 'HEAGAWGHEE')
  const [seqB, setSeqB] = useUrlParam('seqB', 'PAWHEAE')
  const [matParam, setMat] = useUrlParam('mat', DEFAULT_MATRIX)
  const [modeParam, setMode] = useUrlParam('mode', 'global')
  const mat = Object.hasOwn(USABLE, matParam) ? matParam : DEFAULT_MATRIX
  const mode = modeParam === 'local' ? 'local' : 'global'
  const matrix = USABLE[mat].matrix as Matrix

  // User overrides are tagged with the matrix they were made for, so picking a
  // different matrix falls back to that matrix's own defaults.
  type Settings = { gapOpen: number; gapExtend: number; negate: boolean }
  const defaults = useMemo<Settings>(() => ({ ...defaultGaps(matrix), negate: looksLikeDistance(matrix) }), [matrix])
  const [custom, setCustom] = useState<{ mat: string } & Partial<Settings>>({ mat })
  const { gapOpen, gapExtend, negate } = { ...defaults, ...(custom.mat === mat ? custom : {}) }
  const update = (patch: Partial<Settings>) =>
    setCustom((c) => ({ ...(c.mat === mat ? c : {}), ...patch, mat }))

  const a = cleanSequence(seqA), b = cleanSequence(seqB)
  const tooLong = a.seq.length > MAX_ALIGN_LENGTH || b.seq.length > MAX_ALIGN_LENGTH
  const result = useMemo(
    () => (a.seq && b.seq && !tooLong ? align(a.seq, b.seq, matrix, { gapOpen, gapExtend, mode, negate }) : null),
    [a.seq, b.seq, tooLong, matrix, gapOpen, gapExtend, mode, negate],
  )

  // Alignment rows in blocks of 60 columns, with the residue number each row starts at.
  const blocks = useMemo(() => {
    if (!result) return []
    const out: { a: string; m: string; b: string; posA: number; posB: number }[] = []
    let pa = result.startA, pb = result.startB
    for (let i = 0; i < result.length; i += LINE) {
      const ra = result.alignedA.slice(i, i + LINE), rb = result.alignedB.slice(i, i + LINE)
      out.push({ a: ra, m: result.midline.slice(i, i + LINE), b: rb, posA: pa, posB: pb })
      pa += ra.replace(/-/g, '').length
      pb += rb.replace(/-/g, '').length
    }
    return out
  }, [result])

  const pct = (n: number) => (result?.length ? `${((100 * n) / result.length).toFixed(1)}%` : '—')

  return (
    <div className="flex flex-col gap-12">
      <aside className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 items-start">
        <SequenceInput seq={seqA} onChange={setSeqA} label="Sequence A" />
        <SequenceInput seq={seqB} onChange={setSeqB} label="Sequence B" />
        <RecordSelector accession={mat} onChange={setMat} db={USABLE} label="AAIndex2 matrix" />
        <fieldset className="flex flex-col gap-1">
          <legend className={`${label} mb-1`}>Mode</legend>
          {(['global', 'local'] as const).map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="align-mode" checked={mode === m} onChange={() => setMode(m)} className="" />
              {m === 'global' ? 'Global (Needleman–Wunsch)' : 'Local (Smith–Waterman)'}
            </label>
          ))}
        </fieldset>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className={label}>Gap open</span>
            <input type="number" min={0} step="any" value={gapOpen} onChange={(e) => update({ gapOpen: Math.max(0, Number(e.target.value)) })} className={input} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>Gap extend</span>
            <input type="number" min={0} step="any" value={gapExtend} onChange={(e) => update({ gapExtend: Math.max(0, Number(e.target.value)) })} className={input} />
          </label>
        </div>
        <label className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
          <input type="checkbox" checked={negate} onChange={(e) => update({ negate: e.target.checked })} className=" mt-0.5" />
          <span>Distance matrix (lower = more similar) — scored as mean − value before aligning</span>
        </label>
        <ShareLink />
      </aside>

      <div className="min-w-0 flex flex-col gap-12">
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <p className="font-mono">{mat}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{DB2[mat].description}</p>

          {(a.dropped > 0 || b.dropped > 0) && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
              Non-standard residues removed before aligning: {a.dropped} from A, {b.dropped} from B.
            </p>
          )}
          {tooLong && (
            <p className="text-sm text-red-500">Each sequence is limited to {MAX_ALIGN_LENGTH} residues for in-browser alignment.</p>
          )}
          {!tooLong && (!a.seq || !b.seq) && (
            <p className="text-gray-400 dark:text-gray-500 text-center py-24">Enter two sequences to align.</p>
          )}

          {result && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
                <Stat name="Score" value={Number(result.score.toFixed(3)).toString()} />
                <Stat name="Length" value={String(result.length)} />
                <Stat name="Identity" value={`${result.identity} (${pct(result.identity)})`} />
                <Stat name="Similarity" value={`${result.similarity} (${pct(result.similarity)})`} />
                <Stat name="Gaps" value={`${result.gaps} (${pct(result.gaps)})`} />
              </div>
              <div className="overflow-x-auto bg-gray-50 dark:bg-gray-900 rounded-sm p-4">
                <pre className="font-mono text-xs leading-5 text-gray-800 dark:text-gray-200" aria-label="Alignment">
                  {blocks.map((bl, i) => (
                    <span key={i}>
                      {`A ${String(bl.posA).padStart(5)} ${bl.a}\n`}
                      {`        ${bl.m}\n`}
                      {`B ${String(bl.posB).padStart(5)} ${bl.b}\n`}
                      {i < blocks.length - 1 ? '\n' : ''}
                    </span>
                  ))}
                </pre>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                | identical · : positive substitution score · gap of length k costs open + (k − 1) × extend
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
