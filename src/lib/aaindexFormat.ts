import { saveAs } from 'file-saver'
import { AAIndex1DB, AAIndex2DB, AAIndex3DB } from '../types'

// AAIndex1 canonical value row ordering
const ROW1 = ['A','R','N','D','C','Q','E','G','H','I'] as const
const ROW2 = ['L','K','M','F','P','S','T','W','Y','V'] as const

function fmtNum(v: number): string {
  if (Number.isInteger(v)) return v.toFixed(0) + '.'
  for (let dp = 1; dp <= 4; dp++) {
    if (Math.abs(parseFloat(v.toFixed(dp)) - v) < 1e-9) return v.toFixed(dp)
  }
  return v.toFixed(4)
}

function fmtField(v: number | null | undefined, width = 8): string {
  if (v == null || !isFinite(v as number)) return 'NA'.padStart(width)
  return fmtNum(v as number).padStart(width)
}

// Split "Author 'Title' Journal" references string into A/T/J parts
function parseRef(ref: string): { author: string; title: string; journal: string } {
  const m = ref.match(/^(.*?)'(.*)'(.*)$/)
  if (!m) return { author: ref.trim(), title: '', journal: '' }
  return { author: m[1].trim(), title: m[2].trim(), journal: m[3].trim() }
}

function wrapLine(prefix: string, text: string, maxWidth = 80): string {
  if (!text) return ''
  if (prefix.length + text.length <= maxWidth) return prefix + text
  const words = text.split(' ')
  const lines: string[] = []
  let line = prefix
  for (const word of words) {
    const sep = line === prefix ? '' : ' '
    if (line.length + sep.length + word.length <= maxWidth) {
      line += sep + word
    } else {
      lines.push(line)
      line = '  ' + word
    }
  }
  if (line) lines.push(line)
  return lines.join('\n')
}

function fmtCorr(corrs: Record<string, number>): string {
  const entries = Object.entries(corrs).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
  if (!entries.length) return ''
  const lines: string[] = []
  for (let i = 0; i < entries.length; i += 3) {
    const prefix = i === 0 ? 'C ' : '  '
    const items = entries.slice(i, i + 3).map(([acc, r]) => acc.padEnd(10) + r.toFixed(3).padStart(9))
    lines.push(prefix + items.join('  '))
  }
  return lines.join('\n')
}

function serializeAAIndex1(db: AAIndex1DB): string {
  return Object.entries(db).map(([accession, rec]) => {
    const lines: string[] = []
    lines.push('H ' + accession)
    lines.push('D ' + rec.description)
    if (rec.pmid) lines.push('R PMID:' + rec.pmid)

    const { author, title, journal } = parseRef(rec.references ?? '')
    if (author) lines.push(wrapLine('A ', author))
    if (title)  lines.push(wrapLine('T ', title))
    if (journal) lines.push(wrapLine('J ', journal))
    if (rec.notes) lines.push('* ' + rec.notes)

    const corrStr = fmtCorr(rec.correlation_coefficients ?? {})
    if (corrStr) lines.push(corrStr)

    lines.push('I    A/L     R/K     N/M     D/F     C/P     Q/S     E/T     G/W     H/Y     I/V')
    lines.push('  ' + ROW1.map(aa => fmtField(rec.values?.[aa])).join(''))
    lines.push('  ' + ROW2.map(aa => fmtField(rec.values?.[aa])).join(''))
    lines.push('//')
    return lines.join('\n')
  }).join('\n') + '\n'
}

function serializeMatrix(db: AAIndex2DB | AAIndex3DB): string {
  return Object.entries(db).map(([accession, rec]) => {
    const lines: string[] = []
    lines.push('H ' + accession)
    lines.push('D ' + rec.description)
    if (rec.pmid) lines.push('R PMID:' + rec.pmid)

    const { author, title, journal } = parseRef(rec.references ?? '')
    if (author) lines.push(wrapLine('A ', author))
    if (title)  lines.push(wrapLine('T ', title))
    if (journal) lines.push(wrapLine('J ', journal))
    if (rec.notes) lines.push('* ' + rec.notes)

    const order = rec.col_order
    lines.push('M rows = ' + order.join('') + ', cols = ' + order.join(''))

    for (let i = 0; i < order.length; i++) {
      const row = order[i]
      lines.push(order.slice(0, i + 1).map(col => fmtField(rec.matrix?.[row]?.[col])).join(''))
    }

    lines.push('//')
    return lines.join('\n')
  }).join('\n') + '\n'
}

export function downloadAAIndex(db: AAIndex1DB | AAIndex2DB | AAIndex3DB, name: 'aaindex1' | 'aaindex2' | 'aaindex3') {
  const content = name === 'aaindex1'
    ? serializeAAIndex1(db as AAIndex1DB)
    : serializeMatrix(db as AAIndex2DB)
  saveAs(new Blob([content], { type: 'text/plain;charset=utf-8' }), name)
}
