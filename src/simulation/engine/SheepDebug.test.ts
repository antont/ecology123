import { describe, it, expect, beforeEach } from 'vitest'
import { SimulationEngine } from './SimulationEngine'
import { WORLD_CONFIG } from '../config/WorldConfig'
import { Grass, Sheep, Wolf, Direction } from '../types/SimulationTypes'

describe('Sheep Debug', () => {
  let simulationEngine: SimulationEngine

  beforeEach(() => {
    simulationEngine = new SimulationEngine(WORLD_CONFIG)
    initializeTestEcosystem(simulationEngine)
  })

  const initializeTestEcosystem = (sim: SimulationEngine) => {
    const world = sim.getWorld()
    
    // Add dense grass coverage
    for (let x = 10; x < 40; x += 1) {
      for (let y = 10; y < 40; y += 1) {
        const grass: Grass = {
          id: `grass-${x}-${y}`,
          x,
          y,
          energy: 0.8,
          age: 0,
          isAlive: true,
          density: 0.9, // Very high density
          growthStage: 'mature',
          lastGrazed: 0,
          seasonalGrowth: 1.0
        }
        
        world.setCellContent(x, y, { grass })
      }
    }
    
    // Add sheep with high energy
    for (let i = 0; i < 5; i++) {
      const x = 20 + i * 2
      const y = 20 + i * 2
      
      const sheep: Sheep = {
        id: `sheep-${i}`,
        x,
        y,
        energy: 0.9, // High energy
        age: 0,
        isAlive: true,
        hunger: 0,
        reproductionCooldown: 0,
        lastDirection: Direction.NORTH,
        grazingEfficiency: 0.9
      }
      
      world.setCellContent(x, y, { sheep })
    }
    
    world.updateStatistics()
  }

  it('should track sheep energy and eating over time', () => {
    const world = simulationEngine.getWorld()
    
    for (let step = 0; step < 20; step++) {
      simulationEngine.step()
      
      const sheep = world.getOrganismsByType('sheep') as Sheep[]
      const grass = world.getOrganismsByType('grass') as Grass[]
      
      console.log(`Step ${step}: Sheep=${sheep.length}, Grass=${grass.length}`)
      
      if (sheep.length > 0) {
        sheep.forEach((s, i) => {
          console.log(`  Sheep ${i}: energy=${s.energy.toFixed(2)}, hunger=${s.hunger}, pos=(${s.x},${s.y})`)
          
          // Check if sheep is on grass
          const cell = world.getCell(s.x, s.y)
          if (cell?.grass) {
            console.log(`    On grass: density=${cell.grass.density.toFixed(2)}`)
          } else {
            console.log(`    No grass at position`)
          }
        })
      }
      
      if (sheep.length === 0) {
        console.log(`  All sheep died at step ${step}`)
        break
      }
    }
    
    const finalStats = simulationEngine.getStatistics()
    expect(finalStats.sheepCount).toBeGreaterThan(0)
  })
})
