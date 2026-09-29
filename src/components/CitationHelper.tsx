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

  const btn = 'text-xs px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-semibold">Cite this record</h2>
        <div className="flex gap-1">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormatId(f.id)}
              aria-pressed={formatId === f.id}
              className={`text-xs px-2.5 py-1 rounded font-mono font-medium transition-colors ${
                formatId === f.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <pre className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 whitespace-pre-wrap break-words font-mono leading-relaxed max-h-48 overflow-y-auto">
        {text}
      </pre>
      <div className="mt-2 flex gap-2">
        <button onClick={copy} className={btn}>{copied ? '✓ Copied' : 'Copy to clipboard'}</button>
        <button onClick={download} className={btn}>↓ .{format.ext}</button>
      </div>
    </div>
  )
}
