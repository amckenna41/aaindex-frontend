import { test, expect } from '@playwright/test'

// Smoke tests for every nav link — ensures no route crashes on load.

const ROUTES = [
  { path: '/explorer',      label: /explorer/i },
  { path: '/sequence',      label: /sequence analysis/i },
  { path: '/encode',        label: /encode/i },
  { path: '/visualise',     label: /visualiser|bar chart/i },
  { path: '/stats',         label: /category/i },
  { path: '/api-reference', label: /api reference/i },
  { path: '/guide',         label: /how.to guide/i },
  { path: '/about',         label: /about/i },
]

for (const { path, label } of ROUTES) {
  test(`${path} loads without crashing`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('body')).not.toContainText('Something went wrong')
    await expect(page.getByText(label).first()).toBeVisible({ timeout: 8_000 })
  })
}

test('unknown route redirects to Explorer', async ({ page }) => {
  await page.goto('/this-does-not-exist')
  await expect(page).toHaveURL(/\/explorer/)
})

test('dark mode toggle changes colour scheme', async ({ page }) => {
  await page.goto('/explorer')
  const html = page.locator('html')
  const before = await html.getAttribute('class')
  await page.getByRole('button', { name: /toggle dark mode/i }).click()
  const after = await html.getAttribute('class')
  expect(before).not.toBe(after)
})
