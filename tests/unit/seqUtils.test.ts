import { describe, it, expect } from 'vitest'
import {
  encodeSequence,
  slidingWindowEncode,
  pearsonR,
  zScoreNormalise,
  VALID_AAS,
} from '../../src/lib/seqUtils'

// ── VALID_AAS ──────────────────────────────────────────────────────────────────

describe('VALID_AAS', () => {
  it('contains exactly the 20 standard amino acids', () => {
    expect(VALID_AAS.size).toBe(20)
  })

  it('includes all expected single-letter codes', () => {
    const expected = ['A','C','D','E','F','G','H','I','K','L','M','N','P','Q','R','S','T','V','W','Y']
    for (const aa of expected) expect(VALID_AAS.has(aa)).toBe(true)
  })

  it('does not include ambiguous codes like B, Z, X, U, O', () => {
    for (const c of ['B','Z','X','U','O','J','*','-']) expect(VALID_AAS.has(c)).toBe(false)
  })
})

// ── encodeSequence ─────────────────────────────────────────────────────────────

describe('encodeSequence', () => {
  const values: Record<string, number> = {
    A: 1.8, C: 2.5, D: -3.5, E: -3.5, F: 2.8,
    G: -0.4, H: -3.2, I: 4.5, K: -3.9, L: 3.8,
    M: 1.9, N: -3.5, P: -1.6, Q: -3.5, R: -4.5,
    S: -0.8, T: -0.7, V: 4.2, W: -0.9, Y: -1.3,
  }

  it('returns an array with length equal to the sequence', () => {
    const result = encodeSequence('ACDE', values)
    expect(result).toHaveLength(4)
  })

  it('positions are 1-indexed', () => {
    const result = encodeSequence('ACDE', values)
    expect(result[0].pos).toBe(1)
    expect(result[3].pos).toBe(4)
  })

  it('assigns correct amino acid letter to each element', () => {
    const result = encodeSequence('ACDE', values)
    expect(result[0].aa).toBe('A')
    expect(result[1].aa).toBe('C')
    expect(result[2].aa).toBe('D')
    expect(result[3].aa).toBe('E')
  })

  it('maps known amino acids to their values', () => {
    const result = encodeSequence('ACDE', values)
    expect(result[0].value).toBe(1.8)
    expect(result[1].value).toBe(2.5)
    expect(result[2].value).toBe(-3.5)
    expect(result[3].value).toBe(-3.5)
  })

  it('uppercases lowercase input', () => {
    const result = encodeSequence('acde', values)
    expect(result[0].aa).toBe('A')
    expect(result[0].value).toBe(1.8)
  })

  it('returns null for amino acids not in the values map', () => {
    const partial: Record<string, number> = { A: 1.8 }
    const result = encodeSequence('AC', partial)
    expect(result[0].value).toBe(1.8)
    expect(result[1].value).toBeNull()
  })

  it('returns null for non-amino-acid characters', () => {
    const result = encodeSequence('A-*X', values)
    expect(result[0].value).toBe(1.8)
    expect(result[1].value).toBeNull()
    expect(result[2].value).toBeNull()
    expect(result[3].value).toBeNull()
  })

  it('still sets the aa field for non-amino-acid characters', () => {
    const result = encodeSequence('A-', values)
    expect(result[1].aa).toBe('-')
  })

  it('returns null when the value is NaN', () => {
    const withNaN = { ...values, A: NaN }
    const result = encodeSequence('A', withNaN)
    expect(result[0].value).toBeNull()
  })

  it('returns null when the value is Infinity', () => {
    const withInf = { ...values, A: Infinity }
    const result = encodeSequence('A', withInf)
    expect(result[0].value).toBeNull()
  })

  it('returns empty array for empty sequence', () => {
    expect(encodeSequence('', values)).toHaveLength(0)
  })

  it('handles a full 20-AA sequence correctly', () => {
    const seq = 'ACDEFGHIKLMNPQRSTVWY'
    const result = encodeSequence(seq, values)
    expect(result).toHaveLength(20)
    expect(result.every((r) => r.value !== null)).toBe(true)
  })

  it('position numbers increment correctly for long sequences', () => {
    const seq = 'A'.repeat(100)
    const result = encodeSequence(seq, { A: 1 })
    expect(result[0].pos).toBe(1)
    expect(result[99].pos).toBe(100)
  })
})

// ── slidingWindowEncode ────────────────────────────────────────────────────────

describe('slidingWindowEncode', () => {
  const values: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5 }

  const makeEncoded = (seq: string, vals: Record<string, number> = values) =>
    encodeSequence(seq, vals)

  it('with window size 1 returns same values unchanged', () => {
    const encoded = makeEncoded('AACDE', { A: 1, C: 3, D: 4, E: 5 })
    const windowed = slidingWindowEncode(encoded, 1)
    windowed.forEach((w, i) => {
      expect(w.value).toBeCloseTo(encoded[i].value ?? 0, 5)
    })
  })

  it('preserves position and aa fields', () => {
    const encoded = makeEncoded('ACDE', { A: 1, C: 3, D: 4, E: 5 })
    const windowed = slidingWindowEncode(encoded, 3)
    expect(windowed[0].pos).toBe(1)
    expect(windowed[0].aa).toBe('A')
    expect(windowed[2].pos).toBe(3)
  })

  it('averages a window of 3 at the center position', () => {
    // A=1, C=3, D=4 → center of [1,3,4] = 8/3
    const encoded = makeEncoded('ACD', { A: 1, C: 3, D: 4 })
    const windowed = slidingWindowEncode(encoded, 3)
    expect(windowed[1].value).toBeCloseTo((1 + 3 + 4) / 3, 5)
  })

  it('clips window at left boundary', () => {
    // First position with window 3: only has itself and next → [1,3]
    const encoded = makeEncoded('ACD', { A: 1, C: 3, D: 4 })
    const windowed = slidingWindowEncode(encoded, 3)
    expect(windowed[0].value).toBeCloseTo((1 + 3) / 2, 5)
  })

  it('clips window at right boundary', () => {
    // Last position with window 3: only prev and itself → [3,4]
    const encoded = makeEncoded('ACD', { A: 1, C: 3, D: 4 })
    const windowed = slidingWindowEncode(encoded, 3)
    expect(windowed[2].value).toBeCloseTo((3 + 4) / 2, 5)
  })

  it('excludes null values from the window average', () => {
    // X is not in values, so null; window of 3 around X: only non-null neighbours
    const encoded = encodeSequence('AXC', { A: 1, C: 3 })
    const windowed = slidingWindowEncode(encoded, 3)
    // center position: X=null; window has A=1 and C=3 → avg = 2
    expect(windowed[1].value).toBeCloseTo((1 + 3) / 2, 5)
  })

  it('returns null when all values in window are null', () => {
    const encoded = encodeSequence('XXX', {})
    const windowed = slidingWindowEncode(encoded, 3)
    expect(windowed[0].value).toBeNull()
    expect(windowed[1].value).toBeNull()
    expect(windowed[2].value).toBeNull()
  })

  it('output length equals input length', () => {
    const encoded = makeEncoded('ACDEFG', { A:1,C:3,D:4,E:5,F:6,G:-1 })
    expect(slidingWindowEncode(encoded, 5)).toHaveLength(encoded.length)
  })

  it('handles window size larger than sequence length', () => {
    const encoded = makeEncoded('AC', { A: 1, C: 3 })
    const windowed = slidingWindowEncode(encoded, 99)
    // All positions see all values: avg = 2
    expect(windowed[0].value).toBeCloseTo(2, 5)
    expect(windowed[1].value).toBeCloseTo(2, 5)
  })
})

// ── pearsonR ───────────────────────────────────────────────────────────────────

describe('pearsonR', () => {
  it('returns 1.0 for perfectly positively correlated arrays', () => {
    expect(pearsonR([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])).toBeCloseTo(1, 5)
  })

  it('returns -1.0 for perfectly negatively correlated arrays', () => {
    expect(pearsonR([1, 2, 3, 4, 5], [10, 8, 6, 4, 2])).toBeCloseTo(-1, 5)
  })

  it('returns ~0 for uncorrelated arrays', () => {
    // Constant Y → no linear relationship
    const r = pearsonR([1, 2, 3, 4, 5], [3, 3, 3, 3, 3])
    expect(r).toBeCloseTo(0, 5)
  })

  it('returns 1.0 for identical arrays', () => {
    expect(pearsonR([3, 1, 4, 1, 5], [3, 1, 4, 1, 5])).toBeCloseTo(1, 5)
  })

  it('returns 0 when fewer than 2 elements', () => {
    expect(pearsonR([], [])).toBe(0)
    expect(pearsonR([1], [1])).toBe(0)
  })

  it('returns 0 when X has zero variance', () => {
    expect(pearsonR([2, 2, 2], [1, 2, 3])).toBe(0)
  })

  it('returns 0 when Y has zero variance', () => {
    expect(pearsonR([1, 2, 3], [5, 5, 5])).toBe(0)
  })

  it('is between -1 and 1 for real data', () => {
    const xs = [1.8, 2.5, -3.5, -3.5, 2.8, -0.4, -3.2]
    const ys = [0.31, 1.54, 0.60, 0.78, 1.06, 0.0, 0.23]
    const r = pearsonR(xs, ys)
    expect(r).toBeGreaterThanOrEqual(-1)
    expect(r).toBeLessThanOrEqual(1)
  })

  it('is symmetric: pearsonR(xs,ys) == pearsonR(ys,xs)', () => {
    const xs = [1, -2, 3, 0, -1]
    const ys = [2, 1, -1, 3, 4]
    expect(pearsonR(xs, ys)).toBeCloseTo(pearsonR(ys, xs), 10)
  })
})

// ── zScoreNormalise ────────────────────────────────────────────────────────────

describe('zScoreNormalise', () => {
  it('output mean is approximately 0', () => {
    const input = { A: 1, C: 2, D: 3, E: 4, F: 5 }
    const result = zScoreNormalise(input)
    const vals = Object.values(result)
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    expect(mean).toBeCloseTo(0, 10)
  })

  it('output population std is approximately 1', () => {
    const input = { A: 1, C: 2, D: 3, E: 4, F: 5 }
    const result = zScoreNormalise(input)
    const vals = Object.values(result)
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length)
    expect(std).toBeCloseTo(1, 10)
  })

  it('preserves the keys of the input object', () => {
    const input = { A: 10, C: 20, D: 30 }
    const result = zScoreNormalise(input)
    expect(Object.keys(result).sort()).toEqual(['A', 'C', 'D'])
  })

  it('maps a single value to 0 (std defaults to 1 to avoid div/0)', () => {
    const result = zScoreNormalise({ A: 42 })
    expect(result['A']).toBeCloseTo(0, 10)
  })

  it('maps all-equal values to 0 (zero variance)', () => {
    const input = { A: 5, C: 5, D: 5 }
    const result = zScoreNormalise(input)
    for (const v of Object.values(result)) expect(v).toBeCloseTo(0, 10)
  })

  it('the largest input value gets the largest z-score', () => {
    const input = { A: 1, C: 5, D: 3 }
    const result = zScoreNormalise(input)
    expect(result['C']).toBeGreaterThan(result['D'])
    expect(result['D']).toBeGreaterThan(result['A'])
  })

  it('handles negative values correctly', () => {
    const input = { A: -10, C: 0, D: 10 }
    const result = zScoreNormalise(input)
    expect(result['A']).toBeLessThan(0)
    expect(result['D']).toBeGreaterThan(0)
    expect(result['C']).toBeCloseTo(0, 10)
  })

  it('returns the original object if all values are filtered out', () => {
    const input = {}
    const result = zScoreNormalise(input)
    expect(result).toEqual(input)
  })
})
