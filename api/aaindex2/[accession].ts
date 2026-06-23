import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders, methodNotAllowed } from '../_helpers'
import rawDb from '../../src/data/aaindex2.json'

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
  const record = db[key]

  if (!record) {
    return res.status(404).json({
      error: `Record '${key}' not found in aaindex2`,
      hint: 'Check /api/aaindex2 for a list of valid accessions',
    })
  }

  return res.status(200).json({ accession: key, database: 'aaindex2', ...record as object })
}
