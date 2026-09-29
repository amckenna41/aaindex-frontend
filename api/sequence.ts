import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders, setCacheHeaders, methodNotAllowed, USER_AGENT } from './_helpers.js'

type Source = 'uniprot' | 'pdb'

interface Entry { id: string; description: string; sequence: string; length: number }

// Conservative — the id is interpolated into an upstream URL, so nothing that
// could escape the path is allowed through.
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]{2,19}$/
const PDB_RE = /^[0-9][A-Za-z0-9]{3}(_[A-Za-z0-9]{1,4})?$/

function parseFasta(text: string, source: Source): Entry[] {
  const entries: Entry[] = []
  let cur: { header: string; parts: string[] } | null = null
  const flush = () => {
    if (!cur) return
    const sequence = cur.parts.join('').toUpperCase()
    if (!sequence) return
    // RCSB headers are pipe-delimited ("1CRN_1|Chains A, B[auth C]|CRAMBIN|..."),
    // UniProt's are "sp|P01308|INS_HUMAN Insulin OS=..." with the id up to the first space.
    const [id, ...rest] = source === 'pdb' ? cur.header.split('|') : cur.header.split(/\s+/)
    entries.push({ id, description: rest.join(source === 'pdb' ? '|' : ' '), sequence, length: sequence.length })
  }
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('>')) { flush(); cur = { header: line.slice(1), parts: [] } }
    else if (cur && line) cur.parts.push(line.replace(/\s/g, ''))
  }
  flush()
  return entries
}

/** Chain ids an RCSB entity covers, from the field before the first "|" of its
 *  description ("Chains A, B[auth C]"). Both the label id (B) and the author id
 *  (C) are returned — users quote either. */
export function pdbChains(description: string): string[] {
  const field = description.split('|')[0].replace(/^Chains?\s+/i, '')
  return field.split(',').flatMap((item) => {
    const m = item.trim().match(/^([A-Za-z0-9]+)(?:\[auth ([A-Za-z0-9]+)\])?$/)
    return m ? [m[1], m[2]].filter(Boolean).map((c) => c.toUpperCase()) : []
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return methodNotAllowed(res)

  const { id, db } = req.query

  if (typeof id !== 'string' || !ID_RE.test(id)) {
    return res.status(400).json({
      error: '`id` must be a UniProt accession or PDB id (3-20 alphanumeric characters, . _ -)',
    })
  }
  if (db !== undefined && db !== 'uniprot' && db !== 'pdb' && db !== 'auto') {
    return res.status(400).json({ error: '`db` must be one of: uniprot, pdb, auto' })
  }

  const source: Source =
    db === 'pdb' ? 'pdb'
    : db === 'uniprot' ? 'uniprot'
    : PDB_RE.test(id) ? 'pdb' : 'uniprot'

  // PDB ids may carry a chain suffix (1CRN_A); the entry endpoint takes the id alone.
  const entryId = source === 'pdb' ? id.split('_')[0].toUpperCase() : id.toUpperCase()
  const chain = source === 'pdb' && id.includes('_') ? id.split('_')[1].toUpperCase() : null

  const url = source === 'pdb'
    ? `https://www.rcsb.org/fasta/entry/${encodeURIComponent(entryId)}`
    : `https://rest.uniprot.org/uniprotkb/${encodeURIComponent(entryId)}.fasta`

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (upstream.status === 404 || upstream.status === 400) {
      return res.status(404).json({ error: `No ${source} record found for '${entryId}'` })
    }
    if (!upstream.ok) {
      console.error(`sequence/${entryId}: ${source} returned ${upstream.status}`)
      return res.status(502).json({ error: `Failed to reach ${source}` })
    }

    let entries = parseFasta(await upstream.text(), source)
    if (!entries.length) {
      return res.status(404).json({ error: `No sequence found for '${entryId}'` })
    }

    if (chain) {
      const matched = entries.filter((e) => pdbChains(e.description).includes(chain))
      if (!matched.length) {
        return res.status(404).json({ error: `Chain '${chain}' not found in ${entryId}` })
      }
      entries = matched
    }

    setCacheHeaders(res)
    return res.status(200).json({ id: entryId, source, chain, count: entries.length, entries })
  } catch (e) {
    console.error(`sequence/${entryId}: upstream fetch failed`, e)
    return res.status(502).json({ error: `Failed to reach ${source}` })
  }
}
