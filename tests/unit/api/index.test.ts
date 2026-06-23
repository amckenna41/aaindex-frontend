import { describe, it, expect } from 'vitest'
import handler from '../../../api/index'
import { makeReq, makeRes } from './_fixtures'

describe('GET /api', () => {
  it('returns 200', () => {
    const res = makeRes()
    handler(makeReq(), res)
    expect(res.statusCode).toBe(200)
  })

  it('body includes all three database keys', () => {
    const res = makeRes()
    handler(makeReq(), res)
    const body = res.body as Record<string, unknown>
    const dbs = body.databases as Record<string, unknown>
    expect(dbs).toHaveProperty('aaindex1')
    expect(dbs).toHaveProperty('aaindex2')
    expect(dbs).toHaveProperty('aaindex3')
  })

  it('each database entry includes an endpoint list and count', () => {
    const res = makeRes()
    handler(makeReq(), res)
    const dbs = (res.body as Record<string, Record<string, unknown>>).databases
    for (const db of Object.values(dbs)) {
      expect(db).toHaveProperty('count')
      expect(db).toHaveProperty('endpoints')
    }
  })

  it('sets CORS header', () => {
    const res = makeRes()
    handler(makeReq(), res)
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*')
  })

  it('returns 405 for POST', () => {
    const res = makeRes()
    handler(makeReq({ method: 'POST' }), res)
    expect(res.statusCode).toBe(405)
  })

  it('OPTIONS preflight returns 204', () => {
    const res = makeRes()
    handler(makeReq({ method: 'OPTIONS' }), res)
    expect(res.statusCode).toBe(204)
  })
})
