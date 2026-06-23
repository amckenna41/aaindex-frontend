import { describe, it, expect } from 'vitest'
import Fuse from 'fuse.js'
import { buildSearchIndex } from '../../src/lib/search'
import type { AAIndex1DB, AAIndex2DB, AAIndex3DB } from '../../src/types'

const mockDB: AAIndex1DB = {
  KYTJ820101: {
    description: 'Hydrophobicity index (Kyte-Doolittle, 1982)',
    references: '', notes: '', pmid: '7151539',
    category: 'hydrophobicity',
    correlation_coefficients: {},
    values: { A: 1.8, C: 2.5, D: -3.5, E: -3.5, F: 2.8, G: -0.4, H: -3.2, I: 4.5, K: -3.9, L: 3.8, M: 1.9, N: -3.5, P: -1.6, Q: -3.5, R: -4.5, S: -0.8, T: -0.7, V: 4.2, W: -0.9, Y: -1.3 },
  },
  CHOP780201: {
    description: 'Normalized frequency of alpha-helix',
    references: '', notes: '', pmid: '364941',
    category: 'secondary_structure',
    correlation_coefficients: {},
    values: { A: 1.45, C: 0.77, D: 0.98, E: 1.53, F: 1.12, G: 0.53, H: 1.24, I: 1.00, K: 1.07, L: 1.34, M: 1.20, N: 0.73, P: 0.59, Q: 1.17, R: 0.79, S: 0.79, T: 0.82, W: 1.14, Y: 0.61, V: 1.14 },
  },
  GRAR740102: {
    description: 'Polarity (Grantham, 1974)',
    references: '', notes: '', pmid: '4843792',
    category: 'polarity',
    correlation_coefficients: {},
    values: { A: 8.1, C: 5.5, D: 13.0, E: 12.3, F: 5.2, G: 9.0, H: 10.4, I: 5.2, K: 11.3, L: 4.9, M: 5.7, N: 11.6, P: 8.0, Q: 10.5, R: 10.5, S: 9.2, T: 8.6, V: 5.9, W: 5.4, Y: 6.2 },
  },
}

// ── buildSearchIndex ───────────────────────────────────────────────────────────

describe('buildSearchIndex', () => {
  it('returns a Fuse instance', () => {
    const index = buildSearchIndex(mockDB)
    expect(index).toBeInstanceOf(Fuse)
  })

  it('searching by exact accession finds the record', () => {
    const index = buildSearchIndex(mockDB)
    const results = index.search('KYTJ820101')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.accession).toBe('KYTJ820101')
  })

  it('searching by description keyword finds a matching record', () => {
    const index = buildSearchIndex(mockDB)
    const results = index.search('hydrophobicity')
    const accessions = results.map((r) => r.item.accession)
    expect(accessions).toContain('KYTJ820101')
  })

  it('searching by partial description keyword finds a match', () => {
    const index = buildSearchIndex(mockDB)
    const results = index.search('alpha helix')
    const accessions = results.map((r) => r.item.accession)
    expect(accessions).toContain('CHOP780201')
  })

  it('returns results that include a score field', () => {
    const index = buildSearchIndex(mockDB)
    const results = index.search('polarity')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]).toHaveProperty('score')
  })

  it('a highly relevant match scores lower (closer to 0) than a poor match', () => {
    const index = buildSearchIndex(mockDB)
    const results = index.search('polarity')
    // The first result should have the lowest (best) score
    expect(results[0].score!).toBeLessThan(0.5)
  })

  it('returns no results for a completely unrelated search term', () => {
    const index = buildSearchIndex(mockDB)
    const results = index.search('zzzzzzzzzzzzzzz')
    expect(results).toHaveLength(0)
  })

  it('works with an empty database', () => {
    const index = buildSearchIndex({} as AAIndex1DB)
    const results = index.search('anything')
    expect(results).toHaveLength(0)
  })

  it('index items include accession, description and category fields', () => {
    const index = buildSearchIndex(mockDB)
    const results = index.search('KYTJ820101')
    const item = results[0].item
    expect(item).toHaveProperty('accession')
    expect(item).toHaveProperty('description')
    expect(item).toHaveProperty('category')
  })

  it('category is correctly mapped from the DB record', () => {
    const index = buildSearchIndex(mockDB)
    const results = index.search('KYTJ820101')
    expect(results[0].item.category).toBe('hydrophobicity')
  })

  it('can find a record by category', () => {
    const index = buildSearchIndex(mockDB)
    const results = index.search('secondary_structure')
    const accessions = results.map((r) => r.item.accession)
    expect(accessions).toContain('CHOP780201')
  })
})

// ── AAIndex2 search ────────────────────────────────────────────────────────────

const mockDB2: AAIndex2DB = {
  ALTS910101: {
    description: 'The PAM-120 matrix (Altschul, 1991)',
    references: '', notes: '', pmid: '2051488',
    is_symmetric: true,
    col_order: ['A'], row_order: ['A'],
    correlation_coefficients: {},
    matrix: { A: { A: 3 } },
  },
  HENS920102: {
    description: 'BLOSUM-62 scoring matrix (Henikoff-Henikoff, 1992)',
    references: '', notes: '', pmid: '1438297',
    is_symmetric: true,
    col_order: ['A'], row_order: ['A'],
    correlation_coefficients: {},
    matrix: { A: { A: 4 } },
  },
}

describe('buildSearchIndex — AAIndex2', () => {
  it('returns a Fuse instance for an AAIndex2 DB', () => {
    expect(buildSearchIndex(mockDB2)).toBeInstanceOf(Fuse)
  })

  it('finds a record by accession code', () => {
    const idx = buildSearchIndex(mockDB2)
    const results = idx.search('ALTS910101')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.accession).toBe('ALTS910101')
  })

  it('finds a record by description keyword', () => {
    const idx = buildSearchIndex(mockDB2)
    const results = idx.search('BLOSUM')
    expect(results.some((r) => r.item.accession === 'HENS920102')).toBe(true)
  })

  it('category field is empty string for AAIndex2 records', () => {
    const idx = buildSearchIndex(mockDB2)
    const results = idx.search('PAM')
    expect(results[0].item.category).toBe('')
  })

  it('returns no results for unrelated query', () => {
    const idx = buildSearchIndex(mockDB2)
    expect(idx.search('zzzzzzzzz')).toHaveLength(0)
  })
})

// ── AAIndex3 search ────────────────────────────────────────────────────────────

const mockDB3: AAIndex3DB = {
  BASU010101: {
    description: 'Optimization-based potential (Basuroy-Bhattacharya, 2001)',
    references: '', notes: '', pmid: '11340059',
    is_symmetric: true,
    col_order: ['A'], row_order: ['A'],
    correlation_coefficients: {},
    matrix: { A: { A: -0.05 } },
  },
  TANS760101: {
    description: 'Statistical contact potential (Tanaka-Scheraga, 1976)',
    references: '', notes: '', pmid: '1267629',
    is_symmetric: true,
    col_order: ['A'], row_order: ['A'],
    correlation_coefficients: {},
    matrix: { A: { A: -1.2 } },
  },
}

describe('buildSearchIndex — AAIndex3', () => {
  it('returns a Fuse instance for an AAIndex3 DB', () => {
    expect(buildSearchIndex(mockDB3)).toBeInstanceOf(Fuse)
  })

  it('finds a record by accession code', () => {
    const idx = buildSearchIndex(mockDB3)
    const results = idx.search('TANS760101')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.accession).toBe('TANS760101')
  })

  it('finds a record by description keyword', () => {
    const idx = buildSearchIndex(mockDB3)
    const results = idx.search('statistical')
    expect(results.some((r) => r.item.accession === 'TANS760101')).toBe(true)
  })

  it('returns no results for unrelated query', () => {
    const idx = buildSearchIndex(mockDB3)
    expect(idx.search('zzzzzzzzz')).toHaveLength(0)
  })
})
