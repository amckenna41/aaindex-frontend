import { AAIndex1DB } from '../types'
import { AA_ORDER_ALPHA } from './aminoAcids'

export interface AAStat {
  aa: string
  mean: number | null
  min: number | null
  max: number | null
  std: number | null
  n: number
}

export function categoryStats(db: AAIndex1DB, category: string): AAStat[] {
  const records = Object.values(db).filter((r) => !category || r.category === category)
  return AA_ORDER_ALPHA.map((aa) => {
    const vals = records
      .map((r) => r.values[aa])
      .filter((v): v is number => v != null && isFinite(v))
    if (!vals.length) return { aa, mean: null, min: null, max: null, std: null, n: 0 }
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length)
    return { aa, mean, min: Math.min(...vals), max: Math.max(...vals), std, n: vals.length }
  })
}
