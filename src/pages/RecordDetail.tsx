import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, type ReactNode } from 'react'
import { useAAIndexStore } from '../store/useAAIndexStore'
import { exportValuesAsCSV, exportRecordAsJSON, exportMatrixAsCSV } from '../lib/exportUtils'
import AminoAcidBarChart from '../components/AminoAcidBarChart'
import MatrixHeatmap from '../components/MatrixHeatmap'
import ExportButton from '../components/ExportButton'
import SimilarRecords from '../components/SimilarRecords'
import CitationHelper from '../components/CitationHelper'
import PubMedAbstract from '../components/PubMedAbstract'
import { AAIndex1DB, AAIndex1Record, AAIndex2Record, DBName } from '../types'

// Loaded on demand, one database at a time. Importing all three statically here
// pulled every byte of source JSON into the entry chunk and made the Explorer's
// dynamic imports pointless.
const LOADERS: Record<DBName, () => Promise<{ default: unknown }>> = {
  aaindex1: () => import('../data/aaindex1.json'),
  aaindex2: () => import('../data/aaindex2.json'),
  aaindex3: () => import('../data/aaindex3.json'),
}

const DB_ORDER: DBName[] = ['aaindex1', 'aaindex2', 'aaindex3']
const cache: Partial<Record<DBName, Record<string, unknown>>> = {}

async function loadDB(name: DBName): Promise<Record<string, unknown>> {
  if (!cache[name]) cache[name] = (await LOADERS[name]()).default as Record<string, unknown>
  return cache[name]!
}

interface Located {
  dbName: DBName
  record: AAIndex1Record | AAIndex2Record
  db1: AAIndex1DB | null
}

/** Walks the databases in order, loading each only until the accession is found.
 *  Object.hasOwn, not truthiness — `constructor` and friends are inherited from
 *  Object.prototype and would otherwise sail past the not-found guard. */
async function locate(accession: string): Promise<Located | null> {
  for (const dbName of DB_ORDER) {
    const db = await loadDB(dbName)
    if (Object.hasOwn(db, accession)) {
      return {
        dbName,
        record: db[accession] as AAIndex1Record | AAIndex2Record,
        db1: dbName === 'aaindex1' ? (db as unknown as AAIndex1DB) : null,
      }
    }
  }
  return null
}

function copyIframeSnippet(accession: string) {
  const url = `${window.location.origin}/records/${accession}`
  const snippet = `<iframe src="${url}" width="800" height="600" frameborder="0" style="border:1px solid #E3E3E1;border-radius:12px"></iframe>`
  navigator.clipboard.writeText(snippet)
}

export default function RecordDetail() {
  const { accession } = useParams<{ accession: string }>()
  const navigate = useNavigate()
  const { addToCompare, removeFromCompare, selectedAccessions, favourites, toggleFavourite, normalise, setNormalise, browseList } = useAAIndexStore()

  const [located, setLocated] = useState<Located | null | undefined>(undefined)

  useEffect(() => {
    if (!accession) return
    let cancelled = false
    setLocated(undefined)
    locate(accession).then((r) => { if (!cancelled) setLocated(r) })
    return () => { cancelled = true }
  }, [accession])

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

  if (located === undefined) {
    return <p className="text-gray-400 dark:text-gray-500 py-24 text-center">Loading record…</p>
  }

  const dbName = located?.dbName ?? null
  const rec1 = located?.dbName === 'aaindex1' ? (located.record as AAIndex1Record) : null
  const rec2 = located && located.dbName !== 'aaindex1' ? (located.record as AAIndex2Record) : null

  if (!dbName || !located) {
    return (
      <div className="text-center py-24 flex flex-col gap-4 items-center">
        <p className="text-gray-400 dark:text-gray-500">Record not found: {accession}</p>
        <Link to="/explorer" className="btn-text">
          ← Back to Explorer
        </Link>
      </div>
    )
  }

  const isSelected = selectedAccessions.includes(accession)
  const isFav = favourites.includes(accession)
  const record = (rec1 ?? rec2)!

  const handleEmbed = () => {
    copyIframeSnippet(accession)
    setEmbedCopied(true)
    setTimeout(() => setEmbedCopied(false), 2000)
  }

  const header = (
    <header className="flex flex-col gap-10">
      <Link to="/explorer" className="btn-text self-start">← Explorer</Link>
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline gap-4">
          <p className="font-mono text-sm text-gray-500 dark:text-gray-400">{accession}</p>
          {rec1 && (
            <button
              onClick={() => toggleFavourite(accession)}
              aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
              className={isFav ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400'}
            >
              {isFav ? '★' : '☆'}
            </button>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight leading-tight">{record.description}</h1>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-x-8 gap-y-3 border-t border-gray-200 dark:border-gray-800 pt-6">
        <Meta label="Accession"><span className="font-mono">{accession}</span></Meta>
        <Meta label="Database"><span className="font-mono">{dbName}</span></Meta>
        {rec1?.category && <Meta label="Category">{rec1.category}</Meta>}
        {record.pmid && (
          <Meta label="PubMed">
            <a
              href={`https://pubmed.ncbi.nlm.nih.gov/${record.pmid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono underline underline-offset-4 decoration-gray-300 dark:decoration-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              PubMed: {record.pmid} ↗
            </a>
          </Meta>
        )}
        {record.references && <Meta label="Reference">{record.references}</Meta>}
        {rec1?.notes && <Meta label="Notes">{rec1.notes}</Meta>}
      </dl>
    </header>
  )

  const browseNav = browseList.length > 0 && (
    <nav aria-label="Browse records" className="flex items-baseline justify-between border-t border-gray-200 dark:border-gray-800 pt-6 text-sm">
      <button
        onClick={() => prevAcc && navigate(`/records/${prevAcc}`)}
        disabled={!prevAcc}
        className="btn-text disabled:cursor-not-allowed"
      >
        ← {prevAcc ? <span className="font-mono">{prevAcc}</span> : 'Previous'}
      </button>
      <span className="text-gray-400 dark:text-gray-500 tabular-nums">
        {browseIdx + 1} / {browseList.length}
      </span>
      <button
        onClick={() => nextAcc && navigate(`/records/${nextAcc}`)}
        disabled={!nextAcc}
        className="btn-text disabled:cursor-not-allowed"
      >
        {nextAcc ? <span className="font-mono">{nextAcc}</span> : 'Next'} →
      </button>
    </nav>
  )

  if (rec1) {
    const corrEntries = Object.entries(rec1.correlation_coefficients ?? {})
    return (
      <article className="flex flex-col gap-16">
        {header}

        {/* Actions */}
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <button
            onClick={() => {
              if (isSelected) removeFromCompare(accession)
              else { addToCompare(accession); navigate('/compare') }
            }}
            className={isSelected ? 'text-sm underline underline-offset-4 decoration-gray-300 dark:decoration-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 underline-offset-4' : 'btn-primary'}
          >
            {isSelected ? '✓ Added to Compare' : '+ Add to Compare'}
          </button>
          <ExportButton onClick={() => exportValuesAsCSV(accession, rec1.values)} label="Export values CSV" />
          <ExportButton onClick={() => exportRecordAsJSON(accession, rec1)} label="Export record JSON" />
          <button onClick={handleEmbed} className="btn-text">
            {embedCopied ? '✓ Embed snippet copied' : '</> Get embed code'}
          </button>
        </div>

        {/* Citation */}
        {rec1.references && (
          <CitationHelper
            accession={accession}
            references={rec1.references}
            pmid={rec1.pmid ?? ''}
            description={rec1.description}
          />
        )}

        {/* PubMed abstract */}
        {rec1.pmid && <PubMedAbstract pmid={rec1.pmid} />}

        {/* Bar chart */}
        <section className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between flex-wrap gap-3">
            <h2 className="label">Amino Acid Values</h2>
            <label className="flex items-baseline gap-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={normalise}
                onChange={(e) => setNormalise(e.target.checked)}
              />
              z-score normalise
            </label>
          </div>
          <AminoAcidBarChart values={rec1.values} accession={accession} height={300} normalise={normalise} />
        </section>

        {/* Correlation table */}
        {corrEntries.length > 0 && (
          <section className="flex flex-col gap-6">
            <h2 className="label">All Correlation Coefficients ({corrEntries.length})</h2>
            <div className="overflow-x-auto max-h-80">
              <table className="text-sm w-full">
                <thead className="sticky top-0 bg-paper dark:bg-gray-950">
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-2 pr-4 font-normal text-gray-400 dark:text-gray-500">Accession</th>
                    <th className="text-right py-2 font-normal text-gray-400 dark:text-gray-500">r</th>
                  </tr>
                </thead>
                <tbody>
                  {corrEntries
                    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                    .map(([acc, coef]) => (
                    <tr key={acc} className="border-b border-gray-200 dark:border-gray-800">
                      <td className="py-2 pr-4">
                        <Link to={`/records/${acc}`} className="font-mono hover:text-indigo-600 dark:hover:text-indigo-400">
                          {acc}
                        </Link>
                      </td>
                      <td className={`py-2 text-right font-mono ${coef > 0 ? '' : 'text-gray-500 dark:text-gray-400'}`}>
                        {coef > 0 ? '+' : ''}{coef.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Similar records */}
        {Object.keys(rec1.correlation_coefficients ?? {}).length > 0 && (
          <SimilarRecords
            accession={accession}
            correlationCoefficients={rec1.correlation_coefficients}
            db={located.db1 ?? {}}
          />
        )}

        {browseNav}
      </article>
    )
  }

  // Matrix record (aaindex2 / aaindex3)
  if (!rec2) return null

  return (
    <article className="flex flex-col gap-16">
      {header}

      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <ExportButton onClick={() => exportRecordAsJSON(accession, rec2)} label="Export record JSON" />
      </div>

      {rec2.references && (
        <CitationHelper
          accession={accession}
          references={rec2.references}
          pmid={rec2.pmid ?? ''}
          description={rec2.description}
        />
      )}

      {rec2.pmid && <PubMedAbstract pmid={rec2.pmid} />}

      <section className="flex flex-col gap-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="label">Substitution Matrix</h2>
          <ExportButton onClick={() => exportMatrixAsCSV(accession, rec2.matrix)} label="Export matrix CSV" />
        </div>
        <MatrixHeatmap matrix={rec2.matrix} />
      </section>

      <details className="flex flex-col gap-4">
        <summary className="label cursor-pointer hover:text-ink dark:hover:text-gray-100">Raw matrix table</summary>
        <div className="overflow-x-auto mt-6">
          <table className="text-xs font-mono">
            <thead>
              <tr>
                <th className="pr-2"></th>
                {rec2.col_order.map((c) => (
                  <th key={c} className="px-1 text-center font-normal text-gray-400">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(rec2.matrix).map(([row, cols]) => (
                <tr key={row}>
                  <td className="pr-2 text-gray-400">{row}</td>
                  {rec2.col_order.map((c) => (
                    <td key={c} className="px-1 text-center">{cols[c] ?? ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {browseNav}
    </article>
  )
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-sm text-gray-400 dark:text-gray-500 lowercase [font-variant-caps:small-caps] tracking-wide">{label}</dt>
      <dd className="text-gray-700 dark:text-gray-300 mb-3 sm:mb-0">{children}</dd>
    </>
  )
}
