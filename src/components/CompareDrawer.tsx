import { useNavigate } from 'react-router-dom'
import { useAAIndexStore } from '../store/useAAIndexStore'

export default function CompareDrawer() {
  const { selectedAccessions, removeFromCompare, clearCompare } = useAAIndexStore()
  const navigate = useNavigate()

  if (selectedAccessions.length === 0) return null

  return (
    <div className="compare-drawer-root fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">Compare:</span>
        <div className="flex gap-2 flex-wrap flex-1">
          {selectedAccessions.map((acc) => (
            <span
              key={acc}
              className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs font-mono px-2 py-1 rounded"
            >
              {acc}
              <button
                onClick={() => removeFromCompare(acc)}
                className="hover:text-red-600 ml-0.5"
                aria-label={`Remove ${acc}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={clearCompare}
            className="text-xs px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Clear
          </button>
          <button
            onClick={() => navigate('/compare')}
            className="text-xs px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            View comparison →
          </button>
        </div>
      </div>
    </div>
  )
}
