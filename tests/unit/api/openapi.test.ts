import { describe, it, expect } from 'vitest'
import handler from '../../../api/openapi'
import { makeReq, makeRes } from './_fixtures'
import { ENDPOINTS } from '../../../src/lib/apiSpec'

function spec() {
  const res = makeRes()
  handler(makeReq({ headers: { host: 'aaindex.test' } }), res)
  return res.body as {
    openapi: string
    servers: Array<{ url: string }>
    paths: Record<string, Record<string, { parameters?: unknown[]; requestBody?: unknown }>>
  }
}

describe('GET /api/openapi', () => {
  it('is a 3.1 document', () => {
    expect(spec().openapi).toBe('3.1.0')
  })

  it('derives the server URL from the request host', () => {
    expect(spec().servers[0].url).toBe('https://aaindex.test')
  })

  it('documents every endpoint the reference page renders', () => {
    const paths = spec().paths
    for (const ep of ENDPOINTS) {
      expect(paths[ep.path], ep.path).toBeDefined()
      expect(paths[ep.path][ep.method.toLowerCase()], `${ep.method} ${ep.path}`).toBeDefined()
    }
  })

  it('marks path parameters as required', () => {
    const params = spec().paths['/api/aaindex1/{accession}'].get.parameters as Array<{ name: string; required: boolean }>
    expect(params.find((p) => p.name === 'accession')?.required).toBe(true)
  })

  it('gives the POST endpoint a request body', () => {
    expect(spec().paths['/api/encode'].post.requestBody).toBeDefined()
  })

  it('405s for POST', () => {
    const res = makeRes()
    handler(makeReq({ method: 'POST' }), res)
    expect(res.statusCode).toBe(405)
  })
})
