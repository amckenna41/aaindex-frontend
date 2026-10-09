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
    <>
      {categories.length > 0 && (
        <label className="flex items-baseline gap-2">
          <span className="label">Category</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-transparent border-0 p-0 pr-6 text-sm text-ink dark:text-gray-100 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
      )}
      <span aria-hidden className="text-gray-300 dark:text-gray-700">·</span>
      <label className="flex items-baseline gap-2 text-sm cursor-pointer select-none text-gray-500 dark:text-gray-400 hover:text-ink dark:hover:text-gray-100">
        <input
          type="checkbox"
          checked={showOnlyFavourites}
          onChange={(e) => setShowOnlyFavourites(e.target.checked)}
          className="translate-y-px"
        />
        Favourites only
        {favourites.length > 0 && (
          <span className="tabular-nums text-gray-400 dark:text-gray-500">({favourites.length})</span>
        )}
      </label>
    </>
  )
}
