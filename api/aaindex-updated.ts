import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders, setCacheHeaders, methodNotAllowed } from './_helpers.js'

const SOURCE = 'https://www.genome.jp/aaindex/'

// Exported for unit testing the extraction without a network round-trip.
export function parseLastUpdated(html: string): string | null {
  const m = html.match(/Last updated:[ \t]*([^<]*[^<\s])/i)
  return m ? m[1].trim() : null
}

// Lives for the lifetime of the serverless instance — the source changes ~never.
let cached: string | null = null

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return methodNotAllowed(res)

  if (cached) {
    setCacheHeaders(res)
    return res.status(200).json({ lastUpdated: cached, source: SOURCE })
  }

  try {
    const upstream = await fetch(SOURCE, {
      headers: { 'User-Agent': 'AAIndex-Explorer/1.0 (https://aaindex.vercel.app)' },
    })
    if (!upstream.ok) return res.status(502).json({ error: `genome.jp returned ${upstream.status}` })

    const lastUpdated = parseLastUpdated(await upstream.text())
    if (!lastUpdated) return res.status(502).json({ error: 'Could not find "Last updated" on source page' })

    cached = lastUpdated
    setCacheHeaders(res)
    return res.status(200).json({ lastUpdated, source: SOURCE })
  } catch (e) {
    console.error('aaindex-updated: upstream fetch failed', e)
    return res.status(502).json({ error: 'Failed to reach genome.jp' })
  }
}
