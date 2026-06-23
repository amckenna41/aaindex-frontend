import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Comparator from '../../src/pages/Comparator'
import { useAAIndexStore } from '../../src/store/useAAIndexStore'

vi.mock('recharts', () => {
  const React = require('react')
  const stub = (p: any) => React.createElement('div', { 'data-testid': 'recharts-stub' }, p.children)
  return {
    BarChart: stub, Bar: stub, XAxis: stub, YAxis: stub, Tooltip: stub,
    CartesianGrid: stub, Legend: stub, ResponsiveContainer: stub, Cell: stub,
  }
})

function renderWithRoute(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/compare${search}`]}>
      <Routes>
        <Route path="/compare" element={<Comparator />} />
        <Route path="/explorer" element={<div>Explorer</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  useAAIndexStore.setState({
    selectedAccessions: [],
    normalise: false,
    favourites: [],
    searchQuery: '',
    categoryFilter: '',
    showOnlyFavourites: false,
    activeDB: 'aaindex1',
  })
  localStorage.clear()
})

// ── Empty state ───────────────────────────────────────────────────────────────

describe('Comparator — empty state', () => {
  it('shows "No records selected" when store is empty and no URL params', () => {
    renderWithRoute()
    expect(screen.getByText(/no records selected/i)).toBeInTheDocument()
  })

  it('renders a link to the Explorer', () => {
    renderWithRoute()
    expect(screen.getByRole('link', { name: /go to explorer/i })).toBeInTheDocument()
  })
})

// ── URL hydration (URL → store) ───────────────────────────────────────────────

describe('Comparator — URL hydration', () => {
  it('loads accessions from ?ids= query param', async () => {
    renderWithRoute('?ids=KYTJ820101,CHOP780201')
    await waitFor(() => {
      expect(screen.getAllByText('KYTJ820101').length).toBeGreaterThan(0)
      expect(screen.getAllByText('CHOP780201').length).toBeGreaterThan(0)
    })
  })

  it('ignores accessions not in aaindex1', async () => {
    renderWithRoute('?ids=KYTJ820101,NOTEXIST999')
    await waitFor(() => {
      expect(screen.getAllByText('KYTJ820101').length).toBeGreaterThan(0)
      expect(screen.queryByText('NOTEXIST999')).not.toBeInTheDocument()
    })
  })

  it('caps hydration at 4 accessions', async () => {
    renderWithRoute('?ids=KYTJ820101,CHOP780201,GRAR740102,ANDN920101,BHAR880101')
    await waitFor(() => {
      const chips = screen.getAllByRole('button', { name: /remove/i })
      expect(chips.length).toBeLessThanOrEqual(4)
    })
  })

  it('activates z-score normalisation when ?norm=zscore is set', async () => {
    renderWithRoute('?ids=KYTJ820101&norm=zscore')
    await waitFor(() => {
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement
      expect(checkbox.checked).toBe(true)
    })
  })

  it('does not activate normalisation when ?norm= is absent', async () => {
    renderWithRoute('?ids=KYTJ820101')
    await waitFor(() => {
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement
      expect(checkbox.checked).toBe(false)
    })
  })
})

// ── Store → URL sync ──────────────────────────────────────────────────────────

describe('Comparator — store-to-URL sync', () => {
  it('renders selected accessions from the store', async () => {
    useAAIndexStore.setState({ selectedAccessions: ['KYTJ820101'], normalise: false })
    renderWithRoute()
    await waitFor(() => {
      expect(screen.getAllByText('KYTJ820101').length).toBeGreaterThan(0)
    })
  })

  it('removes an accession chip when the × button is clicked', async () => {
    useAAIndexStore.setState({ selectedAccessions: ['KYTJ820101', 'CHOP780201'], normalise: false })
    renderWithRoute()
    await waitFor(() => screen.getAllByText('KYTJ820101'))
    const removeBtn = screen.getByRole('button', { name: /remove kytj820101/i })
    fireEvent.click(removeBtn)
    await waitFor(() => {
      // After removal, accession should only appear in the table header for CHOP780201, not KYTJ820101 chip
      expect(screen.queryByRole('button', { name: /remove kytj820101/i })).not.toBeInTheDocument()
      expect(screen.getAllByText('CHOP780201').length).toBeGreaterThan(0)
    })
  })

  it('clears all chips when "Clear all" is clicked', async () => {
    useAAIndexStore.setState({ selectedAccessions: ['KYTJ820101', 'CHOP780201'], normalise: false })
    renderWithRoute()
    await waitFor(() => screen.getAllByText('KYTJ820101'))
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /remove kytj820101/i })).not.toBeInTheDocument()
    })
  })

  it('toggles normalisation via the checkbox', async () => {
    useAAIndexStore.setState({ selectedAccessions: ['KYTJ820101'], normalise: false })
    renderWithRoute()
    await waitFor(() => screen.getByRole('checkbox'))
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(false)
    fireEvent.click(checkbox)
    await waitFor(() => {
      expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true)
    })
  })
})

// ── Values table ──────────────────────────────────────────────────────────────

describe('Comparator — values table', () => {
  it('renders a row for each of the 20 standard amino acids', async () => {
    useAAIndexStore.setState({ selectedAccessions: ['KYTJ820101'], normalise: false })
    renderWithRoute()
    await waitFor(() => screen.getAllByText('KYTJ820101'))
    const aas = ['A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'Y']
    for (const aa of aas) {
      expect(screen.getAllByText(aa).length).toBeGreaterThan(0)
    }
  })

  it('shows the share button', async () => {
    useAAIndexStore.setState({ selectedAccessions: ['KYTJ820101'], normalise: false })
    renderWithRoute()
    await waitFor(() => screen.getByText(/share/i))
  })
})
