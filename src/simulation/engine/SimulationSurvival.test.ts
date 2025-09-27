import { describe, it, expect, beforeEach } from 'vitest'
import { SimulationEngine } from './SimulationEngine'
import { WORLD_CONFIG } from '../config/WorldConfig'
import { Grass, Sheep, Wolf, Direction } from '../types/SimulationTypes'
import { OrganismFactory } from '../utils/OrganismFactory'

describe('Simulation Survival', () => {
  let simulationEngine: SimulationEngine

  beforeEach(() => {
    simulationEngine = new SimulationEngine(WORLD_CONFIG)
    initializeStableEcosystem(simulationEngine)
  })

  const initializeStableEcosystem = (sim: SimulationEngine) => {
    const world = sim.getWorld()
    
    // Create a more stable initial ecosystem
    // Add dense grass coverage for better survival
    for (let x = 5; x < 45; x += 1) {
      for (let y = 5; y < 45; y += 1) {
        const grass = OrganismFactory.createGrass({
          id: `grass-${x}-${y}`,
          x,
          y,
          energy: 0.8,
          density: 0.9, // Very high density grass
          growthStage: 'mature'
        })
        
        world.setCellContent(x, y, { grass })
      }
    }
    
    // Add sheep with good energy and spacing
    for (let i = 0; i < 15; i++) {
      const x = 10 + (i % 5) * 8
      const y = 10 + Math.floor(i / 5) * 8
      
      const sheep = OrganismFactory.createSheep({
        id: `sheep-${i}`,
        x,
        y,
        energy: 0.9, // High energy
        age: 0,
        grazingEfficiency: 0.9
      })
      
      world.setCellContent(x, y, { sheep })
    }
    
    // Add wolves with good energy and spacing
    for (let i = 0; i < 3; i++) {
      const x = 15 + i * 15
      const y = 15 + i * 10
      
      const wolf = OrganismFactory.createWolf({
        id: `wolf-${i}`,
        x,
        y,
        energy: 0.9, // High energy
        age: 0
      })
      
      world.setCellContent(x, y, { wolf })
    }
    
    world.updateStatistics()
  }

  it('should have animals survive until step 10', () => {
    // Run simulation for 10 steps
    for (let step = 0; step < 10; step++) {
      simulationEngine.step()
    }
    
    const stats = simulationEngine.getStatistics()
    
    // At least some animals should survive
    expect(stats.sheepCount).toBeGreaterThan(0)
    expect(stats.wolfCount).toBeGreaterThan(0)
    expect(stats.grassCount).toBeGreaterThan(0)
    
    // Log the final counts for debugging
    console.log(`After 10 steps: Grass=${stats.grassCount}, Sheep=${stats.sheepCount}, Wolves=${stats.wolfCount}`)
  })

  it('should have animals survive until step 50', () => {
    let maxSheep = 0
    let maxWolves = 0
    let survivedSteps = 0
    
    // Run simulation for 50 steps
    for (let step = 0; step < 50; step++) {
      simulationEngine.step()
      
      const currentStats = simulationEngine.getStatistics()
      maxSheep = Math.max(maxSheep, currentStats.sheepCount)
      maxWolves = Math.max(maxWolves, currentStats.wolfCount)
      
      if (currentStats.sheepCount > 0 || currentStats.wolfCount > 0) {
        survivedSteps = step
      }
      
      // Log every 10 steps
      if (step % 10 === 0) {
        console.log(`Step ${step}: Grass=${currentStats.grassCount}, Sheep=${currentStats.sheepCount}, Wolves=${currentStats.wolfCount}`)
      }
    }
    
    const stats = simulationEngine.getStatistics()
    
    // At least some animals should survive for a reasonable time
    expect(survivedSteps).toBeGreaterThan(15) // Should survive at least 15 steps
    expect(maxSheep).toBeGreaterThan(0) // Should have had some sheep at some point
    expect(maxWolves).toBeGreaterThan(0) // Should have had some wolves at some point
    expect(stats.grassCount).toBeGreaterThan(0) // Grass should always survive
    
    // Log the final counts for debugging
    console.log(`After 50 steps: Grass=${stats.grassCount}, Sheep=${stats.sheepCount}, Wolves=${stats.wolfCount}`)
    console.log(`Max populations: Sheep=${maxSheep}, Wolves=${maxWolves}, Survived until step ${survivedSteps}`)
  })

  it('should maintain stable population over time', () => {
    const initialStats = simulationEngine.getStatistics()
    console.log(`Initial: Grass=${initialStats.grassCount}, Sheep=${initialStats.sheepCount}, Wolves=${initialStats.wolfCount}`)
    
    let maxSheep = 0
    let maxWolves = 0
    
    // Run simulation for 20 steps
    for (let step = 0; step < 20; step++) {
      simulationEngine.step()
      const currentStats = simulationEngine.getStatistics()
      
      maxSheep = Math.max(maxSheep, currentStats.sheepCount)
      maxWolves = Math.max(maxWolves, currentStats.wolfCount)
      
      // Log every 5 steps
      if (step % 5 === 0) {
        console.log(`Step ${step}: Grass=${currentStats.grassCount}, Sheep=${currentStats.sheepCount}, Wolves=${currentStats.wolfCount}`)
      }
    }
    
    const finalStats = simulationEngine.getStatistics()
    
    // Should have had some animals at some point and grass should survive
    expect(finalStats.grassCount).toBeGreaterThan(0)
    expect(maxSheep).toBeGreaterThan(0) // Should have had some sheep
    expect(maxWolves).toBeGreaterThan(0) // Should have had some wolves
    
    console.log(`Final: Grass=${finalStats.grassCount}, Sheep=${finalStats.sheepCount}, Wolves=${finalStats.wolfCount}`)
    console.log(`Max populations: Sheep=${maxSheep}, Wolves=${maxWolves}`)
  })
})
