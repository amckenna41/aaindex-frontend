import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders, setCacheHeaders, methodNotAllowed } from '../_helpers.js'
import rawDb from '../../src/data/aaindex3.json' with { type: 'json' }

const db = rawDb as Record<string, unknown>

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return methodNotAllowed(res)

  const { accession } = req.query
  if (typeof accession !== 'string') {
    return res.status(400).json({ error: 'Invalid accession parameter' })
  }

  const key = accession.toUpperCase()
  const record = Object.hasOwn(db, key) ? db[key] : undefined

  if (record === undefined) {
    return res.status(404).json({
      error: `Record '${key}' not found in aaindex3`,
      hint: 'Check /api/aaindex3 for a list of valid accessions',
    })
  }

  setCacheHeaders(res)
  return res.status(200).json({ accession: key, database: 'aaindex3', ...record as object })
}
