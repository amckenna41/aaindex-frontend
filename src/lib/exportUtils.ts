import { saveAs } from 'file-saver'

export function exportValuesAsCSV(accession: string, values: Record<string, number>) {
  const header = 'amino_acid,value'
  const rows = Object.entries(values).map(([aa, v]) => `${aa},${v}`)
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
  const aas = Object.keys(records[accessions[0]])
  const header = ['amino_acid', ...accessions].join(',')
  const rows = aas.map((aa) => [aa, ...accessions.map((a) => records[a][aa] ?? '')].join(','))
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
  saveAs(blob, `comparison_${accessions.join('_')}.csv`)
}

export function exportMatrixAsCSV(accession: string, matrix: Record<string, Record<string, number>>) {
  const rows = Object.keys(matrix)
  const cols = Object.keys(matrix[rows[0]])
  const header = ['', ...cols].join(',')
  const lines = rows.map((r) => [r, ...cols.map((c) => matrix[r][c] ?? '')].join(','))
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' })
  saveAs(blob, `${accession}_matrix.csv`)
}
