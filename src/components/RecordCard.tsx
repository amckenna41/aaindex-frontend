import { useNavigate } from 'react-router-dom'
import { AAIndex1Record, AAIndex2Record, DBName } from '../types'
import { useAAIndexStore } from '../store/useAAIndexStore'
import { AA_ORDER_ALPHA } from '../lib/aminoAcids'
import { categoryColour } from '../lib/categories'

function Sparkline({ values }: { values: Record<string, number> }) {
  const ordered = AA_ORDER_ALPHA.map((aa) => values[aa] ?? 0)
  const min = ordered.reduce((a, b) => (b < a ? b : a), ordered[0] ?? 0)
  const max = ordered.reduce((a, b) => (b > a ? b : a), ordered[0] ?? 0)
  const range = max - min || 1
  const w = 6
  const h = 24

  return (
    <svg width={AA_ORDER_ALPHA.length * w} height={h} className="shrink-0">
      {ordered.map((v, i) => {
        const barH = Math.max(1, ((v - min) / range) * h)
        return (
          <rect
            key={i}
            x={i * w}
            y={h - barH}
            width={w - 1}
            height={barH}
            fill="#6366f1"
            opacity={0.6 + 0.4 * ((v - min) / range)}
          />
        )
      })}
    </svg>
  )
}

/** Several indices have gaps for particular amino acids. The detail view draws
 *  those as hatched cells; without a marker here it's easy to pick a sparse
 *  index off the list without noticing. */
function coverage(values: Record<string, number>): number {
  return AA_ORDER_ALPHA.filter((aa) => {
    const v = values?.[aa]
    return v != null && isFinite(v)
  }).length
}

interface Props {
  accession: string
  record: AAIndex1Record | AAIndex2Record
  dbName: DBName
}

export default function RecordCard({ accession, record, dbName }: Props) {
  const navigate = useNavigate()
  const { selectedAccessions, addToCompare, removeFromCompare, favourites, toggleFavourite } = useAAIndexStore()
  const isSelected = selectedAccessions.includes(accession)
  const isFull = selectedAccessions.length >= 4 && !isSelected
  const isFav = favourites.includes(accession)
  const is1 = dbName === 'aaindex1'
  const r1 = record as AAIndex1Record
  const category = is1 ? r1.category : null
  const covered = is1 ? coverage(r1.values) : AA_ORDER_ALPHA.length

  return (
    <div
      className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex flex-col gap-2 h-full hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer"
      onClick={() => navigate(`/records/${accession}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/records/${accession}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm shrink-0">
            {accession}
          </span>
          {category && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${categoryColour(category)}`}>
              {category}
            </span>
          )}
          {covered < AA_ORDER_ALPHA.length && (
            <span
              title={`Only ${covered} of ${AA_ORDER_ALPHA.length} amino acids have a value in this index`}
              aria-label={`Incomplete: ${covered} of ${AA_ORDER_ALPHA.length} amino acids covered`}
              className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
            >
              ⚠ {covered}/{AA_ORDER_ALPHA.length}
            </span>
          )}
        </div>
        {is1 && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavourite(accession) }}
            aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
            className={`shrink-0 text-base leading-none transition-colors ${isFav ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300 dark:text-gray-600 dark:hover:text-yellow-400'}`}
          >
            ★
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
        {record.description.length > 80 ? record.description.slice(0, 80) + '…' : record.description}
      </p>

      <div className="flex items-center justify-between gap-2 mt-auto">
        {is1 && <Sparkline values={r1.values} />}
        {!is1 && <span className="text-xs text-gray-400">Matrix record</span>}

        {is1 && (
          <button
            onClick={(e) => { e.stopPropagation(); isSelected ? removeFromCompare(accession) : addToCompare(accession) }}
            disabled={isFull}
            className={`text-xs px-2 py-1 rounded font-medium transition-colors shrink-0 ${
              isSelected
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : isFull
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 cursor-not-allowed'
                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 hover:bg-indigo-200'
            }`}
          >
            {isSelected ? '✓ Added' : isFull ? 'Max 4' : '+ Compare'}
          </button>
        )}
      </div>
    </div>
  )
}
