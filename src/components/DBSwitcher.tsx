import { useAAIndexStore } from '../store/useAAIndexStore'
import { DBName } from '../types'

const DBS: { name: DBName; label: string; count: number }[] = [
  { name: 'aaindex1', label: 'AAIndex1', count: 566 },
  { name: 'aaindex2', label: 'AAIndex2', count: 94 },
  { name: 'aaindex3', label: 'AAIndex3', count: 47 },
]

export default function DBSwitcher() {
  const activeDB = useAAIndexStore((s) => s.activeDB)
  const setActiveDB = useAAIndexStore((s) => s.setActiveDB)

  return (
    <div role="group" aria-label="Database" className="flex items-baseline gap-x-3 flex-wrap text-sm">
      <span className="label">Database</span>
      {DBS.map(({ name, label, count }, i) => (
        <span key={name} className="flex items-baseline gap-x-3">
          {i > 0 && <span aria-hidden className="text-gray-300 dark:text-gray-700">·</span>}
          <button
            onClick={() => setActiveDB(name)}
            aria-pressed={activeDB === name}
            className={`tabular-nums underline-offset-[6px] ${
              activeDB === name
                ? 'text-indigo-600 dark:text-indigo-400 underline'
                : 'text-gray-500 dark:text-gray-400 hover:text-ink dark:hover:text-gray-100'
            }`}
          >
            <span>{label}</span>
            <span className="ml-1 text-gray-400 dark:text-gray-500">{count}</span>
          </button>
        </span>
      ))}
    </div>
  )
}
