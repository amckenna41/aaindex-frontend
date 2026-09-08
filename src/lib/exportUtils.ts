import { saveAs } from 'file-saver'
import { csvCell } from './csv'
import type { EncodedResidue } from './seqUtils'

export function exportValuesAsCSV(accession: string, values: Record<string, number>) {
  const header = 'amino_acid,value'
  const rows = Object.entries(values).map(([aa, v]) => [csvCell(aa), csvCell(v)].join(','))
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
  saveAs(blob, `${accession}_values.csv`)
}

export function exportRecordAsJSON(accession: string, record: object) {
  const blob = new Blob([JSON.stringify({ [accession]: record }, null, 2)], {
    type: 'application/json',
  })
  saveAs(blob, `${accession}.json`)
}

export function exportComparisonAsCSV(
  accessions: string[],
  records: Record<string, Record<string, number>>
) {
  if (!accessions.length || !records[accessions[0]]) return
  const aas = Object.keys(records[accessions[0]])
  const header = ['amino_acid', ...accessions.map((a) => csvCell(a))].join(',')
  const rows = aas.map((aa) => [csvCell(aa), ...accessions.map((a) => csvCell(records[a][aa]))].join(','))
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
  saveAs(blob, `comparison_${accessions.join('_')}.csv`)
}

export function exportMatrixAsCSV(accession: string, matrix: Record<string, Record<string, number>>) {
  const rows = Object.keys(matrix)
  if (!rows.length) return
  const cols = Object.keys(matrix[rows[0]])
  const header = ['', ...cols.map((c) => csvCell(c))].join(',')
  const lines = rows.map((r) => [csvCell(r), ...cols.map((c) => csvCell(matrix[r][c]))].join(','))
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' })
  saveAs(blob, `${accession}_matrix.csv`)
}

export function exportEncodingAsCSV(accession: string, seq: string, encoded: EncodedResidue[]) {
  const header = 'position,amino_acid,value'
  const rows = encoded.map(({ pos, aa, value }) => [csvCell(pos), csvCell(aa), csvCell(value)].join(','))
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
  saveAs(blob, `${accession}_encoding_${seq.slice(0, 8)}.csv`)
}
