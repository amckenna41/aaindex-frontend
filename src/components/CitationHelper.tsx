import { useState } from 'react'

interface Props {
  accession: string
  references: string
  pmid: string
  description: string
}

function extractYear(ref: string): string {
  const m = ref.match(/\((\d{4})\)/)
  return m ? m[1] : 'n.d.'
}

function buildBibTeX(accession: string, references: string, pmid: string, description: string): string {
  const year = extractYear(references)
  // Extract first author last name
  const firstAuthorMatch = references.match(/^([A-Z][a-z]+)/)
  const key = firstAuthorMatch ? `${firstAuthorMatch[1]}${year}` : accession
  return `@article{${key},
  title   = {${description}},
  note    = {AAIndex accession: ${accession}},
  year    = {${year}},
  pmid    = {${pmid}},
  annote  = {${references}}
}`
}

function buildAPA(references: string, pmid: string): string {
  // The references field is already close to APA format
  const base = references.replace(/\s+/g, ' ').trim()
  return pmid ? `${base} PMID: ${pmid}` : base
}

function buildPlain(accession: string, references: string, pmid: string): string {
  return `${references} [AAIndex: ${accession}${pmid ? `, PMID: ${pmid}` : ''}]`
}

export default function CitationHelper({ accession, references, pmid, description }: Props) {
  const [format, setFormat] = useState<'bibtex' | 'apa' | 'plain'>('bibtex')
  const [copied, setCopied] = useState(false)

  const citations = {
    bibtex: buildBibTeX(accession, references, pmid, description),
    apa: buildAPA(references, pmid),
    plain: buildPlain(accession, references, pmid),
  }

  const text = citations[format]

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-semibold">Cite this record</h2>
        <div className="flex gap-1">
          {(['bibtex', 'apa', 'plain'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`text-xs px-2.5 py-1 rounded font-mono font-medium transition-colors ${
                format === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {f === 'bibtex' ? 'BibTeX' : f === 'apa' ? 'APA' : 'Plain'}
            </button>
          ))}
        </div>
      </div>
      <pre className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 whitespace-pre-wrap break-all font-mono leading-relaxed max-h-40 overflow-y-auto">
        {text}
      </pre>
      <button
        onClick={copy}
        className="mt-2 text-xs px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        {copied ? '✓ Copied' : 'Copy to clipboard'}
      </button>
    </div>
  )
}
