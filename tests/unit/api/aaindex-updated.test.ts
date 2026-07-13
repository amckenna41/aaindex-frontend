import { describe, it, expect } from 'vitest'
import { parseLastUpdated } from '../../../api/aaindex-updated'

describe('parseLastUpdated', () => {
  it('extracts the date from the genome.jp footer markup', () => {
    const html = '<div id="footer">\n<p>Last updated: February 13, 2017</p>\n</div>'
    expect(parseLastUpdated(html)).toBe('February 13, 2017')
  })

  it('is case-insensitive and trims surrounding whitespace', () => {
    expect(parseLastUpdated('<p>last updated:   March 1, 2020  </p>')).toBe('March 1, 2020')
  })

  it('returns null when no "Last updated" text is present', () => {
    expect(parseLastUpdated('<p>Nothing here</p>')).toBeNull()
  })
})
