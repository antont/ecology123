import { describe, it, expect, beforeEach } from 'vitest'
import { SimulationEngine } from './SimulationEngine'
import { WORLD_CONFIG } from '../config/WorldConfig'
import { WorldInitializer } from '../utils/WorldInitializer'

describe('Long-term Ecosystem Stability', () => {
  let simulationEngine: SimulationEngine

  beforeEach(() => {
    simulationEngine = new SimulationEngine(WORLD_CONFIG)
    initializeProductionEcosystem(simulationEngine)
  })

  const initializeProductionEcosystem = (sim: SimulationEngine) => {
    const world = sim.getWorld()
    WorldInitializer.createProductionEcosystem(world, WORLD_CONFIG)
  }

  it('should maintain all species for 1000 steps', () => {
    console.log('🎯 Testing 1000-step ecosystem stability...')
    
    const targetSteps = 1000
    let extinctionStep = -1
    let extinctSpecies = ''
    
    // Track populations over time
    const populationHistory: Array<{
      step: number
      grass: number
      sheep: number
      wolves: number
    }> = []

    for (let step = 0; step < targetSteps; step++) {
      simulationEngine.step()
      
      const stats = simulationEngine.getStatistics()
      const currentPop = {
        step,
        grass: stats.grassCount,
        sheep: stats.sheepCount,
        wolves: stats.wolfCount
      }
      
      populationHistory.push(currentPop)
      
      // Log every 100 steps
      if (step % 100 === 0) {
        console.log(`Step ${step}: Grass=${currentPop.grass}, Sheep=${currentPop.sheep}, Wolves=${currentPop.wolves}`)
      }
      
      // Check for extinctions
      if (currentPop.sheep === 0 && extinctionStep === -1) {
        extinctionStep = step
        extinctSpecies = 'sheep'
        break
      }
      
      if (currentPop.wolves === 0 && extinctionStep === -1) {
        extinctionStep = step
        extinctSpecies = 'wolves'
        break
      }
      
      // Grass extinction is less critical but still track it
      if (currentPop.grass === 0 && extinctionStep === -1) {
        extinctionStep = step
        extinctSpecies = 'grass'
        break
      }
    }
    
    // Analysis
    const finalStats = simulationEngine.getStatistics()
    console.log(`\n📊 Final Results after ${extinctionStep === -1 ? targetSteps : extinctionStep} steps:`)
    console.log(`Grass: ${finalStats.grassCount}`)
    console.log(`Sheep: ${finalStats.sheepCount}`)
    console.log(`Wolves: ${finalStats.wolfCount}`)
    
    if (extinctionStep !== -1) {
      console.log(`💀 ${extinctSpecies} went extinct at step ${extinctionStep}`)
      
      // Show population trends leading to extinction
      const preExtinction = populationHistory.slice(Math.max(0, extinctionStep - 50), extinctionStep)
      console.log('\n📉 Population trend before extinction:')
      preExtinction.forEach(pop => {
        if (pop.step % 10 === 0) {
          console.log(`  Step ${pop.step}: Grass=${pop.grass}, Sheep=${pop.sheep}, Wolves=${pop.wolves}`)
        }
      })
    } else {
      console.log('✅ All species survived 1000 steps!')
      
      // Show population oscillations
      const samples = [0, 250, 500, 750, 999].map(i => populationHistory[i])
      console.log('\n📈 Population samples throughout simulation:')
      samples.forEach(pop => {
        console.log(`  Step ${pop.step}: Grass=${pop.grass}, Sheep=${pop.sheep}, Wolves=${pop.wolves}`)
      })
    }
    
    // The test passes if all species survive 1000 steps
    expect(extinctionStep).toBe(-1)
    expect(finalStats.sheepCount).toBeGreaterThan(0)
    expect(finalStats.wolfCount).toBeGreaterThan(0)
    expect(finalStats.grassCount).toBeGreaterThan(0)
  }, 60000) // 60 second timeout for long test

  it('should show population oscillations over 500 steps', () => {
    console.log('🌊 Testing population oscillations...')
    
    const targetSteps = 500
    const populationHistory: Array<{
      step: number
      sheep: number
      wolves: number
    }> = []

    for (let step = 0; step < targetSteps; step++) {
      simulationEngine.step()
      
      const stats = simulationEngine.getStatistics()
      populationHistory.push({
        step,
        sheep: stats.sheepCount,
        wolves: stats.wolfCount
      })
      
      // Early exit if extinction occurs
      if (stats.sheepCount === 0 || stats.wolfCount === 0) {
        console.log(`💀 Extinction at step ${step}: Sheep=${stats.sheepCount}, Wolves=${stats.wolfCount}`)
        break
      }
    }
    
    // Analyze oscillations
    const sheepCounts = populationHistory.map(p => p.sheep)
    const wolfCounts = populationHistory.map(p => p.wolves)
    
    const sheepMax = Math.max(...sheepCounts)
    const sheepMin = Math.min(...sheepCounts)
    const wolfMax = Math.max(...wolfCounts)
    const wolfMin = Math.min(...wolfCounts)
    
    console.log(`\n📊 Population Ranges:`)
    console.log(`Sheep: ${sheepMin} - ${sheepMax} (range: ${sheepMax - sheepMin})`)
    console.log(`Wolves: ${wolfMin} - ${wolfMax} (range: ${wolfMax - wolfMin})`)
    
    // We expect some population variation (oscillations)
    expect(sheepMax - sheepMin).toBeGreaterThan(5) // Some sheep variation
    expect(wolfMax - wolfMin).toBeGreaterThan(1) // Some wolf variation
    expect(populationHistory.length).toBeGreaterThan(100) // Should survive at least 100 steps
  }, 30000) // 30 second timeout
})
