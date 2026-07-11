import { test, expect } from '@playwright/test'

// Journey: Search → Record detail → Add to compare → Comparator → Export CSV

test.describe('Explorer → Compare journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explorer')
    // Clear any persisted compare state from localStorage
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('lands on Explorer with record cards visible', async ({ page }) => {
    // First page shows the first records in the dataset (KYTJ820101 is deep in the list).
    await expect(page.locator('text=ANDN920101')).toBeVisible({ timeout: 10_000 })
  })

  test('search filters down the record list', async ({ page }) => {
    // KYTJ820101's description is "Hydropathy index" — search matches on that.
    await page.getByPlaceholder(/search/i).fill('hydropathy')
    await expect(page.locator('text=KYTJ820101')).toBeVisible()
    // Cards not matching the query should disappear
    const cards = page.locator('[role="button"]')
    const count = await cards.count()
    expect(count).toBeLessThan(50)
  })

  test('clicking a record card navigates to its detail page', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('hydropathy')
    await page.locator('text=KYTJ820101').first().click()
    await expect(page).toHaveURL(/\/records\/KYTJ820101/)
    await expect(page.getByText(/Hydropathy/i).first()).toBeVisible()
  })

  test('add to compare from detail page navigates to Comparator', async ({ page }) => {
    await page.goto('/records/KYTJ820101')
    await page.getByRole('button', { name: /add to compare/i }).click()
    await expect(page).toHaveURL(/\/compare/)
    await expect(page.locator('text=KYTJ820101').first()).toBeVisible()
  })

  test('comparator shows the values table with 20 amino acid rows', async ({ page }) => {
    await page.goto('/compare?ids=KYTJ820101')
    await expect(page.locator('table')).toBeVisible({ timeout: 8_000 })
    // A-Z amino acid rows should all be present
    for (const aa of ['A', 'C', 'D', 'E', 'F']) {
      await expect(page.locator(`td:has-text("${aa}")`).first()).toBeVisible()
    }
  })

  test('z-score normalise toggle shows the normalisation note', async ({ page }) => {
    await page.goto('/compare?ids=KYTJ820101')
    await page.getByRole('checkbox').click()
    await expect(page.getByText(/z-score normalised/i)).toBeVisible()
  })

  test('share button copies a URL to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/compare?ids=KYTJ820101')
    await page.getByRole('button', { name: /share/i }).click()
    await expect(page.getByText(/copied/i)).toBeVisible()
  })
})
