import { describe, it, expect } from 'vitest'
import handler from '../../../api/encode'
import { makeRes } from './_fixtures'

function makePostReq(body: Record<string, unknown>) {
  return { method: 'POST', query: {}, body } as never
}

describe('POST /api/encode', () => {
  it('returns 405 for GET', () => {
    const res = makeRes()
    handler({ method: 'GET', query: {}, body: {} } as never, res)
    expect(res.statusCode).toBe(405)
  })

  it('returns 204 for OPTIONS', () => {
    const res = makeRes()
    handler({ method: 'OPTIONS', query: {}, body: {} } as never, res)
    expect(res.statusCode).toBe(204)
  })

  it('returns 400 when sequence is missing', () => {
    const res = makeRes()
    handler(makePostReq({}), res)
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when sequence is empty string', () => {
    const res = makeRes()
    handler(makePostReq({ sequence: '' }), res)
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when sequence exceeds 10,000 residues', () => {
    const res = makeRes()
    handler(makePostReq({ sequence: 'A'.repeat(10_001) }), res)
    expect(res.statusCode).toBe(400)
  })

  it('returns 200 for a valid sequence', () => {
    const res = makeRes()
    handler(makePostReq({ sequence: 'ACDE' }), res)
    expect(res.statusCode).toBe(200)
  })

  it('body contains sequence, length, and valid_residues', () => {
    const res = makeRes()
    handler(makePostReq({ sequence: 'ACDE' }), res)
    const body = res.body as Record<string, unknown>
    expect(body.sequence).toBe('ACDE')
    expect(body.length).toBe(4)
    expect(body.valid_residues).toBe(4)
  })

  it('sequence is uppercased in the response', () => {
    const res = makeRes()
    handler(makePostReq({ sequence: 'acde' }), res)
    expect((res.body as Record<string, unknown>).sequence).toBe('ACDE')
  })

  it('whitespace is stripped from the sequence', () => {
    const res = makeRes()
    handler(makePostReq({ sequence: 'A C D E' }), res)
    expect((res.body as Record<string, unknown>).sequence).toBe('ACDE')
    expect((res.body as Record<string, unknown>).length).toBe(4)
  })

  it('encodes against the first 50 aaindex1 records by default (cap prevents huge responses)', () => {
    const res = makeRes()
    handler(makePostReq({ sequence: 'ACDE' }), res)
    expect((res.body as Record<string, unknown>).accessions_encoded).toBe(50)
  })

  it('encodings object has one key per default accession (50)', () => {
    const res = makeRes()
    handler(makePostReq({ sequence: 'ACDE' }), res)
    const encodings = (res.body as { encodings: Record<string, unknown> }).encodings
    expect(Object.keys(encodings)).toHaveLength(50)
  })

  it('each encoding entry has description, category, coverage, and values', () => {
    const res = makeRes()
    handler(makePostReq({ sequence: 'ACDE' }), res)
    const encodings = (res.body as { encodings: Record<string, { description: string; category: string; coverage: number; values: unknown[] }> }).encodings
    for (const enc of Object.values(encodings).slice(0, 5)) {
      expect(enc).toHaveProperty('description')
      expect(enc).toHaveProperty('category')
      expect(enc).toHaveProperty('coverage')
      expect(enc).toHaveProperty('values')
    }
  })

  it('values array length equals sequence length', () => {
    const res = makeRes()
    handler(makePostReq({ sequence: 'ACDE' }), res)
    const encodings = (res.body as { encodings: Record<string, { values: unknown[] }> }).encodings
    const first = Object.values(encodings)[0]
    expect(first.values).toHaveLength(4)
  })

  it('can encode against a specific subset of accessions', () => {
    const res = makeRes()
    handler(makePostReq({ sequence: 'ACDE', accessions: ['KYTJ820101'] }), res)
    const body = res.body as { accessions_encoded: number; encodings: Record<string, unknown> }
    expect(body.accessions_encoded).toBe(1)
    expect(body.encodings).toHaveProperty('KYTJ820101')
  })

  it('accessions are case-insensitive', () => {
    const res = makeRes()
    handler(makePostReq({ sequence: 'ACDE', accessions: ['kytj820101'] }), res)
    const body = res.body as { encodings: Record<string, unknown> }
    expect(body.encodings).toHaveProperty('KYTJ820101')
  })

  it('returns 400 when all provided accessions are invalid', () => {
    const res = makeRes()
    handler(makePostReq({ sequence: 'ACDE', accessions: ['NOTEXIST999'] }), res)
    expect(res.statusCode).toBe(400)
  })

  it('coverage is between 0 and 1', () => {
    const res = makeRes()
    handler(makePostReq({ sequence: 'ACDE', accessions: ['KYTJ820101'] }), res)
    const enc = (res.body as { encodings: Record<string, { coverage: number }> }).encodings['KYTJ820101']
    expect(enc.coverage).toBeGreaterThanOrEqual(0)
    expect(enc.coverage).toBeLessThanOrEqual(1)
  })

  it('sets CORS header', () => {
    const res = makeRes()
    handler(makePostReq({ sequence: 'ACDE' }), res)
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*')
  })
})
