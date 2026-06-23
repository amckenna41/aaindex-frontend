import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AminoAcidBarChart from '../../src/components/AminoAcidBarChart'

vi.mock('recharts', () => {
  const React = require('react')
  const stub = ({ children }: any) => React.createElement('div', { 'data-testid': 'recharts-stub' }, children)
  return {
    BarChart: stub, Bar: stub, XAxis: stub, YAxis: stub,
    Tooltip: stub, Cell: stub, ResponsiveContainer: stub, ReferenceLine: stub,
  }
})

const fullValues: Record<string, number> = {
  A: 1.8, C: 2.5, D: -3.5, E: -3.5, F: 2.8, G: -0.4, H: -3.2, I: 4.5,
  K: -3.9, L: 3.8, M: 1.9, N: -3.5, P: -1.6, Q: -3.5, R: -4.5, S: -0.8,
  T: -0.7, V: 4.2, W: -0.9, Y: -1.3,
}

const partialValues: Record<string, number | null> = {
  A: 1.8, C: null, D: -3.5,
}

describe('AminoAcidBarChart', () => {
  it('renders without crashing with full values', () => {
    expect(() => render(<AminoAcidBarChart values={fullValues} accession="KYTJ820101" />)).not.toThrow()
  })

  it('renders without crashing when some values are null', () => {
    expect(() => render(<AminoAcidBarChart values={partialValues as Record<string, number>} accession="TEST" />)).not.toThrow()
  })

  it('renders without crashing with empty values object', () => {
    expect(() => render(<AminoAcidBarChart values={{}} accession="EMPTY" />)).not.toThrow()
  })

  it('renders without crashing with normalise prop', () => {
    expect(() => render(<AminoAcidBarChart values={fullValues} accession="KYTJ820101" normalise />)).not.toThrow()
  })

  it('renders without crashing with a custom height', () => {
    expect(() => render(<AminoAcidBarChart values={fullValues} accession="KYTJ820101" height={500} />)).not.toThrow()
  })

  it('accepts default height prop gracefully', () => {
    // no height prop → uses default 280
    expect(() => render(<AminoAcidBarChart values={fullValues} accession="TEST" />)).not.toThrow()
  })

  it('renders with all-positive values without throwing', () => {
    const positive = Object.fromEntries(Object.entries(fullValues).map(([k, v]) => [k, Math.abs(v)]))
    expect(() => render(<AminoAcidBarChart values={positive} accession="TEST" />)).not.toThrow()
  })

  it('renders with all-negative values without throwing', () => {
    const negative = Object.fromEntries(Object.entries(fullValues).map(([k, v]) => [k, -Math.abs(v)]))
    expect(() => render(<AminoAcidBarChart values={negative} accession="TEST" />)).not.toThrow()
  })
})
