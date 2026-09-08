import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders, setCacheHeaders, methodNotAllowed, tableFormat, sendTable, badFormat } from './_helpers.js'
import raw1 from '../src/data/aaindex1.json' with { type: 'json' }
import raw2 from '../src/data/aaindex2.json' with { type: 'json' }
import raw3 from '../src/data/aaindex3.json' with { type: 'json' }

interface Summary {
  description: string
  category?: string
  is_symmetric?: boolean
}

// ponytail: one function serves all six /api/aaindex{1,2,3}[/:accession] routes —
// Hobby caps a deployment at 12 Serverless Functions and six near-identical files
// spent half of that. vercel.json rewrites keep the public URLs unchanged.
// Upgrade path: if these ever diverge, split the config entry, not the file.
const DBS: Record<string, {
  data: Record<string, Summary>
  description: string
  categorised: boolean
  summary: (accession: string, rec: Summary) => Record<string, unknown>
}> = {
  aaindex1: {
    data: raw1 as unknown as Record<string, Summary>,
    description: 'Amino acid physicochemical property indices',
    categorised: true, // aaindex1 alone has categories; 2 and 3 ignore ?category=
    summary: (accession, rec) => ({ accession, description: rec.description, category: rec.category }),
  },
  aaindex2: {
    data: raw2 as unknown as Record<string, Summary>,
    description: 'Amino acid mutation matrices',
    categorised: false,
    summary: (accession, rec) => ({ accession, description: rec.description, is_symmetric: rec.is_symmetric }),
  },
  aaindex3: {
    data: raw3 as unknown as Record<string, Summary>,
    description: 'Amino acid contact potentials',
    categorised: false,
    summary: (accession, rec) => ({ accession, description: rec.description, is_symmetric: rec.is_symmetric }),
  },
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return methodNotAllowed(res)

  const { database, accession, q, category, limit, offset } = req.query

  if (typeof database !== 'string' || !Object.hasOwn(DBS, database)) {
    return res.status(404).json({ error: 'Unknown database', valid: Object.keys(DBS) })
  }
  const cfg = DBS[database]

  // Single record: /api/<database>/<accession>
  if (accession !== undefined) {
    if (typeof accession !== 'string') {
      return res.status(400).json({ error: 'Invalid accession parameter' })
    }
    const key = accession.toUpperCase()
    if (!Object.hasOwn(cfg.data, key)) {
      return res.status(404).json({
        error: `Record '${key}' not found in ${database}`,
        hint: `Check /api/${database} for a list of valid accessions`,
      })
    }
    setCacheHeaders(res)
    return res.status(200).json({ accession: key, database, ...cfg.data[key] as object })
  }

  // Listing: /api/<database>
  const fmt = tableFormat(req.query.format)
  if (fmt === undefined) return badFormat(res)

  let entries = Object.entries(cfg.data)
  const total = entries.length

  if (typeof q === 'string' && q) {
    const ql = q.toLowerCase()
    entries = entries.filter(
      ([acc, rec]) =>
        acc.toLowerCase().includes(ql) || rec.description.toLowerCase().includes(ql),
    )
  }

  if (cfg.categorised && typeof category === 'string' && category) {
    entries = entries.filter(([, rec]) => rec.category === category)
  }

  const count = entries.length
  const off = typeof offset === 'string' ? Math.max(0, parseInt(offset) || 0) : 0
  const lim = typeof limit === 'string' ? Math.min(1000, Math.max(1, parseInt(limit) || count)) : count
  const records = entries.slice(off, off + lim).map(([acc, rec]) => cfg.summary(acc, rec))

  if (fmt) return sendTable(res, fmt, database, records)

  setCacheHeaders(res)
  return res.status(200).json({
    database,
    description: cfg.description,
    total,
    count,
    offset: off,
    limit: lim,
    records,
  })
}
