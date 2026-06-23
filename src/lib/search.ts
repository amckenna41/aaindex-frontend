import Fuse from 'fuse.js'
import { AAIndex1DB, AAIndex2DB, AAIndex3DB } from '../types'

type SearchItem = { accession: string; description: string; category?: string }

export function buildSearchIndex(db: AAIndex1DB | AAIndex2DB | AAIndex3DB): Fuse<SearchItem> {
  const items: SearchItem[] = Object.entries(db).map(([accession, rec]) => ({
    accession,
    description: rec.description,
    category: (rec as AAIndex1DB[string]).category ?? '',
  }))
  return new Fuse(items, {
    keys: ['accession', 'description', 'category'],
    threshold: 0.35,
    includeScore: true,
  })
}
