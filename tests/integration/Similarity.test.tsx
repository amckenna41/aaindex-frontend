import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Similarity from '../../src/pages/Similarity'

vi.mock('recharts', () => {
  const React = require('react')
  const stub = ({ children }: any) => React.createElement('div', { 'data-testid': 'recharts-stub' }, children)
  return {
    ScatterChart: stub, Scatter: stub, XAxis: stub, YAxis: stub, ZAxis: stub,
    Tooltip: stub, CartesianGrid: stub, Cell: stub, ResponsiveContainer: stub,
  }
})

const at = (search = '') =>
  render(<MemoryRouter initialEntries={[`/similarity${search}`]}><Similarity /></MemoryRouter>)

describe('Similarity — whole-database property space', () => {
  it('renders without crashing', () => {
    expect(() => at()).not.toThrow()
  })

  it('is titled consistently with the navigation and the guide', () => {
    at()
    expect(screen.getByRole('heading', { name: 'Property Space' })).toBeInTheDocument()
  })

  it('reports the variance explained by each component', () => {
    at()
    expect(screen.getByText(/PC1 explains \d+\.\d% of variance/)).toBeInTheDocument()
  })

  it('shows every record by default', () => {
    at()
    expect(screen.getByText(/566 of 566 records shown/)).toBeInTheDocument()
  })

  it('offers a category filter with all categories', () => {
    at()
    expect(screen.getByRole('option', { name: /hydrophobic/ })).toBeInTheDocument()
  })

  it('narrows the shown records when a category is picked', async () => {
    at()
    await userEvent.selectOptions(screen.getByRole('combobox'), 'hydrophobic')
    expect(screen.queryByText(/566 of 566 records shown/)).toBeNull()
    expect(screen.getByText(/of 566 records shown/)).toBeInTheDocument()
  })

  it('hydrates a pinned record from the URL', () => {
    at('?acc=KYTJ820101')
    expect(screen.getByText(/Most correlated with KYTJ820101/)).toBeInTheDocument()
  })

  it('ignores an unknown accession in the URL', () => {
    at('?acc=NOSUCH0000')
    expect(screen.queryByText(/Most correlated with/)).toBeNull()
  })

  it('ignores a prototype key in the URL', () => {
    expect(() => at('?acc=constructor')).not.toThrow()
    expect(screen.queryByText(/Most correlated with/)).toBeNull()
  })

  it('lists correlated neighbours for a pinned record', () => {
    at('?acc=KYTJ820101')
    // Kyte-Doolittle correlates near-perfectly with the other hydrophobicity scales,
    // so the top neighbour's |r| should be high.
    const coefficients = screen.getAllByText(/^[+-]\d\.\d\d$/)
    expect(coefficients.length).toBeGreaterThan(0)
    expect(Math.abs(Number(coefficients[0].textContent))).toBeGreaterThan(0.9)
  })

  it('offers a link to open the pinned record', () => {
    at('?acc=KYTJ820101')
    expect(screen.getByRole('button', { name: /Open KYTJ820101/ })).toBeInTheDocument()
  })
})
