import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Visualiser from '../../src/pages/Visualiser'

vi.mock('recharts', () => {
  const React = require('react')
  const stub = ({ children }: any) => React.createElement('div', { 'data-testid': 'recharts-stub' }, children)
  return {
    BarChart: stub, Bar: stub, XAxis: stub, YAxis: stub, Tooltip: stub,
    Cell: stub, ResponsiveContainer: stub, ReferenceLine: stub,
    RadarChart: stub, Radar: stub, PolarGrid: stub, PolarAngleAxis: stub,
    Legend: stub, ScatterChart: stub, Scatter: stub, CartesianGrid: stub,
    Label: stub,
  }
})

// ── Render ─────────────────────────────────────────────────────────────────────

describe('Visualiser — initial render', () => {
  it('renders without crashing', () => {
    expect(() => render(<Visualiser />)).not.toThrow()
  })

  it('shows all chart type buttons', () => {
    render(<Visualiser />)
    expect(screen.getByRole('button', { name: /bar chart/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /radar chart/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /matrix heatmap/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /property scatter/i })).toBeInTheDocument()
  })

  it('bar chart button is visually active by default', () => {
    render(<Visualiser />)
    const barBtn = screen.getByRole('button', { name: /bar chart/i })
    expect(barBtn.className).toContain('bg-indigo-600')
  })

  it('shows a record filter input', () => {
    render(<Visualiser />)
    expect(screen.getByPlaceholderText(/filter records/i)).toBeInTheDocument()
  })

  it('shows a record select list', () => {
    render(<Visualiser />)
    const selects = screen.getAllByRole('listbox')
    expect(selects.length).toBeGreaterThan(0)
  })

  it('shows the CSV export button', () => {
    render(<Visualiser />)
    expect(screen.getByRole('button', { name: /csv/i })).toBeInTheDocument()
  })

  it('shows the PNG download button', () => {
    render(<Visualiser />)
    expect(screen.getByRole('button', { name: /png/i })).toBeInTheDocument()
  })
})

// ── Chart type switching ───────────────────────────────────────────────────────

describe('Visualiser — chart type switching', () => {
  it('clicking Radar chart activates that button', async () => {
    render(<Visualiser />)
    await userEvent.click(screen.getByRole('button', { name: /radar chart/i }))
    const radarBtn = screen.getByRole('button', { name: /radar chart/i })
    expect(radarBtn.className).toContain('bg-indigo-600')
  })

  it('activating Radar chart deactivates Bar chart', async () => {
    render(<Visualiser />)
    await userEvent.click(screen.getByRole('button', { name: /radar chart/i }))
    const barBtn = screen.getByRole('button', { name: /bar chart/i })
    expect(barBtn.className).not.toContain('bg-indigo-600')
  })

  it('switching to Radar chart shows "Overlay second record" checkbox', async () => {
    render(<Visualiser />)
    await userEvent.click(screen.getByRole('button', { name: /radar chart/i }))
    expect(screen.getByRole('checkbox', { name: /overlay second record/i })).toBeInTheDocument()
  })

  it('overlay second record is unchecked by default in Radar mode', async () => {
    render(<Visualiser />)
    await userEvent.click(screen.getByRole('button', { name: /radar chart/i }))
    const checkbox = screen.getByRole('checkbox', { name: /overlay second record/i })
    expect(checkbox).not.toBeChecked()
  })

  it('checking overlay shows a second record selector', async () => {
    render(<Visualiser />)
    await userEvent.click(screen.getByRole('button', { name: /radar chart/i }))
    const checkbox = screen.getByRole('checkbox', { name: /overlay second record/i })
    await userEvent.click(checkbox)
    expect(screen.getByText(/record 2/i)).toBeInTheDocument()
  })

  it('switching to Heatmap shows the DB selector', async () => {
    render(<Visualiser />)
    await userEvent.click(screen.getByRole('button', { name: /matrix heatmap/i }))
    expect(screen.getByText(/aaindex2/i)).toBeInTheDocument()
    expect(screen.getByText(/aaindex3/i)).toBeInTheDocument()
  })

  it('switching from Heatmap to Bar removes the DB selector', async () => {
    render(<Visualiser />)
    await userEvent.click(screen.getByRole('button', { name: /matrix heatmap/i }))
    await userEvent.click(screen.getByRole('button', { name: /bar chart/i }))
    expect(screen.queryByText(/aaindex2/i)).not.toBeInTheDocument()
  })

  it('switching to Property Scatter shows "X axis record" label', async () => {
    render(<Visualiser />)
    await userEvent.click(screen.getByRole('button', { name: /property scatter/i }))
    expect(screen.getByText(/x axis record/i)).toBeInTheDocument()
  })

  it('switching to Property Scatter shows "Y axis record" label', async () => {
    render(<Visualiser />)
    await userEvent.click(screen.getByRole('button', { name: /property scatter/i }))
    expect(screen.getByText(/y axis record/i)).toBeInTheDocument()
  })

  it('Property Scatter header shows both accessions joined with ×', async () => {
    render(<Visualiser />)
    await userEvent.click(screen.getByRole('button', { name: /property scatter/i }))
    // Header should show "ACC1 × ACC2" format
    const header = document.querySelector('p.font-mono.font-bold')
    expect(header?.textContent).toContain('×')
  })

  it('switching back from Scatter to Bar hides Y axis selector', async () => {
    render(<Visualiser />)
    await userEvent.click(screen.getByRole('button', { name: /property scatter/i }))
    await userEvent.click(screen.getByRole('button', { name: /bar chart/i }))
    expect(screen.queryByText(/y axis record/i)).not.toBeInTheDocument()
  })
})

// ── Record filter ──────────────────────────────────────────────────────────────

describe('Visualiser — record filter', () => {
  it('typing in the filter narrows options in the record select', () => {
    render(<Visualiser />)
    const filterInput = screen.getByPlaceholderText(/filter records/i)
    const listbox = screen.getAllByRole('listbox')[0]
    const initialCount = listbox.querySelectorAll('option').length
    fireEvent.change(filterInput, { target: { value: 'KYTJ820101' } })
    expect(listbox.querySelectorAll('option').length).toBeLessThan(initialCount)
  })

  it('filtering to an exact accession leaves exactly one option', () => {
    render(<Visualiser />)
    const filterInput = screen.getByPlaceholderText(/filter records/i)
    const listbox = screen.getAllByRole('listbox')[0]
    fireEvent.change(filterInput, { target: { value: 'KYTJ820101' } })
    const options = listbox.querySelectorAll('option')
    expect(options).toHaveLength(1)
    expect(options[0].value).toBe('KYTJ820101')
  })

  it('selecting a record from the list updates the chart header accession', async () => {
    render(<Visualiser />)
    const listbox = screen.getAllByRole('listbox')[0]
    await userEvent.selectOptions(listbox, listbox.querySelectorAll('option')[1].value)
    const header = document.querySelector('p.font-mono.font-bold')
    expect(header?.textContent).not.toBe('')
  })
})

// ── Heatmap DB switching ───────────────────────────────────────────────────────

describe('Visualiser — heatmap DB switching', () => {
  it('clicking AAIndex3 selects it', async () => {
    render(<Visualiser />)
    await userEvent.click(screen.getByRole('button', { name: /matrix heatmap/i }))
    const db3Btn = screen.getByRole('button', { name: /aaindex3/i })
    await userEvent.click(db3Btn)
    expect(db3Btn.className).toContain('bg-indigo-600')
  })
})
