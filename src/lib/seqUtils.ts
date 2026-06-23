import { saveAs } from 'file-saver'

export const VALID_AAS = new Set([
  'A','C','D','E','F','G','H','I','K','L','M','N','P','Q','R','S','T','V','W','Y',
])

export interface EncodedResidue {
  pos: number
  aa: string
  value: number | null // null = missing (AA not in index)
}

export function encodeSequence(seq: string, values: Record<string, number>): EncodedResidue[] {
  return seq
    .toUpperCase()
    .split('')
    .map((aa, i) => ({
      pos: i + 1,
      aa,
      value:
        VALID_AAS.has(aa) && aa in values && values[aa] != null && isFinite(values[aa])
          ? values[aa]
          : null,
    }))
}

export function slidingWindowEncode(
  encoded: EncodedResidue[],
  windowSize: number
): EncodedResidue[] {
  const half = Math.floor(windowSize / 2)
  return encoded.map((r, i) => {
    const slice = encoded.slice(Math.max(0, i - half), Math.min(encoded.length, i + half + 1))
    const vals = slice.map((e) => e.value).filter((v): v is number => v !== null)
    return { pos: r.pos, aa: r.aa, value: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null }
  })
}

export function pearsonR(xs: number[], ys: number[]): number {
  const n = xs.length
  if (n < 2) return 0
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
  const dx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0))
  const dy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0))
  return dx && dy ? num / (dx * dy) : 0
}

export function zScoreNormalise(values: Record<string, number>): Record<string, number> {
  const vals = Object.values(values).filter((v) => v != null && isFinite(v))
  if (!vals.length) return values
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length
  const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length) || 1
  return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, (v - mean) / std]))
}

export function exportEncodingAsCSV(accession: string, seq: string, encoded: EncodedResidue[]) {
  const header = 'position,amino_acid,value'
  const rows = encoded.map(({ pos, aa, value }) => `${pos},${aa},${value ?? ''}`)
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
  saveAs(blob, `${accession}_encoding_${seq.slice(0, 8)}.csv`)
}
