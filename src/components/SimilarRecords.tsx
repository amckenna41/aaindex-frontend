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

  const Row = ({ acc, r }: { acc: string; r: number }) => (
    <Link
      to={`/records/${acc}`}
      className="group grid grid-cols-[4.5rem_1fr] gap-x-4 py-3 border-b border-gray-200 dark:border-gray-800"
    >
      <span className="font-mono text-sm tabular-nums text-gray-500 dark:text-gray-400">
        {r > 0 ? '+' : ''}{r.toFixed(3)}
      </span>
      <span className="min-w-0">
        <span className="block font-mono text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{acc}</span>
        <span className="block text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{db[acc]?.description}</span>
      </span>
    </Link>
  )

  return (
    <section className="flex flex-col gap-6">
      <h2 className="label">Similar Records</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {topSimilar.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 pb-2 border-b border-gray-200 dark:border-gray-800">
              Most correlated (r &gt; 0)
            </p>
            {topSimilar.map(([acc, r]) => <Row key={acc} acc={acc} r={r} />)}
          </div>
        )}
        {topAnti.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 pb-2 border-b border-gray-200 dark:border-gray-800">
              Most anti-correlated (r &lt; 0)
            </p>
            {topAnti.map(([acc, r]) => <Row key={acc} acc={acc} r={r} />)}
          </div>
        )}
      </div>
    </section>
  )
}
