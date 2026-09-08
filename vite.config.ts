import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // One chunk per source database, so the split is explicit in the build
        // output rather than something a stray static import can silently undo.
        manualChunks(id: string) {
          const data = id.match(/src\/data\/(aaindex[123])\.json/)
          if (data) return data[1]
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|@remix-run)\//.test(id)) return 'vendor'
          if (id.includes('node_modules/recharts')) return 'charts'
          if (id.includes('node_modules/fuse.js')) return 'search'
          return undefined
        },
      },
    },
  },
})
