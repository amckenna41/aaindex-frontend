import { describe, it, expect } from 'vitest'
import listHandler from '../../../api/aaindex2'
import detailHandler from '../../../api/aaindex2/[accession]'
import { makeReq, makeRes } from './_fixtures'

const KNOWN = 'HENS920102' // BLOSUM-62

// ── List endpoint ─────────────────────────────────────────────────────────────

describe('GET /api/aaindex2', () => {
  it('returns 200', () => {
    const res = makeRes()
    listHandler(makeReq(), res)
    expect(res.statusCode).toBe(200)
  })

  it('body has database field set to aaindex2', () => {
    const res = makeRes()
    listHandler(makeReq(), res)
    expect((res.body as Record<string, unknown>).database).toBe('aaindex2')
  })

  it('returns all 94 records when no filter is applied', () => {
    const res = makeRes()
    listHandler(makeReq(), res)
    const body = res.body as { total: number; count: number; records: unknown[] }
    expect(body.total).toBe(94)
    expect(body.count).toBe(94)
    expect(body.records).toHaveLength(94)
  })

  it('body includes total, count, offset, and limit fields', () => {
    const res = makeRes()
    listHandler(makeReq(), res)
    const body = res.body as Record<string, unknown>
    expect(body).toHaveProperty('total')
    expect(body).toHaveProperty('count')
    expect(body).toHaveProperty('offset')
    expect(body).toHaveProperty('limit')
  })

  it('?limit= returns the requested number of records', () => {
    const res = makeRes()
    listHandler(makeReq({ query: { limit: '5' } }), res)
    const body = res.body as { records: unknown[] }
    expect(body.records).toHaveLength(5)
  })

  it('each record has accession, description, and is_symmetric fields', () => {
    const res = makeRes()
    listHandler(makeReq(), res)
    const { records } = res.body as { records: Record<string, unknown>[] }
    for (const rec of records) {
      expect(rec).toHaveProperty('accession')
      expect(rec).toHaveProperty('description')
      expect(rec).toHaveProperty('is_symmetric')
    }
  })

  it('is_symmetric is a boolean on every record', () => {
    const res = makeRes()
    listHandler(makeReq(), res)
    const { records } = res.body as { records: { is_symmetric: unknown }[] }
    expect(records.every((r) => typeof r.is_symmetric === 'boolean')).toBe(true)
  })

  it('?q= filters by accession code', () => {
    const res = makeRes()
    listHandler(makeReq({ query: { q: KNOWN } }), res)
    const { records } = res.body as { records: { accession: string }[] }
    expect(records).toHaveLength(1)
    expect(records[0].accession).toBe(KNOWN)
  })

  it('?q= filters by description substring (case-insensitive)', () => {
    const res = makeRes()
    listHandler(makeReq({ query: { q: 'blosum' } }), res)
    const { records } = res.body as { records: { accession: string }[] }
    expect(records.length).toBeGreaterThan(0)
    expect(records.some((r) => r.accession === KNOWN)).toBe(true)
  })

  it('?q= with no match returns count 0', () => {
    const res = makeRes()
    listHandler(makeReq({ query: { q: 'xxxxxxxxxnotareal' } }), res)
    expect((res.body as { count: number }).count).toBe(0)
  })

  it('sets CORS header', () => {
    const res = makeRes()
    listHandler(makeReq(), res)
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*')
  })

  it('returns 405 for POST', () => {
    const res = makeRes()
    listHandler(makeReq({ method: 'POST' }), res)
    expect(res.statusCode).toBe(405)
  })

  it('OPTIONS preflight returns 204', () => {
    const res = makeRes()
    listHandler(makeReq({ method: 'OPTIONS' }), res)
    expect(res.statusCode).toBe(204)
  })
})

// ── Detail endpoint ───────────────────────────────────────────────────────────

describe('GET /api/aaindex2/:accession', () => {
  it('returns 200 for a known accession', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: KNOWN } }), res)
    expect(res.statusCode).toBe(200)
  })

  it('body contains accession and database fields', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: KNOWN } }), res)
    const body = res.body as Record<string, unknown>
    expect(body.accession).toBe(KNOWN)
    expect(body.database).toBe('aaindex2')
  })

  it('body contains a matrix field', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: KNOWN } }), res)
    expect((res.body as Record<string, unknown>)).toHaveProperty('matrix')
  })

  it('matrix has 20 row keys', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: KNOWN } }), res)
    const { matrix } = res.body as { matrix: Record<string, unknown> }
    expect(Object.keys(matrix)).toHaveLength(20)
  })

  it('each matrix row has 20 column entries', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: KNOWN } }), res)
    const { matrix } = res.body as { matrix: Record<string, Record<string, number>> }
    for (const row of Object.values(matrix)) {
      expect(Object.keys(row)).toHaveLength(20)
    }
  })

  it('body contains row_order and col_order', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: KNOWN } }), res)
    const body = res.body as Record<string, unknown>
    expect(body).toHaveProperty('row_order')
    expect(body).toHaveProperty('col_order')
  })

  it('accession is case-insensitive', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: KNOWN.toLowerCase() } }), res)
    expect(res.statusCode).toBe(200)
    expect((res.body as Record<string, unknown>).accession).toBe(KNOWN)
  })

  it('returns 404 for an unknown accession', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: 'NOTAREAL001' } }), res)
    expect(res.statusCode).toBe(404)
  })

  it('sets CORS header', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: KNOWN } }), res)
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*')
  })

  it('returns 405 for DELETE', () => {
    const res = makeRes()
    detailHandler(makeReq({ method: 'DELETE', query: { accession: KNOWN } }), res)
    expect(res.statusCode).toBe(405)
  })
})
