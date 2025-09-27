import { describe, it, expect, beforeEach } from 'vitest'
import { World } from './World'
import { WORLD_CONFIG } from '../config/WorldConfig'
import { Season, Direction } from '../types/SimulationTypes'
import { OrganismFactory } from '../utils/OrganismFactory'

describe('World', () => {
  let world: World

  beforeEach(() => {
    world = new World(WORLD_CONFIG)
  })

  it('should initialize with correct dimensions', () => {
    expect(world.getWidth()).toBe(50)
    expect(world.getHeight()).toBe(50)
  })

  it('should initialize with empty cells', () => {
    const cells = world.getCells()
    expect(cells).toHaveLength(50)
    expect(cells[0]).toHaveLength(50)
  })

  it('should initialize with spring season', () => {
    expect(world.getSeason()).toBe(Season.SPRING)
  })

  it('should initialize with default temperature', () => {
    expect(world.getTemperature()).toBe(20) // Default temperature
  })

  it('should be able to set and get cell content', () => {
    const x = 10
    const y = 15
    
    // Test setting grass
    const grass = OrganismFactory.createGrass({
      id: 'grass-1',
      x,
      y,
      energy: 0.8,
      density: 0.9,
      growthStage: 'mature'
    })
    
    world.setCellContent(x, y, { grass })
    const cell = world.getCell(x, y)
    expect(cell?.grass).toEqual(grass)
  })

  it('should return null for out-of-bounds coordinates', () => {
    expect(world.getCell(-1, 0)).toBeNull()
    expect(world.getCell(0, -1)).toBeNull()
    expect(world.getCell(50, 0)).toBeNull()
    expect(world.getCell(0, 50)).toBeNull()
  })

  it('should return null for setCellContent with out-of-bounds coordinates', () => {
    const result = world.setCellContent(-1, 0, {})
    expect(result).toBe(false)
  })

  it('should clear cell content', () => {
    const x = 5
    const y = 5
    
    // Set content first
    world.setCellContent(x, y, { 
      grass: OrganismFactory.createGrass({
        id: 'grass-1',
        x,
        y,
        energy: 0.8,
        density: 0.9,
        growthStage: 'mature'
      })
    })
    
    // Clear content
    world.clearCellContent(x, y)
    const cell = world.getCell(x, y)
    expect(cell?.grass).toBeUndefined()
  })

  it('should update season based on step count', () => {
    // Spring: steps 0-149
    expect(world.getSeason()).toBe(Season.SPRING)
    
    // Simulate 150 steps to reach summer
    for (let i = 0; i < 150; i++) {
      world.incrementStep()
    }
    expect(world.getSeason()).toBe(Season.SUMMER)
  })

  it('should update temperature based on season', () => {
    const initialTemp = world.getTemperature()
    
    // Simulate to summer (warmer)
    for (let i = 0; i < 150; i++) {
      world.incrementStep()
    }
    expect(world.getTemperature()).toBeGreaterThan(initialTemp)
  })

  it('should get all organisms of a specific type', () => {
    const x1 = 1, y1 = 1
    const x2 = 2, y2 = 2
    
    const sheep1 = OrganismFactory.createSheep({
      id: 'sheep-1',
      x: x1,
      y: y1,
      energy: 0.8,
      age: 0,
      grazingEfficiency: 0.8
    })
    
    const sheep2 = OrganismFactory.createSheep({
      id: 'sheep-2',
      x: x2,
      y: y2,
      energy: 0.7,
      age: 0,
      grazingEfficiency: 0.9
    })
    
    world.setCellContent(x1, y1, { sheep: sheep1 })
    world.setCellContent(x2, y2, { sheep: sheep2 })
    
    const sheep = world.getOrganismsByType('sheep')
    expect(sheep).toHaveLength(2)
    expect(sheep.map(s => s.id)).toContain('sheep-1')
    expect(sheep.map(s => s.id)).toContain('sheep-2')
  })

  it('should get empty array for non-existent organism type', () => {
    const wolves = world.getOrganismsByType('wolf')
    expect(wolves).toHaveLength(0)
  })
})
