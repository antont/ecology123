import { describe, it, expect } from 'vitest'
import { WORLD_CONFIG } from './WorldConfig'

describe('WorldConfig', () => {
  it('should have valid grid dimensions', () => {
    expect(WORLD_CONFIG.width).toBe(100)
    expect(WORLD_CONFIG.height).toBe(100)
    expect(WORLD_CONFIG.width).toBeGreaterThan(0)
    expect(WORLD_CONFIG.height).toBeGreaterThan(0)
  })

  it('should have valid simulation timing', () => {
    expect(WORLD_CONFIG.stepDuration).toBe(60000) // 1 minute
    expect(WORLD_CONFIG.stepDuration).toBeGreaterThan(0)
  })

  it('should have valid initial populations', () => {
    expect(WORLD_CONFIG.initialGrassCoverage).toBeGreaterThan(0)
    expect(WORLD_CONFIG.initialGrassCoverage).toBeLessThanOrEqual(1)
    expect(WORLD_CONFIG.initialSheepCount).toBeGreaterThan(0)
    expect(WORLD_CONFIG.initialWolfCount).toBeGreaterThan(0)
    expect(WORLD_CONFIG.initialSheepCount).toBeLessThan(WORLD_CONFIG.width * WORLD_CONFIG.height)
    expect(WORLD_CONFIG.initialWolfCount).toBeLessThan(WORLD_CONFIG.width * WORLD_CONFIG.height)
  })

  it('should have valid grass parameters', () => {
    expect(WORLD_CONFIG.grass.growthRate).toBeGreaterThan(0)
    expect(WORLD_CONFIG.grass.growthRate).toBeLessThanOrEqual(1)
    expect(WORLD_CONFIG.grass.maxDensity).toBe(1.0)
    expect(WORLD_CONFIG.grass.consumptionRate).toBeGreaterThan(0)
    expect(WORLD_CONFIG.grass.consumptionRate).toBeLessThanOrEqual(1)
    expect(WORLD_CONFIG.grass.spreadingRadius).toBeGreaterThan(0)
  })

  it('should have valid sheep parameters', () => {
    expect(WORLD_CONFIG.sheep.movementRange).toBeGreaterThan(0)
    expect(WORLD_CONFIG.sheep.hungerThreshold).toBeGreaterThan(0)
    expect(WORLD_CONFIG.sheep.reproductionRate).toBeGreaterThan(0)
    expect(WORLD_CONFIG.sheep.reproductionRate).toBeLessThanOrEqual(1)
    expect(WORLD_CONFIG.sheep.lifespan).toBeGreaterThan(0)
    expect(WORLD_CONFIG.sheep.energyPerGrass).toBeGreaterThan(0)
  })

  it('should have valid wolf parameters', () => {
    expect(WORLD_CONFIG.wolf.movementRange).toBeGreaterThan(0)
    expect(WORLD_CONFIG.wolf.hungerThreshold).toBeGreaterThan(0)
    expect(WORLD_CONFIG.wolf.reproductionRate).toBeGreaterThan(0)
    expect(WORLD_CONFIG.wolf.reproductionRate).toBeLessThanOrEqual(1)
    expect(WORLD_CONFIG.wolf.lifespan).toBeGreaterThan(0)
    expect(WORLD_CONFIG.wolf.energyPerSheep).toBeGreaterThan(0)
  })

  it('should have valid world parameters', () => {
    expect(WORLD_CONFIG.world.seasonLength).toBeGreaterThan(0)
    expect(WORLD_CONFIG.world.temperatureEffect).toBeGreaterThanOrEqual(0)
    expect(WORLD_CONFIG.world.diseaseProbability).toBeGreaterThanOrEqual(0)
    expect(WORLD_CONFIG.world.diseaseProbability).toBeLessThanOrEqual(1)
  })

  it('should have valid visualization parameters', () => {
    expect(WORLD_CONFIG.visualization.cellSize).toBeGreaterThan(0)
    expect(WORLD_CONFIG.visualization.animationSpeed).toBeGreaterThan(0)
    expect(['natural', 'colorful', 'monochrome']).toContain(WORLD_CONFIG.visualization.colorScheme)
  })

  it('should have valid debug parameters', () => {
    expect(['debug', 'info', 'warn', 'error']).toContain(WORLD_CONFIG.debug.logLevel)
    expect(typeof WORLD_CONFIG.debug.showDebugInfo).toBe('boolean')
    expect(typeof WORLD_CONFIG.debug.pauseOnExtinction).toBe('boolean')
    expect(typeof WORLD_CONFIG.debug.saveStatistics).toBe('boolean')
  })
})
