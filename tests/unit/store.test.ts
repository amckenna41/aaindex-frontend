import { describe, it, expect, beforeEach } from 'vitest'
import { useAAIndexStore } from '../../src/store/useAAIndexStore'

// Reset store and localStorage before every test
beforeEach(() => {
  localStorage.clear()
  useAAIndexStore.setState({
    activeDB: 'aaindex1',
    selectedAccessions: [],
    categoryFilter: '',
    searchQuery: '',
    favourites: [],
    showOnlyFavourites: false,
    normalise: false,
  })
})

// ── Initial state ──────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('activeDB defaults to aaindex1', () => {
    expect(useAAIndexStore.getState().activeDB).toBe('aaindex1')
  })

  it('selectedAccessions starts empty', () => {
    expect(useAAIndexStore.getState().selectedAccessions).toEqual([])
  })

  it('categoryFilter starts empty', () => {
    expect(useAAIndexStore.getState().categoryFilter).toBe('')
  })

  it('searchQuery starts empty', () => {
    expect(useAAIndexStore.getState().searchQuery).toBe('')
  })

  it('favourites starts empty (or populated from localStorage)', () => {
    expect(useAAIndexStore.getState().favourites).toEqual([])
  })

  it('showOnlyFavourites defaults to false', () => {
    expect(useAAIndexStore.getState().showOnlyFavourites).toBe(false)
  })

  it('normalise defaults to false', () => {
    expect(useAAIndexStore.getState().normalise).toBe(false)
  })
})

// ── setActiveDB ────────────────────────────────────────────────────────────────

describe('setActiveDB', () => {
  it('updates activeDB', () => {
    useAAIndexStore.getState().setActiveDB('aaindex2')
    expect(useAAIndexStore.getState().activeDB).toBe('aaindex2')
  })

  it('resets categoryFilter when switching DB', () => {
    useAAIndexStore.getState().setCategoryFilter('hydrophobicity')
    useAAIndexStore.getState().setActiveDB('aaindex2')
    expect(useAAIndexStore.getState().categoryFilter).toBe('')
  })

  it('resets searchQuery when switching DB', () => {
    useAAIndexStore.getState().setSearchQuery('helix')
    useAAIndexStore.getState().setActiveDB('aaindex2')
    expect(useAAIndexStore.getState().searchQuery).toBe('')
  })

  it('resets showOnlyFavourites when switching DB', () => {
    useAAIndexStore.getState().setShowOnlyFavourites(true)
    useAAIndexStore.getState().setActiveDB('aaindex2')
    expect(useAAIndexStore.getState().showOnlyFavourites).toBe(false)
  })
})

// ── toggleFavourite ────────────────────────────────────────────────────────────

describe('toggleFavourite', () => {
  it('adds an accession to an empty favourites list', () => {
    useAAIndexStore.getState().toggleFavourite('ACCE000101')
    expect(useAAIndexStore.getState().favourites).toContain('ACCE000101')
  })

  it('removes an already-favourited accession', () => {
    useAAIndexStore.getState().toggleFavourite('ACCE000101')
    useAAIndexStore.getState().toggleFavourite('ACCE000101')
    expect(useAAIndexStore.getState().favourites).not.toContain('ACCE000101')
  })

  it('keeps other favourites when removing one', () => {
    useAAIndexStore.getState().toggleFavourite('ACCE000101')
    useAAIndexStore.getState().toggleFavourite('ACCE000102')
    useAAIndexStore.getState().toggleFavourite('ACCE000101')
    expect(useAAIndexStore.getState().favourites).toContain('ACCE000102')
    expect(useAAIndexStore.getState().favourites).not.toContain('ACCE000101')
  })

  it('can add multiple distinct favourites', () => {
    useAAIndexStore.getState().toggleFavourite('ACC1')
    useAAIndexStore.getState().toggleFavourite('ACC2')
    useAAIndexStore.getState().toggleFavourite('ACC3')
    expect(useAAIndexStore.getState().favourites).toHaveLength(3)
  })

  it('persists favourites to localStorage', () => {
    useAAIndexStore.getState().toggleFavourite('ACCE000101')
    const stored = JSON.parse(localStorage.getItem('aaindex_favourites') ?? '[]')
    expect(stored).toContain('ACCE000101')
  })

  it('removes from localStorage when toggled off', () => {
    useAAIndexStore.getState().toggleFavourite('ACCE000101')
    useAAIndexStore.getState().toggleFavourite('ACCE000101')
    const stored = JSON.parse(localStorage.getItem('aaindex_favourites') ?? '[]')
    expect(stored).not.toContain('ACCE000101')
  })
})

// ── addToCompare / removeFromCompare / clearCompare ───────────────────────────

describe('addToCompare', () => {
  it('adds an accession to the compare list', () => {
    useAAIndexStore.getState().addToCompare('ACC1')
    expect(useAAIndexStore.getState().selectedAccessions).toContain('ACC1')
  })

  it('does not add duplicates', () => {
    useAAIndexStore.getState().addToCompare('ACC1')
    useAAIndexStore.getState().addToCompare('ACC1')
    expect(useAAIndexStore.getState().selectedAccessions).toHaveLength(1)
  })

  it('caps the compare list at 4 accessions', () => {
    for (const acc of ['A1','A2','A3','A4','A5']) {
      useAAIndexStore.getState().addToCompare(acc)
    }
    expect(useAAIndexStore.getState().selectedAccessions).toHaveLength(4)
    expect(useAAIndexStore.getState().selectedAccessions).not.toContain('A5')
  })

  it('preserves insertion order', () => {
    useAAIndexStore.getState().addToCompare('A1')
    useAAIndexStore.getState().addToCompare('A2')
    useAAIndexStore.getState().addToCompare('A3')
    expect(useAAIndexStore.getState().selectedAccessions).toEqual(['A1','A2','A3'])
  })
})

describe('removeFromCompare', () => {
  it('removes the specified accession', () => {
    useAAIndexStore.getState().addToCompare('ACC1')
    useAAIndexStore.getState().addToCompare('ACC2')
    useAAIndexStore.getState().removeFromCompare('ACC1')
    expect(useAAIndexStore.getState().selectedAccessions).not.toContain('ACC1')
    expect(useAAIndexStore.getState().selectedAccessions).toContain('ACC2')
  })

  it('is a no-op if the accession is not in the list', () => {
    useAAIndexStore.getState().addToCompare('ACC1')
    useAAIndexStore.getState().removeFromCompare('NOT_THERE')
    expect(useAAIndexStore.getState().selectedAccessions).toHaveLength(1)
  })
})

describe('clearCompare', () => {
  it('empties the compare list', () => {
    useAAIndexStore.getState().addToCompare('ACC1')
    useAAIndexStore.getState().addToCompare('ACC2')
    useAAIndexStore.getState().clearCompare()
    expect(useAAIndexStore.getState().selectedAccessions).toHaveLength(0)
  })
})

// ── filter / search state ──────────────────────────────────────────────────────

describe('setCategoryFilter', () => {
  it('sets the category filter', () => {
    useAAIndexStore.getState().setCategoryFilter('hydrophobicity')
    expect(useAAIndexStore.getState().categoryFilter).toBe('hydrophobicity')
  })

  it('can be set to empty string', () => {
    useAAIndexStore.getState().setCategoryFilter('hydrophobicity')
    useAAIndexStore.getState().setCategoryFilter('')
    expect(useAAIndexStore.getState().categoryFilter).toBe('')
  })
})

describe('setSearchQuery', () => {
  it('sets the search query', () => {
    useAAIndexStore.getState().setSearchQuery('helix propensity')
    expect(useAAIndexStore.getState().searchQuery).toBe('helix propensity')
  })
})

describe('setShowOnlyFavourites', () => {
  it('sets showOnlyFavourites to true', () => {
    useAAIndexStore.getState().setShowOnlyFavourites(true)
    expect(useAAIndexStore.getState().showOnlyFavourites).toBe(true)
  })

  it('sets showOnlyFavourites back to false', () => {
    useAAIndexStore.getState().setShowOnlyFavourites(true)
    useAAIndexStore.getState().setShowOnlyFavourites(false)
    expect(useAAIndexStore.getState().showOnlyFavourites).toBe(false)
  })
})

describe('setNormalise', () => {
  it('sets normalise to true', () => {
    useAAIndexStore.getState().setNormalise(true)
    expect(useAAIndexStore.getState().normalise).toBe(true)
  })

  it('sets normalise back to false', () => {
    useAAIndexStore.getState().setNormalise(true)
    useAAIndexStore.getState().setNormalise(false)
    expect(useAAIndexStore.getState().normalise).toBe(false)
  })
})
