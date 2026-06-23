import { useState, useMemo, useRef } from 'react'
import { useAAIndexStore } from '../store/useAAIndexStore'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { AAIndex1DB } from '../types'
import { encodeSequence, VALID_AAS } from '../lib/seqUtils'
import { AA_FULL_NAMES } from '../lib/aminoAcids'
import { saveAs } from 'file-saver'

import db1 from '../data/aaindex1.json'

const DB1 = db1 as unknown as AAIndex1DB
const ALL_ACCS = Object.keys(DB1)

interface ParsedSeq { id: string; seq: string }

const EXAMPLES = [
  {
    label: 'Human Insulin B-chain',
    description: '30 residues · classic hydrophobicity benchmark',
    fasta: '>HumanInsulin_Bchain\nFVNQHLCGSHLVEALYLVCGERGFFYTPKT',
  },
  {
    label: 'Human Ubiquitin',
    description: '76 residues · highly conserved regulatory protein',
    fasta: '>Ubiquitin_Human\nMQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG',
  },
  {
    label: 'Bee venom Melittin',
    description: '26 residues · amphipathic alpha-helix',
    fasta: '>Melittin_BeeVenom\nGIGAVLKVLTTGLPALISWIKRKRQQ',
  },
  {
    label: 'Multi-sequence set',
    description: 'Insulin · Ubiquitin · Melittin (3 sequences)',
    fasta: '>HumanInsulin_Bchain\nFVNQHLCGSHLVEALYLVCGERGFFYTPKT\n>Ubiquitin_Human\nMQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG\n>Melittin_BeeVenom\nGIGAVLKVLTTGLPALISWIKRKRQQ',
  },
]

// ── Parsers ────────────────────────────────────────────────────────────────────

function parseFasta(text: string): ParsedSeq[] {
  const out: ParsedSeq[] = []
  let cur: ParsedSeq | null = null
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('>')) {
      if (cur) out.push(cur)
      cur = { id: line.slice(1).split(/\s+/)[0] || `seq_${out.length + 1}`, seq: '' }
    } else if (cur) {
      cur.seq += line.replace(/\s/g, '').toUpperCase()
    }
  }
  if (cur) out.push(cur)
  return out
}

function parsePlain(text: string): ParsedSeq[] {
  return text
    .split('\n')
    .map((line, i) => ({ id: `seq_${i + 1}`, seq: line.trim().replace(/\s/g, '').toUpperCase() }))
    .filter((s) => s.seq.length > 0 && [...s.seq].some((c) => VALID_AAS.has(c)))
}

function parseFile(text: string, name: string): ParsedSeq[] {
  const seqs = name.toLowerCase().endsWith('.fasta') || name.toLowerCase().endsWith('.fa') || text.trimStart().startsWith('>')
    ? parseFasta(text)
    : parsePlain(text)
  return seqs.filter((s) => s.seq.length > 0)
}

// ── CSV export ─────────────────────────────────────────────────────────────────

function exportLongCSV(seqs: ParsedSeq[], accession: string) {
  const values = DB1[accession]?.values ?? {}
  const rows: string[] = ['sequence_id,position,amino_acid,' + accession]
  for (const { id, seq } of seqs) {
    const encoded = encodeSequence(seq, values)
    for (const e of encoded) {
      rows.push(`${id},${e.pos},${e.aa},${e.value ?? ''}`)
    }
  }
  saveAs(new Blob([rows.join('\n')], { type: 'text/csv' }), `encoded_${accession}.csv`)
}

function exportSummaryCSV(seqs: ParsedSeq[], accession: string) {
  const values = DB1[accession]?.values ?? {}
  const rows: string[] = ['sequence_id,length,valid_residues,mean,min,max']
  for (const { id, seq } of seqs) {
    const encoded = encodeSequence(seq, values)
    const nums = encoded.map((e) => e.value).filter((v): v is number => v !== null)
    if (!nums.length) { rows.push(`${id},${seq.length},0,,,`); continue }
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length
    const min  = Math.min(...nums)
    const max  = Math.max(...nums)
    rows.push(`${id},${seq.length},${nums.length},${mean.toFixed(4)},${min.toFixed(4)},${max.toFixed(4)}`)
  }
  saveAs(new Blob([rows.join('\n')], { type: 'text/csv' }), `summary_${accession}.csv`)
}

// ── Subcomponents ──────────────────────────────────────────────────────────────

function RecordSelector({ accession, onChange }: { accession: string; onChange: (a: string) => void }) {
  const [filter, setFilter] = useState('')
  const filtered = useMemo(
    () => ALL_ACCS.filter((a) =>
      a.toLowerCase().includes(filter.toLowerCase()) ||
      DB1[a].description.toLowerCase().includes(filter.toLowerCase())
    ),
    [filter]
  )
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">AAIndex1 record</span>
      <input
        type="text"
        placeholder="Filter records…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <select
        value={accession}
        onChange={(e) => onChange(e.target.value)}
        size={10}
        className="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {filtered.map((a) => (
          <option key={a} value={a} title={DB1[a].description}>{a}</option>
        ))}
      </select>
      <p className="text-xs text-gray-500 dark:text-gray-400 italic truncate" title={DB1[accession]?.description}>
        {DB1[accession]?.description}
      </p>
    </div>
  )
}

function SeqStats({ seq, accession }: { seq: string; accession: string }) {
  const encoded = useMemo(() => encodeSequence(seq, DB1[accession]?.values ?? {}), [seq, accession])
  const nums = encoded.map((e) => e.value).filter((v): v is number => v !== null)
  if (!nums.length) return <span className="text-gray-400 text-xs">no data</span>
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length
  return (
    <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
      {nums.length}/{seq.length} · μ={mean.toFixed(2)}
    </span>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Encode() {
  const [sequences, setSequences] = useState<ParsedSeq[]>([])
  const [fileName, setFileName] = useState('')
  const [accession, setAccession] = useState(ALL_ACCS[0])
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [favsOpen, setFavsOpen] = useState(false)
  const [examplesOpen, setExamplesOpen] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const favourites = useAAIndexStore((s) => s.favourites)

  const loadExample = (fasta: string, label: string) => {
    setError('')
    const seqs = parseFasta(fasta)
    if (!seqs.length) return
    setSequences(seqs)
    setFileName(`${label} (example)`)
    setPreview(seqs[0].id)
  }

  const handleFile = (file: File) => {
    setError('')
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const seqs = parseFile(text, file.name)
      if (!seqs.length) {
        setError('No valid sequences found. Expected FASTA or plain text (one sequence per line).')
        setSequences([])
        setPreview(null)
        return
      }
      setSequences(seqs)
      setPreview(seqs[0].id)
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const previewSeq = preview ? sequences.find((s) => s.id === preview) : sequences[0]
  const previewEncoded = useMemo(
    () => previewSeq ? encodeSequence(previewSeq.seq, DB1[accession]?.values ?? {}) : [],
    [previewSeq, accession]
  )
  const hasNeg = previewEncoded.some((e) => (e.value ?? 0) < 0)

  return (
    <div className="flex gap-6">
      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 flex flex-col gap-5">

        {/* File upload */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Input file</span>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".txt,.fasta,.fa"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {fileName ? (
              <div>
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 truncate">{fileName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{sequences.length} sequences loaded</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Drop or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">.fasta / .fa / .txt</p>
              </div>
            )}
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Example sequences */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setExamplesOpen((v) => !v)}
            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <span>Examples</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform ${examplesOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {examplesOpen && (
            <ul className="flex flex-col gap-0.5">
              {EXAMPLES.map((ex) => (
                <li key={ex.label}>
                  <button
                    onClick={() => loadExample(ex.fasta, ex.label)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950 group"
                  >
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{ex.label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{ex.description}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <RecordSelector accession={accession} onChange={setAccession} />

        {/* Favourites */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setFavsOpen((v) => !v)}
            className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <span>Favourites {favourites.length > 0 && `(${favourites.length})`}</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform ${favsOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {favsOpen && (
            favourites.length === 0
              ? <p className="text-xs text-gray-400 italic">No favourites yet — star records in the Explorer.</p>
              : <ul className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                  {favourites.map((acc) => (
                    <li key={acc}>
                      <button
                        onClick={() => setAccession(acc)}
                        className={`w-full text-left px-2 py-1 rounded text-xs font-mono truncate ${accession === acc ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                        title={DB1[acc]?.description}
                      >
                        {acc}
                      </button>
                    </li>
                  ))}
                </ul>
          )}
        </div>

        {/* Export buttons */}
        {sequences.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Export</span>
            <button
              onClick={() => exportLongCSV(sequences, accession)}
              className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
            >
              ↓ All encodings (long CSV)
            </button>
            <button
              onClick={() => exportSummaryCSV(sequences, accession)}
              className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
            >
              ↓ Summary stats CSV
            </button>
            <p className="text-xs text-gray-400">
              Long CSV: sequence_id · position · amino_acid · value<br />
              Summary: mean · min · max per sequence
            </p>
          </div>
        )}
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">

        {/* Empty state */}
        {!sequences.length && (
          <div className="flex-1 flex items-center justify-center min-h-64 text-center text-gray-400 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
            <div>
              <p className="text-lg mb-1">Upload a sequence file to encode</p>
              <p className="text-xs text-gray-400">FASTA format or plain text — one sequence per line</p>
            </div>
          </div>
        )}

        {/* Preview chart */}
        {sequences.length > 0 && previewSeq && (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <div>
                <p className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">{accession}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{DB1[accession]?.description}</p>
              </div>
              {sequences.length > 1 && (
                <select
                  value={preview ?? ''}
                  onChange={(e) => setPreview(e.target.value)}
                  className="text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {sequences.map((s) => (
                    <option key={s.id} value={s.id}>{s.id}</option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Preview: <span className="font-mono">{previewSeq.id}</span> · {previewSeq.seq.length} residues
            </p>
            <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all leading-relaxed max-h-16 overflow-y-auto mb-2 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded px-2 py-1">
              {previewSeq.seq}
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={previewEncoded} margin={{ top: 4, right: 8, bottom: 24, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="pos"
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Position', position: 'insideBottom', offset: -12, fontSize: 11 }}
                  height={32}
                />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                {hasNeg && <CartesianGrid y={0} strokeDasharray="4 2" stroke="#9ca3af" />}
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
                <Line type="monotone" dataKey="value" stroke="#6366f1" dot={previewEncoded.length <= 60 ? { r: 2 } : false} connectNulls={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Sequence table */}
        {sequences.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">
                {sequences.length} sequence{sequences.length !== 1 ? 's' : ''} loaded
              </h2>
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="text-xs w-full">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-1.5 pr-4 font-medium text-gray-600 dark:text-gray-400">ID</th>
                    <th className="text-right py-1.5 pr-4 font-medium text-gray-600 dark:text-gray-400">Length</th>
                    <th className="text-left py-1.5 pr-4 font-medium text-gray-600 dark:text-gray-400">Sequence</th>
                    <th className="text-left py-1.5 font-medium text-gray-600 dark:text-gray-400">Encoding ({accession})</th>
                  </tr>
                </thead>
                <tbody>
                  {sequences.map((s) => (
                    <tr
                      key={s.id}
                      className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer ${preview === s.id ? 'bg-indigo-50 dark:bg-indigo-950' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                      onClick={() => setPreview(s.id)}
                    >
                      <td className="py-1.5 pr-4 font-mono text-indigo-600 dark:text-indigo-400">{s.id}</td>
                      <td className="py-1.5 pr-4 text-right text-gray-500">{s.seq.length}</td>
                      <td className="py-1.5 pr-4 font-mono text-gray-700 dark:text-gray-300" title={s.seq}>
                        {s.seq.length > 40 ? s.seq.slice(0, 40) + '…' : s.seq}
                      </td>
                      <td className="py-1.5"><SeqStats seq={s.seq} accession={accession} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">Click a row to preview its encoding above.</p>
          </div>
        )}
      </div>
    </div>
  )
}
