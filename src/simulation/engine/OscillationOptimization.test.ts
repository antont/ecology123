/**
 * Oscillation Optimization Test
 * 
 * This test measures and optimizes the number of predator-prey oscillations
 * in the ecosystem to achieve classic Lotka-Volterra dynamics.
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { SimulationEngine } from './SimulationEngine'
import { WORLD_CONFIG } from '../config/WorldConfig'
import { WorldInitializer } from '../utils/WorldInitializer'

describe('Oscillation Optimization', () => {
  let simulationEngine: SimulationEngine

  beforeEach(() => {
    simulationEngine = new SimulationEngine(WORLD_CONFIG)
    const world = simulationEngine.getWorld()
    WorldInitializer.createProductionEcosystem(world, WORLD_CONFIG)
  })

  test('should achieve at least 5 oscillation cycles in 1000 steps', async () => {
    console.log('🌊 Testing oscillation dynamics over 1000 steps...')
    
    let previousWolfCount = simulationEngine.getStatistics().wolfCount
    
    // Run simulation for 1000 steps
    for (let step = 0; step < 1000; step++) {
      simulationEngine.step()
      
      const stats = simulationEngine.getStatistics()
      
      // Track wolf population changes
      if (stats.wolfCount !== previousWolfCount) {
        console.log(`🐺 Step ${step + 1}: Wolf population changed ${previousWolfCount} → ${stats.wolfCount} (${stats.wolfCount - previousWolfCount})`)
        
        // Show wolf details if population is small
        if (stats.wolfCount <= 5) {
          const wolves = simulationEngine.getWorld().getOrganismsByType('wolf') as unknown as Array<{ id: string; energy: number; hunger: number; age: number }>
          wolves.forEach((wolf) => {
            const hungerThreshold = WORLD_CONFIG.wolf.hungerThreshold
            const deathHunger = hungerThreshold * 2
            const willDieSoon = wolf.energy <= 0.1 || wolf.hunger >= deathHunger - 10 || wolf.age >= WORLD_CONFIG.wolf.lifespan - 10
            console.log(`  Wolf ${wolf.id}: energy=${wolf.energy.toFixed(3)}, hunger=${wolf.hunger}/${deathHunger}, age=${wolf.age}/${WORLD_CONFIG.wolf.lifespan}${willDieSoon ? ' ⚠️ CRITICAL' : ''}`)
          })
        }
        
        previousWolfCount = stats.wolfCount
      }
      
      // Log major population changes
      if (step % 100 === 0) {
        console.log(`Step ${step}: Grass=${stats.grassCount}, Sheep=${stats.sheepCount}, Wolves=${stats.wolfCount}`)
      }
      
      // Stop early if all wolves are extinct
      if (stats.wolfCount === 0) {
        console.log(`🚨 All wolves extinct at step ${step + 1}!`)
        break
      }
    }
    
    const oscillationAnalysis = simulationEngine.getOscillationAnalysis()
    const stats = simulationEngine.getStatistics()
    
    console.log('\n🔬 OSCILLATION ANALYSIS RESULTS:')
    console.log(`Total Oscillation Cycles: ${oscillationAnalysis.totalCycles}`)
    console.log(`Cycles by Species:`, oscillationAnalysis.cyclesBySpecies)
    console.log(`Near-Extinction Recoveries: ${oscillationAnalysis.nearExtinctionRecoveries}`)
    console.log(`Overgrowth Corrections: ${oscillationAnalysis.overgrowthCorrections}`)
    console.log(`Average Cycle Duration: ${oscillationAnalysis.averageCycleDuration.toFixed(1)} steps`)
    console.log(`Oscillation Health: ${oscillationAnalysis.oscillationHealth}`)
    console.log(`Stability Score: ${oscillationAnalysis.stabilityScore}/100`)
    
    console.log('\n🔍 Recent Cycles:')
    oscillationAnalysis.recentCycles.slice(-5).forEach((cycle, i) => {
      console.log(`  ${i + 1}. ${cycle.species} ${cycle.cycleType} (${cycle.duration} steps, amplitude: ${cycle.amplitude})${cycle.triggerFactor ? ` - ${cycle.triggerFactor}` : ''}`)
    })
    
    console.log(`\n📊 Final Populations: Grass=${stats.grassCount}, Sheep=${stats.sheepCount}, Wolves=${stats.wolfCount}`)
    
    // Test requirements for healthy oscillations
    expect(oscillationAnalysis.totalCycles).toBeGreaterThanOrEqual(5)
    
    expect(oscillationAnalysis.nearExtinctionRecoveries).toBeGreaterThanOrEqual(1)
    
    expect(oscillationAnalysis.stabilityScore).toBeGreaterThanOrEqual(30)
    
    // All species should still be alive for true oscillations
    expect(stats.sheepCount).toBeGreaterThan(0)
    expect(stats.wolfCount).toBeGreaterThan(0)
  })

  test('should achieve wolf population recovery after decline', async () => {
    console.log('🐺 Testing wolf recovery dynamics...')
    
    let minWolfPopulation = Infinity
    let maxWolfPopulation = 0
    let wolfRecoveries = 0
    let lastWolfCount = 0
    
    // Run simulation and track wolf population dynamics
    for (let step = 0; step < 150; step++) {
      simulationEngine.step()
      const stats = simulationEngine.getStatistics()
      
      // Track wolf population extremes
      if (stats.wolfCount < minWolfPopulation) {
        minWolfPopulation = stats.wolfCount
      }
      if (stats.wolfCount > maxWolfPopulation) {
        maxWolfPopulation = stats.wolfCount
      }
      
      // Detect recovery (population increases after being low)
      if (lastWolfCount < 10 && stats.wolfCount > lastWolfCount + 5) {
        wolfRecoveries++
        console.log(`🔄 Wolf recovery detected at step ${step}: ${lastWolfCount} → ${stats.wolfCount}`)
      }
      
      lastWolfCount = stats.wolfCount
      
      // Break if wolves go extinct
      if (stats.wolfCount === 0) {
        console.log(`💀 Wolves extinct at step ${step}`)
        break
      }
    }
    
    const oscillationAnalysis = simulationEngine.getOscillationAnalysis()
    
    console.log(`\n🐺 Wolf Population Analysis:`)
    console.log(`Min Wolf Population: ${minWolfPopulation}`)
    console.log(`Max Wolf Population: ${maxWolfPopulation}`)
    console.log(`Wolf Recoveries Detected: ${wolfRecoveries}`)
    console.log(`Near-Extinction Recoveries: ${oscillationAnalysis.nearExtinctionRecoveries}`)
    
    // Test that wolves can recover from low populations
    expect(wolfRecoveries).toBeGreaterThanOrEqual(1)
    
    expect(minWolfPopulation).toBeLessThan(15)
    
    expect(maxWolfPopulation).toBeGreaterThan(20)
  })

  test('should demonstrate predator-prey coupling', async () => {
    console.log('🔗 Testing predator-prey coupling dynamics...')
    
    const populationHistory: Array<{ step: number; sheep: number; wolves: number }> = []
    
    // Run simulation and collect data
    for (let step = 0; step < 100; step++) {
      simulationEngine.step()
      const stats = simulationEngine.getStatistics()
      
      populationHistory.push({
        step,
        sheep: stats.sheepCount,
        wolves: stats.wolfCount
      })
    }
    
    // Analyze coupling: when wolves increase, sheep should eventually decrease
    let couplingEvents = 0
    
    for (let i = 10; i < populationHistory.length - 10; i++) {
      const wolfIncrease = populationHistory[i].wolves > populationHistory[i - 5].wolves * 1.2
      const sheepDecreaseAfter = populationHistory[i + 5].sheep < populationHistory[i].sheep * 0.8
      
      if (wolfIncrease && sheepDecreaseAfter) {
        couplingEvents++
        console.log(`🔗 Coupling event at step ${populationHistory[i].step}: Wolf↑ → Sheep↓`)
      }
    }
    
    const oscillationAnalysis = simulationEngine.getOscillationAnalysis()
    
    console.log(`\n🔗 Predator-Prey Coupling Analysis:`)
    console.log(`Coupling Events Detected: ${couplingEvents}`)
    console.log(`Total Oscillation Cycles: ${oscillationAnalysis.totalCycles}`)
    
    // Test for evidence of predator-prey coupling
    expect(couplingEvents).toBeGreaterThanOrEqual(1)
    
    expect(oscillationAnalysis.totalCycles).toBeGreaterThanOrEqual(3)
  })

  test('should optimize parameters for maximum oscillations', async () => {
    console.log('⚙️ Testing parameter optimization for oscillations...')
    
    // Test current configuration
    const baselineResult = await runOscillationTest(simulationEngine)
    
    console.log(`\n📊 Baseline Results:`)
    console.log(`Oscillation Cycles: ${baselineResult.totalCycles}`)
    console.log(`Stability Score: ${baselineResult.stabilityScore}`)
    console.log(`Duration: ${baselineResult.duration} steps`)
    
    // Provide optimization suggestions based on results
    if (baselineResult.totalCycles < 5) {
      console.log('\n💡 OPTIMIZATION SUGGESTIONS:')
      console.log('- Reduce wolf hunting efficiency to allow sheep recovery periods')
      console.log('- Increase sheep reproduction rate for faster population recovery')
      console.log('- Adjust wolf energy consumption to create boom-bust cycles')
      console.log('- Consider reducing world size for more intense interactions')
    }
    
    if (baselineResult.stabilityScore < 50) {
      console.log('\n🔧 STABILITY IMPROVEMENTS:')
      console.log('- Balance predator-prey ratios more carefully')
      console.log('- Ensure wolves can survive lean periods without going extinct')
      console.log('- Allow sheep to recover quickly when predation pressure drops')
    }
    
    // The test passes if we achieve reasonable oscillations
    expect(baselineResult.totalCycles).toBeGreaterThanOrEqual(3)
  })
})

/**
 * Helper function to run oscillation test
 */
async function runOscillationTest(engine: SimulationEngine): Promise<{
  totalCycles: number;
  stabilityScore: number;
  duration: number;
  finalPopulations: { sheep: number; wolves: number };
}> {
  let duration = 0
  
  // Run until extinction or 1000 steps
  for (let step = 0; step < 1000; step++) {
    engine.step()
    duration = step + 1
    
    const stats = engine.getStatistics()
    if (stats.sheepCount === 0 || stats.wolfCount === 0) {
      break
    }
  }
  
  const oscillationAnalysis = engine.getOscillationAnalysis()
  const finalStats = engine.getStatistics()
  
  return {
    totalCycles: oscillationAnalysis.totalCycles,
    stabilityScore: oscillationAnalysis.stabilityScore,
    duration,
    finalPopulations: {
      sheep: finalStats.sheepCount,
      wolves: finalStats.wolfCount
    }
  }
}
