import { describe, it, expect } from 'vitest'
import { parseYear } from '../../../api/pubmed/[pmid]'

describe('parseYear', () => {
  it('reads the publication year, not the earlier DateCompleted year', () => {
    const xml = `<MedlineCitation><DateCompleted><Year>1982</Year></DateCompleted>
      <Article><Journal><JournalIssue><PubDate><Year>1981</Year><Month>May</Month></PubDate></JournalIssue></Journal></Article>
      </MedlineCitation>`
    expect(parseYear(xml)).toBe('1981')
  })

  it('reads the year out of a free-text MedlineDate', () => {
    expect(parseYear('<PubDate><MedlineDate>1998 Dec-1999 Jan</MedlineDate></PubDate>')).toBe('1998')
  })

  it('returns an empty string when there is no PubDate', () => {
    expect(parseYear('<DateCompleted><Year>1982</Year></DateCompleted>')).toBe('')
  })
})
