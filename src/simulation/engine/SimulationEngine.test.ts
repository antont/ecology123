import { describe, it, expect, beforeEach } from 'vitest'
import { SimulationEngine } from './SimulationEngine'
import { WORLD_CONFIG } from '../config/WorldConfig'
import { Grass, Sheep, Wolf, Direction } from '../types/SimulationTypes'
import { OrganismFactory } from '../utils/OrganismFactory'

describe('SimulationEngine', () => {
  let simulationEngine: SimulationEngine

  beforeEach(() => {
    simulationEngine = new SimulationEngine(WORLD_CONFIG)
  })

  it('should initialize with config', () => {
    expect(simulationEngine).toBeDefined()
    expect(simulationEngine.isRunning()).toBe(false)
    expect(simulationEngine.isPaused()).toBe(false)
  })

  it('should start simulation', () => {
    simulationEngine.start()
    expect(simulationEngine.isRunning()).toBe(true)
    expect(simulationEngine.isPaused()).toBe(false)
  })

  it('should pause simulation', () => {
    simulationEngine.start()
    simulationEngine.pause()
    expect(simulationEngine.isRunning()).toBe(true)
    expect(simulationEngine.isPaused()).toBe(true)
  })

  it('should resume simulation', () => {
    simulationEngine.start()
    simulationEngine.pause()
    simulationEngine.resume()
    expect(simulationEngine.isRunning()).toBe(true)
    expect(simulationEngine.isPaused()).toBe(false)
  })

  it('should stop simulation', () => {
    simulationEngine.start()
    simulationEngine.stop()
    expect(simulationEngine.isRunning()).toBe(false)
    expect(simulationEngine.isPaused()).toBe(false)
  })

  it('should step simulation', () => {
    // Add some organisms to the world
    const grass: Grass = {
      id: 'grass-1',
      x: 10,
      y: 10,
      energy: 0.8,
      age: 0,
      isAlive: true,
      density: 0.9,
      growthStage: 'mature',
      lastGrazed: 0,
      seasonalGrowth: 1.0
    }
    
    const sheep: Sheep = {
      id: 'sheep-1',
      x: 15,
      y: 15,
      energy: 0.7,
      age: 0,
      isAlive: true,
      hunger: 0,
      reproductionCooldown: 0,
      lastDirection: Direction.NORTH,
      grazingEfficiency: 0.8
    }
    
    simulationEngine.getWorld().setCellContent(10, 10, { grass })
    simulationEngine.getWorld().setCellContent(15, 15, { sheep })
    
    // Step the simulation
    simulationEngine.step()
    
    // Check that step was processed
    const world = simulationEngine.getWorld()
    expect(world.getCurrentStep()).toBe(1)
  })

  it('should get world state', () => {
    const world = simulationEngine.getWorld()
    expect(world).toBeDefined()
    expect(world.getWidth()).toBe(50)
    expect(world.getHeight()).toBe(50)
  })

  it('should get simulation statistics', () => {
    const stats = simulationEngine.getStatistics()
    expect(stats).toBeDefined()
    expect(stats.totalSteps).toBe(0)
    expect(stats.grassCount).toBe(0)
    expect(stats.sheepCount).toBe(0)
    expect(stats.wolfCount).toBe(0)
  })

  it('should set simulation speed', () => {
    simulationEngine.setSpeed(2.0)
    expect(simulationEngine.getSpeed()).toBe(2.0)
  })

  it('should reset simulation', () => {
    // Add some organisms
    const grass: Grass = {
      id: 'grass-1',
      x: 10,
      y: 10,
      energy: 0.8,
      age: 0,
      isAlive: true,
      density: 0.9,
      growthStage: 'mature',
      lastGrazed: 0,
      seasonalGrowth: 1.0
    }
    
    simulationEngine.getWorld().setCellContent(10, 10, { grass })
    
    // Step a few times
    simulationEngine.step()
    simulationEngine.step()
    
    // Reset
    simulationEngine.reset()
    
    // Check that everything is reset
    expect(simulationEngine.isRunning()).toBe(false)
    expect(simulationEngine.isPaused()).toBe(false)
    expect(simulationEngine.getWorld().getCurrentStep()).toBe(0)
    expect(simulationEngine.getStatistics().totalSteps).toBe(0)
  })

  it('should handle multiple steps', () => {
    // Add some organisms
    const grass: Grass = {
      id: 'grass-1',
      x: 10,
      y: 10,
      energy: 0.8,
      age: 0,
      isAlive: true,
      density: 0.9,
      growthStage: 'mature',
      lastGrazed: 0,
      seasonalGrowth: 1.0
    }
    
    simulationEngine.getWorld().setCellContent(10, 10, { grass })
    
    // Step multiple times
    for (let i = 0; i < 5; i++) {
      simulationEngine.step()
    }
    
    expect(simulationEngine.getWorld().getCurrentStep()).toBe(5)
  })

  it('should update statistics after each step', () => {
    // Add some organisms
    const grass: Grass = {
      id: 'grass-1',
      x: 10,
      y: 10,
      energy: 0.8,
      age: 0,
      isAlive: true,
      density: 0.9,
      growthStage: 'mature',
      lastGrazed: 0,
      seasonalGrowth: 1.0
    }
    
    const sheep: Sheep = {
      id: 'sheep-1',
      x: 15,
      y: 15,
      energy: 0.7,
      age: 0,
      isAlive: true,
      hunger: 0,
      reproductionCooldown: 0,
      lastDirection: Direction.NORTH,
      grazingEfficiency: 0.8
    }
    
    simulationEngine.getWorld().setCellContent(10, 10, { grass })
    simulationEngine.getWorld().setCellContent(15, 15, { sheep })
    
    // Step the simulation
    simulationEngine.step()
    
    // Check that statistics were updated
    const stats = simulationEngine.getStatistics()
    expect(stats.grassCount).toBeGreaterThan(0)
    expect(stats.sheepCount).toBeGreaterThan(0)
  })
})
