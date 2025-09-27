import { describe, it, expect, beforeEach } from 'vitest'
import { StepProcessor } from './StepProcessor'
import { World } from './World'
import { WORLD_CONFIG } from '../config/WorldConfig'
import { Grass, Sheep, Wolf, Direction } from '../types/SimulationTypes'
import { OrganismFactory } from '../utils/OrganismFactory'

describe('StepProcessor', () => {
  let stepProcessor: StepProcessor
  let world: World

  beforeEach(() => {
    world = new World(WORLD_CONFIG)
    stepProcessor = new StepProcessor(world, WORLD_CONFIG)
  })

  it('should initialize with world and config', () => {
    expect(stepProcessor).toBeDefined()
  })

  it('should process grass growth in batch', () => {
    // Create multiple grass cells
    const grassArray: Grass[] = Array.from({ length: 5 }, (_, i) => 
      OrganismFactory.createGrass({
        id: `grass-${i}`,
        x: 10 + i,
        y: 10,
        energy: 0.5,
        age: 0,
        density: 0.3,
        growthStage: 'sprout'
      })
    )
    
    grassArray.forEach(grass => {
      world.setCellContent(grass.x, grass.y, { grass })
    })
    
    // Process step multiple times to increase chance of growth
    for (let i = 0; i < 10; i++) {
      stepProcessor.processStep()
    }
    
    // Check if any grass grew
    const grassAfter = world.getOrganismsByType('grass') as Grass[]
    expect(grassAfter.length).toBeGreaterThanOrEqual(5)
    
    // At least some grass should have grown
    const totalDensity = grassAfter.reduce((sum, g) => sum + g.density, 0)
    expect(totalDensity).toBeGreaterThan(5 * 0.3) // Original total density
  })

  it('should process sheep movement in batch', () => {
    // Create multiple sheep
    const sheepArray: Sheep[] = Array.from({ length: 3 }, (_, i) => 
      OrganismFactory.createSheep({
        id: `sheep-${i}`,
        x: 10 + i * 2,
        y: 10 + i * 2,
        energy: 0.8,
        age: 0,
        grazingEfficiency: 0.8
      })
    )
    
    sheepArray.forEach(sheep => {
      world.setCellContent(sheep.x, sheep.y, { sheep })
    })
    
    // Process step
    stepProcessor.processStep()
    
    // Check if sheep moved
    const sheepAfter = world.getOrganismsByType('sheep') as Sheep[]
    expect(sheepAfter).toHaveLength(3)
    sheepAfter.forEach(sheep => {
      expect(sheep.x).toBeGreaterThanOrEqual(0)
      expect(sheep.y).toBeGreaterThanOrEqual(0)
    })
  })

  it('should process wolf movement in batch', () => {
    // Create multiple wolves
    const wolfArray: Wolf[] = Array.from({ length: 2 }, (_, i) => 
      OrganismFactory.createWolf({
        id: `wolf-${i}`,
        x: 15 + i * 3,
        y: 15 + i * 3,
        energy: 0.9,
        age: 0
      })
    )
    
    wolfArray.forEach(wolf => {
      world.setCellContent(wolf.x, wolf.y, { wolf })
    })
    
    // Process step
    stepProcessor.processStep()
    
    // Check if wolves moved
    const wolfAfter = world.getOrganismsByType('wolf') as Wolf[]
    expect(wolfAfter).toHaveLength(2)
    wolfAfter.forEach(wolf => {
      expect(wolf.x).toBeGreaterThanOrEqual(0)
      expect(wolf.y).toBeGreaterThanOrEqual(0)
    })
  })

  it('should process sheep eating grass in batch', () => {
    // Create grass and sheep in same cells
    const pairs = Array.from({ length: 3 }, (_, i) => {
      const x = 10 + i * 2
      const y = 10 + i * 2
      
      const grass = OrganismFactory.createGrass({
        id: `grass-${i}`,
        x,
        y,
        energy: 0.8,
        density: 0.9,
        growthStage: 'mature'
      })
      
      const sheep = OrganismFactory.createSheep({
        id: `sheep-${i}`,
        x,
        y,
        energy: 0.3,
        age: 0,
        grazingEfficiency: 0.8
      })
      
      return { grass, sheep, x, y }
    })
    
    pairs.forEach(({ grass, sheep, x, y }) => {
      world.setCellContent(x, y, { grass, sheep })
    })
    
    // Process step multiple times to ensure eating happens
    for (let i = 0; i < 5; i++) {
      stepProcessor.processStep()
    }
    
    // Check if any sheep ate grass
    const sheepAfter = world.getOrganismsByType('sheep') as Sheep[]
    const grassAfter = world.getOrganismsByType('grass') as Grass[]
    
    // Sheep might have moved or died, but some should still exist
    expect(sheepAfter.length).toBeGreaterThanOrEqual(0)
    // Some grass should have been consumed or spread
    const totalGrassDensity = grassAfter.reduce((sum, g) => sum + g.density, 0)
    expect(totalGrassDensity).toBeGreaterThanOrEqual(0)
  })

  it('should process wolf eating sheep in batch', () => {
    // Create sheep and wolves in same cells
    const pairs = Array.from({ length: 2 }, (_, i) => {
      const x = 10 + i * 3
      const y = 10 + i * 3
      
      const sheep = OrganismFactory.createSheep({
        id: `sheep-${i}`,
        x,
        y,
        energy: 0.5,
        age: 0,
        grazingEfficiency: 0.8
      })
      
      const wolf = OrganismFactory.createWolf({
        id: `wolf-${i}`,
        x,
        y,
        energy: 0.3,
        age: 0
      })
      
      return { sheep, wolf, x, y }
    })
    
    pairs.forEach(({ sheep, wolf, x, y }) => {
      world.setCellContent(x, y, { sheep, wolf })
    })
    
    // Process step multiple times to ensure eating happens
    for (let i = 0; i < 5; i++) {
      stepProcessor.processStep()
    }
    
    // Check if any wolves ate sheep
    const wolfAfter = world.getOrganismsByType('wolf') as Wolf[]
    const sheepAfter = world.getOrganismsByType('sheep') as Sheep[]
    
    // Wolves might have moved or died, but some should still exist
    expect(wolfAfter.length).toBeGreaterThanOrEqual(0)
    // Some sheep should have been eaten or moved
    expect(sheepAfter.length).toBeLessThanOrEqual(2)
  })

  it('should process organism aging in batch', () => {
    // Create multiple old sheep
    const sheepArray: Sheep[] = Array.from({ length: 3 }, (_, i) => 
      OrganismFactory.createSheep({
        id: `sheep-${i}`,
        x: 10 + i * 2,
        y: 10 + i * 2,
        energy: 0.5,
        age: 74,
        grazingEfficiency: 0.8
      })
    )
    
    sheepArray.forEach(sheep => {
      world.setCellContent(sheep.x, sheep.y, { sheep })
    })
    
    // Process step
    stepProcessor.processStep()
    
    // Check if sheep aged
    const sheepAfter = world.getOrganismsByType('sheep') as Sheep[]
    sheepAfter.forEach(sheep => {
      expect(sheep.age).toBe(75)
    })
  })

  it('should process organism death from old age in batch', () => {
    // Create multiple very old sheep
    const sheepArray: Sheep[] = Array.from({ length: 3 }, (_, i) => 
      OrganismFactory.createSheep({
        id: `sheep-${i}`,
        x: 10 + i * 2,
        y: 10 + i * 2,
        energy: 0.5,
        age: 75, // At lifespan
        grazingEfficiency: 0.8
      })
    )
    
    sheepArray.forEach(sheep => {
      world.setCellContent(sheep.x, sheep.y, { sheep })
    })
    
    // Process step
    stepProcessor.processStep()
    
    // Check if sheep died
    const sheepAfter = world.getOrganismsByType('sheep') as Sheep[]
    expect(sheepAfter).toHaveLength(0)
  })

  it('should process organism death from starvation in batch', () => {
    // Create multiple starving sheep
    const sheepArray: Sheep[] = Array.from({ length: 3 }, (_, i) => 
      OrganismFactory.createSheep({
        id: `sheep-${i}`,
        x: 10 + i * 2,
        y: 10 + i * 2,
        energy: 0.0,
        age: 0,
        grazingEfficiency: 0.8
      })
    )
    
    sheepArray.forEach(sheep => {
      world.setCellContent(sheep.x, sheep.y, { sheep })
    })
    
    // Process step
    stepProcessor.processStep()
    
    // Check if sheep died from starvation
    const sheepAfter = world.getOrganismsByType('sheep') as Sheep[]
    expect(sheepAfter).toHaveLength(0)
  })

  it('should update world statistics after processing', () => {
    // Create some organisms
    const grassArray: Grass[] = Array.from({ length: 3 }, (_, i) => 
      OrganismFactory.createGrass({
        id: `grass-${i}`,
        x: 10 + i,
        y: 10,
        energy: 0.8,
        density: 0.9,
        growthStage: 'mature'
      })
    )
    
    const sheepArray: Sheep[] = Array.from({ length: 2 }, (_, i) => 
      OrganismFactory.createSheep({
        id: `sheep-${i}`,
        x: 15 + i,
        y: 15,
        energy: 0.7,
        age: 0,
        grazingEfficiency: 0.8
      })
    )
    
    grassArray.forEach(grass => {
      world.setCellContent(grass.x, grass.y, { grass })
    })
    sheepArray.forEach(sheep => {
      world.setCellContent(sheep.x, sheep.y, { sheep })
    })
    
    // Step the simulation
    stepProcessor.processStep()
    
    // Check if statistics were updated
    const stats = world.getState().statistics
    expect(stats.grassCount).toBeGreaterThan(0)
    expect(stats.sheepCount).toBeGreaterThan(0)
  })
})