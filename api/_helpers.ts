import type { VercelResponse } from '@vercel/node'

export function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
}

export function methodNotAllowed(res: VercelResponse) {
  return res.status(405).json({ error: 'Method Not Allowed', allowed: ['GET'] })
}
