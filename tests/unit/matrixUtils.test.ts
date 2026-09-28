import { describe, it, expect } from 'vitest'
import {
  align, cleanSequence, contactProfile, defaultGaps, isComplete, looksLikeDistance, Matrix,
} from '../../src/lib/matrixUtils'
import db2 from '../../src/data/aaindex2.json'
import db3 from '../../src/data/aaindex3.json'

const M2 = db2 as unknown as Record<string, { matrix: Matrix }>
const M3 = db3 as unknown as Record<string, { matrix: Matrix }>
const BLOSUM50 = M2.HENS920104.matrix
const BLOSUM62 = M2.HENS920102.matrix

// Durbin, Eddy, Krogh & Mitchison, "Biological Sequence Analysis" (1998), §2.3:
// BLOSUM50, linear gap d = 8 (open = extend = 8).
describe('align — Durbin textbook example', () => {
  const linear = { gapOpen: 8, gapExtend: 8 }

  it('global score is 1', () => {
    const r = align('HEAGAWGHEE', 'PAWHEAE', BLOSUM50, { ...linear, mode: 'global' })
    expect(r.score).toBe(1)
    expect(r.alignedA.replace(/-/g, '')).toBe('HEAGAWGHEE')
    expect(r.alignedB.replace(/-/g, '')).toBe('PAWHEAE')
    expect(r.alignedA).toHaveLength(r.alignedB.length)
  })

  it('local score is 28 with AWGHE / AW-HE', () => {
    const r = align('HEAGAWGHEE', 'PAWHEAE', BLOSUM50, { ...linear, mode: 'local' })
    expect(r.score).toBe(28)
    expect(r.alignedA).toBe('AWGHE')
    expect(r.alignedB).toBe('AW-HE')
    expect(r.midline).toBe('|| ||')
    expect(r.startA).toBe(5)
    expect(r.startB).toBe(2)
  })
})

describe('align — invariants', () => {
  it('self-alignment is gap-free, 100% identity, and scores the diagonal sum', () => {
    const s = 'MQIFVKTLTGKTITLEV'
    const r = align(s, s, BLOSUM62, { gapOpen: 11, gapExtend: 1, mode: 'global' })
    const diag = [...s].reduce((t, c) => t + (BLOSUM62[c][c] as number), 0)
    expect(r.score).toBe(diag)
    expect(r.identity).toBe(s.length)
    expect(r.gaps).toBe(0)
  })

  it('affine gaps prefer one long gap over several short ones', () => {
    const r = align('ACDEFGHIKLMNPQ', 'ACDEFMNPQ', BLOSUM62, { gapOpen: 11, gapExtend: 1, mode: 'global' })
    expect(r.alignedB.match(/-+/g)).toHaveLength(1)
    expect(r.gaps).toBe(5)
  })

  it('global alignment against an empty sequence is all gap', () => {
    const r = align('ACD', '', BLOSUM62, { gapOpen: 10, gapExtend: 1, mode: 'global' })
    expect(r.alignedB).toBe('---')
    expect(r.score).toBe(-12)
  })

  it('negate flips a distance matrix so identical residues are rewarded', () => {
    const grantham = M2.GRAR740104.matrix
    expect(looksLikeDistance(grantham)).toBe(true)
    expect(looksLikeDistance(BLOSUM62)).toBe(false)
    const r = align('WWWW', 'WWWW', grantham, { gapOpen: 50, gapExtend: 5, mode: 'global', negate: true })
    expect(r.identity).toBe(4)
  })

  it('a distance matrix still gives a non-empty local alignment', () => {
    // Plain negation leaves no positive scores, so Smith–Waterman would return nothing.
    const grantham = M2.GRAR740104.matrix
    const r = align('HEAGAWGHEE', 'PAWHEAE', grantham, { gapOpen: 150, gapExtend: 15, mode: 'local', negate: true })
    expect(r.score).toBeGreaterThan(0)
    expect(r.length).toBeGreaterThan(0)
    expect(r.alignedA).toContain('AW')
  })
})

describe('matrix helpers', () => {
  it('isComplete detects gaps', () => {
    expect(isComplete(BLOSUM62)).toBe(true)
    const holed = { ...BLOSUM62, A: { ...BLOSUM62.A, C: null } }
    expect(isComplete(holed)).toBe(false)
  })

  it('defaultGaps scales with the matrix spread', () => {
    // AAIndex's BLOSUM62 spans −6..16 (not the familiar −4..11), hence scaling.
    const g = defaultGaps(BLOSUM62)
    expect(g.gapOpen).toBeCloseTo(15, 5)
    expect(g.gapExtend).toBeCloseTo(1.5, 5)
  })

  it('cleanSequence drops non-standard residues and counts them', () => {
    expect(cleanSequence('ac dxBZ*e')).toEqual({ seq: 'ACDE', dropped: 4 })
  })
})

describe('contactProfile', () => {
  const m = M3.MIYS960102.matrix

  it('matches a brute-force O(n²) average over ordered pairs', () => {
    const seq = 'MQIFVKTLTGKCCW'
    let sum = 0, n = 0
    for (let i = 0; i < seq.length; i++) for (let j = 0; j < seq.length; j++) {
      if (i === j) continue
      sum += m[seq[i]][seq[j]] as number; n++
    }
    const r = contactProfile(seq, m)
    expect(r.pairsCounted).toBe(n)
    expect(r.meanPair).toBeCloseTo(sum / n, 10)
    const p0 = [...seq].slice(1).reduce((t, c) => t + (m[seq[0]][c] as number), 0) / (seq.length - 1)
    expect(r.perResidue[0].value).toBeCloseTo(p0, 10)
  })

  it('a single residue has no pairs', () => {
    expect(contactProfile('A', m).meanPair).toBeNull()
  })
})
