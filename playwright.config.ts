import { defineConfig, devices } from '@playwright/test'

// A dedicated port, not Vite's 5173 default: that one is routinely occupied by
// another project's dev server, and `reuseExistingServer` would then silently
// run the whole suite against the wrong application.
const PORT = Number(process.env.E2E_PORT ?? 5273)
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // --strictPort so a port clash fails loudly instead of drifting to another
    // port while the tests keep hitting whatever is on this one.
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
