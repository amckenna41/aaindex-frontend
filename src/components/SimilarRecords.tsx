import { Link } from 'react-router-dom'
import { AAIndex1DB } from '../types'

interface Props {
  accession: string
  correlationCoefficients: Record<string, number>
  db: AAIndex1DB
}

export default function SimilarRecords({ accession: _accession, correlationCoefficients, db }: Props) {
  const entries = Object.entries(correlationCoefficients)
    .filter(([acc]) => acc in db)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))

  const topSimilar = entries.filter(([, r]) => r > 0).slice(0, 5)
  const topAnti = entries.filter(([, r]) => r < 0).slice(0, 5)

  if (!entries.length) return null

  const Card = ({ acc, r }: { acc: string; r: number }) => {
    const rec = db[acc]
    const positive = r >= 0
    return (
      <Link
        to={`/records/${acc}`}
        className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
      >
        <span
          className={`shrink-0 text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
            positive
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
          }`}
        >
          {r > 0 ? '+' : ''}{r.toFixed(3)}
        </span>
        <div className="min-w-0">
          <div className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">{acc}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{rec?.description}</div>
        </div>
      </Link>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <h2 className="font-semibold mb-4">Similar Records</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topSimilar.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-2">
              Most correlated (r &gt; 0)
            </p>
            <div className="flex flex-col gap-2">
              {topSimilar.map(([acc, r]) => <Card key={acc} acc={acc} r={r} />)}
            </div>
          </div>
        )}
        {topAnti.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 mb-2">
              Most anti-correlated (r &lt; 0)
            </p>
            <div className="flex flex-col gap-2">
              {topAnti.map(([acc, r]) => <Card key={acc} acc={acc} r={r} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
