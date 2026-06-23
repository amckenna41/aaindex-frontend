import { describe, it, expect } from 'vitest'
import { AA_FULL_NAMES, AA_ORDER, AA_ORDER_ALPHA } from '../../src/lib/aminoAcids'

describe('AA_ORDER', () => {
  it('contains exactly 20 entries', () => {
    expect(AA_ORDER).toHaveLength(20)
  })

  it('all entries are unique (no duplicates)', () => {
    expect(new Set(AA_ORDER).size).toBe(20)
  })

  it('all entries are single uppercase letters', () => {
    for (const aa of AA_ORDER) {
      expect(aa).toMatch(/^[A-Z]$/)
    }
  })

  it('contains all 20 standard amino acid codes', () => {
    const standard = ['A','R','N','D','C','Q','E','G','H','I','L','K','M','F','P','S','T','W','Y','V']
    for (const aa of standard) expect(AA_ORDER).toContain(aa)
  })
})

describe('AA_ORDER_ALPHA', () => {
  it('contains exactly 20 entries', () => {
    expect(AA_ORDER_ALPHA).toHaveLength(20)
  })

  it('all entries are unique (no duplicates)', () => {
    expect(new Set(AA_ORDER_ALPHA).size).toBe(20)
  })

  it('is alphabetically sorted', () => {
    const sorted = [...AA_ORDER_ALPHA].sort()
    expect(AA_ORDER_ALPHA).toEqual(sorted)
  })

  it('contains exactly the same amino acids as AA_ORDER', () => {
    expect([...AA_ORDER_ALPHA].sort()).toEqual([...AA_ORDER].sort())
  })

  it('starts with A', () => {
    expect(AA_ORDER_ALPHA[0]).toBe('A')
  })

  it('ends with Y', () => {
    expect(AA_ORDER_ALPHA[AA_ORDER_ALPHA.length - 1]).toBe('Y')
  })
})

describe('AA_FULL_NAMES', () => {
  it('contains exactly 20 entries', () => {
    expect(Object.keys(AA_FULL_NAMES)).toHaveLength(20)
  })

  it('every amino acid in AA_ORDER has a full name', () => {
    for (const aa of AA_ORDER) {
      expect(AA_FULL_NAMES).toHaveProperty(aa)
    }
  })

  it('every amino acid in AA_ORDER_ALPHA has a full name', () => {
    for (const aa of AA_ORDER_ALPHA) {
      expect(AA_FULL_NAMES).toHaveProperty(aa)
    }
  })

  it('all values are non-empty strings', () => {
    for (const name of Object.values(AA_FULL_NAMES)) {
      expect(typeof name).toBe('string')
      expect(name.length).toBeGreaterThan(0)
    }
  })

  it('contains known correct mappings', () => {
    expect(AA_FULL_NAMES['A']).toBe('Alanine')
    expect(AA_FULL_NAMES['G']).toBe('Glycine')
    expect(AA_FULL_NAMES['W']).toBe('Tryptophan')
    expect(AA_FULL_NAMES['P']).toBe('Proline')
    expect(AA_FULL_NAMES['K']).toBe('Lysine')
  })

  it('all names start with an uppercase letter', () => {
    for (const name of Object.values(AA_FULL_NAMES)) {
      expect(name[0]).toMatch(/[A-Z]/)
    }
  })

  it('keys are all single uppercase letters', () => {
    for (const key of Object.keys(AA_FULL_NAMES)) {
      expect(key).toMatch(/^[A-Z]$/)
    }
  })
})
