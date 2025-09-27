import { describe, it, expect, beforeEach } from 'vitest'
import { SimulationEngine } from './SimulationEngine'
import { WORLD_CONFIG } from '../config/WorldConfig'
import { Grass, Sheep, Wolf, Direction } from '../types/SimulationTypes'

describe('Wolf Debug', () => {
  let simulationEngine: SimulationEngine

  beforeEach(() => {
    simulationEngine = new SimulationEngine(WORLD_CONFIG)
    initializeTestEcosystem(simulationEngine)
  })

  const initializeTestEcosystem = (sim: SimulationEngine) => {
    const world = sim.getWorld()
    
    // Add grass
    for (let x = 10; x < 40; x += 2) {
      for (let y = 10; y < 40; y += 2) {
        const grass: Grass = {
          id: `grass-${x}-${y}`,
          x,
          y,
          energy: 0.8,
          age: 0,
          isAlive: true,
          density: 0.8,
          growthStage: 'mature',
          lastGrazed: 0,
          seasonalGrowth: 1.0
        }
        
        world.setCellContent(x, y, { grass })
      }
    }
    
    // Add sheep near wolves
    for (let i = 0; i < 10; i++) {
      const x = 20 + (i % 3) * 5
      const y = 20 + Math.floor(i / 3) * 5
      
      const sheep: Sheep = {
        id: `sheep-${i}`,
        x,
        y,
        energy: 0.9,
        age: 0,
        isAlive: true,
        hunger: 0,
        reproductionCooldown: 0,
        lastDirection: Direction.NORTH,
        grazingEfficiency: 0.9
      }
      
      world.setCellContent(x, y, { sheep })
    }
    
    // Add wolves
    for (let i = 0; i < 2; i++) {
      const x = 25 + i * 10
      const y = 25 + i * 5
      
      const wolf: Wolf = {
        id: `wolf-${i}`,
        x,
        y,
        energy: 0.9,
        age: 0,
        isAlive: true,
        hunger: 0,
        reproductionCooldown: 0,
        lastDirection: Direction.NORTH,
        huntingTarget: undefined
      }
      
      world.setCellContent(x, y, { wolf })
    }
    
    world.updateStatistics()
  }

  it('should track wolf energy and hunting over time', () => {
    const world = simulationEngine.getWorld()
    
    for (let step = 0; step < 20; step++) {
      simulationEngine.step()
      
      const wolves = world.getOrganismsByType('wolf') as Wolf[]
      const sheep = world.getOrganismsByType('sheep') as Sheep[]
      
      console.log(`Step ${step}: Wolves=${wolves.length}, Sheep=${sheep.length}`)
      
      if (wolves.length > 0) {
        wolves.forEach((wolf, i) => {
          console.log(`  Wolf ${i}: energy=${wolf.energy.toFixed(2)}, hunger=${wolf.hunger}, hunting=${wolf.huntingTarget || 'none'}`)
        })
      }
      
      if (wolves.length === 0) {
        console.log(`  All wolves died at step ${step}`)
        break
      }
    }
    
    const finalStats = simulationEngine.getStatistics()
    expect(finalStats.wolfCount).toBeGreaterThan(0)
  })
})
