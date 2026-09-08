// Generates public/sitemap.xml from the bundled databases at build time, so the
// 707 record pages are indexable and the list can't drift from the data.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.env.SITE_URL ?? 'https://aaindex.vercel.app'

const PAGES = [
  '/explorer', '/sequence', '/encode', '/compare', '/visualise',
  '/similarity', '/api-reference', '/guide', '/about',
]

const accessions = ['aaindex1', 'aaindex2', 'aaindex3'].flatMap((db) =>
  Object.keys(JSON.parse(readFileSync(join(root, 'src/data', `${db}.json`), 'utf8'))),
)

const today = new Date().toISOString().slice(0, 10)
const url = (loc, priority) =>
  `  <url><loc>${BASE}${loc}</loc><lastmod>${today}</lastmod><priority>${priority}</priority></url>`

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  url('/', '1.0'),
  ...PAGES.map((p) => url(p, '0.8')),
  ...accessions.map((acc) => url(`/records/${acc}`, '0.6')),
  '</urlset>',
].join('\n')

writeFileSync(join(root, 'public/sitemap.xml'), xml + '\n')
console.log(`sitemap.xml: ${accessions.length + PAGES.length + 1} urls`)
