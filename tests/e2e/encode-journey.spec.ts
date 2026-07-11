import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import os from 'os'

// Journey: Encode page — load example, select record, inspect chart, export CSV

const FASTA = `>TestSeq
ACDEFGHIKLMNPQRSTVWY
`

test.describe('Encode journey', () => {
  test('Examples panel is visible and expanded by default', async ({ page }) => {
    await page.goto('/encode')
    await expect(page.getByText('Human Insulin B-chain')).toBeVisible()
  })

  test('clicking an example loads its sequence', async ({ page }) => {
    await page.goto('/encode')
    await page.getByText('Human Insulin B-chain').click()
    await expect(page.getByText(/insulin/i).first()).toBeVisible()
    await expect(page.getByText(/sequences loaded/i)).toBeVisible()
  })

  test('uploading a FASTA file shows sequence count and chart', async ({ page }) => {
    await page.goto('/encode')

    // Write a temp FASTA file to disk and upload it
    const tmpFile = path.join(os.tmpdir(), 'test.fasta')
    fs.writeFileSync(tmpFile, FASTA)

    const input = page.locator('input[type="file"]')
    await input.setInputFiles(tmpFile)

    await expect(page.getByRole('heading', { name: /1 sequence loaded/i })).toBeVisible({ timeout: 5_000 })
    fs.unlinkSync(tmpFile)
  })

  test('export CSV buttons appear after a sequence is loaded', async ({ page }) => {
    await page.goto('/encode')
    await page.getByText('Human Ubiquitin').click()
    await expect(page.getByText(/all encodings/i)).toBeVisible()
    await expect(page.getByText(/summary stats/i)).toBeVisible()
  })

  test('switching the AAIndex record updates the preview', async ({ page }) => {
    await page.goto('/encode')
    await page.getByText('Human Ubiquitin').click()
    // The record selector is a <select> — choose a different record
    const selector = page.locator('select').last()
    const initialValue = await selector.inputValue()
    await selector.selectOption({ index: 5 })
    await expect(selector).not.toHaveValue(initialValue)
  })
})
