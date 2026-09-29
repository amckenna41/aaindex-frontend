/** Citation formats for an AAIndex record, built from its free-text reference.
 *  Most references follow "Authors 'Title' Journal Vol, pages (Year)"; books and
 *  chapters don't, and fall back to the raw text rather than a mangled parse. */

export interface CitationInput {
  accession: string
  references: string
  pmid: string
  description: string
}

export interface ParsedReference {
  authors: Array<{ last: string; initials: string }>
  title: string
  year: string
  /** Journal fields — absent for books, chapters and unparseable entries. */
  journal?: string
  volume?: string
  pages?: string
}

const ARTICLE = /^(.+?)\s+'([^']+)'\s+(.+?)\s+(\d+[A-Z]?),\s*([\w.?]+(?:-[\w.?]+)?),?\s*\((\d{4})\)/

/** "Cid, H., Bunster, M. and Gazitua, F." → [{Cid, H.}, {Bunster, M.}, {Gazitua, F.}] */
function parseAuthors(s: string) {
  const parts = s.replace(/,?\s+and\s+/g, ', ').replace(/,?\s*ed\.$/, '').split(/,\s*/).filter(Boolean)
  const out: ParsedReference['authors'] = []
  for (let i = 0; i + 1 < parts.length; i += 2) out.push({ last: parts[i], initials: parts[i + 1] })
  return out
}

export function parseReference(ref: string): ParsedReference | null {
  const s = ref.replace(/\s+/g, ' ').trim()
  const m = s.match(ARTICLE)
  if (m) {
    const [, authors, title, journal, volume, pages, year] = m
    return {
      authors: parseAuthors(authors),
      title,
      year,
      journal,
      volume,
      pages: pages.includes('?') ? undefined : pages,
    }
  }
  // Books and chapters: authors, the first non-empty quoted title, a year.
  const authors = s.match(/^(.+?)\s+'/)?.[1]
  const title = s.match(/'([^']*[^'\s][^']*)'/)?.[1] // skips the empty '' placeholder
  const year = s.match(/\((\d{4})\)/)?.[1] ?? s.match(/\b(1[89]\d\d|20\d\d)\b/)?.[1]
  if (!authors || !title || !year) return null
  return { authors: parseAuthors(authors), title, year }
}

export function extractYear(ref: string): string {
  return parseReference(ref)?.year ?? ref.match(/\((\d{4})\)/)?.[1] ?? 'n.d.'
}

const spacedInitials = (i: string) => i.replace(/\.(?=[A-Z])/g, '. ')
const enDash = (p: string) => p.replace('-', '–')

export function buildBibTeX({ accession, references, pmid, description }: CitationInput): string {
  const p = parseReference(references)
  const year = p?.year ?? extractYear(references)
  const key = p?.authors[0] ? `${p.authors[0].last.replace(/[^A-Za-z]/g, '')}${year}` : accession
  const fields: Array<[string, string | undefined]> = [
    ['author', p?.authors.map((a) => `${a.last}, ${a.initials}`).join(' and ')],
    ['title', p?.title ?? description],
    ['journal', p?.journal],
    ['volume', p?.volume],
    ['pages', p?.pages?.replace('-', '--')],
    ['year', year],
    ['pmid', pmid || undefined],
    ['note', `AAIndex accession: ${accession}`],
  ]
  const body = fields
    .filter((f): f is [string, string] => !!f[1])
    .map(([k, v]) => `  ${k.padEnd(7)} = {${v}}`)
    .join(',\n')
  return `@${p?.journal ? 'article' : 'misc'}{${key},\n${body}\n}`
}

/** APA 7th edition, as plain text (no italics). */
export function buildAPA({ references, pmid }: CitationInput): string {
  const p = parseReference(references)
  if (!p?.journal) return references.replace(/\s+/g, ' ').trim()
  const names = p.authors.map((a) => `${a.last}, ${spacedInitials(a.initials)}`)
  const authors = names.length <= 1 ? names.join('')
    : names.length === 2 ? `${names[0]}, & ${names[1]}`
    : `${names.slice(0, -1).join(', ')}, & ${names[names.length - 1]}`
  const title = p.title.replace(/\.$/, '')
  const pages = p.pages ? `, ${enDash(p.pages)}` : ''
  const link = pmid ? ` https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : ''
  return `${authors} (${p.year}). ${title}. ${p.journal}, ${p.volume}${pages}.${link}`
}

/** RIS, for import into Zotero, EndNote, Mendeley and friends. */
export function buildRIS({ accession, references, pmid, description }: CitationInput): string {
  const p = parseReference(references)
  const [sp, ep] = p?.pages?.split('-') ?? []
  const lines: Array<[string, string | undefined]> = [
    ['TY', p?.journal ? 'JOUR' : 'GEN'],
    ...(p?.authors ?? []).map((a): [string, string] => ['AU', `${a.last}, ${a.initials}`]),
    ['TI', p?.title ?? description],
    ['JO', p?.journal],
    ['VL', p?.volume],
    ['SP', sp],
    ['EP', ep],
    ['PY', p?.year ?? extractYear(references)],
    ['UR', pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : undefined],
    ['N1', `AAIndex accession: ${accession}`],
    ['N1', p?.journal ? undefined : references.replace(/\s+/g, ' ').trim()],
  ]
  return [
    ...lines.filter(([, v]) => v && v !== 'n.d.').map(([k, v]) => `${k}  - ${v}`),
    'ER  - ',
  ].join('\n')
}

export function buildPlain({ accession, references, pmid }: CitationInput): string {
  return `${references} [AAIndex: ${accession}${pmid ? `, PMID: ${pmid}` : ''}]`
}
