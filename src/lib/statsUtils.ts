import { AA_ORDER_ALPHA } from './aminoAcids'
import type { AAIndex1DB } from '../types'

export interface AAStat {
  aa: string
  n: number
  mean: number | null
  min: number | null
  max: number | null
  std: number | null
}

export function categoryStats(db: AAIndex1DB, category: string): AAStat[] {
  const records = Object.values(db).filter(
    (r) => !category || r.category === category,
  )

  return AA_ORDER_ALPHA.map((aa) => {
    const vals = records
      .map((r) => r.values[aa])
      .filter((v): v is number => v != null && isFinite(v))

    if (!vals.length) return { aa, n: 0, mean: null, min: null, max: null, std: null }

    const n = vals.length
    const mean = vals.reduce((a, b) => a + b, 0) / n
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / n)

    return { aa, n, mean, min, max, std }
  })
}
