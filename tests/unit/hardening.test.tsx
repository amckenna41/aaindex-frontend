/** Regression cover for the front-end findings. */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { saveAs } from 'file-saver'
import ErrorBoundary from '../../src/components/ErrorBoundary'
import RecordCard from '../../src/components/RecordCard'
import { exportEncodingAsCSV } from '../../src/lib/exportUtils'
import { minOf, maxOf } from '../../src/lib/statsUtils'
import { exportPySARDescriptors } from '../../src/lib/pysar'
import type { AAIndex1Record } from '../../src/types'

const mockSaveAs = vi.mocked(saveAs)
beforeEach(() => mockSaveAs.mockClear())

const record = (values: Record<string, number>): AAIndex1Record => ({
  description: 'Test record',
  references: '',
  notes: '',
  pmid: '',
  category: 'hydrophobic',
  correlation_coefficients: {},
  values,
})

const FULL = Object.fromEntries(
  'ACDEFGHIKLMNPQRSTVWY'.split('').map((aa, i) => [aa, i / 10]),
) as Record<string, number>

// ── B6 ────────────────────────────────────────────────────────────────────────

describe('B6 — long sequences do not blow the call stack', () => {
  const huge = Array.from({ length: 300_000 }, (_, i) => (i % 977) - 400)

  it('minOf handles an array that would break Math.min(...spread)', () => {
    expect(() => Math.min(...huge)).toThrow(RangeError)
    expect(minOf(huge)).toBe(Math.min(...huge.slice(0, 977)))
  })

  it('maxOf handles the same array', () => {
    expect(maxOf(huge)).toBe(576)
  })

  it('minOf and maxOf return null for an empty array', () => {
    expect(minOf([])).toBeNull()
    expect(maxOf([])).toBeNull()
  })
})

// ── S1 ────────────────────────────────────────────────────────────────────────

describe('S1 — CSV exports sanitise every cell, not just the header', () => {
  it('quotes a formula payload appearing as an amino acid symbol', async () => {
    exportEncodingAsCSV('ACC1', 'AB', [
      { pos: 1, aa: '=cmd|calc', value: 1.5 },
      { pos: 2, aa: 'A', value: null },
    ])
    const text = await (mockSaveAs.mock.calls[0][0] as Blob).text()
    expect(text).toContain('"=cmd|calc"')
  })

  it('leaves ordinary rows untouched', async () => {
    exportEncodingAsCSV('ACC1', 'A', [{ pos: 1, aa: 'A', value: -4.5 }])
    const text = await (mockSaveAs.mock.calls[0][0] as Blob).text()
    expect(text.split('\n')[1]).toBe('1,A,-4.5')
  })
})

// ── B7 ────────────────────────────────────────────────────────────────────────

describe('B7 — the error boundary offers a recovery that actually resets', () => {
  const Boom = () => { throw new Error('deterministic failure') }

  it('renders the fallback and a route-resetting action', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><Boom /></ErrorBoundary>)
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back to explorer/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()
  })

  it('no longer offers a no-op "Try again"', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><Boom /></ErrorBoundary>)
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull()
  })
})

// ── Coverage badges ───────────────────────────────────────────────────────────

describe('coverage badges warn about sparse indices in the list', () => {
  const renderCard = (values: Record<string, number>) =>
    render(
      <MemoryRouter>
        <RecordCard accession="TEST000001" record={record(values)} dbName="aaindex1" />
      </MemoryRouter>,
    )

  it('shows no badge when all 20 amino acids have values', () => {
    renderCard(FULL)
    expect(screen.queryByText(/\/20/)).toBeNull()
  })

  it('shows the covered count when values are missing', () => {
    const { A: _a, C: _c, ...sparse } = FULL
    renderCard(sparse)
    expect(screen.getByText(/18\/20/)).toBeInTheDocument()
  })

  it('describes the gap for screen readers', () => {
    const { A: _a, ...sparse } = FULL
    renderCard(sparse)
    expect(screen.getByLabelText(/19 of 20 amino acids covered/i)).toBeInTheDocument()
  })
})

// ── pySAR bridge ──────────────────────────────────────────────────────────────

describe('pySAR export', () => {
  const db = { KYTJ820101: record(FULL) }

  it('writes a dataset CSV and a config JSON', () => {
    exportPySARDescriptors([{ id: 's1', seq: 'ACDEF' }], ['KYTJ820101'], db)
    expect(mockSaveAs).toHaveBeenCalledTimes(2)
    expect(mockSaveAs.mock.calls[0][1]).toBe('pysar_dataset_KYTJ820101.csv')
    expect(mockSaveAs.mock.calls[1][1]).toBe('pysar_config_KYTJ820101.json')
  })

  it('the dataset carries a sequence and an activity column to fill in', async () => {
    exportPySARDescriptors([{ id: 's1', seq: 'ACDEF' }], ['KYTJ820101'], db)
    const text = await (mockSaveAs.mock.calls[0][0] as Blob).text()
    expect(text.split('\n')[0]).toBe('sequence_id,sequence,activity')
    expect(text.split('\n')[1]).toBe('s1,ACDEF,')
  })

  it('the config names the AAIndex indices and embeds their values', async () => {
    exportPySARDescriptors([{ id: 's1', seq: 'ACDEF' }], ['KYTJ820101'], db)
    const config = JSON.parse(await (mockSaveAs.mock.calls[1][0] as Blob).text())
    expect(config.aai_indices).toEqual(['KYTJ820101'])
    expect(config.aai_reference.KYTJ820101.values.A).toBe(0)
  })

  it('sanitises a malicious sequence id', async () => {
    exportPySARDescriptors([{ id: '=cmd|calc', seq: 'ACDEF' }], ['KYTJ820101'], db)
    const text = await (mockSaveAs.mock.calls[0][0] as Blob).text()
    expect(text).toContain('"=cmd|calc"')
  })

  it('does nothing without sequences', () => {
    exportPySARDescriptors([], ['KYTJ820101'], db)
    expect(mockSaveAs).not.toHaveBeenCalled()
  })
})

// ── ShareLink ─────────────────────────────────────────────────────────────────

describe('ShareLink', () => {
  it('copies the current URL', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const { default: ShareLink } = await import('../../src/components/ShareLink')
    render(<ShareLink />)
    await userEvent.click(screen.getByRole('button'))
    expect(writeText).toHaveBeenCalledWith(window.location.href)
  })
})
