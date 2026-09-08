import { describe, it, expect, vi } from 'vitest'
import { render as rtlRender, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Encode from '../../src/pages/Encode'

// The page reads and writes the query string, so it needs a router context.
const render = (ui: React.ReactElement) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>)

vi.mock('recharts', () => {
  const React = require('react')
  const stub = ({ children }: any) => React.createElement('div', { 'data-testid': 'recharts-stub' }, children)
  return {
    LineChart: stub, Line: stub, XAxis: stub, YAxis: stub,
    Tooltip: stub, CartesianGrid: stub, ReferenceLine: stub,
    ResponsiveContainer: stub,
  }
})

// Helper: build a File and fire it through the hidden file input
async function uploadFile(filename: string, content: string) {
  const file = new File([content], filename, { type: 'text/plain' })
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  await userEvent.upload(input, file)
  return file
}

const FASTA_SINGLE = `>seq1 test protein
ACDEFGHIKLMNPQRSTVWY
`

const FASTA_MULTI = `>prot_A
MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRERAIAKDLGAVFLVGIGGKLSDGHRHDVRAPDYDDWSTPSELGHAGLNGDILVWNPK
>prot_B
ACDEFGHIKLMNPQRSTVWY
`

const PLAIN_TWO_SEQS = `ACDEFGHIKLMNPQRSTVWY
MKTAYIAKQRQ
`

const INVALID_CONTENT = `12345
!!!???
`

// Plain text file with a mix of valid sequences and invalid (non-AA) lines.
const MIXED_PLAIN_WITH_INVALID = `ACDEFGHIKLMNPQRSTVWY
12345678
MKTAYIAKQRQ
`

// FASTA file where one entry has an empty body (rejected) and one is valid.
const FASTA_WITH_EMPTY_ENTRY = `>empty_seq

>valid_seq
ACDE
`

// ── Render ─────────────────────────────────────────────────────────────────────

describe('Encode — initial render', () => {
  it('renders without crashing', () => {
    expect(() => render(<Encode />)).not.toThrow()
  })

  it('shows the empty-state prompt when no file is loaded', () => {
    render(<Encode />)
    expect(screen.getByText(/upload a sequence file to encode/i)).toBeInTheDocument()
  })

  it('shows the file upload area', () => {
    render(<Encode />)
    expect(screen.getByText(/drop or click to upload/i)).toBeInTheDocument()
  })

  it('shows accepted file formats', () => {
    render(<Encode />)
    expect(screen.getByText(/\.fasta\s*\/\s*\.fa\s*\/\s*\.txt/i)).toBeInTheDocument()
  })

  it('shows the AAIndex1 record selector', () => {
    render(<Encode />)
    expect(screen.getByText(/aaindex1 record/i)).toBeInTheDocument()
  })

  it('shows a filter input for records', () => {
    render(<Encode />)
    expect(screen.getByPlaceholderText(/filter records/i)).toBeInTheDocument()
  })

  it('does not show export buttons before upload', () => {
    render(<Encode />)
    expect(screen.queryByText(/all encodings/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/summary stats/i)).not.toBeInTheDocument()
  })
})

// ── FASTA upload — single sequence ─────────────────────────────────────────────

describe('Encode — FASTA single sequence upload', () => {
  it('shows the loaded filename after upload', async () => {
    render(<Encode />)
    await uploadFile('test.fasta', FASTA_SINGLE)
    await waitFor(() => expect(screen.getByText('test.fasta')).toBeInTheDocument())
  })

  it('shows "1 sequences loaded" count', async () => {
    render(<Encode />)
    await uploadFile('test.fasta', FASTA_SINGLE)
    await waitFor(() => expect(screen.getByText(/1 sequences loaded/i)).toBeInTheDocument())
  })

  it('shows the sequence ID in the preview', async () => {
    render(<Encode />)
    await uploadFile('test.fasta', FASTA_SINGLE)
    // seq1 appears in both the preview label and the table row
    await waitFor(() => expect(screen.getAllByText('seq1').length).toBeGreaterThanOrEqual(1))
  })

  it('displays the actual protein sequence after upload', async () => {
    render(<Encode />)
    await uploadFile('test.fasta', FASTA_SINGLE)
    // Sequence appears in the preview box and the table cell
    await waitFor(() => {
      expect(screen.getAllByText('ACDEFGHIKLMNPQRSTVWY').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows the sequence length in the preview', async () => {
    render(<Encode />)
    await uploadFile('test.fasta', FASTA_SINGLE)
    await waitFor(() => expect(screen.getByText(/20 residues/i)).toBeInTheDocument())
  })

  it('shows export buttons after loading', async () => {
    render(<Encode />)
    await uploadFile('test.fasta', FASTA_SINGLE)
    await waitFor(() => {
      expect(screen.getByText(/all encodings/i)).toBeInTheDocument()
      expect(screen.getByText(/summary stats/i)).toBeInTheDocument()
    })
  })

  it('hides the empty-state prompt once sequences are loaded', async () => {
    render(<Encode />)
    await uploadFile('test.fasta', FASTA_SINGLE)
    await waitFor(() => {
      expect(screen.queryByText(/upload a sequence file to encode/i)).not.toBeInTheDocument()
    })
  })
})

// ── FASTA upload — multiple sequences ─────────────────────────────────────────

describe('Encode — FASTA multi-sequence upload', () => {
  it('shows correct sequence count for two sequences', async () => {
    render(<Encode />)
    await uploadFile('multi.fasta', FASTA_MULTI)
    await waitFor(() => expect(screen.getAllByText(/2 sequences loaded/i).length).toBeGreaterThanOrEqual(1))
  })

  it('renders the sequence table with the correct IDs', async () => {
    render(<Encode />)
    await uploadFile('multi.fasta', FASTA_MULTI)
    await waitFor(() => {
      expect(screen.getAllByText('prot_A').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('prot_B').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows truncated sequences in table when they exceed 40 chars', async () => {
    render(<Encode />)
    await uploadFile('multi.fasta', FASTA_MULTI)
    await waitFor(() => {
      // prot_A sequence is long, should appear truncated (with …)
      const truncated = screen.queryAllByText(/…/)
      expect(truncated.length).toBeGreaterThan(0)
    })
  })

  it('shows short sequences in table untruncated', async () => {
    render(<Encode />)
    await uploadFile('multi.fasta', FASTA_MULTI)
    await waitFor(() => {
      // prot_B = ACDEFGHIKLMNPQRSTVWY (20 chars, under 40 — no truncation)
      const cells = screen.getAllByText('ACDEFGHIKLMNPQRSTVWY')
      expect(cells.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows a sequence-selector dropdown when multiple sequences are loaded', async () => {
    render(<Encode />)
    await uploadFile('multi.fasta', FASTA_MULTI)
    await waitFor(() => {
      // The dropdown has prot_A and prot_B as options
      const selects = screen.getAllByRole('combobox')
      const options = selects.flatMap((s) => [...s.querySelectorAll('option')].map((o) => o.value))
      expect(options).toContain('prot_A')
      expect(options).toContain('prot_B')
    })
  })
})

// ── Plain text upload ──────────────────────────────────────────────────────────

describe('Encode — plain text upload', () => {
  it('parses plain text file with two sequence lines', async () => {
    render(<Encode />)
    await uploadFile('seqs.txt', PLAIN_TWO_SEQS)
    await waitFor(() => expect(screen.getAllByText(/2 sequences loaded/i).length).toBeGreaterThanOrEqual(1))
  })

  it('assigns sequential IDs (seq_1, seq_2) to plain text sequences', async () => {
    render(<Encode />)
    await uploadFile('seqs.txt', PLAIN_TWO_SEQS)
    await waitFor(() => {
      expect(screen.getAllByText('seq_1').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('seq_2').length).toBeGreaterThanOrEqual(1)
    })
  })
})

// ── Error handling ─────────────────────────────────────────────────────────────

describe('Encode — error handling', () => {
  it('shows an error message for a file with no valid sequences', async () => {
    render(<Encode />)
    await uploadFile('bad.txt', INVALID_CONTENT)
    await waitFor(() => {
      expect(screen.getByText(/no valid sequences found/i)).toBeInTheDocument()
    })
  })

  it('shows 0 sequences loaded and the error message after a failed upload', async () => {
    render(<Encode />)
    await uploadFile('bad.txt', INVALID_CONTENT)
    await waitFor(() => expect(screen.getByText(/no valid sequences found/i)).toBeInTheDocument())
    // The component still renders "0 sequences loaded" once a filename is set
    expect(screen.getByText(/0\s+sequences loaded/i)).toBeInTheDocument()
  })
})

// ── Favourites section ─────────────────────────────────────────────────────────

describe('Encode — favourites section', () => {
  it('renders the Favourites toggle button', () => {
    render(<Encode />)
    expect(screen.getByText(/favourites/i)).toBeInTheDocument()
  })

  it('favourites list is collapsed by default', () => {
    render(<Encode />)
    expect(screen.queryByText(/no favourites yet/i)).not.toBeInTheDocument()
  })

  it('clicking the toggle opens the favourites section', async () => {
    render(<Encode />)
    const btn = screen.getByRole('button', { name: /favourites/i })
    await userEvent.click(btn)
    expect(screen.getByText(/no favourites yet/i)).toBeInTheDocument()
  })

  it('clicking the toggle again closes the favourites section', async () => {
    render(<Encode />)
    const btn = screen.getByRole('button', { name: /favourites/i })
    await userEvent.click(btn)
    await userEvent.click(btn)
    expect(screen.queryByText(/no favourites yet/i)).not.toBeInTheDocument()
  })
})

// ── Record filter ──────────────────────────────────────────────────────────────

describe('Encode — record filter', () => {
  it('typing in the filter input narrows the record list', async () => {
    render(<Encode />)
    const filterInput = screen.getByPlaceholderText(/filter records/i)
    const select = filterInput.parentElement!.querySelector('select')!
    const initialCount = select.options.length
    await userEvent.type(filterInput, 'KYTJ')
    expect(select.options.length).toBeLessThan(initialCount)
  })

  it('the record select shows the description of the active record', async () => {
    render(<Encode />)
    // The description is rendered below the select (italic text)
    const desc = document.querySelector('p.italic')
    expect(desc).not.toBeNull()
    expect(desc!.textContent!.length).toBeGreaterThan(0)
  })
})

// ── Rejected sequences ─────────────────────────────────────────────────────────

describe('Encode — rejected sequences', () => {
  it('shows a skipped-sequences warning when some plain text lines have no valid AAs', async () => {
    render(<Encode />)
    await uploadFile('mixed.txt', MIXED_PLAIN_WITH_INVALID)
    await waitFor(() => {
      expect(screen.getByText(/1 sequence.? skipped/i)).toBeInTheDocument()
    })
  })

  it('loads valid sequences even when some lines are rejected', async () => {
    render(<Encode />)
    await uploadFile('mixed.txt', MIXED_PLAIN_WITH_INVALID)
    await waitFor(() => {
      expect(screen.getAllByText(/2 sequences loaded/i).length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows a reason for each rejected sequence', async () => {
    render(<Encode />)
    await uploadFile('mixed.txt', MIXED_PLAIN_WITH_INVALID)
    await waitFor(() => {
      expect(screen.getByText(/no standard amino acids found/i)).toBeInTheDocument()
    })
  })

  it('does not show the skipped panel when all sequences are valid', async () => {
    render(<Encode />)
    await uploadFile('seqs.txt', PLAIN_TWO_SEQS)
    await waitFor(() => expect(screen.getAllByText(/2 sequences loaded/i).length).toBeGreaterThanOrEqual(1))
    expect(screen.queryByText(/sequences? skipped/i)).not.toBeInTheDocument()
  })

  it('shows rejected panel alongside the error when all sequences are invalid', async () => {
    render(<Encode />)
    await uploadFile('bad.txt', INVALID_CONTENT)
    await waitFor(() => {
      expect(screen.getByText(/no valid sequences found/i)).toBeInTheDocument()
      expect(screen.getByText(/2 sequences? skipped/i)).toBeInTheDocument()
    })
  })

  it('tracks empty FASTA entries as rejected', async () => {
    render(<Encode />)
    await uploadFile('test.fasta', FASTA_WITH_EMPTY_ENTRY)
    await waitFor(() => {
      // valid_seq loads, empty_seq is rejected
      expect(screen.getAllByText(/1 sequences? loaded/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/1 sequence.? skipped/i)).toBeInTheDocument()
    })
  })
})

// ── Clear button ───────────────────────────────────────────────────────────────

describe('Encode — clear (×) button', () => {
  it('shows a clear button once a file is loaded', async () => {
    render(<Encode />)
    await uploadFile('test.fasta', FASTA_SINGLE)
    await waitFor(() => {
      expect(screen.getByTitle(/remove loaded sequence/i)).toBeInTheDocument()
    })
  })

  it('restores the empty state when the clear button is clicked', async () => {
    render(<Encode />)
    await uploadFile('test.fasta', FASTA_SINGLE)
    await waitFor(() => screen.getByTitle(/remove loaded sequence/i))
    await userEvent.click(screen.getByTitle(/remove loaded sequence/i))
    await waitFor(() => {
      expect(screen.getByText(/upload a sequence file to encode/i)).toBeInTheDocument()
    })
  })

  it('removes the rejected sequences panel when the clear button is clicked', async () => {
    render(<Encode />)
    await uploadFile('mixed.txt', MIXED_PLAIN_WITH_INVALID)
    await waitFor(() => screen.getByText(/1 sequence.? skipped/i))
    await userEvent.click(screen.getByTitle(/remove loaded sequence/i))
    await waitFor(() => {
      expect(screen.queryByText(/sequences? skipped/i)).not.toBeInTheDocument()
    })
  })
})
