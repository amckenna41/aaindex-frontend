import { describe, it, expect } from 'vitest'
import handler from '../../../api/search'
import { makeReq, makeRes } from './_fixtures'

describe('GET /api/search', () => {
  it('returns 400 when q is missing', () => {
    const res = makeRes()
    handler(makeReq(), res)
    expect(res.statusCode).toBe(400)
  })

  it('returns hits from more than one database', () => {
    const res = makeRes()
    handler(makeReq({ query: { q: 'a' } }), res)
    const { records } = res.body as { records: { database: string }[] }
    const dbs = new Set(records.map((r) => r.database))
    expect(dbs.size).toBeGreaterThan(1)
  })

  it('tags each record with its source database', () => {
    const res = makeRes()
    handler(makeReq({ query: { q: 'hydrophobicity' } }), res)
    const { records } = res.body as { records: { database: string; accession: string; description: string }[] }
    expect(records.length).toBeGreaterThan(0)
    for (const rec of records) {
      expect(['aaindex1', 'aaindex2', 'aaindex3']).toContain(rec.database)
      expect(rec).toHaveProperty('accession')
      expect(rec).toHaveProperty('description')
    }
  })

  it('matches by accession code across databases', () => {
    const res = makeRes()
    handler(makeReq({ query: { q: 'KYTJ820101' } }), res)
    const { records } = res.body as { records: { accession: string; database: string }[] }
    expect(records.some((r) => r.accession === 'KYTJ820101' && r.database === 'aaindex1')).toBe(true)
  })

  it('is case-insensitive', () => {
    const res = makeRes()
    handler(makeReq({ query: { q: 'HYDROPHOBICITY' } }), res)
    const { count } = res.body as { count: number }
    expect(count).toBeGreaterThan(0)
  })

  it('?limit= and ?offset= paginate the merged results', () => {
    const full = makeRes()
    handler(makeReq({ query: { q: 'a' } }), full)
    const fullBody = full.body as { count: number; records: { accession: string }[] }

    const paged = makeRes()
    handler(makeReq({ query: { q: 'a', limit: '5', offset: '1' } }), paged)
    const pagedBody = paged.body as { count: number; records: { accession: string }[] }

    expect(pagedBody.count).toBe(fullBody.count) // count is total matches, not page size
    expect(pagedBody.records).toHaveLength(5)
    expect(pagedBody.records[0].accession).toBe(fullBody.records[1].accession)
  })

  it('no match returns empty records and count 0', () => {
    const res = makeRes()
    handler(makeReq({ query: { q: 'xxxxxxxxxnotareal' } }), res)
    const body = res.body as { count: number; records: unknown[] }
    expect(body.count).toBe(0)
    expect(body.records).toHaveLength(0)
  })

  it('returns 405 for POST', () => {
    const res = makeRes()
    handler(makeReq({ method: 'POST', query: { q: 'a' } }), res)
    expect(res.statusCode).toBe(405)
  })

  it('OPTIONS preflight returns 204', () => {
    const res = makeRes()
    handler(makeReq({ method: 'OPTIONS' }), res)
    expect(res.statusCode).toBe(204)
  })

  it('sets CORS header', () => {
    const res = makeRes()
    handler(makeReq({ query: { q: 'a' } }), res)
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*')
  })
})
