import { create } from 'zustand'
import { DBName } from '../types'

const FAVS_KEY = 'aaindex_favourites'
const loadFavs = (): string[] => {
  try { return JSON.parse(localStorage.getItem(FAVS_KEY) ?? '[]') } catch { return [] }
}
const saveFavs = (favs: string[]) => localStorage.setItem(FAVS_KEY, JSON.stringify(favs))

interface AAIndexState {
  activeDB: DBName
  setActiveDB: (db: DBName) => void

  selectedAccessions: string[]
  addToCompare: (acc: string) => void
  removeFromCompare: (acc: string) => void
  clearCompare: () => void

  categoryFilter: string
  setCategoryFilter: (cat: string) => void

  searchQuery: string
  setSearchQuery: (q: string) => void

  favourites: string[]
  toggleFavourite: (acc: string) => void
  showOnlyFavourites: boolean
  setShowOnlyFavourites: (v: boolean) => void

  normalise: boolean
  setNormalise: (v: boolean) => void

  browseList: string[]
  setBrowseList: (list: string[]) => void
}

export const useAAIndexStore = create<AAIndexState>((set) => ({
  activeDB: 'aaindex1',
  setActiveDB: (db) => set({ activeDB: db, categoryFilter: '', searchQuery: '', showOnlyFavourites: false }),

  selectedAccessions: [],
  addToCompare: (acc) =>
    set((s) => ({
      selectedAccessions:
        s.selectedAccessions.includes(acc) || s.selectedAccessions.length >= 4
          ? s.selectedAccessions
          : [...s.selectedAccessions, acc],
    })),
  removeFromCompare: (acc) =>
    set((s) => ({ selectedAccessions: s.selectedAccessions.filter((a) => a !== acc) })),
  clearCompare: () => set({ selectedAccessions: [] }),

  categoryFilter: '',
  setCategoryFilter: (cat) => set({ categoryFilter: cat }),

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  favourites: loadFavs(),
  toggleFavourite: (acc) =>
    set((s) => {
      const next = s.favourites.includes(acc)
        ? s.favourites.filter((a) => a !== acc)
        : [...s.favourites, acc]
      saveFavs(next)
      return { favourites: next }
    }),
  showOnlyFavourites: false,
  setShowOnlyFavourites: (v) => set({ showOnlyFavourites: v }),

  normalise: false,
  setNormalise: (v) => set({ normalise: v }),

  browseList: [],
  setBrowseList: (list) => set({ browseList: list }),
}))
