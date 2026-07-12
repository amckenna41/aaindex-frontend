import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders, methodNotAllowed } from './_helpers.js'
import db1 from '../src/data/aaindex1.json' with { type: 'json' }
import db2 from '../src/data/aaindex2.json' with { type: 'json' }
import db3 from '../src/data/aaindex3.json' with { type: 'json' }

type Rec = { description: string }
const dbs: Array<[string, Record<string, Rec>]> = [
  ['aaindex1', db1 as Record<string, Rec>],
  ['aaindex2', db2 as Record<string, Rec>],
  ['aaindex3', db3 as Record<string, Rec>],
]

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return methodNotAllowed(res)

  const { q, limit, offset } = req.query
  if (typeof q !== 'string' || !q) {
    return res.status(400).json({ error: '`q` query parameter is required' })
  }

  const ql = q.toLowerCase()
  const hits = dbs.flatMap(([database, db]) =>
    Object.entries(db)
      .filter(
        ([acc, rec]) =>
          acc.toLowerCase().includes(ql) || rec.description.toLowerCase().includes(ql),
      )
      .map(([accession, rec]) => ({ database, accession, description: rec.description })),
  )

  const count = hits.length
  const off = typeof offset === 'string' ? Math.max(0, parseInt(offset) || 0) : 0
  const lim = typeof limit === 'string' ? Math.min(1000, Math.max(1, parseInt(limit) || count)) : count

  return res.status(200).json({
    query: q,
    count,
    offset: off,
    limit: lim,
    records: hits.slice(off, off + lim),
  })
}
