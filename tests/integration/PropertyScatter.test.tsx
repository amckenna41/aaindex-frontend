import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PropertyScatter from '../../src/components/PropertyScatter'

vi.mock('recharts', () => {
  const React = require('react')
  const stub = ({ children }: any) => React.createElement('div', { 'data-testid': 'recharts-stub' }, children)
  return {
    ScatterChart: stub, Scatter: stub, XAxis: stub, YAxis: stub,
    Tooltip: stub, CartesianGrid: stub, ReferenceLine: stub,
    ResponsiveContainer: stub, Label: stub,
  }
})

const hydrophobicity: Record<string, number | null> = {
  A: 1.8, C: 2.5, D: -3.5, E: -3.5, F: 2.8, G: -0.4, H: -3.2, I: 4.5,
  K: -3.9, L: 3.8, M: 1.9, N: -3.5, P: -1.6, Q: -3.5, R: -4.5, S: -0.8,
  T: -0.7, V: 4.2, W: -0.9, Y: -1.3,
}

const molecularWeight: Record<string, number | null> = {
  A: 89, C: 121, D: 133, E: 147, F: 165, G: 75, H: 155, I: 131,
  K: 146, L: 131, M: 149, N: 132, P: 115, Q: 146, R: 174, S: 105,
  T: 119, V: 117, W: 204, Y: 181,
}

describe('PropertyScatter', () => {
  it('renders without crashing with two full value sets', () => {
    expect(() => render(
      <PropertyScatter
        xValues={hydrophobicity}
        yValues={molecularWeight}
        xAccession="KYTJ820101"
        yAccession="MWTS000101"
      />
    )).not.toThrow()
  })

  it('shows the no-data message when both value maps are empty', () => {
    render(
      <PropertyScatter
        xValues={{}}
        yValues={{}}
        xAccession="X"
        yAccession="Y"
      />
    )
    expect(screen.getByText(/no overlapping data/i)).toBeInTheDocument()
  })

  it('shows the no-data message when no AAs overlap between the two records', () => {
    // X only has A, Y only has C → no common non-null values
    render(
      <PropertyScatter
        xValues={{ A: 1.8 }}
        yValues={{ C: 2.5 }}
        xAccession="X"
        yAccession="Y"
      />
    )
    expect(screen.getByText(/no overlapping data/i)).toBeInTheDocument()
  })

  it('does not show no-data message when there is at least one overlapping AA', () => {
    render(
      <PropertyScatter
        xValues={{ A: 1.8, C: 2.5 }}
        yValues={{ A: 89, C: 121 }}
        xAccession="X"
        yAccession="Y"
      />
    )
    expect(screen.queryByText(/no overlapping data/i)).not.toBeInTheDocument()
  })

  it('shows no-data message when xValues has null for all shared keys', () => {
    render(
      <PropertyScatter
        xValues={{ A: null, C: null }}
        yValues={{ A: 89, C: 121 }}
        xAccession="X"
        yAccession="Y"
      />
    )
    expect(screen.getByText(/no overlapping data/i)).toBeInTheDocument()
  })

  it('shows no-data message when yValues has null for all shared keys', () => {
    render(
      <PropertyScatter
        xValues={{ A: 1.8, C: 2.5 }}
        yValues={{ A: null, C: null }}
        xAccession="X"
        yAccession="Y"
      />
    )
    expect(screen.getByText(/no overlapping data/i)).toBeInTheDocument()
  })

  it('renders without crashing when same record is passed for both axes', () => {
    expect(() => render(
      <PropertyScatter
        xValues={hydrophobicity}
        yValues={hydrophobicity}
        xAccession="SAME"
        yAccession="SAME"
      />
    )).not.toThrow()
  })

  it('renders without crashing with a single overlapping AA', () => {
    expect(() => render(
      <PropertyScatter
        xValues={{ A: 1.8 }}
        yValues={{ A: 89 }}
        xAccession="X"
        yAccession="Y"
      />
    )).not.toThrow()
    expect(screen.queryByText(/no overlapping data/i)).not.toBeInTheDocument()
  })
})
