/** Regression cover for S4 (prototype keys), B4 (deep-linked page) and
 *  B5 (dark mode persistence). */
import { StrictMode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import RecordDetail from '../../src/pages/RecordDetail'
import Explorer from '../../src/pages/Explorer'
import Navbar from '../../src/components/layout/Navbar'
import ErrorBoundary from '../../src/components/ErrorBoundary'
import { useAAIndexStore } from '../../src/store/useAAIndexStore'

vi.mock('recharts', () => {
  const React = require('react')
  const stub = ({ children }: any) => React.createElement('div', { 'data-testid': 'recharts-stub' }, children)
  return {
    BarChart: stub, Bar: stub, LineChart: stub, Line: stub, XAxis: stub, YAxis: stub,
    Tooltip: stub, CartesianGrid: stub, ReferenceLine: stub, Cell: stub,
    ResponsiveContainer: stub, ScatterChart: stub, Scatter: stub, ZAxis: stub,
  }
})

const atRecord = (accession: string) =>
  render(
    <ErrorBoundary>
      <MemoryRouter initialEntries={[`/records/${accession}`]}>
        <Routes>
          <Route path="/records/:accession" element={<RecordDetail />} />
        </Routes>
      </MemoryRouter>
    </ErrorBoundary>,
  )

describe('S4 — prototype keys do not crash the record page', () => {
  it.each(['constructor', 'toString', 'valueOf', 'hasOwnProperty'])(
    '/records/%s shows "Record not found"',
    async (key) => {
      atRecord(key)
      expect(await screen.findByText(new RegExp(`Record not found: ${key}`))).toBeInTheDocument()
    },
  )

  it('does not fall through to the error boundary', async () => {
    atRecord('constructor')
    await screen.findByText(/Record not found/)
    expect(screen.queryByText(/something went wrong/i)).toBeNull()
  })

  it('still resolves a real record', async () => {
    atRecord('KYTJ820101')
    expect(await screen.findByText(/Amino Acid Values/)).toBeInTheDocument()
  })
})

describe('B4 — a deep-linked page number survives the first render', () => {
  beforeEach(() => {
    useAAIndexStore.setState({
      activeDB: 'aaindex1', searchQuery: '', categoryFilter: '',
      showOnlyFavourites: false, favourites: [],
    })
  })

  // StrictMode, because that is how main.tsx mounts the app: it replays mount
  // effects with the same closure, which is exactly what broke ?page=N before.
  const LocationProbe = () => <span data-testid="search">{useLocation().search}</span>

  const atExplorer = (search: string) =>
    render(
      <StrictMode>
        <MemoryRouter initialEntries={[`/explorer${search}`]}>
          <Explorer />
          <LocationProbe />
        </MemoryRouter>
      </StrictMode>,
    )

  it('lands on page 3 when the URL says so', async () => {
    atExplorer('?page=3')
    expect(await screen.findByText(/Page 3 of/)).toBeInTheDocument()
  })

  it('defaults to page 1 with no page param', async () => {
    atExplorer('')
    expect(await screen.findByText(/Page 1 of/)).toBeInTheDocument()
  })

  it('still resets to page 1 when the filter changes afterwards', async () => {
    atExplorer('?page=3')
    await screen.findByText(/Page 3 of/)
    useAAIndexStore.getState().setCategoryFilter('hydrophobic')
    await waitFor(() => expect(screen.getByText(/Page 1 of/)).toBeInTheDocument())
  })

  it('hydrates the search query alongside the page number', async () => {
    atExplorer('?q=hydro&page=2')
    await screen.findByText(/Page 2 of/)
    expect(useAAIndexStore.getState().searchQuery).toBe('hydro')
  })

  it('does not wipe the query string on mount', async () => {
    atExplorer('?q=hydro&page=2')
    await screen.findByText(/Page 2 of/)
    await waitFor(() => {
      const search = screen.getByTestId('search').textContent ?? ''
      expect(search).toContain('q=hydro')
      expect(search).toContain('page=2')
    })
  })
})

describe('B5 — the theme choice is persisted and honours the OS preference', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false, addEventListener() {}, removeEventListener() {} }))
  })

  const atNavbar = () => render(<MemoryRouter><Navbar /></MemoryRouter>)

  it('writes the choice to localStorage when toggled', async () => {
    atNavbar()
    await userEvent.click(screen.getAllByLabelText(/toggle dark mode/i)[0])
    expect(localStorage.getItem('aaindex_theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('restores a stored dark choice on mount', () => {
    localStorage.setItem('aaindex_theme', 'dark')
    atNavbar()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('a stored light choice beats a dark OS preference', () => {
    localStorage.setItem('aaindex_theme', 'light')
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {} }))
    atNavbar()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('falls back to prefers-color-scheme with nothing stored', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {} }))
    atNavbar()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})

describe('B8 — a corrupted favourites value cannot throw at store init', () => {
  it.each(['{"not":"an array"}', '"a string"', '42', 'null', 'not json at all'])(
    'survives %s in localStorage',
    async (raw) => {
      localStorage.setItem('aaindex_favourites', raw)
      vi.resetModules()
      const { useAAIndexStore: fresh } = await import('../../src/store/useAAIndexStore')
      expect(Array.isArray(fresh.getState().favourites)).toBe(true)
    },
  )

  it('drops non-string entries from a partially valid array', async () => {
    localStorage.setItem('aaindex_favourites', '["KYTJ820101", 42, null]')
    vi.resetModules()
    const { useAAIndexStore: fresh } = await import('../../src/store/useAAIndexStore')
    expect(fresh.getState().favourites).toEqual(['KYTJ820101'])
  })
})
