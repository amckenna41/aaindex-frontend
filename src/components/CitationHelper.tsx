import { useState } from 'react'
import { saveAs } from 'file-saver'
import { buildBibTeX, buildAPA, buildRIS, buildPlain, type CitationInput } from '../lib/citation'

const FORMATS = [
  { id: 'bibtex', label: 'BibTeX', build: buildBibTeX, ext: 'bib', mime: 'application/x-bibtex' },
  { id: 'ris', label: 'RIS', build: buildRIS, ext: 'ris', mime: 'application/x-research-info-systems' },
  { id: 'apa', label: 'APA', build: buildAPA, ext: 'txt', mime: 'text/plain' },
  { id: 'plain', label: 'Plain', build: buildPlain, ext: 'txt', mime: 'text/plain' },
] as const

export default function CitationHelper(props: CitationInput) {
  const [formatId, setFormatId] = useState<(typeof FORMATS)[number]['id']>('bibtex')
  const [copied, setCopied] = useState(false)

  const format = FORMATS.find((f) => f.id === formatId)!
  const text = format.build(props)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked — the text is still selectable.
    }
  }

  const download = () =>
    saveAs(new Blob([text + '\n'], { type: format.mime }), `${props.accession}_${format.id}.${format.ext}`)

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <h2 className="label">Cite this record</h2>
        <div className="flex items-baseline gap-4 text-sm">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormatId(f.id)}
              aria-pressed={formatId === f.id}
              className={`underline-offset-[6px] ${
                formatId === f.id
                  ? 'text-indigo-600 dark:text-indigo-400 underline'
                  : 'text-gray-500 dark:text-gray-400 hover:text-ink dark:hover:text-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <pre className="text-[13px] bg-gray-50 dark:bg-gray-900 rounded-sm p-4 whitespace-pre-wrap break-words font-mono leading-relaxed max-h-48 overflow-y-auto">
        {text}
      </pre>
      <div className="flex gap-6">
        <button onClick={copy} className="btn-text">{copied ? '✓ Copied' : 'Copy to clipboard'}</button>
        <button onClick={download} className="btn-text">↓ .{format.ext}</button>
      </div>
    </section>
  )
}
