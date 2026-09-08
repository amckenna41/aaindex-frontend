/** Regression cover for the API findings: error responses must never be cached,
 *  encode must be bounded, and prototype keys must not resolve to records. */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { makeReq, makeRes, type MockRes } from './_fixtures'

import indexHandler from '../../../api/index'
import searchHandler from '../../../api/search'
import list1 from '../../../api/aaindex1'
import list2 from '../../../api/aaindex2'
import list3 from '../../../api/aaindex3'
import rec1 from '../../../api/aaindex1/[accession]'
import rec2 from '../../../api/aaindex2/[accession]'
import rec3 from '../../../api/aaindex3/[accession]'
import encodeHandler from '../../../api/encode'
import pubmedHandler from '../../../api/pubmed/[pmid]'
import updatedHandler, { parseLastUpdated } from '../../../api/aaindex-updated'

afterEach(() => vi.unstubAllGlobals())

const LIST_HANDLERS = [
  ['/api', indexHandler],
  ['/api/search', searchHandler],
  ['/api/aaindex1', list1],
  ['/api/aaindex2', list2],
  ['/api/aaindex3', list3],
] as const

describe('S3 — errors are never cached at the edge', () => {
  it.each(LIST_HANDLERS)('%s does not cache a 405', (_name, handler) => {
    const res = makeRes()
    handler(makeReq({ method: 'DELETE' }), res)
    expect(res.statusCode).toBe(405)
    expect(res.headers['Cache-Control']).toBeUndefined()
  })

  it('a 400 from search is not cached', () => {
    const res = makeRes()
    searchHandler(makeReq({ query: {} }), res)
    expect(res.statusCode).toBe(400)
    expect(res.headers['Cache-Control']).toBeUndefined()
  })

  it('a 404 from a record endpoint is not cached', () => {
    const res = makeRes()
    rec1(makeReq({ query: { accession: 'NOSUCH0000' } }), res)
    expect(res.statusCode).toBe(404)
    expect(res.headers['Cache-Control']).toBeUndefined()
  })

  it('a transient 502 from PubMed is not cached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => '' }))
    const res = makeRes()
    await pubmedHandler(makeReq({ query: { pmid: '99999999' } }), res)
    expect(res.statusCode).toBe(502)
    expect(res.headers['Cache-Control']).toBeUndefined()
  })

  it('a successful list response is still cached', () => {
    const res = makeRes()
    list1(makeReq(), res)
    expect(res.headers['Cache-Control']).toContain('s-maxage=86400')
  })

  it('CORS is set on error responses even though caching is not', () => {
    const res = makeRes()
    searchHandler(makeReq({ query: {} }), res)
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*')
  })
})

describe('S5 — upstream internals stay server-side', () => {
  it('the genome.jp failure message carries no exception detail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND internal.host')))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = makeRes()
    await updatedHandler(makeReq(), res)
    expect(res.statusCode).toBe(502)
    expect(JSON.stringify(res.body)).not.toContain('ENOTFOUND')
  })

  it('the NCBI failure message carries no exception detail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('socket hang up at 10.1.2.3')))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = makeRes()
    await pubmedHandler(makeReq({ query: { pmid: '12345678' } }), res)
    expect(res.statusCode).toBe(502)
    expect(JSON.stringify(res.body)).not.toContain('10.1.2.3')
  })
})

describe('S6 — parseLastUpdated is linear on pathological input', () => {
  it('extracts the date', () => {
    expect(parseLastUpdated('<p>Last updated: February 13, 2017 </p>')).toBe('February 13, 2017')
  })

  it('returns null when the marker is absent', () => {
    expect(parseLastUpdated('<html>nothing here</html>')).toBeNull()
  })

  it('completes quickly on a long input with no closing angle bracket', () => {
    const started = Date.now()
    parseLastUpdated('Last updated: ' + 'a '.repeat(60_000))
    expect(Date.now() - started).toBeLessThan(1000)
  })
})

describe('S2 — POST /api/encode is bounded', () => {
  it('rejects more accessions than the cap', () => {
    const res = makeRes()
    encodeHandler(
      makeReq({ method: 'POST', body: { sequence: 'ACDEF', accessions: Array(51).fill('KYTJ820101') } }),
      res,
    )
    expect(res.statusCode).toBe(400)
  })

  it('accepts a request at the cap', () => {
    const res = makeRes()
    encodeHandler(
      makeReq({ method: 'POST', body: { sequence: 'ACDEF', accessions: Array(50).fill('KYTJ820101') } }),
      res,
    )
    expect(res.statusCode).toBe(200)
  })

  it('encodes at most the cap when no accessions are given', () => {
    const res = makeRes()
    encodeHandler(makeReq({ method: 'POST', body: { sequence: 'ACDEF' } }), res)
    expect((res.body as { accessions_encoded: number }).accessions_encoded).toBeLessThanOrEqual(50)
  })
})

describe('S4 — prototype keys resolve to 404, not an inherited member', () => {
  const cases: Array<[string, (req: never, res: MockRes) => unknown]> = [
    ['aaindex1', rec1 as never],
    ['aaindex2', rec2 as never],
    ['aaindex3', rec3 as never],
  ]
  it.each(cases)('%s/constructor is a 404', (_db, handler) => {
    const res = makeRes()
    handler(makeReq({ query: { accession: 'constructor' } }) as never, res)
    expect(res.statusCode).toBe(404)
  })

  it.each(['toString', 'valueOf', '__proto__', 'hasOwnProperty'])('aaindex1/%s is a 404', (key) => {
    const res = makeRes()
    rec1(makeReq({ query: { accession: key } }), res)
    expect(res.statusCode).toBe(404)
  })
})

describe('B8 — /api counts are derived from the data', () => {
  it('matches the bundled record counts rather than a hardcoded number', async () => {
    const [db1, db2, db3] = await Promise.all([
      import('../../../src/data/aaindex1.json'),
      import('../../../src/data/aaindex2.json'),
      import('../../../src/data/aaindex3.json'),
    ])
    const res = makeRes()
    indexHandler(makeReq(), res)
    const dbs = (res.body as { databases: Record<string, { count: number }> }).databases
    expect(dbs.aaindex1.count).toBe(Object.keys(db1.default).length)
    expect(dbs.aaindex2.count).toBe(Object.keys(db2.default).length)
    expect(dbs.aaindex3.count).toBe(Object.keys(db3.default).length)
  })
})

describe('?format=csv|tsv on the list endpoints', () => {
  it('returns CSV with a header row', () => {
    const res = makeRes()
    list1(makeReq({ query: { format: 'csv', limit: '2' } }), res)
    expect(res.headers['Content-Type']).toContain('text/csv')
    expect(String(res.body).split('\n')[0]).toBe('accession,description,category')
  })

  it('returns tab-separated values for tsv', () => {
    const res = makeRes()
    list2(makeReq({ query: { format: 'tsv', limit: '1' } }), res)
    expect(String(res.body).split('\n')[0]).toBe('accession\tdescription\tis_symmetric')
  })

  it('search supports csv too', () => {
    const res = makeRes()
    searchHandler(makeReq({ query: { q: 'hydro', format: 'csv' } }), res)
    expect(String(res.body).split('\n')[0]).toBe('database,accession,description')
  })

  it('quotes a description containing a comma', () => {
    const res = makeRes()
    list3(makeReq({ query: { format: 'csv' } }), res)
    const withComma = String(res.body).split('\n').find((l) => l.includes('"'))
    expect(withComma).toBeDefined()
  })

  it('format=json is still JSON', () => {
    const res = makeRes()
    list1(makeReq({ query: { format: 'json', limit: '1' } }), res)
    expect(res.body).toHaveProperty('database', 'aaindex1')
  })

  it('rejects an unknown format', () => {
    const res = makeRes()
    list1(makeReq({ query: { format: 'yaml' } }), res)
    expect(res.statusCode).toBe(400)
  })
})
