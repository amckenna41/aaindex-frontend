import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders, setCacheHeaders } from './_helpers.js'
import rawDb from '../src/data/aaindex1.json' with { type: 'json' }

interface DB1Record {
  description: string
  category: string
  values: Record<string, number | null>
}

const db = rawDb as Record<string, DB1Record>

const MAX_ACCESSIONS = 50

const VALID_AAS = new Set(['A','C','D','E','F','G','H','I','K','L','M','N','P','Q','R','S','T','V','W','Y'])

function encode(seq: string, values: Record<string, number | null>) {
  return seq.toUpperCase().split('').map((aa, i) => ({
    pos: i + 1,
    aa,
    value: VALID_AAS.has(aa) && aa in values && values[aa] != null && isFinite(values[aa]) ? values[aa] : null,
  }))
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', allowed: ['POST'] })
  }

  const body = req.body as { sequence?: unknown; accessions?: unknown }
  const sequence = body?.sequence

  if (typeof sequence !== 'string' || sequence.length === 0) {
    return res.status(400).json({ error: '`sequence` (non-empty string) is required in the request body' })
  }

  if (sequence.length > 10_000) {
    return res.status(400).json({ error: '`sequence` must not exceed 10,000 residues' })
  }

  const seq = sequence.toUpperCase().replace(/\s/g, '')
  const validCount = [...seq].filter((aa) => VALID_AAS.has(aa)).length

  // Determine which accessions to encode against.
  let accs: string[]
  if (Array.isArray(body?.accessions) && (body.accessions as unknown[]).length > 0) {
    if ((body.accessions as unknown[]).length > MAX_ACCESSIONS) {
      return res.status(400).json({
        error: `\`accessions\` must not exceed ${MAX_ACCESSIONS} entries`,
      })
    }
    accs = (body.accessions as unknown[])
      .filter((a): a is string => typeof a === 'string' && a.toUpperCase() in db)
      .map((a) => a.toUpperCase())
    if (accs.length === 0) {
      return res.status(400).json({ error: 'None of the provided `accessions` were found in aaindex1' })
    }
  } else {
    // No explicit list supplied — same cap, to prevent multi-megabyte responses.
    accs = Object.keys(db).slice(0, MAX_ACCESSIONS)
  }

  const encodings: Record<string, { description: string; category: string; coverage: number; values: Array<{ pos: number; aa: string; value: number | null }> }> = {}

  for (const acc of accs) {
    const rec = db[acc]
    const encoded = encode(seq, rec.values)
    const covered = encoded.filter((e) => e.value !== null).length
    encodings[acc] = {
      description: rec.description,
      category: rec.category,
      coverage: validCount > 0 ? Math.round((covered / validCount) * 1000) / 1000 : 0,
      values: encoded,
    }
  }

  setCacheHeaders(res)
  return res.status(200).json({
    sequence: seq,
    length: seq.length,
    valid_residues: validCount,
    accessions_encoded: accs.length,
    encodings,
  })
}
