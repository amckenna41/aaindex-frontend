import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveAs } from 'file-saver'
import { downloadAAIndex } from '../../src/lib/aaindexFormat'
import type { AAIndex1DB, AAIndex2DB } from '../../src/types'

vi.mock('file-saver', () => ({ saveAs: vi.fn() }))
const mockSaveAs = vi.mocked(saveAs)

beforeEach(() => mockSaveAs.mockClear())

async function captureText(): Promise<string> {
  const blob = mockSaveAs.mock.calls[0][0] as Blob
  return blob.text()
}

// ── Fixtures ───────────────────────────────────────────────────────────────────

const singleRecordDB: AAIndex1DB = {
  RECS000101: {
    description: 'Normalized frequency of alpha-helix',
    references: "Chou PY and Fasman GD 'Prediction of the secondary structure of proteins from their amino acid sequence.' Adv. Enzymol. 47:45-148(1978)",
    notes: 'LNR',
    pmid: '364941',
    category: 'secondary_structure',
    correlation_coefficients: { OTHE000101: 0.875, ANOT000102: -0.312 },
    values: {
      A: 1.45, R: 0.79, N: 0.73, D: 0.98, C: 0.77,
      Q: 1.17, E: 1.53, G: 0.53, H: 1.24, I: 1.00,
      L: 1.34, K: 1.07, M: 1.20, F: 1.12, P: 0.59,
      S: 0.79, T: 0.82, W: 1.14, Y: 0.61, V: 1.14,
    },
  },
}

const recordWithNAs: AAIndex1DB = {
  NATEST0101: {
    description: 'Record with some missing values',
    references: '', notes: '', pmid: '',
    category: 'test',
    correlation_coefficients: {},
    values: { A: 1.0, C: null as unknown as number, D: NaN },
  },
}

const integerValueDB: AAIndex1DB = {
  INTVAL0101: {
    description: 'Integer values',
    references: '', notes: '', pmid: '',
    category: 'test',
    correlation_coefficients: {},
    values: { A: 89, C: 121, D: 133, E: 147, F: 165, G: 75, H: 155, I: 131, K: 146, L: 131, M: 149, N: 132, P: 115, Q: 146, R: 174, S: 105, T: 119, W: 204, Y: 181, V: 117 },
  },
}

const matrixDB: AAIndex2DB = {
  BLOS000101: {
    description: 'BLOSUM62',
    references: '', notes: '', pmid: '',
    is_symmetric: true,
    col_order: ['A','C','D'],
    correlation_coefficients: {},
    matrix: {
      A: { A: 4 },
      C: { A: -1, C: 9 },
      D: { A: -2, C: -3, D: 6 },
    },
  },
}

// ── downloadAAIndex — AAIndex1 ─────────────────────────────────────────────────

describe('downloadAAIndex (aaindex1)', () => {
  it('calls saveAs exactly once', () => {
    downloadAAIndex(singleRecordDB, 'aaindex1')
    expect(mockSaveAs).toHaveBeenCalledTimes(1)
  })

  it('saves file named "aaindex1"', () => {
    downloadAAIndex(singleRecordDB, 'aaindex1')
    expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'aaindex1')
  })

  it('output contains the H (accession) line', async () => {
    downloadAAIndex(singleRecordDB, 'aaindex1')
    const text = await captureText()
    expect(text).toContain('H RECS000101')
  })

  it('output contains the D (description) line', async () => {
    downloadAAIndex(singleRecordDB, 'aaindex1')
    const text = await captureText()
    expect(text).toContain('D Normalized frequency of alpha-helix')
  })

  it('output contains the R (PMID) line when pmid is set', async () => {
    downloadAAIndex(singleRecordDB, 'aaindex1')
    const text = await captureText()
    expect(text).toContain('R PMID:364941')
  })

  it('output contains the I (index header) line', async () => {
    downloadAAIndex(singleRecordDB, 'aaindex1')
    const text = await captureText()
    expect(text).toContain('I    A/L     R/K')
  })

  it('output ends each record with //', async () => {
    downloadAAIndex(singleRecordDB, 'aaindex1')
    const text = await captureText()
    expect(text).toContain('//')
  })

  it('integer values are formatted with a trailing dot', async () => {
    downloadAAIndex(integerValueDB, 'aaindex1')
    const text = await captureText()
    // e.g. "89." should appear in the value rows
    expect(text).toMatch(/\b89\.\s/)
  })

  it('decimal values are formatted without unnecessary trailing zeros', async () => {
    downloadAAIndex(singleRecordDB, 'aaindex1')
    const text = await captureText()
    // 1.45 should appear, not 1.4500
    expect(text).toContain('1.45')
  })

  it('null/NA values are formatted as NA', async () => {
    downloadAAIndex(recordWithNAs, 'aaindex1')
    const text = await captureText()
    expect(text).toContain('NA')
  })

  it('correlation coefficients appear as C lines', async () => {
    downloadAAIndex(singleRecordDB, 'aaindex1')
    const text = await captureText()
    expect(text).toContain('C ')
    expect(text).toContain('OTHE000101')
  })

  it('notes appear with * prefix', async () => {
    downloadAAIndex(singleRecordDB, 'aaindex1')
    const text = await captureText()
    expect(text).toContain('* LNR')
  })

  it('multi-record DB produces multiple // separators', async () => {
    const multiDB: AAIndex1DB = {
      ...singleRecordDB,
      SECOND0101: {
        description: 'Second record',
        references: '', notes: '', pmid: '',
        category: 'test',
        correlation_coefficients: {},
        values: { A: 0.5, C: 0.3, D: 0.8, E: 0.9, F: 1.1, G: 0.2, H: 0.7, I: 1.3, K: 0.6, L: 1.2, M: 0.9, N: 0.4, P: 0.3, Q: 0.8, R: 0.5, S: 0.6, T: 0.7, W: 0.9, Y: 0.5, V: 1.0 },
      },
    }
    downloadAAIndex(multiDB, 'aaindex1')
    const text = await captureText()
    const separatorCount = (text.match(/\/\//g) ?? []).length
    expect(separatorCount).toBe(2)
  })
})

// ── downloadAAIndex — AAIndex2 ─────────────────────────────────────────────────

describe('downloadAAIndex (aaindex2)', () => {
  it('calls saveAs exactly once', () => {
    downloadAAIndex(matrixDB, 'aaindex2')
    expect(mockSaveAs).toHaveBeenCalledTimes(1)
  })

  it('saves file named "aaindex2"', () => {
    downloadAAIndex(matrixDB, 'aaindex2')
    expect(mockSaveAs).toHaveBeenCalledWith(expect.any(Blob), 'aaindex2')
  })

  it('output contains the H (accession) line', async () => {
    downloadAAIndex(matrixDB, 'aaindex2')
    const text = await captureText()
    expect(text).toContain('H BLOS000101')
  })

  it('output contains the M (matrix order) line', async () => {
    downloadAAIndex(matrixDB, 'aaindex2')
    const text = await captureText()
    expect(text).toContain('M rows = ACD, cols = ACD')
  })

  it('output contains matrix values', async () => {
    downloadAAIndex(matrixDB, 'aaindex2')
    const text = await captureText()
    expect(text).toContain('4.')   // A:A diagonal
    expect(text).toContain('9.')   // C:C diagonal
    expect(text).toContain('6.')   // D:D diagonal
  })

  it('ends with //', async () => {
    downloadAAIndex(matrixDB, 'aaindex2')
    const text = await captureText()
    expect(text).toContain('//')
  })
})
