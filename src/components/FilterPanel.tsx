import { useAAIndexStore } from '../store/useAAIndexStore'

interface Props {
  categories: string[]
}

export default function FilterPanel({ categories }: Props) {
  const categoryFilter = useAAIndexStore((s) => s.categoryFilter)
  const setCategoryFilter = useAAIndexStore((s) => s.setCategoryFilter)
  const showOnlyFavourites = useAAIndexStore((s) => s.showOnlyFavourites)
  const setShowOnlyFavourites = useAAIndexStore((s) => s.setShowOnlyFavourites)
  const favourites = useAAIndexStore((s) => s.favourites)

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showOnlyFavourites}
            onChange={(e) => setShowOnlyFavourites(e.target.checked)}
            className="accent-yellow-400"
          />
          <span className="text-yellow-500">★</span>
          Favourites only
          {favourites.length > 0 && (
            <span className="text-xs text-gray-400">({favourites.length})</span>
          )}
        </label>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            Category
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
