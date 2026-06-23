import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SequenceAnalysis from '../../src/pages/SequenceAnalysis'

vi.mock('recharts', () => {
  const React = require('react')
  const stub = ({ children }: any) => React.createElement('div', { 'data-testid': 'recharts-stub' }, children)
  return {
    LineChart: stub, Line: stub, XAxis: stub, YAxis: stub,
    Tooltip: stub, CartesianGrid: stub, ReferenceLine: stub,
    ResponsiveContainer: stub,
  }
})

// ── Render ─────────────────────────────────────────────────────────────────────

describe('SequenceAnalysis — initial render', () => {
  it('renders without crashing', () => {
    expect(() => render(<SequenceAnalysis />)).not.toThrow()
  })

  it('shows all three tabs', () => {
    render(<SequenceAnalysis />)
    expect(screen.getByRole('button', { name: /sequence encoder/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sliding window/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /multi-property heatmap/i })).toBeInTheDocument()
  })

  it('Sequence Encoder tab is active by default', () => {
    render(<SequenceAnalysis />)
    const encoderTab = screen.getByRole('button', { name: /sequence encoder/i })
    expect(encoderTab.className).toContain('border-indigo-600')
  })

  it('shows the tab description for the active tab', () => {
    render(<SequenceAnalysis />)
    expect(screen.getByText(/encode a sequence using an aaindex1 property/i)).toBeInTheDocument()
  })
})

// ── Encoder tab ────────────────────────────────────────────────────────────────

describe('SequenceAnalysis — Encoder tab', () => {
  it('shows a sequence textarea', () => {
    render(<SequenceAnalysis />)
    const textarea = screen.getByPlaceholderText(/e\.g\. ACDEFGHIKLMNPQRSTVWY/i)
    expect(textarea).toBeInTheDocument()
  })

  it('default sequence has 20 residues', () => {
    render(<SequenceAnalysis />)
    expect(screen.getByText(/20 residues/i)).toBeInTheDocument()
  })

  it('shows a record filter input', () => {
    render(<SequenceAnalysis />)
    expect(screen.getByPlaceholderText(/filter records/i)).toBeInTheDocument()
  })

  it('shows the CSV export button', () => {
    render(<SequenceAnalysis />)
    expect(screen.getByRole('button', { name: /csv/i })).toBeInTheDocument()
  })

  it('typing a new sequence updates the residue count', async () => {
    render(<SequenceAnalysis />)
    const textarea = screen.getByPlaceholderText(/e\.g\. ACDEFGHIKLMNPQRSTVWY/i)
    await userEvent.clear(textarea)
    await userEvent.type(textarea, 'ACDE')
    expect(screen.getByText(/4 residues/i)).toBeInTheDocument()
  })

  it('unknown characters trigger the "Unknown chars" warning', async () => {
    render(<SequenceAnalysis />)
    const textarea = screen.getByPlaceholderText(/e\.g\. ACDEFGHIKLMNPQRSTVWY/i)
    await userEvent.clear(textarea)
    await userEvent.type(textarea, 'ACDE1234')
    expect(screen.getByText(/unknown chars/i)).toBeInTheDocument()
  })

  it('valid sequence does not show the unknown chars warning', async () => {
    render(<SequenceAnalysis />)
    const textarea = screen.getByPlaceholderText(/e\.g\. ACDEFGHIKLMNPQRSTVWY/i)
    await userEvent.clear(textarea)
    await userEvent.type(textarea, 'ACDEFGHIKLMNPQRSTVWY')
    expect(screen.queryByText(/unknown chars/i)).not.toBeInTheDocument()
  })

  it('clearing the sequence shows "enter a protein sequence" prompt', async () => {
    render(<SequenceAnalysis />)
    const textarea = screen.getByPlaceholderText(/e\.g\. ACDEFGHIKLMNPQRSTVWY/i)
    await userEvent.clear(textarea)
    expect(screen.getByText(/enter a protein sequence to encode it/i)).toBeInTheDocument()
  })

  it('shows the accession in the chart header', () => {
    render(<SequenceAnalysis />)
    // The first accession from aaindex1 should be visible
    const header = document.querySelector('p.font-mono.font-bold')
    expect(header?.textContent?.length).toBeGreaterThan(0)
  })

  it('shows a sequence strip when sequence length ≤ 100', () => {
    render(<SequenceAnalysis />)
    // Default sequence is 20 chars, strip should be visible
    // Each residue is rendered as a div with its AA letter
    const aaDivs = document.querySelectorAll('.font-mono.shrink-0.w-6')
    expect(aaDivs.length).toBeGreaterThan(0)
  })
})

// ── Tab switching ──────────────────────────────────────────────────────────────

describe('SequenceAnalysis — tab switching', () => {
  it('clicking Sliding Window tab activates it', async () => {
    render(<SequenceAnalysis />)
    await userEvent.click(screen.getByRole('button', { name: /sliding window/i }))
    const tab = screen.getByRole('button', { name: /sliding window/i })
    expect(tab.className).toContain('border-indigo-600')
  })

  it('Sliding Window tab shows the Kyte-Doolittle description by default', async () => {
    render(<SequenceAnalysis />)
    await userEvent.click(screen.getByRole('button', { name: /sliding window/i }))
    // "Kyte-Doolittle" appears in both the tab description and the selected record's description
    expect(screen.getAllByText(/kyte-doolittle/i).length).toBeGreaterThanOrEqual(1)
  })

  it('Sliding Window tab shows a window size slider', async () => {
    render(<SequenceAnalysis />)
    await userEvent.click(screen.getByRole('button', { name: /sliding window/i }))
    const slider = screen.getByRole('slider')
    expect(slider).toBeInTheDocument()
    expect(slider).toHaveAttribute('min', '3')
    expect(slider).toHaveAttribute('max', '25')
  })

  it('Sliding Window tab shows current window size in label', async () => {
    render(<SequenceAnalysis />)
    await userEvent.click(screen.getByRole('button', { name: /sliding window/i }))
    expect(screen.getByText(/window size: 9/i)).toBeInTheDocument()
  })

  it('adjusting the window slider updates the label', async () => {
    render(<SequenceAnalysis />)
    await userEvent.click(screen.getByRole('button', { name: /sliding window/i }))
    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '15' } })
    expect(screen.getByText(/window size: 15/i)).toBeInTheDocument()
  })

  it('clicking Multi-property Heatmap tab activates it', async () => {
    render(<SequenceAnalysis />)
    await userEvent.click(screen.getByRole('button', { name: /multi-property heatmap/i }))
    const tab = screen.getByRole('button', { name: /multi-property heatmap/i })
    expect(tab.className).toContain('border-indigo-600')
  })

  it('Heatmap tab shows a sequence input', async () => {
    render(<SequenceAnalysis />)
    await userEvent.click(screen.getByRole('button', { name: /multi-property heatmap/i }))
    const textareas = screen.getAllByRole('textbox')
    expect(textareas.length).toBeGreaterThan(0)
  })

  it('Heatmap tab shows index checkboxes', async () => {
    render(<SequenceAnalysis />)
    await userEvent.click(screen.getByRole('button', { name: /multi-property heatmap/i }))
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)
  })

  it('Heatmap tab shows Clear and Top 10 buttons', async () => {
    render(<SequenceAnalysis />)
    await userEvent.click(screen.getByRole('button', { name: /multi-property heatmap/i }))
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /top 10/i })).toBeInTheDocument()
  })

  it('clicking Clear in Heatmap tab deselects all indices', async () => {
    render(<SequenceAnalysis />)
    await userEvent.click(screen.getByRole('button', { name: /multi-property heatmap/i }))
    const clearBtn = screen.getByRole('button', { name: /clear/i })
    await userEvent.click(clearBtn)
    expect(screen.getByText(/select at least one index/i)).toBeInTheDocument()
  })

  it('tab descriptions update when switching tabs', async () => {
    render(<SequenceAnalysis />)
    await userEvent.click(screen.getByRole('button', { name: /sliding window/i }))
    expect(screen.getAllByText(/kyte-doolittle/i).length).toBeGreaterThanOrEqual(1)

    await userEvent.click(screen.getByRole('button', { name: /sequence encoder/i }))
    expect(screen.getByText(/encode a sequence using an aaindex1 property/i)).toBeInTheDocument()
  })
})

// ── Encoder tab — record selection ─────────────────────────────────────────────

describe('SequenceAnalysis — record selection', () => {
  it('filtering the record list narrows the options', async () => {
    render(<SequenceAnalysis />)
    const filterInput = screen.getByPlaceholderText(/filter records/i)
    const select = filterInput.parentElement!.querySelector('select')!
    const initialCount = select.options.length
    await userEvent.type(filterInput, 'KYTJ')
    expect(select.options.length).toBeLessThan(initialCount)
  })

  it('shows a description line below the record selector', () => {
    render(<SequenceAnalysis />)
    const descriptionEl = document.querySelector('p.text-sm.text-gray-600, p.text-sm.text-gray-400')
    expect(descriptionEl?.textContent?.length).toBeGreaterThan(0)
  })
})

// Helper: fireEvent is not imported from vitest, get it from testing-library
import { fireEvent } from '@testing-library/react'
