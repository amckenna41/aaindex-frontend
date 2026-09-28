// Sequence tools built on the AAIndex2 (substitution) and AAIndex3 (contact)
// matrices. Dependency-free, like seqUtils, so an API route could share it.

import { VALID_AAS } from './seqUtils'

export type Matrix = Record<string, Record<string, number | null>>

const STD = [...VALID_AAS]

export function pairValue(m: Matrix, a: string, b: string): number | null {
  const v = m[a]?.[b]
  return v != null && isFinite(v) ? v : null
}

/** True when every standard-residue pair has a value. Matrices with gaps are
 *  left out of the pickers rather than guessing at the missing cells. */
export function isComplete(m: Matrix): boolean {
  return STD.every((a) => STD.every((b) => pairValue(m, a, b) != null))
}

/** Identity pairs score below mismatches in a distance matrix (Grantham,
 *  Miyata…). A heuristic, so the UI lets the user override it. */
export function looksLikeDistance(m: Matrix): boolean {
  let diag = 0, off = 0
  for (const a of STD) for (const b of STD) {
    const v = pairValue(m, a, b) ?? 0
    if (a === b) diag += v
    else off += v
  }
  return diag / 20 < off / 380
}

/** Keep only the 20 standard residues; returns the cleaned sequence and how many were dropped. */
export function cleanSequence(seq: string): { seq: string; dropped: number } {
  const upper = seq.toUpperCase().replace(/\s/g, '')
  const kept = [...upper].filter((c) => VALID_AAS.has(c)).join('')
  return { seq: kept, dropped: upper.length - kept.length }
}

// ── Pairwise alignment (Gotoh, affine gaps) ──────────────────────────────────

export interface AlignOptions {
  /** Penalty for the first residue of a gap (positive number). */
  gapOpen: number
  /** Penalty for each further residue of the same gap (positive number). */
  gapExtend: number
  mode: 'global' | 'local'
  /** Distance-style matrix (lower = more similar): scores become mean − value,
   *  so identical residues score positive and dissimilar ones negative. A plain
   *  negation would leave nothing positive, and a local alignment would be empty. */
  negate?: boolean
}

export interface Alignment {
  score: number
  alignedA: string
  alignedB: string
  /** '|' identical, ':' positive score, ' ' otherwise — the EMBOSS convention. */
  midline: string
  identity: number
  similarity: number
  gaps: number
  length: number
  /** 1-based start positions of the aligned region in each input (local mode). */
  startA: number
  startB: number
}

export const MAX_ALIGN_LENGTH = 2000

const NEG = -Infinity
const FROM_M = 0, FROM_X = 1, FROM_Y = 2, START = 3

/**
 * Global (Needleman–Wunsch) or local (Smith–Waterman) alignment with affine
 * gaps. A gap of length k costs gapOpen + (k − 1)·gapExtend. Inputs must
 * already be cleaned to the 20 standard residues.
 * ponytail: O(n·m) traceback memory — capped at MAX_ALIGN_LENGTH per sequence;
 * Hirschberg's linear-space variant if longer sequences are ever needed.
 */
export function align(a: string, b: string, m: Matrix, opts: AlignOptions): Alignment {
  const { gapOpen: go, gapExtend: ge, mode } = opts
  const local = mode === 'local'
  const centre = opts.negate ? meanValue(m) : 0
  const score = (x: string, y: string) => {
    const v = pairValue(m, x, y) ?? 0
    return opts.negate ? centre - v : v
  }
  const n = a.length, w = b.length
  const cols = w + 1
  const s = (i: number, j: number) => score(a[i - 1], b[j - 1])

  // Rolling score rows; full-size pointer grids for the traceback.
  let pM = new Float64Array(cols), pX = new Float64Array(cols), pY = new Float64Array(cols)
  let cM = new Float64Array(cols), cX = new Float64Array(cols), cY = new Float64Array(cols)
  const tM = new Uint8Array((n + 1) * cols)
  const tX = new Uint8Array((n + 1) * cols)
  const tY = new Uint8Array((n + 1) * cols)

  // Row 0
  pM[0] = 0; pX[0] = NEG; pY[0] = NEG
  for (let j = 1; j <= w; j++) {
    pM[j] = local ? 0 : NEG
    pX[j] = NEG
    pY[j] = local ? NEG : -go - (j - 1) * ge
    tY[j] = j === 1 ? FROM_M : FROM_Y
  }

  let best = local ? 0 : NEG, bi = 0, bj = 0

  for (let i = 1; i <= n; i++) {
    cM[0] = local ? 0 : NEG
    cX[0] = local ? NEG : -go - (i - 1) * ge
    cY[0] = NEG
    tX[i * cols] = i === 1 ? FROM_M : FROM_X
    for (let j = 1; j <= w; j++) {
      const k = i * cols + j

      // M: a[i] aligned with b[j]
      let v = pM[j - 1], p = FROM_M
      if (pX[j - 1] > v) { v = pX[j - 1]; p = FROM_X }
      if (pY[j - 1] > v) { v = pY[j - 1]; p = FROM_Y }
      if (local && v <= 0) { v = 0; p = START }
      cM[j] = v + s(i, j); tM[k] = p

      // X: a[i] against a gap (came from row above)
      v = pM[j] - go; p = FROM_M
      if (pX[j] - ge > v) { v = pX[j] - ge; p = FROM_X }
      if (pY[j] - go > v) { v = pY[j] - go; p = FROM_Y }
      cX[j] = v; tX[k] = p

      // Y: b[j] against a gap (came from the left)
      v = cM[j - 1] - go; p = FROM_M
      if (cY[j - 1] - ge > v) { v = cY[j - 1] - ge; p = FROM_Y }
      if (cX[j - 1] - go > v) { v = cX[j - 1] - go; p = FROM_X }
      cY[j] = v; tY[k] = p

      if (local && cM[j] > best) { best = cM[j]; bi = i; bj = j }
    }
    ;[pM, cM] = [cM, pM]; [pX, cX] = [cX, pX]; [pY, cY] = [cY, pY]
  }

  let i: number, j: number, state: number
  if (local) {
    i = bi; j = bj; state = FROM_M
  } else {
    i = n; j = w
    // pM/pX/pY hold the last row after the final swap.
    best = pM[w]; state = FROM_M
    if (pX[w] > best) { best = pX[w]; state = FROM_X }
    if (pY[w] > best) { best = pY[w]; state = FROM_Y }
  }

  const outA: string[] = [], outB: string[] = []
  while (local ? i > 0 && j > 0 : i > 0 || j > 0) {
    const k = i * cols + j
    if (state === FROM_M) {
      const p = tM[k]
      outA.push(a[i - 1]); outB.push(b[j - 1]); i--; j--
      if (p === START) break
      state = p
    } else if (state === FROM_X) {
      state = tX[k]; outA.push(a[i - 1]); outB.push('-'); i--
    } else {
      state = tY[k]; outA.push('-'); outB.push(b[j - 1]); j--
    }
  }
  outA.reverse(); outB.reverse()

  let identity = 0, similarity = 0, gaps = 0, mid = ''
  for (let t = 0; t < outA.length; t++) {
    const x = outA[t], y = outB[t]
    if (x === '-' || y === '-') { gaps++; mid += ' '; continue }
    if (x === y) { identity++; similarity++; mid += '|'; continue }
    if (score(x, y) > 0) { similarity++; mid += ':' } else mid += ' '
  }

  return {
    score: best === NEG ? 0 : best,
    alignedA: outA.join(''),
    alignedB: outB.join(''),
    midline: mid,
    identity, similarity, gaps,
    length: outA.length,
    startA: i + 1,
    startB: j + 1,
  }
}

function meanValue(m: Matrix): number {
  let sum = 0, n = 0
  for (const a of STD) for (const b of STD) {
    const v = pairValue(m, a, b)
    if (v != null) { sum += v; n++ }
  }
  return n ? sum / n : 0
}

/** Default gap penalties scaled to the matrix's spread, so PAM/BLOSUM-style
 *  integer matrices land near the usual 10–11 / 1 and 0–1 scaled ones stay sane. */
export function defaultGaps(m: Matrix): { gapOpen: number; gapExtend: number } {
  let lo = Infinity, hi = -Infinity
  for (const a of STD) for (const b of STD) {
    const v = pairValue(m, a, b)
    if (v == null) continue
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  const range = hi - lo || 1
  const round = (x: number) => Number(x.toPrecision(2))
  return { gapOpen: round(range * 0.7), gapExtend: round(range * 0.07) }
}

// ── Contact energy (sequence-only estimate) ──────────────────────────────────

export interface ContactProfile {
  /** Mean value over every ordered residue pair i ≠ j with a defined value. */
  meanPair: number | null
  /** Per residue: mean value against every other residue in the sequence. */
  perResidue: { pos: number; aa: string; value: number | null }[]
  pairsCounted: number
}

/**
 * Without a structure we don't know which residues touch, so this averages the
 * contact potential over all pairs — a composition-level estimate of how
 * favourably the sequence's residues interact, not a folded-state energy.
 * O(20·n) via residue counts rather than O(n²) over pairs.
 */
export function contactProfile(seq: string, m: Matrix): ContactProfile {
  const counts: Record<string, number> = {}
  for (const c of seq) counts[c] = (counts[c] ?? 0) + 1

  let total = 0, pairs = 0
  const perResidue = [...seq].map((aa, i) => {
    let sum = 0, n = 0
    for (const b of Object.keys(counts)) {
      const v = pairValue(m, aa, b)
      if (v == null) continue
      const c = counts[b] - (b === aa ? 1 : 0) // exclude the residue itself
      sum += v * c; n += c
    }
    total += sum; pairs += n
    return { pos: i + 1, aa, value: n ? sum / n : null }
  })

  return { meanPair: pairs ? total / pairs : null, perResidue, pairsCounted: pairs }
}
