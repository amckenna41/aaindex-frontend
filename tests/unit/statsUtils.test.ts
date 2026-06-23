import { describe, it, expect } from 'vitest'
import { categoryStats } from '../../src/lib/statsUtils'
import type { AAIndex1DB } from '../../src/types'

// ── fixtures ───────────────────────────────────────────────────────────────────

const mockDB: AAIndex1DB = {
  REC001: {
    description: 'Hydrophobicity (Kyte-Doolittle)',
    references: '', notes: '', pmid: '',
    category: 'hydrophobicity',
    correlation_coefficients: {},
    values: { A: 1.8, C: 2.5, D: -3.5, E: -3.5, F: 2.8, G: -0.4, H: -3.2, I: 4.5, K: -3.9, L: 3.8, M: 1.9, N: -3.5, P: -1.6, Q: -3.5, R: -4.5, S: -0.8, T: -0.7, V: 4.2, W: -0.9, Y: -1.3 },
  },
  REC002: {
    description: 'Molecular weight',
    references: '', notes: '', pmid: '',
    category: 'size',
    correlation_coefficients: {},
    values: { A: 89, C: 121, D: 133, E: 147, F: 165, G: 75, H: 155, I: 131, K: 146, L: 131, M: 149, N: 132, P: 115, Q: 146, R: 174, S: 105, T: 119, V: 117, W: 204, Y: 181 },
  },
  REC003: {
    description: 'Alpha-helix propensity',
    references: '', notes: '', pmid: '',
    category: 'hydrophobicity',
    correlation_coefficients: {},
    values: { A: 1.45, C: 0.77, D: 0.98, E: 1.53, F: 1.12, G: 0.53, H: 1.24, I: 1.00, K: 1.07, L: 1.34, M: 1.20, N: 0.73, P: 0.59, Q: 1.17, R: 0.79, S: 0.79, T: 0.82, V: 1.14, W: 1.14, Y: 0.61 },
  },
}

// ── categoryStats ──────────────────────────────────────────────────────────────

describe('categoryStats', () => {
  it('returns stats for all 20 amino acids', () => {
    const stats = categoryStats(mockDB, '')
    expect(stats).toHaveLength(20)
  })

  it('result amino acids are in alphabetical order (AA_ORDER_ALPHA)', () => {
    const stats = categoryStats(mockDB, '')
    const aas = stats.map((s) => s.aa)
    expect(aas).toEqual([...aas].sort())
  })

  it('with empty category filter includes all records', () => {
    const stats = categoryStats(mockDB, '')
    const aStat = stats.find((s) => s.aa === 'A')!
    expect(aStat.n).toBe(3) // REC001, REC002, REC003 all have A
  })

  it('filters correctly by a specific category', () => {
    const stats = categoryStats(mockDB, 'hydrophobicity')
    const aStat = stats.find((s) => s.aa === 'A')!
    expect(aStat.n).toBe(2) // only REC001 and REC003
  })

  it('returns n=0 and null stats when no records match category', () => {
    const stats = categoryStats(mockDB, 'nonexistent_category')
    for (const s of stats) {
      expect(s.n).toBe(0)
      expect(s.mean).toBeNull()
      expect(s.min).toBeNull()
      expect(s.max).toBeNull()
      expect(s.std).toBeNull()
    }
  })

  it('calculates correct mean for amino acid A across all records', () => {
    const stats = categoryStats(mockDB, '')
    const aStat = stats.find((s) => s.aa === 'A')!
    const expected = (1.8 + 89 + 1.45) / 3
    expect(aStat.mean).toBeCloseTo(expected, 5)
  })

  it('calculates correct min for amino acid A across all records', () => {
    const stats = categoryStats(mockDB, '')
    const aStat = stats.find((s) => s.aa === 'A')!
    expect(aStat.min).toBeCloseTo(1.45, 5) // min of 1.8, 89, 1.45
  })

  it('calculates correct max for amino acid A across all records', () => {
    const stats = categoryStats(mockDB, '')
    const aStat = stats.find((s) => s.aa === 'A')!
    expect(aStat.max).toBeCloseTo(89, 5)
  })

  it('calculates correct std for amino acid A across all records', () => {
    const stats = categoryStats(mockDB, '')
    const aStat = stats.find((s) => s.aa === 'A')!
    const vals = [1.8, 89, 1.45]
    const mean = vals.reduce((a, b) => a + b, 0) / 3
    const expectedStd = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / 3)
    expect(aStat.std).toBeCloseTo(expectedStd, 5)
  })

  it('std is 0 when all values for an AA are the same', () => {
    const uniformDB: AAIndex1DB = {
      R1: { description: '', references: '', notes: '', pmid: '', category: 'test', correlation_coefficients: {}, values: { A: 5 } },
      R2: { description: '', references: '', notes: '', pmid: '', category: 'test', correlation_coefficients: {}, values: { A: 5 } },
    }
    const stats = categoryStats(uniformDB, 'test')
    const aStat = stats.find((s) => s.aa === 'A')!
    expect(aStat.std).toBeCloseTo(0, 10)
  })

  it('returns null stats for AAs not present in any matching record', () => {
    const sparseDB: AAIndex1DB = {
      R1: { description: '', references: '', notes: '', pmid: '', category: 'sparse', correlation_coefficients: {}, values: { A: 1.0 } },
    }
    const stats = categoryStats(sparseDB, 'sparse')
    const cStat = stats.find((s) => s.aa === 'C')!
    expect(cStat.n).toBe(0)
    expect(cStat.mean).toBeNull()
  })

  it('returns results for single-record DB', () => {
    const singleDB: AAIndex1DB = {
      ONLY: { description: '', references: '', notes: '', pmid: '', category: 'cat', correlation_coefficients: {}, values: { A: 2.0, C: 3.0 } },
    }
    const stats = categoryStats(singleDB, 'cat')
    const aStat = stats.find((s) => s.aa === 'A')!
    expect(aStat.n).toBe(1)
    expect(aStat.mean).toBeCloseTo(2.0, 5)
    expect(aStat.std).toBeCloseTo(0, 5)
  })
})
