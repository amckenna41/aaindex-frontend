import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders } from '../_helpers.js'

interface PubMedData {
  title: string
  abstract: string
  authors: string
  journal: string
  year: string
}

// In-memory cache — lives for the lifetime of the serverless instance.
const cache = new Map<string, PubMedData>()

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
}

function extractFirst(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return m ? decodeEntities(m[1].replace(/<[^>]*>/g, '').trim()) : ''
}

function parseAbstract(xml: string): string {
  const parts: string[] = []
  const re = /<AbstractText([^>]*)>([\s\S]*?)<\/AbstractText>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const labelMatch = m[1].match(/Label="([^"]*)"/i)
    const label = labelMatch ? `${labelMatch[1]}:\n` : ''
    const text = decodeEntities(m[2].replace(/<[^>]*>/g, '').trim())
    if (text) parts.push(`${label}${text}`)
  }
  return parts.join('\n\n')
}

function parseAuthors(xml: string): string {
  const names: string[] = []
  const re = /<Author[^>]*>([\s\S]*?)<\/Author>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const last = extractFirst(m[1], 'LastName')
    const initials = extractFirst(m[1], 'Initials')
    if (last) names.push(initials ? `${last} ${initials}` : last)
  }
  if (!names.length) return ''
  return names.length > 6
    ? `${names.slice(0, 6).join(', ')} et al.`
    : names.join(', ')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })

  const { pmid } = req.query
  if (typeof pmid !== 'string' || !/^\d+$/.test(pmid)) {
    return res.status(400).json({ error: 'pmid must be a numeric string' })
  }

  if (cache.has(pmid)) {
    res.setHeader('X-Cache', 'HIT')
    return res.status(200).json({ pmid, ...cache.get(pmid) })
  }

  try {
    const apiKey = process.env.NCBI_API_KEY ? `&api_key=${process.env.NCBI_API_KEY}` : ''
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&rettype=abstract&retmode=xml${apiKey}`

    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'AAIndex-Explorer/1.0 (https://aaindex.vercel.app; contact: aaindex@research.dev)',
      },
    })

    if (!upstream.ok) {
      return res.status(502).json({ error: `NCBI returned ${upstream.status}` })
    }

    const xml = await upstream.text()

    // Surface a clear error if NCBI returns an error document instead of article XML
    if (xml.includes('<ERROR>') || !xml.includes('<PubmedArticle')) {
      return res.status(404).json({ error: `No PubMed record found for PMID ${pmid}` })
    }

    const title    = extractFirst(xml, 'ArticleTitle')
    const abstract = parseAbstract(xml) || 'Abstract not available for this record.'
    const authors  = parseAuthors(xml)
    const journal  = extractFirst(xml, 'ISOAbbreviation') || extractFirst(xml, 'Title')
    const year     = extractFirst(xml, 'Year')

    const data: PubMedData = { title, abstract, authors, journal, year }

    if (cache.size >= 500) cache.delete(cache.keys().next().value as string)
    cache.set(pmid, data)

    res.setHeader('X-Cache', 'MISS')
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
    return res.status(200).json({ pmid, ...data })
  } catch (e) {
    return res.status(502).json({ error: `Failed to reach NCBI: ${String(e)}` })
  }
}

