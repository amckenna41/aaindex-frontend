import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders, methodNotAllowed } from './_helpers'
import rawDb from '../src/data/aaindex3.json'

interface DB3Record {
  description: string
  pmid: string
  references: string
  notes: string
  is_symmetric: boolean
  row_order: string[]
  col_order: string[]
  matrix: Record<string, Record<string, number>>
  correlation_coefficients: Record<string, number>
}

const db = rawDb as Record<string, DB3Record>

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return methodNotAllowed(res)

  const { q, limit, offset } = req.query

  let entries = Object.entries(db)
  const total = entries.length

  if (typeof q === 'string' && q) {
    const ql = q.toLowerCase()
    entries = entries.filter(
      ([acc, rec]) =>
        acc.toLowerCase().includes(ql) || rec.description.toLowerCase().includes(ql),
    )
  }

  const count = entries.length
  const off = typeof offset === 'string' ? Math.max(0, parseInt(offset) || 0) : 0
  const lim = typeof limit === 'string' ? Math.min(1000, Math.max(1, parseInt(limit) || count)) : count
  const page = entries.slice(off, off + lim)

  return res.status(200).json({
    database: 'aaindex3',
    description: 'Amino acid contact potentials',
    total,
    count,
    offset: off,
    limit: lim,
    records: page.map(([accession, rec]) => ({
      accession,
      description: rec.description,
      is_symmetric: rec.is_symmetric,
    })),
  })
}
