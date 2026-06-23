import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders } from '../_helpers'

// In-memory cache — lives for the lifetime of the serverless instance.
const cache = new Map<string, string>()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })

  const { pmid } = req.query
  if (typeof pmid !== 'string' || !/^\d+$/.test(pmid)) {
    return res.status(400).json({ error: 'pmid must be a numeric string' })
  }

  if (cache.has(pmid)) {
    res.setHeader('X-Cache', 'HIT')
    return res.status(200).json({ pmid, abstract: cache.get(pmid) })
  }

  try {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&rettype=abstract&retmode=text`
    const upstream = await fetch(url)
    if (!upstream.ok) {
      return res.status(502).json({ error: `NCBI returned ${upstream.status}` })
    }
    const text = await upstream.text()
    cache.set(pmid, text)
    res.setHeader('X-Cache', 'MISS')
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
    return res.status(200).json({ pmid, abstract: text })
  } catch (e) {
    return res.status(502).json({ error: `Failed to reach NCBI: ${String(e)}` })
  }
}
