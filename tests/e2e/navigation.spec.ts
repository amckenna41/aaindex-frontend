import { test, expect } from '@playwright/test'

// Smoke tests for every nav link — ensures no route crashes on load.

const ROUTES = [
  { path: '/explorer',      label: /explorer/i },
  { path: '/sequence',      label: /sequence encoder/i },
  { path: '/encode',        label: /encode/i },
  { path: '/compare',       label: /compare/i },
  { path: '/visualise',     label: /visualiser|bar chart/i },
  { path: '/similarity',    label: /property space/i },
  { path: '/api-reference', label: /api reference/i },
  { path: '/guide',         label: /user guide/i },
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

test('a record page renders rather than tripping the error boundary', async ({ page }) => {
  await page.goto('/records/KYTJ820101')
  await expect(page.getByText('Amino Acid Values')).toBeVisible({ timeout: 8_000 })
})

test('a prototype key shows "Record not found" instead of crashing', async ({ page }) => {
  await page.goto('/records/constructor')
  await expect(page.getByText(/Record not found/i)).toBeVisible({ timeout: 8_000 })
  await expect(page.locator('body')).not.toContainText('Something went wrong')
})

test('a deep-linked Explorer page number is honoured on first load', async ({ page }) => {
  await page.goto('/explorer?page=3')
  await expect(page.getByText(/Page 3 of/)).toBeVisible({ timeout: 8_000 })
})

test('the dark mode choice survives a reload', async ({ page }) => {
  await page.goto('/explorer')
  const isDark = () => page.evaluate(() => document.documentElement.classList.contains('dark'))
  await page.getByRole('button', { name: /toggle dark mode/i }).click()
  const chosen = await isDark()
  await page.reload()
  expect(await isDark()).toBe(chosen)
})
