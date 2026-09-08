import type { VercelResponse } from '@vercel/node'
import { toTable } from '../src/lib/csv.js'

export function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

/** Edge cache. Deliberately separate from the CORS headers: only ever call this
 *  on a 200 path, so a transient upstream failure isn't cached for a day. */
export function setCacheHeaders(res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
}

export function methodNotAllowed(res: VercelResponse) {
  return res.status(405).json({ error: 'Method Not Allowed', allowed: ['GET'] })
}

export type TableFormat = 'csv' | 'tsv'

/** Reads ?format=csv|tsv. Returns null for JSON (the default) and undefined for
 *  an unrecognised value, which callers reject with a 400. */
export function tableFormat(v: unknown): TableFormat | null | undefined {
  if (v === undefined || v === '') return null
  if (v === 'json') return null
  if (v === 'csv' || v === 'tsv') return v
  return undefined
}

export function sendTable(
  res: VercelResponse,
  fmt: TableFormat,
  filename: string,
  rows: Array<Record<string, unknown>>,
) {
  setCacheHeaders(res)
  res.setHeader('Content-Type', `text/${fmt === 'csv' ? 'csv' : 'tab-separated-values'}; charset=utf-8`)
  res.setHeader('Content-Disposition', `inline; filename="${filename}.${fmt}"`)
  return res.status(200).send(toTable(rows, fmt === 'csv' ? ',' : '\t'))
}

export function badFormat(res: VercelResponse) {
  return res.status(400).json({ error: '`format` must be one of: json, csv, tsv' })
}
