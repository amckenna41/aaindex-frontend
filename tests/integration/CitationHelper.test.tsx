import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { saveAs } from 'file-saver'
import CitationHelper from '../../src/components/CitationHelper'

const KD = {
  accession: 'KYTJ820101',
  references: "Kyte, J. and Doolittle, R.F. 'A simple method for displaying the hydropathic character of a protein' J. Mol. Biol. 157, 105-132 (1982)",
  pmid: '7108955',
  description: 'Hydropathy index (Kyte-Doolittle, 1982)',
}

beforeEach(() => vi.mocked(saveAs).mockClear())

describe('CitationHelper', () => {
  it('offers BibTeX, RIS, APA and Plain, with BibTeX selected', () => {
    render(<CitationHelper {...KD} />)
    for (const name of ['BibTeX', 'RIS', 'APA', 'Plain']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'BibTeX' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/@article\{Kyte1982,/)).toBeInTheDocument()
  })

  it('switches to RIS', async () => {
    const { container } = render(<CitationHelper {...KD} />)
    await userEvent.click(screen.getByRole('button', { name: 'RIS' }))
    // Read the raw text: RIS tags need their exact two spaces, which getByText normalises away.
    expect(container.querySelector('pre')!.textContent).toMatch(/^TY {2}- JOUR\n/)
  })

  it('switches to APA', async () => {
    render(<CitationHelper {...KD} />)
    await userEvent.click(screen.getByRole('button', { name: 'APA' }))
    expect(screen.getByText(/^Kyte, J\., & Doolittle, R\. F\. \(1982\)\./)).toBeInTheDocument()
  })

  it.each([
    ['BibTeX', '↓ .bib', 'KYTJ820101_bibtex.bib'],
    ['RIS', '↓ .ris', 'KYTJ820101_ris.ris'],
    ['APA', '↓ .txt', 'KYTJ820101_apa.txt'],
  ])('downloads %s with the right extension', async (fmt, button, filename) => {
    render(<CitationHelper {...KD} />)
    await userEvent.click(screen.getByRole('button', { name: fmt }))
    await userEvent.click(screen.getByRole('button', { name: button }))
    expect(vi.mocked(saveAs).mock.calls[0][1]).toBe(filename)
  })

  it('does not throw when the clipboard is blocked', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'))
    render(<CitationHelper {...KD} />)
    await user.click(screen.getByRole('button', { name: /copy to clipboard/i }))
    expect(screen.getByRole('button', { name: /copy to clipboard/i })).toBeInTheDocument()
  })
})
