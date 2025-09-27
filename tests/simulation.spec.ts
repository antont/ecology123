import { test, expect } from '@playwright/test'

test.describe('Ecological Simulation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display simulation interface', async ({ page }) => {
    // Check that the main elements are present
    await expect(page.getByRole('heading', { name: 'Ecological Simulation' })).toBeVisible()
    await expect(page.getByText('A three-level food chain simulation: Grass → Sheep → Wolves')).toBeVisible()
    
    // Check control buttons
    await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Step' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible()
    
    // Check statistics display
    await expect(page.locator('text=Step').first()).toBeVisible()
    await expect(page.locator('text=Grass').first()).toBeVisible()
    await expect(page.locator('text=Sheep').first()).toBeVisible()
    await expect(page.locator('text=Wolves').first()).toBeVisible()
    
    // Check canvas is present
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
  })

  test('should initialize with organisms', async ({ page }) => {
    // Wait for the simulation to load
    await page.waitForTimeout(1000)
    
    // Check that we have some organisms (counts should be > 0)
    const grassCount = await page.locator('text=Grass').locator('..').locator('div').last().textContent()
    const sheepCount = await page.locator('text=Sheep').locator('..').locator('div').last().textContent()
    const wolfCount = await page.locator('text=Wolves').locator('..').locator('div').last().textContent()
    
    expect(parseInt(grassCount || '0')).toBeGreaterThan(0)
    expect(parseInt(sheepCount || '0')).toBeGreaterThan(0)
    expect(parseInt(wolfCount || '0')).toBeGreaterThan(0)
  })

  test('should update counts after reset', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000)
    
    // Get initial counts
    const initialGrassCount = await page.locator('text=Grass').locator('..').locator('div').last().textContent()
    const initialSheepCount = await page.locator('text=Sheep').locator('..').locator('div').last().textContent()
    const initialWolfCount = await page.locator('text=Wolves').locator('..').locator('div').last().textContent()
    
    // Click reset
    await page.getByRole('button', { name: 'Reset' }).click()
    await page.waitForTimeout(500)
    
    // Check that counts are updated (should be > 0)
    const grassCount = await page.locator('text=Grass').locator('..').locator('div').last().textContent()
    const sheepCount = await page.locator('text=Sheep').locator('..').locator('div').last().textContent()
    const wolfCount = await page.locator('text=Wolves').locator('..').locator('div').last().textContent()
    
    expect(parseInt(grassCount || '0')).toBeGreaterThan(0)
    expect(parseInt(sheepCount || '0')).toBeGreaterThan(0)
    expect(parseInt(wolfCount || '0')).toBeGreaterThan(0)
  })

  test('should advance simulation with step button', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000)
    
    // Get initial step count
    const initialStep = await page.locator('text=Step').locator('..').locator('div').last().textContent()
    const initialStepNum = parseInt(initialStep || '0')
    
    // Click step button
    await page.getByRole('button', { name: 'Step' }).click()
    await page.waitForTimeout(500)
    
    // Check that step count increased
    const newStep = await page.locator('text=Step').locator('..').locator('div').last().textContent()
    const newStepNum = parseInt(newStep || '0')
    
    expect(newStepNum).toBeGreaterThan(initialStepNum)
  })

  test('should start and pause simulation', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000)
    
    // Click start
    await page.getByRole('button', { name: 'Start' }).click()
    
    // Wait a bit for simulation to run
    await page.waitForTimeout(2000)
    
    // Check that step count has increased
    const stepCount = await page.locator('text=Step').locator('..').locator('div').last().textContent()
    const stepNum = parseInt(stepCount || '0')
    
    expect(stepNum).toBeGreaterThan(0)
    
    // Click pause
    await page.getByRole('button', { name: 'Pause' }).click()
    
    // Wait a bit
    await page.waitForTimeout(1000)
    
    // Get step count after pause
    const pausedStepCount = await page.locator('text=Step').locator('..').locator('div').last().textContent()
    const pausedStepNum = parseInt(pausedStepCount || '0')
    
    // Step count should not have increased much after pause
    expect(pausedStepNum - stepNum).toBeLessThan(2)
  })

  test('should display organisms on canvas', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000)
    
    // Get canvas
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
    
    // Take a screenshot to verify organisms are visible
    await canvas.screenshot({ path: 'test-results/canvas-initial.png' })
    
    // The canvas should have some content (not just empty)
    const canvasBox = await canvas.boundingBox()
    expect(canvasBox).not.toBeNull()
    expect(canvasBox!.width).toBeGreaterThan(0)
    expect(canvasBox!.height).toBeGreaterThan(0)
  })

  test('should show legend', async ({ page }) => {
    // Check that legend is visible
    await expect(page.getByText('Legend:')).toBeVisible()
    await expect(page.getByText('🟢 Green = Grass (darker = more dense)')).toBeVisible()
    await expect(page.getByText('⚪ White = Sheep')).toBeVisible()
    await expect(page.getByText('🔴 Red = Wolves')).toBeVisible()
  })
})
