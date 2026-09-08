import { describe, it, expect } from 'vitest'
import handler from '../../../api/window'
import { makeReq, makeRes } from './_fixtures'

const SEQ = 'MQIFVKTLTGKTITLEV'
const ACC = 'KYTJ820101'

describe('GET /api/window', () => {
  it('returns a profile for a valid request', () => {
    const res = makeRes()
    handler(makeReq({ query: { accession: ACC, sequence: SEQ } }), res)
    expect(res.statusCode).toBe(200)
    const body = res.body as Record<string, unknown>
    expect(body.accession).toBe(ACC)
    expect(body.window).toBe(7)
    expect((body.profile as unknown[]).length).toBe(SEQ.length)
  })

  it('smooths values — the window mean differs from the raw value', () => {
    const res = makeRes()
    handler(makeReq({ query: { accession: ACC, sequence: SEQ, window: '9' } }), res)
    const profile = (res.body as { profile: Array<{ value: number; window_mean: number }> }).profile
    expect(profile[8].window_mean).not.toBe(profile[8].value)
  })

  it('accepts a lower-case accession', () => {
    const res = makeRes()
    handler(makeReq({ query: { accession: ACC.toLowerCase(), sequence: SEQ } }), res)
    expect(res.statusCode).toBe(200)
  })

  it('404s for an unknown accession', () => {
    const res = makeRes()
    handler(makeReq({ query: { accession: 'NOPE000000', sequence: SEQ } }), res)
    expect(res.statusCode).toBe(404)
  })

  it('404s rather than crashing on a prototype key', () => {
    const res = makeRes()
    handler(makeReq({ query: { accession: 'constructor', sequence: SEQ } }), res)
    expect(res.statusCode).toBe(404)
  })

  it('400s without a sequence', () => {
    const res = makeRes()
    handler(makeReq({ query: { accession: ACC } }), res)
    expect(res.statusCode).toBe(400)
  })

  it('400s on an even window size', () => {
    const res = makeRes()
    handler(makeReq({ query: { accession: ACC, sequence: SEQ, window: '8' } }), res)
    expect(res.statusCode).toBe(400)
  })

  it('400s on an oversized sequence', () => {
    const res = makeRes()
    handler(makeReq({ query: { accession: ACC, sequence: 'A'.repeat(10_001) } }), res)
    expect(res.statusCode).toBe(400)
  })

  it('serves CSV when asked', () => {
    const res = makeRes()
    handler(makeReq({ query: { accession: ACC, sequence: SEQ, format: 'csv' } }), res)
    expect(res.statusCode).toBe(200)
    expect(res.headers['Content-Type']).toContain('text/csv')
    expect(String(res.body).split('\n')[0]).toBe('position,amino_acid,value,window_mean')
  })

  it('rejects an unknown format', () => {
    const res = makeRes()
    handler(makeReq({ query: { accession: ACC, sequence: SEQ, format: 'xml' } }), res)
    expect(res.statusCode).toBe(400)
  })

  it('does not cache an error response', () => {
    const res = makeRes()
    handler(makeReq({ query: { sequence: SEQ } }), res)
    expect(res.statusCode).toBe(400)
    expect(res.headers['Cache-Control']).toBeUndefined()
  })

  it('caches a successful response', () => {
    const res = makeRes()
    handler(makeReq({ query: { accession: ACC, sequence: SEQ } }), res)
    expect(res.headers['Cache-Control']).toContain('s-maxage=86400')
  })
})
