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
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
        Database
      </span>
      {DBS.map(({ name, label, count }) => (
        <button
          key={name}
          onClick={() => setActiveDB(name)}
          className={`flex items-center justify-between px-3 py-2 rounded text-sm font-medium transition-colors ${
            activeDB === name
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <span>{label}</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeDB === name
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            {count}
          </span>
        </button>
      ))}
    </div>
  )
}
