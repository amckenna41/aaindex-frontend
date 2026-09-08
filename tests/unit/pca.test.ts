import { describe, it, expect } from 'vitest'
import { jacobiEigen, pca2 } from '../../src/lib/pca'

describe('jacobiEigen', () => {
  it('recovers the eigenvalues of a known symmetric matrix', () => {
    // [[2,1],[1,2]] has eigenvalues 3 and 1.
    const { values } = jacobiEigen([[2, 1], [1, 2]])
    expect(values.slice().sort((a, b) => b - a).map((v) => Math.round(v * 1e6) / 1e6)).toEqual([3, 1])
  })

  it('returns orthonormal eigenvectors', () => {
    const { vectors } = jacobiEigen([[2, 1], [1, 2]])
    const dot = vectors[0][0] * vectors[0][1] + vectors[1][0] * vectors[1][1]
    expect(Math.abs(dot)).toBeLessThan(1e-8)
    const norm = Math.hypot(vectors[0][0], vectors[1][0])
    expect(norm).toBeCloseTo(1, 8)
  })

  it('leaves a diagonal matrix unchanged', () => {
    const { values } = jacobiEigen([[5, 0], [0, 2]])
    expect(values.slice().sort((a, b) => b - a)).toEqual([5, 2])
  })
})

describe('pca2', () => {
  it('puts variance on PC1 for data lying on a line', () => {
    const rows = [[-2, -4], [-1, -2], [0, 0], [1, 2], [2, 4]]
    const { explained } = pca2(rows)
    expect(explained[0]).toBeCloseTo(1, 6)
    expect(explained[1]).toBeCloseTo(0, 6)
  })

  it('orders points along PC1 monotonically for collinear input', () => {
    const { scores } = pca2([[-2, -4], [-1, -2], [0, 0], [1, 2], [2, 4]])
    const xs = scores.map(([x]) => x)
    const increasing = xs.every((x, i) => i === 0 || x > xs[i - 1])
    const decreasing = xs.every((x, i) => i === 0 || x < xs[i - 1])
    expect(increasing || decreasing).toBe(true)
  })

  it('imputes nulls rather than producing NaN', () => {
    const { scores } = pca2([[1, null], [2, 3], [3, 5]])
    expect(scores.flat().every((v) => Number.isFinite(v))).toBe(true)
  })

  it('returns an empty result for no rows', () => {
    expect(pca2([])).toEqual({ scores: [], explained: [0, 0], loadings: [] })
  })

  it('returns one score pair per input row', () => {
    expect(pca2([[1, 2, 3], [4, 5, 6], [7, 8, 10]]).scores).toHaveLength(3)
  })
})
