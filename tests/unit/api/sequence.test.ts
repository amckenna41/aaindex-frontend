import { describe, it, expect, vi, afterEach } from 'vitest'
import handler from '../../../api/sequence'
import { makeReq, makeRes } from './_fixtures'

const FASTA = '>sp|P01308|INS_HUMAN Insulin OS=Homo sapiens\nMALWMRLLPLLALLALWGPD\nPAAAFVNQHLCGSHLVEALY\n'

function mockFetch(body: string, status = 200) {
  const fn = vi.fn().mockResolvedValue({ ok: status < 400, status, text: async () => body })
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('GET /api/sequence', () => {
  it('returns the parsed sequence from UniProt', async () => {
    mockFetch(FASTA)
    const res = makeRes()
    await handler(makeReq({ query: { id: 'P01308' } }), res)
    expect(res.statusCode).toBe(200)
    const body = res.body as { source: string; entries: Array<{ sequence: string; length: number }> }
    expect(body.source).toBe('uniprot')
    expect(body.entries[0].sequence).toBe('MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALY')
    expect(body.entries[0].length).toBe(40)
  })

  it('routes a PDB-shaped id to the PDB', async () => {
    const fetchFn = mockFetch('>1CRN_1|Chain A\nTTCCPSIVARSNFNVCRLPGTPEA\n')
    const res = makeRes()
    await handler(makeReq({ query: { id: '1CRN' } }), res)
    expect((res.body as { source: string }).source).toBe('pdb')
    expect(fetchFn.mock.calls[0][0]).toContain('rcsb.org')
  })

  it('rejects an id that could escape the upstream path', async () => {
    const fetchFn = mockFetch(FASTA)
    const res = makeRes()
    await handler(makeReq({ query: { id: '../../etc/passwd' } }), res)
    expect(res.statusCode).toBe(400)
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('rejects an unknown db value', async () => {
    const res = makeRes()
    await handler(makeReq({ query: { id: 'P01308', db: 'ncbi' } }), res)
    expect(res.statusCode).toBe(400)
  })

  it('404s when the upstream has no such record', async () => {
    mockFetch('', 404)
    const res = makeRes()
    await handler(makeReq({ query: { id: 'P99999' } }), res)
    expect(res.statusCode).toBe(404)
  })

  it('does not leak upstream internals when the fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.1:443')))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = makeRes()
    await handler(makeReq({ query: { id: 'P01308' } }), res)
    expect(res.statusCode).toBe(502)
    expect(JSON.stringify(res.body)).not.toContain('ECONNREFUSED')
  })

  it('does not cache a failure', async () => {
    mockFetch('', 404)
    const res = makeRes()
    await handler(makeReq({ query: { id: 'P99999' } }), res)
    expect(res.headers['Cache-Control']).toBeUndefined()
  })

  it('405s for POST', async () => {
    const res = makeRes()
    await handler(makeReq({ method: 'POST', query: { id: 'P01308' } }), res)
    expect(res.statusCode).toBe(405)
  })
})
