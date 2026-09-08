import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  setCorsHeaders, setCacheHeaders, methodNotAllowed, tableFormat, sendTable, badFormat,
} from './_helpers.js'
import { encodeSequence, slidingWindowEncode } from '../src/lib/seqUtils.js'
import rawDb from '../src/data/aaindex1.json' with { type: 'json' }

interface DB1Record {
  description: string
  category: string
  values: Record<string, number | null>
}

const db = rawDb as Record<string, DB1Record>

const MAX_SEQUENCE = 10_000
const MAX_WINDOW = 99

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return methodNotAllowed(res)

  const fmt = tableFormat(req.query.format)
  if (fmt === undefined) return badFormat(res)

  const { accession, sequence, window } = req.query

  if (typeof accession !== 'string' || !accession) {
    return res.status(400).json({ error: '`accession` query parameter is required' })
  }
  const key = accession.toUpperCase()
  if (!Object.hasOwn(db, key)) {
    return res.status(404).json({
      error: `Record '${key}' not found in aaindex1`,
      hint: 'Check /api/aaindex1 for a list of valid accessions',
    })
  }

  if (typeof sequence !== 'string' || !sequence) {
    return res.status(400).json({ error: '`sequence` query parameter is required' })
  }
  const seq = sequence.toUpperCase().replace(/\s/g, '')
  if (!seq.length) return res.status(400).json({ error: '`sequence` must not be empty' })
  if (seq.length > MAX_SEQUENCE) {
    return res.status(400).json({ error: `\`sequence\` must not exceed ${MAX_SEQUENCE} residues` })
  }

  let win = 7
  if (typeof window === 'string' && window) {
    win = parseInt(window, 10)
    if (!Number.isInteger(win) || win < 1 || win > MAX_WINDOW || win % 2 === 0) {
      return res.status(400).json({ error: `\`window\` must be an odd integer between 1 and ${MAX_WINDOW}` })
    }
  }

  const rec = db[key]
  const encoded = encodeSequence(seq, rec.values)
  const smoothed = slidingWindowEncode(encoded, win)
  const covered = encoded.filter((e) => e.value !== null).length

  const profile = encoded.map((e, i) => ({
    position: e.pos,
    amino_acid: e.aa,
    value: e.value,
    window_mean: smoothed[i].value === null ? null : Math.round(smoothed[i].value! * 1e6) / 1e6,
  }))

  if (fmt) return sendTable(res, fmt, `${key}_window${win}`, profile)

  setCacheHeaders(res)
  return res.status(200).json({
    accession: key,
    database: 'aaindex1',
    description: rec.description,
    category: rec.category,
    window: win,
    sequence: seq,
    length: seq.length,
    valid_residues: covered,
    coverage: seq.length ? Math.round((covered / seq.length) * 1000) / 1000 : 0,
    profile,
  })
}
