/** Minimal PCA for the whole-database similarity view.
 *  The feature space is only the 20 amino acids, so a 20×20 symmetric
 *  eigendecomposition (Jacobi rotations) is exact, fast and dependency-free. */

export interface PCAResult {
  /** Scores on the first two components, one row per input row. */
  scores: Array<[number, number]>
  /** Fraction of total variance captured by PC1 and PC2. */
  explained: [number, number]
  /** Component loadings per feature — [PC1, PC2] for each column. */
  loadings: Array<[number, number]>
}

/** Eigen-decomposition of a real symmetric matrix by cyclic Jacobi rotation.
 *  Returns eigenvalues and the matching eigenvectors as columns. */
export function jacobiEigen(
  input: number[][],
  maxSweeps = 100,
  tolerance = 1e-10,
): { values: number[]; vectors: number[][] } {
  const n = input.length
  const a = input.map((row) => [...row])
  const v: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  )

  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let off = 0
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] ** 2
    if (off < tolerance) break

    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < tolerance) continue
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q])
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1))
        const c = 1 / Math.sqrt(t * t + 1)
        const s = t * c

        for (let k = 0; k < n; k++) {
          const akp = a[k][p]
          const akq = a[k][q]
          a[k][p] = c * akp - s * akq
          a[k][q] = s * akp + c * akq
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p][k]
          const aqk = a[q][k]
          a[p][k] = c * apk - s * aqk
          a[q][k] = s * apk + c * aqk
        }
        for (let k = 0; k < n; k++) {
          const vkp = v[k][p]
          const vkq = v[k][q]
          v[k][p] = c * vkp - s * vkq
          v[k][q] = s * vkp + c * vkq
        }
      }
    }
  }

  return { values: a.map((row, i) => row[i]), vectors: v }
}

/** Projects rows onto their first two principal components.
 *  Columns are mean-imputed (nulls are common — several indices have gaps) then
 *  standardised, so a property measured in kcal/mol doesn't swamp one in Å³. */
export function pca2(rows: Array<Array<number | null>>): PCAResult {
  const n = rows.length
  const d = n ? rows[0].length : 0
  if (!n || !d) return { scores: [], explained: [0, 0], loadings: [] }

  const means: number[] = []
  const sds: number[] = []
  for (let j = 0; j < d; j++) {
    const col = rows.map((r) => r[j]).filter((x): x is number => x != null && isFinite(x))
    const mean = col.length ? col.reduce((a, b) => a + b, 0) / col.length : 0
    const variance = col.length ? col.reduce((s, x) => s + (x - mean) ** 2, 0) / col.length : 0
    means.push(mean)
    sds.push(Math.sqrt(variance) || 1)
  }

  const z = rows.map((r) => r.map((x, j) => (x == null || !isFinite(x) ? 0 : (x - means[j]) / sds[j])))

  // Covariance of standardised columns == their correlation matrix.
  const cov: number[][] = Array.from({ length: d }, () => new Array(d).fill(0))
  for (let i = 0; i < d; i++) {
    for (let j = i; j < d; j++) {
      let sum = 0
      for (let k = 0; k < n; k++) sum += z[k][i] * z[k][j]
      cov[i][j] = cov[j][i] = sum / n
    }
  }

  const { values, vectors } = jacobiEigen(cov)
  const order = values.map((_, i) => i).sort((a, b) => values[b] - values[a])
  const [i1, i2] = [order[0], order[1] ?? order[0]]
  const total = values.reduce((a, b) => a + Math.max(0, b), 0) || 1

  const pc1 = vectors.map((row) => row[i1])
  const pc2 = vectors.map((row) => row[i2])

  const scores = z.map((row) => {
    let x = 0
    let y = 0
    for (let j = 0; j < d; j++) { x += row[j] * pc1[j]; y += row[j] * pc2[j] }
    return [x, y] as [number, number]
  })

  return {
    scores,
    explained: [Math.max(0, values[i1]) / total, Math.max(0, values[i2]) / total],
    loadings: pc1.map((v, j) => [v, pc2[j]] as [number, number]),
  }
}
