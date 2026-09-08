import { describe, it, expect } from 'vitest'
import { csvCell, toTable } from '../../src/lib/csv'

describe('csvCell', () => {
  it('passes plain text through unquoted', () => {
    expect(csvCell('KYTJ820101')).toBe('KYTJ820101')
  })

  it('leaves numbers alone, including negatives', () => {
    expect(csvCell(-4.5)).toBe('-4.5')
  })

  it('returns an empty string for null and undefined', () => {
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
  })

  it('quotes a formula-injection payload from a FASTA header', () => {
    expect(csvCell("=cmd|'/c calc'!A1")).toBe('"=cmd|\'/c calc\'!A1"')
  })

  it.each(['=SUM(A1)', '+1', '-1+1', '@SUM', 'a|b'])('quotes %s', (payload) => {
    expect(csvCell(payload).startsWith('"')).toBe(true)
  })

  it('quotes and escapes embedded commas and quotes', () => {
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
  })

  it('quotes a cell containing the tab delimiter in TSV mode', () => {
    expect(csvCell('a\tb', '\t')).toBe('"a\tb"')
  })
})

describe('toTable', () => {
  it('emits a header row followed by one row per record', () => {
    const out = toTable([{ accession: 'A1', description: 'x' }, { accession: 'A2', description: 'y' }])
    expect(out.split('\n')).toEqual(['accession,description', 'A1,x', 'A2,y'])
  })

  it('separates with tabs when asked', () => {
    expect(toTable([{ a: 1, b: 2 }], '\t')).toBe('a\tb\n1\t2')
  })

  it('sanitises a malicious value in a data row', () => {
    expect(toTable([{ id: '=HYPERLINK("http://x")' }])).toContain('"=HYPERLINK(""http://x"")"')
  })

  it('returns an empty string for no rows', () => {
    expect(toTable([])).toBe('')
  })
})
