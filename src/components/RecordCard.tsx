import { useNavigate } from 'react-router-dom'
import { AAIndex1Record, AAIndex2Record, DBName } from '../types'
import { useAAIndexStore, MAX_COMPARE } from '../store/useAAIndexStore'
import { AA_ORDER_ALPHA, coverage } from '../lib/aminoAcids'

interface Props {
  accession: string
  record: AAIndex1Record | AAIndex2Record
  dbName: DBName
}

/** One row of the Explorer's ruled list: accession, description, category. */
export default function RecordCard({ accession, record, dbName }: Props) {
  const navigate = useNavigate()
  const { selectedAccessions, addToCompare, removeFromCompare, favourites, toggleFavourite } = useAAIndexStore()
  const isSelected = selectedAccessions.includes(accession)
  const isFull = selectedAccessions.length >= MAX_COMPARE && !isSelected
  const isFav = favourites.includes(accession)
  const is1 = dbName === 'aaindex1'
  const r1 = record as AAIndex1Record
  const category = is1 ? r1.category : null
  const covered = is1 ? coverage(r1.values) : AA_ORDER_ALPHA.length

  // Actions sit quietly at 40% until the row is hovered or focused; a set
  // state (favourited / added) stays visible.
  const quiet = 'opacity-40 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100'

  return (
    <div
      className="group grid grid-cols-1 sm:grid-cols-[9rem_1fr_auto] gap-x-8 gap-y-1 py-5 border-b border-gray-200 dark:border-gray-800 cursor-pointer"
      onClick={() => navigate(`/records/${accession}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/records/${accession}`)}
    >
      <span className="font-mono text-sm text-ink dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 pt-0.5">
        {accession}
      </span>

      <div className="min-w-0">
        <p className="line-clamp-2">{record.description}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          {category ?? 'Matrix record'}
          {covered < AA_ORDER_ALPHA.length && (
            <span
              title={`Only ${covered} of ${AA_ORDER_ALPHA.length} amino acids have a value in this index`}
              aria-label={`Incomplete: ${covered} of ${AA_ORDER_ALPHA.length} amino acids covered`}
              className="tabular-nums"
            >
              {' · ⚠ '}{covered}/{AA_ORDER_ALPHA.length} amino acids
            </span>
          )}
        </p>
      </div>

      {is1 && (
        <div className="flex items-baseline gap-4 sm:justify-end text-sm pt-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavourite(accession) }}
            aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
            className={isFav
              ? 'text-indigo-600 dark:text-indigo-400'
              : `text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 ${quiet}`}
          >
            {isFav ? '★' : '☆'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); isSelected ? removeFromCompare(accession) : addToCompare(accession) }}
            disabled={isFull}
            className={isSelected
              ? 'underline underline-offset-4 decoration-gray-300 dark:decoration-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 underline-offset-4'
              : `btn-text whitespace-nowrap ${isFull ? 'cursor-not-allowed' : ''} ${quiet}`}
          >
            {isSelected ? '✓ Added' : isFull ? `Max ${MAX_COMPARE}` : '+ Compare'}
          </button>
        </div>
      )}
    </div>
  )
}
