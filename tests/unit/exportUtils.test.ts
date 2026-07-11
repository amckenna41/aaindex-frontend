import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveAs } from 'file-saver'
import {
  exportValuesAsCSV,
  exportRecordAsJSON,
  exportComparisonAsCSV,
  exportMatrixAsCSV,
} from '../../src/lib/exportUtils'

vi.mock('file-saver', () => ({ saveAs: vi.fn() }))
const mockSaveAs = vi.mocked(saveAs)

async function blobText(blob: Blob): Promise<string> {
  return blob.text()
}

beforeEach(() => {
  mockSaveAs.mockClear()
})

// ── exportValuesAsCSV ──────────────────────────────────────────────────────────

describe('exportValuesAsCSV', () => {
  const values = { A: 1.8, C: 2.5, D: -3.5 }

  it('calls saveAs once', () => {
    exportValuesAsCSV('TEST001', values)
    expect(mockSaveAs).toHaveBeenCalledTimes(1)
  })

  it('saves with the correct filename', () => {
    exportValuesAsCSV('TEST001', values)
    expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'TEST001_values.csv')
  })

  it('blob contains a header row', async () => {
    exportValuesAsCSV('TEST001', values)
    const blob = mockSaveAs.mock.calls[0][0] as Blob
    const text = await blobText(blob)
    expect(text.split('\n')[0]).toBe('amino_acid,value')
  })

  it('blob contains one data row per amino acid', async () => {
    exportValuesAsCSV('TEST001', values)
    const blob = mockSaveAs.mock.calls[0][0] as Blob
    const text = await blobText(blob)
    const lines = text.split('\n').filter(Boolean)
    expect(lines).toHaveLength(1 + Object.keys(values).length) // header + 3 data rows
  })

  it('data rows have format "AA,value"', async () => {
    exportValuesAsCSV('TEST001', { A: 1.8 })
    const blob = mockSaveAs.mock.calls[0][0] as Blob
    const text = await blobText(blob)
    const dataLine = text.split('\n')[1]
    expect(dataLine).toBe('A,1.8')
  })

  it('blob type is text/csv', () => {
    exportValuesAsCSV('TEST001', values)
    const blob = mockSaveAs.mock.calls[0][0] as Blob
    expect(blob.type).toBe('text/csv')
  })
})

// ── exportRecordAsJSON ─────────────────────────────────────────────────────────

describe('exportRecordAsJSON', () => {
  const record = { description: 'Test record', values: { A: 1.8 } }

  it('calls saveAs once', () => {
    exportRecordAsJSON('TEST001', record)
    expect(mockSaveAs).toHaveBeenCalledTimes(1)
  })

  it('saves with the correct filename', () => {
    exportRecordAsJSON('TEST001', record)
    expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'TEST001.json')
  })

  it('output is valid JSON wrapping the accession as key', async () => {
    exportRecordAsJSON('TEST001', record)
    const blob = mockSaveAs.mock.calls[0][0] as Blob
    const text = await blobText(blob)
    const parsed = JSON.parse(text)
    expect(parsed).toHaveProperty('TEST001')
    expect(parsed['TEST001']).toEqual(record)
  })

  it('blob type is application/json', () => {
    exportRecordAsJSON('TEST001', record)
    const blob = mockSaveAs.mock.calls[0][0] as Blob
    expect(blob.type).toBe('application/json')
  })

  it('output is pretty-printed with 2-space indent', async () => {
    exportRecordAsJSON('TEST001', { a: 1 })
    const blob = mockSaveAs.mock.calls[0][0] as Blob
    const text = await blobText(blob)
    expect(text).toContain('\n  ')
  })
})

// ── exportComparisonAsCSV ──────────────────────────────────────────────────────

describe('exportComparisonAsCSV', () => {
  const accessions = ['ACC1', 'ACC2']
  const records: Record<string, Record<string, number>> = {
    ACC1: { A: 1.8, C: 2.5 },
    ACC2: { A: 0.5, C: 1.2 },
  }

  it('calls saveAs once', () => {
    exportComparisonAsCSV(accessions, records)
    expect(mockSaveAs).toHaveBeenCalledTimes(1)
  })

  it('saves with a filename containing all accession names', () => {
    exportComparisonAsCSV(accessions, records)
    const filename = mockSaveAs.mock.calls[0][1] as string
    expect(filename).toContain('ACC1')
    expect(filename).toContain('ACC2')
  })

  it('header row contains amino_acid followed by all accessions', async () => {
    exportComparisonAsCSV(accessions, records)
    const blob = mockSaveAs.mock.calls[0][0] as Blob
    const text = await blobText(blob)
    const header = text.split('\n')[0]
    expect(header).toBe('amino_acid,ACC1,ACC2')
  })

  it('each data row has the correct number of columns', async () => {
    exportComparisonAsCSV(accessions, records)
    const blob = mockSaveAs.mock.calls[0][0] as Blob
    const text = await blobText(blob)
    const dataRows = text.split('\n').slice(1).filter(Boolean)
    for (const row of dataRows) {
      expect(row.split(',').length).toBe(3) // aa + 2 values
    }
  })

  it('values are correctly placed in each column', async () => {
    exportComparisonAsCSV(accessions, records)
    const blob = mockSaveAs.mock.calls[0][0] as Blob
    const text = await blobText(blob)
    expect(text).toContain('A,1.8,0.5')
    expect(text).toContain('C,2.5,1.2')
  })
})

// ── exportMatrixAsCSV ──────────────────────────────────────────────────────────

describe('exportMatrixAsCSV', () => {
  const matrix = {
    A: { A: 4, C: -1 },
    C: { A: -1, C: 9 },
  }

  it('calls saveAs once', () => {
    exportMatrixAsCSV('MATRIX001', matrix)
    expect(mockSaveAs).toHaveBeenCalledTimes(1)
  })

  it('saves with the correct filename', () => {
    exportMatrixAsCSV('MATRIX001', matrix)
    expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'MATRIX001_matrix.csv')
  })

  it('first row is a header starting with an empty field', async () => {
    exportMatrixAsCSV('MATRIX001', matrix)
    const blob = mockSaveAs.mock.calls[0][0] as Blob
    const text = await blobText(blob)
    const header = text.split('\n')[0]
    expect(header.startsWith(',')).toBe(true)
  })

  it('header contains all column names', async () => {
    exportMatrixAsCSV('MATRIX001', matrix)
    const blob = mockSaveAs.mock.calls[0][0] as Blob
    const text = await blobText(blob)
    const header = text.split('\n')[0]
    expect(header).toContain('A')
    expect(header).toContain('C')
  })

  it('each data row starts with the row label', async () => {
    exportMatrixAsCSV('MATRIX001', matrix)
    const blob = mockSaveAs.mock.calls[0][0] as Blob
    const text = await blobText(blob)
    const lines = text.split('\n').filter(Boolean)
    expect(lines[1]).toMatch(/^A,/)
    expect(lines[2]).toMatch(/^C,/)
  })

  it('matrix values appear correctly in the output', async () => {
    exportMatrixAsCSV('MATRIX001', matrix)
    const blob = mockSaveAs.mock.calls[0][0] as Blob
    const text = await blobText(blob)
    expect(text).toContain('A,4,-1')
    expect(text).toContain('C,-1,9')
  })
})

// ── crash guards ───────────────────────────────────────────────────────────────

describe('exportComparisonAsCSV — crash guards', () => {
  it('does nothing when accessions array is empty', () => {
    exportComparisonAsCSV([], {})
    expect(mockSaveAs).not.toHaveBeenCalled()
  })

  it('does nothing when the first accession is missing from records', () => {
    exportComparisonAsCSV(['NOTEXIST'], {})
    expect(mockSaveAs).not.toHaveBeenCalled()
  })
})

describe('exportMatrixAsCSV — crash guards', () => {
  it('does nothing when the matrix is empty', () => {
    exportMatrixAsCSV('EMPTY001', {})
    expect(mockSaveAs).not.toHaveBeenCalled()
  })
})

// ── CSV formula-injection quoting ─────────────────────────────────────────────

describe('exportComparisonAsCSV — CSV quoting', () => {
  it('wraps an accession containing a comma in double quotes in the header', async () => {
    exportComparisonAsCSV(['A,B'], { 'A,B': { G: 0.5 } })
    const blob = mockSaveAs.mock.calls[0][0] as Blob
    const text = await blobText(blob)
    expect(text.split('\n')[0]).toContain('"A,B"')
  })

  it('wraps an accession starting with = in double quotes (formula injection guard)', async () => {
    exportComparisonAsCSV(['=CMD'], { '=CMD': { G: 1.0 } })
    const blob = mockSaveAs.mock.calls[0][0] as Blob
    const text = await blobText(blob)
    expect(text.split('\n')[0]).toContain('"=CMD"')
  })
})
