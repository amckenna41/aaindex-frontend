import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Stub file-saver globally so no test tries to trigger a browser download
vi.mock('file-saver', () => ({ saveAs: vi.fn() }))


// ResizeObserver is not present in jsdom; recharts needs it
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Reset localStorage between every test to prevent store state leaking
beforeEach(() => {
  localStorage.clear()
})
