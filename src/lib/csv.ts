/** Formats one CSV/TSV cell. Text that a spreadsheet would run as a formula
 *  (leading =, +, -, @, tab or CR) gets a ' prefix — quoting alone does not stop
 *  Excel evaluating it — and cells with the delimiter, quotes, newlines or those
 *  characters are quoted. Numbers pass through, so negatives stay numeric.
 *  Shared by the browser exporters and the API's ?format=csv|tsv responses. */
export function csvCell(v: string | number | null | undefined, delim = ','): string {
  if (v == null) return ''
  if (typeof v === 'number') return String(v)
  let s = String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  if (/[,"\n\r=+\-@|]/.test(s) || s.includes(delim)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** Builds a delimited table from uniform row objects. Column order follows the
 *  first row's keys. */
export function toTable(rows: Array<Record<string, unknown>>, delim = ','): string {
  if (!rows.length) return ''
  const cols = Object.keys(rows[0])
  const line = (cells: Array<unknown>) =>
    cells.map((c) => csvCell(c as string | number | null, delim)).join(delim)
  return [line(cols), ...rows.map((r) => line(cols.map((c) => r[c])))].join('\n')
}
