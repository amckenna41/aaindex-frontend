import { describe, it, expect } from 'vitest'
import { parseReference, buildAPA, buildRIS, buildBibTeX, extractYear } from '../../src/lib/citation'

const KD = {
  accession: 'KYTJ820101',
  references: "Kyte, J. and Doolittle, R.F. 'A simple method for displaying the hydropathic character of a protein' J. Mol. Biol. 157, 105-132 (1982)",
  pmid: '7108955',
  description: 'Hydropathy index (Kyte-Doolittle, 1982)',
}
const BOOK = {
  accession: 'COHE430101',
  references: "Cohn, E.J. and Edsall, J.T. '' 'Protein, Amino Acid, and Peptides', Reinhold, New York (1943)",
  pmid: '',
  description: 'Partial specific volume',
}

describe('parseReference', () => {
  it('splits a journal reference into its fields', () => {
    expect(parseReference(KD.references)).toEqual({
      authors: [{ last: 'Kyte', initials: 'J.' }, { last: 'Doolittle', initials: 'R.F.' }],
      title: 'A simple method for displaying the hydropathic character of a protein',
      journal: 'J. Mol. Biol.',
      volume: '157',
      pages: '105-132',
      year: '1982',
    })
  })

  it('accepts a comma before the year', () => {
    expect(parseReference("Cornette, J.L. and DeLisi, C. 'Scales' J. Mol. Biol. 196, 659-685, (1987)")?.pages).toBe('659-685')
  })

  it('drops placeholder ??-?? pages', () => {
    expect(parseReference("Bae, K. 'Linkers' Bioinformatics 21, ??-?? (2005)")?.pages).toBeUndefined()
  })

  it('falls back to authors, title and year for a book, skipping the empty title', () => {
    const p = parseReference(BOOK.references)
    expect(p?.journal).toBeUndefined()
    expect(p?.title).toBe('Protein, Amino Acid, and Peptides')
    expect(p?.year).toBe('1943')
  })

  it('returns null for text it cannot read', () => {
    expect(parseReference('')).toBeNull()
    expect(extractYear('')).toBe('n.d.')
  })
})

describe('buildAPA', () => {
  it('formats a journal article in APA 7', () => {
    expect(buildAPA(KD)).toBe(
      'Kyte, J., & Doolittle, R. F. (1982). A simple method for displaying the hydropathic character of a protein. J. Mol. Biol., 157, 105–132. https://pubmed.ncbi.nlm.nih.gov/7108955/',
    )
  })

  it('joins three or more authors with a serial comma and ampersand', () => {
    const ref = "Cid, H., Bunster, M. and Gazitua, F. 'T' Protein Engineering 5, 373-375 (1992)"
    expect(buildAPA({ ...KD, references: ref, pmid: '' })).toMatch(/^Cid, H\., Bunster, M\., & Gazitua, F\. \(1992\)/)
  })

  it('leaves a book reference as written rather than guess', () => {
    expect(buildAPA(BOOK)).toBe(BOOK.references)
  })
})

describe('buildRIS', () => {
  it('emits one tag per line, one AU per author, and ends with ER', () => {
    const lines = buildRIS(KD).split('\n')
    expect(lines[0]).toBe('TY  - JOUR')
    expect(lines.filter((l) => l.startsWith('AU  - '))).toEqual(['AU  - Kyte, J.', 'AU  - Doolittle, R.F.'])
    expect(lines).toContain('SP  - 105')
    expect(lines).toContain('EP  - 132')
    expect(lines).toContain('PY  - 1982')
    expect(lines.at(-1)).toBe('ER  - ')
    expect(lines.every((l) => /^[A-Z][A-Z0-9] {2}- /.test(l))).toBe(true)
  })

  it('marks a book as generic and keeps the raw reference as a note', () => {
    const ris = buildRIS(BOOK)
    expect(ris).toContain('TY  - GEN')
    expect(ris).toContain(`N1  - ${BOOK.references}`)
    expect(ris).not.toContain('UR  - ')
  })
})

describe('buildBibTeX', () => {
  it('builds an @article with parsed fields and a BibTeX page range', () => {
    const bib = buildBibTeX(KD)
    expect(bib).toMatch(/^@article\{Kyte1982,/)
    expect(bib).toContain('author  = {Kyte, J. and Doolittle, R.F.}')
    expect(bib).toContain('pages   = {105--132}')
    expect(bib).toContain('journal = {J. Mol. Biol.}')
  })

  it('uses @misc for a book', () => {
    expect(buildBibTeX(BOOK)).toMatch(/^@misc\{Cohn1943,/)
  })
})
