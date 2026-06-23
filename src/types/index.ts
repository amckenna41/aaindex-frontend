export interface AAIndex1Record {
  description: string
  references: string
  notes: string
  pmid: string
  category: string
  correlation_coefficients: Record<string, number>
  values: Record<string, number>
}

export type AAIndex1DB = Record<string, AAIndex1Record>

export interface AAIndex2Record {
  description: string
  references: string
  notes: string
  pmid: string
  is_symmetric: boolean
  col_order: string[]
  correlation_coefficients: Record<string, number>
  matrix: Record<string, Record<string, number>>
}

export type AAIndex2DB = Record<string, AAIndex2Record>

export type AAIndex3Record = AAIndex2Record
export type AAIndex3DB = Record<string, AAIndex3Record>

export type DBName = 'aaindex1' | 'aaindex2' | 'aaindex3'
