import { describe, it, expect, vi, afterEach } from 'vitest'
import handler, { pdbChains } from '../../../api/sequence'
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

  it('keeps the RCSB entity id clean of the chain field', async () => {
    mockFetch('>1CRN_1|Chain A|CRAMBIN|Crambe abyssinica (3721)\nTTCCPSIVARSNFNVCRLPGTPEA\n')
    const res = makeRes()
    await handler(makeReq({ query: { id: '1CRN' } }), res)
    const e = (res.body as { entries: Array<{ id: string; description: string }> }).entries[0]
    expect(e.id).toBe('1CRN_1')
    expect(e.description).toBe('Chain A|CRAMBIN|Crambe abyssinica (3721)')
  })

  it('selects a chain by label or author id, not by a word in the molecule name', async () => {
    mockFetch([
      '>1ABC_1|Chains A, B[auth C]|Protein kinase C|Homo sapiens (9606)', 'MAAA',
      '>1ABC_2|Chain D|Protein kinase C inhibitor|Homo sapiens (9606)', 'MDDD',
    ].join('\n'))
    const res = makeRes()
    await handler(makeReq({ query: { id: '1ABC_D' } }), res)
    const body = res.body as { entries: Array<{ id: string }> }
    expect(body.entries.map((e) => e.id)).toEqual(['1ABC_2'])
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

describe('pdbChains', () => {
  it('reads single, multiple and author-mapped chains', () => {
    expect(pdbChains('Chain A|CRAMBIN')).toEqual(['A'])
    expect(pdbChains('Chains A, B[auth C]|X')).toEqual(['A', 'B', 'C'])
  })
})
