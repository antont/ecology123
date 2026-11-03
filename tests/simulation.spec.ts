import { test, expect } from '@playwright/test'

test.describe('Ecological Simulation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // The simulation is seeded on the client after hydration
    await expect(page.getByLabel('Seed')).not.toHaveValue('')
  })

  test('shows the world and its populations', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Ecological Simulation/ })).toBeVisible()
    await expect(page.locator('canvas')).toBeVisible()
    await expect(page.getByTestId('stat-sheep')).toHaveText('400')
    await expect(page.getByTestId('stat-wolves')).toHaveText('20')
  })

  test('Step advances one step', async ({ page }) => {
    await expect(page.getByTestId('stat-step')).toHaveText('0')
    await page.getByRole('button', { name: 'Step' }).click()
    await expect(page.getByTestId('stat-step')).toHaveText('1')
  })

  test('Play runs the simulation until paused', async ({ page }) => {
    await page.getByRole('button', { name: 'Play' }).click()
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
    await expect.poll(async () => Number(await page.getByTestId('stat-step').textContent())).toBeGreaterThan(5)
    await page.getByRole('button', { name: 'Pause' }).click()
    const paused = await page.getByTestId('stat-step').textContent()
    await page.waitForTimeout(300)
    await expect(page.getByTestId('stat-step')).toHaveText(paused ?? '')
  })

  test('the same seed replays the same run', async ({ page }) => {
    const replay = async () => {
      await page.getByLabel('Seed').fill('42')
      await page.getByRole('button', { name: 'Reset' }).click()
      for (let i = 0; i < 20; i++) await page.getByRole('button', { name: 'Step' }).click()
      return page.getByTestId('stat-sheep').textContent()
    }
    expect(await replay()).toBe(await replay())
  })
})
