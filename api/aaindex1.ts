import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders, setCacheHeaders, methodNotAllowed, tableFormat, sendTable, badFormat } from './_helpers.js'
import rawDb from '../src/data/aaindex1.json' with { type: 'json' }

interface DB1Record {
  description: string
  category: string
  pmid: string
  references: string
  notes: string
  values: Record<string, number>
  correlation_coefficients: Record<string, number>
}

const db = rawDb as Record<string, DB1Record>

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return methodNotAllowed(res)

  const fmt = tableFormat(req.query.format)
  if (fmt === undefined) return badFormat(res)

  const { q, category, limit, offset } = req.query

  let entries = Object.entries(db)
  const total = entries.length

  if (typeof q === 'string' && q) {
    const ql = q.toLowerCase()
    entries = entries.filter(
      ([acc, rec]) =>
        acc.toLowerCase().includes(ql) || rec.description.toLowerCase().includes(ql),
    )
  }

  if (typeof category === 'string' && category) {
    entries = entries.filter(([, rec]) => rec.category === category)
  }

  const count = entries.length
  const off = typeof offset === 'string' ? Math.max(0, parseInt(offset) || 0) : 0
  const lim = typeof limit === 'string' ? Math.min(1000, Math.max(1, parseInt(limit) || count)) : count
  const page = entries.slice(off, off + lim)

  const records = page.map(([accession, rec]) => ({
    accession,
    description: rec.description,
    category: rec.category,
  }))

  if (fmt) return sendTable(res, fmt, 'aaindex1', records)

  setCacheHeaders(res)
  return res.status(200).json({
    database: 'aaindex1',
    description: 'Amino acid physicochemical property indices',
    total,
    count,
    offset: off,
    limit: lim,
    records,
  })
}
