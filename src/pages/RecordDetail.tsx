import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAAIndexStore } from '../store/useAAIndexStore'
import { exportValuesAsCSV, exportRecordAsJSON, exportMatrixAsCSV } from '../lib/exportUtils'
import AminoAcidBarChart from '../components/AminoAcidBarChart'
import MatrixHeatmap from '../components/MatrixHeatmap'
import ExportButton from '../components/ExportButton'
import SimilarRecords from '../components/SimilarRecords'
import CitationHelper from '../components/CitationHelper'
import PubMedAbstract from '../components/PubMedAbstract'
import { AAIndex1DB, AAIndex2DB, AAIndex3DB } from '../types'
import { categoryColour } from '../lib/categories'

import db1 from '../data/aaindex1.json'
import db2 from '../data/aaindex2.json'
import db3 from '../data/aaindex3.json'

const DB1 = db1 as unknown as AAIndex1DB
const DB2 = db2 as unknown as AAIndex2DB
const DB3 = db3 as unknown as AAIndex3DB

function copyIframeSnippet(accession: string) {
  const url = `${window.location.origin}/records/${accession}`
  const snippet = `<iframe src="${url}" width="800" height="600" frameborder="0" style="border:1px solid #e5e7eb;border-radius:12px"></iframe>`
  navigator.clipboard.writeText(snippet)
}

export default function RecordDetail() {
  const { accession } = useParams<{ accession: string }>()
  const navigate = useNavigate()
  const { addToCompare, removeFromCompare, selectedAccessions, favourites, toggleFavourite, normalise, setNormalise, browseList } = useAAIndexStore()

  const browseIdx = browseList.indexOf(accession ?? '')
  const prevAcc = browseIdx > 0 ? browseList[browseIdx - 1] : null
  const nextAcc = browseIdx >= 0 && browseIdx < browseList.length - 1 ? browseList[browseIdx + 1] : null
  const [embedCopied, setEmbedCopied] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft' && prevAcc) navigate(`/records/${prevAcc}`)
      if (e.key === 'ArrowRight' && nextAcc) navigate(`/records/${nextAcc}`)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prevAcc, nextAcc, navigate])

  if (!accession) return <p>No accession specified.</p>

  const rec1 = DB1[accession]
  const rec2 = DB2[accession] ?? DB3[accession]
  const dbName = rec1 ? 'aaindex1' : DB2[accession] ? 'aaindex2' : DB3[accession] ? 'aaindex3' : null

  if (!dbName) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-semibold mb-2">Record not found: {accession}</p>
        <Link to="/explorer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          ← Back to Explorer
        </Link>
      </div>
    )
  }

  const isSelected = selectedAccessions.includes(accession)
  const isFav = favourites.includes(accession)

  const handleEmbed = () => {
    copyIframeSnippet(accession)
    setEmbedCopied(true)
    setTimeout(() => setEmbedCopied(false), 2000)
  }

  if (rec1) {
    const corrEntries = Object.entries(rec1.correlation_coefficients ?? {})
    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <Link to="/explorer" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          ← Explorer
        </Link>

        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex items-start gap-3 flex-wrap mb-3">
            <span className="font-mono font-bold text-2xl text-indigo-600 dark:text-indigo-400">{accession}</span>
            {rec1.category && (
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${categoryColour(rec1.category)}`}>
                {rec1.category}
              </span>
            )}
            <button
              onClick={() => toggleFavourite(accession)}
              aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
              className={`text-xl leading-none transition-colors ${isFav ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300 dark:text-gray-600 dark:hover:text-yellow-400'}`}
            >
              ★
            </button>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-3">{rec1.description}</p>
          {rec1.pmid && (
            <a
              href={`https://pubmed.ncbi.nlm.nih.gov/${rec1.pmid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              PubMed: {rec1.pmid} ↗
            </a>
          )}
          {rec1.references && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{rec1.references}</p>
          )}
          {rec1.notes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{rec1.notes}</p>
          )}
        </div>

        {/* PubMed abstract */}
        {rec1.pmid && <PubMedAbstract pmid={rec1.pmid} />}

        {/* Bar chart */}
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-semibold">Amino Acid Values</h2>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={normalise}
                onChange={(e) => setNormalise(e.target.checked)}
                className="accent-indigo-600"
              />
              z-score normalise
            </label>
          </div>
          <AminoAcidBarChart values={rec1.values} accession={accession} height={300} normalise={normalise} />
        </div>

        {/* Similar records */}
        {Object.keys(rec1.correlation_coefficients ?? {}).length > 0 && (
          <SimilarRecords
            accession={accession}
            correlationCoefficients={rec1.correlation_coefficients}
            db={DB1}
          />
        )}

        {/* Correlation table */}
        {corrEntries.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-3">All Correlation Coefficients ({corrEntries.length})</h2>
            <div className="overflow-x-auto max-h-64">
              <table className="text-sm w-full">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">Accession</th>
                    <th className="text-right py-2 font-medium text-gray-600 dark:text-gray-400">r</th>
                  </tr>
                </thead>
                <tbody>
                  {corrEntries
                    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                    .map(([acc, coef]) => (
                    <tr key={acc} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <td className="py-2 pr-4">
                        <Link to={`/records/${acc}`} className="font-mono text-indigo-600 dark:text-indigo-400 hover:underline">
                          {acc}
                        </Link>
                      </td>
                      <td className={`py-2 text-right font-mono ${coef > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                        {coef > 0 ? '+' : ''}{coef.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Citation */}
        {rec1.references && (
          <CitationHelper
            accession={accession}
            references={rec1.references}
            pmid={rec1.pmid ?? ''}
            description={rec1.description}
          />
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              if (isSelected) removeFromCompare(accession)
              else { addToCompare(accession); navigate('/compare') }
            }}
            className={`text-sm px-4 py-2 rounded font-medium transition-colors ${
              isSelected
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isSelected ? '✓ Added to Compare' : '+ Add to Compare'}
          </button>
          <ExportButton onClick={() => exportValuesAsCSV(accession, rec1.values)} label="Export values CSV" />
          <ExportButton onClick={() => exportRecordAsJSON(accession, rec1)} label="Export record JSON" />
          <button
            onClick={handleEmbed}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {embedCopied ? '✓ Embed snippet copied' : '</> Get embed code'}
          </button>
        </div>

        {/* Browse navigation */}
        {browseList.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={() => prevAcc && navigate(`/records/${prevAcc}`)}
              disabled={!prevAcc}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← {prevAcc ? <span className="font-mono">{prevAcc}</span> : 'Previous'}
            </button>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {browseIdx + 1} / {browseList.length}
            </span>
            <button
              onClick={() => nextAcc && navigate(`/records/${nextAcc}`)}
              disabled={!nextAcc}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {nextAcc ? <span className="font-mono">{nextAcc}</span> : 'Next'} →
            </button>
          </div>
        )}
      </div>
    )
  }

  // Matrix record (aaindex2 / aaindex3)
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <Link to="/explorer" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
        ← Explorer
      </Link>

      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-start gap-3 flex-wrap mb-3">
          <span className="font-mono font-bold text-2xl text-indigo-600 dark:text-indigo-400">{accession}</span>
          <span className="text-sm px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {dbName.toUpperCase()}
          </span>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-3">{rec2.description}</p>
        {rec2.pmid && (
          <a
            href={`https://pubmed.ncbi.nlm.nih.gov/${rec2.pmid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            PubMed: {rec2.pmid} ↗
          </a>
        )}
        {rec2.references && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{rec2.references}</p>
        )}
      </div>

      {rec2.pmid && <PubMedAbstract pmid={rec2.pmid} />}

      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Substitution Matrix</h2>
          <ExportButton onClick={() => exportMatrixAsCSV(accession, rec2.matrix)} label="Export matrix CSV" />
        </div>
        <MatrixHeatmap matrix={rec2.matrix} />
      </div>

      <details className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <summary className="cursor-pointer font-medium text-sm">Raw matrix table</summary>
        <div className="overflow-x-auto mt-4">
          <table className="text-xs font-mono">
            <thead>
              <tr>
                <th className="pr-2"></th>
                {rec2.col_order.map((c) => (
                  <th key={c} className="px-1 text-center text-gray-500">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(rec2.matrix).map(([row, cols]) => (
                <tr key={row}>
                  <td className="pr-2 font-semibold text-gray-500">{row}</td>
                  {rec2.col_order.map((c) => (
                    <td key={c} className="px-1 text-center">{cols[c] ?? ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {rec2.references && (
        <CitationHelper
          accession={accession}
          references={rec2.references}
          pmid={rec2.pmid ?? ''}
          description={rec2.description}
        />
      )}

      <div className="flex gap-3">
        <ExportButton onClick={() => exportRecordAsJSON(accession, rec2)} label="Export record JSON" />
      </div>

      {/* Browse navigation */}
      {browseList.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            onClick={() => prevAcc && navigate(`/records/${prevAcc}`)}
            disabled={!prevAcc}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← {prevAcc ? <span className="font-mono">{prevAcc}</span> : 'Previous'}
          </button>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {browseIdx + 1} / {browseList.length}
          </span>
          <button
            onClick={() => nextAcc && navigate(`/records/${nextAcc}`)}
            disabled={!nextAcc}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {nextAcc ? <span className="font-mono">{nextAcc}</span> : 'Next'} →
          </button>
        </div>
      )}
    </div>
  )
}
