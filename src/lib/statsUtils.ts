/** Fold-based min/max. Math.min(...xs) spreads into `arguments` and throws
 *  RangeError once xs is large — sequence-length arrays reach that easily. */
export function minOf(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => (b < a ? b : a)) : null
}

export function maxOf(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => (b > a ? b : a)) : null
}
