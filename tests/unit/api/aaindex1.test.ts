import { describe, it, expect } from 'vitest'
import { makeReq, makeRes, dbHandlerFor } from './_fixtures'

const listHandler = dbHandlerFor('aaindex1')
const detailHandler = listHandler

// ── List endpoint ─────────────────────────────────────────────────────────────

describe('GET /api/aaindex1', () => {
  it('returns 200', () => {
    const res = makeRes()
    listHandler(makeReq(), res)
    expect(res.statusCode).toBe(200)
  })

  it('body has database field set to aaindex1', () => {
    const res = makeRes()
    listHandler(makeReq(), res)
    expect((res.body as Record<string, unknown>).database).toBe('aaindex1')
  })

  it('returns all 566 records when no filter is applied', () => {
    const res = makeRes()
    listHandler(makeReq(), res)
    const body = res.body as { total: number; count: number; records: unknown[] }
    expect(body.total).toBe(566)
    expect(body.count).toBe(566)
    expect(body.records).toHaveLength(566)
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
    listHandler(makeReq({ query: { limit: '10' } }), res)
    const body = res.body as { total: number; count: number; records: unknown[] }
    expect(body.total).toBe(566)
    expect(body.records).toHaveLength(10)
  })

  it('?offset= skips the given number of records', () => {
    const res1 = makeRes()
    const res2 = makeRes()
    listHandler(makeReq({ query: { limit: '1' } }), res1)
    listHandler(makeReq({ query: { limit: '1', offset: '1' } }), res2)
    const first = (res1.body as { records: { accession: string }[] }).records[0].accession
    const second = (res2.body as { records: { accession: string }[] }).records[0].accession
    expect(first).not.toBe(second)
  })

  it('each record has accession, description, and category fields', () => {
    const res = makeRes()
    listHandler(makeReq(), res)
    const { records } = res.body as { records: Record<string, unknown>[] }
    for (const rec of records.slice(0, 20)) {
      expect(rec).toHaveProperty('accession')
      expect(rec).toHaveProperty('description')
      expect(rec).toHaveProperty('category')
    }
  })

  it('?q= filters by accession code substring', () => {
    const res = makeRes()
    listHandler(makeReq({ query: { q: 'KYTJ820101' } }), res)
    const { records } = res.body as { records: { accession: string }[] }
    expect(records).toHaveLength(1)
    expect(records[0].accession).toBe('KYTJ820101')
  })

  it('?q= filters by description substring (case-insensitive)', () => {
    const res = makeRes()
    listHandler(makeReq({ query: { q: 'kyte-doolittle' } }), res)
    const { records } = res.body as { records: { accession: string }[] }
    expect(records.length).toBeGreaterThan(0)
    expect(records.some((r) => r.accession === 'KYTJ820101')).toBe(true)
  })

  it('?q= with no match returns empty records array and count 0', () => {
    const res = makeRes()
    listHandler(makeReq({ query: { q: 'xxxxxxxxxnotareal' } }), res)
    const body = res.body as { count: number; records: unknown[] }
    expect(body.count).toBe(0)
    expect(body.records).toHaveLength(0)
  })

  it('?category= filters to matching category only', () => {
    const res = makeRes()
    listHandler(makeReq({ query: { category: 'hydrophobic' } }), res)
    const { records } = res.body as { records: { category: string }[] }
    expect(records.length).toBeGreaterThan(0)
    expect(records.every((r) => r.category === 'hydrophobic')).toBe(true)
  })

  it('?q= and ?category= can be combined', () => {
    const res = makeRes()
    listHandler(makeReq({ query: { q: 'hydrophobicity', category: 'hydrophobic' } }), res)
    const { records } = res.body as { records: { category: string }[] }
    expect(records.every((r) => r.category === 'hydrophobic')).toBe(true)
  })

  it('sets CORS header', () => {
    const res = makeRes()
    listHandler(makeReq(), res)
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*')
  })

  it('sets Cache-Control header', () => {
    const res = makeRes()
    listHandler(makeReq(), res)
    expect(res.headers['Cache-Control']).toBeDefined()
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

describe('GET /api/aaindex1/:accession', () => {
  it('returns 200 for a known accession', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: 'KYTJ820101' } }), res)
    expect(res.statusCode).toBe(200)
  })

  it('body contains accession and database fields', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: 'KYTJ820101' } }), res)
    const body = res.body as Record<string, unknown>
    expect(body.accession).toBe('KYTJ820101')
    expect(body.database).toBe('aaindex1')
  })

  it('body contains a values map with at least 20 entries', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: 'KYTJ820101' } }), res)
    const { values } = res.body as { values: Record<string, number> }
    expect(Object.keys(values).length).toBeGreaterThanOrEqual(20)
  })

  it('values are numeric', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: 'KYTJ820101' } }), res)
    const { values } = res.body as { values: Record<string, number> }
    for (const v of Object.values(values)) {
      expect(typeof v).toBe('number')
    }
  })

  it('body contains description, references, and pmid', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: 'KYTJ820101' } }), res)
    const body = res.body as Record<string, unknown>
    expect(body).toHaveProperty('description')
    expect(body).toHaveProperty('references')
    expect(body).toHaveProperty('pmid')
  })

  it('accession is case-insensitive', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: 'kytj820101' } }), res)
    expect(res.statusCode).toBe(200)
    expect((res.body as Record<string, unknown>).accession).toBe('KYTJ820101')
  })

  it('returns 404 for an unknown accession', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: 'NOTAREAL001' } }), res)
    expect(res.statusCode).toBe(404)
  })

  it('404 body includes a hint field', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: 'NOTAREAL001' } }), res)
    expect((res.body as Record<string, unknown>)).toHaveProperty('hint')
  })

  it('sets CORS header', () => {
    const res = makeRes()
    detailHandler(makeReq({ query: { accession: 'KYTJ820101' } }), res)
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*')
  })

  it('returns 405 for DELETE', () => {
    const res = makeRes()
    detailHandler(makeReq({ method: 'DELETE', query: { accession: 'KYTJ820101' } }), res)
    expect(res.statusCode).toBe(405)
  })
})
