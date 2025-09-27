/**
 * Headless simulation test for analyzing ecosystem dynamics and death causes
 */

import { SimulationEngine } from './SimulationEngine'
import { WORLD_CONFIG } from '../config/WorldConfig'
import { DeathStatistics } from '../types/SimulationTypes'

export interface SimulationAnalysis {
  finalStep: number;
  finalPopulations: {
    grass: number;
    sheep: number;
    wolves: number;
  };
  deathStats: DeathStatistics;
  extinctionStep?: number;
  extinctionCause?: string;
  populationHistory: Array<{
    step: number;
    grass: number;
    sheep: number;
    wolves: number;
  }>;
}

export class HeadlessSimulationTest {
  private simulation: SimulationEngine
  private maxSteps: number
  private populationHistory: Array<{
    step: number;
    grass: number;
    sheep: number;
    wolves: number;
  }> = []

  constructor(maxSteps: number = 100) {
    this.maxSteps = maxSteps
    this.simulation = new SimulationEngine(WORLD_CONFIG)
    this.initializeWorld()
  }

  private initializeWorld(): void {
    const world = this.simulation.getWorld()
    
    // Add more grass for better survival
    for (let i = 0; i < 200; i++) {
      const x = Math.floor(Math.random() * WORLD_CONFIG.width)
      const y = Math.floor(Math.random() * WORLD_CONFIG.height)
      
      const grass = {
        id: `grass-${i}`,
        x,
        y,
        energy: 0.8,
        age: 0,
        isAlive: true,
        density: Math.random() * 0.8 + 0.2,
        growthStage: 'mature' as const,
        lastGrazed: 0,
        seasonalGrowth: 1.0
      }
      
      world.setCellContent(x, y, { grass })
    }
    
    // Add sheep
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * WORLD_CONFIG.width)
      const y = Math.floor(Math.random() * WORLD_CONFIG.height)
      
      const sheep = {
        id: `sheep-${i}`,
        x,
        y,
        energy: 0.9, // Higher initial energy
        age: 0,
        isAlive: true,
        hunger: 0,
        reproductionCooldown: 0,
        lastDirection: Direction.NORTH,
        grazingEfficiency: 0.8
      }
      
      world.setCellContent(x, y, { sheep })
    }
    
    // Add wolves
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(Math.random() * WORLD_CONFIG.width)
      const y = Math.floor(Math.random() * WORLD_CONFIG.height)
      
      const wolf = {
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

  public runAnalysis(): SimulationAnalysis {
    console.log('🔬 Starting headless simulation analysis...')
    console.log(`📊 Target: ${this.maxSteps} steps`)
    
    let extinctionStep: number | undefined
    let extinctionCause: string | undefined
    
    for (let step = 0; step < this.maxSteps; step++) {
      this.simulation.step()
      
      const stats = this.simulation.getStatistics()
      this.populationHistory.push({
        step: stats.step,
        grass: stats.grassCount,
        sheep: stats.sheepCount,
        wolves: stats.wolfCount
      })
      
      // Check for extinction
      if (stats.sheepCount === 0 && !extinctionStep) {
        extinctionStep = step
        extinctionCause = 'sheep_extinction'
        console.log(`⚠️  Sheep extinction at step ${step}`)
      }
      
      if (stats.wolfCount === 0 && !extinctionStep) {
        extinctionStep = step
        extinctionCause = 'wolf_extinction'
        console.log(`⚠️  Wolf extinction at step ${step}`)
      }
      
      if (stats.grassCount === 0 && !extinctionStep) {
        extinctionStep = step
        extinctionCause = 'grass_extinction'
        console.log(`⚠️  Grass extinction at step ${step}`)
      }
      
      // Log every 10 steps
      if (step % 10 === 0) {
        console.log(`Step ${step}: Grass=${stats.grassCount}, Sheep=${stats.sheepCount}, Wolves=${stats.wolfCount}`)
      }
      
      // Stop if all species extinct
      if (stats.grassCount === 0 && stats.sheepCount === 0 && stats.wolfCount === 0) {
        console.log(`💀 Total extinction at step ${step}`)
        break
      }
    }
    
    const finalStats = this.simulation.getStatistics()
    const deathStats = this.simulation.getWorld().getDeathStatistics()
    
    console.log('\n📈 Final Results:')
    console.log(`Final Step: ${finalStats.step}`)
    console.log(`Final Populations: Grass=${finalStats.grassCount}, Sheep=${finalStats.sheepCount}, Wolves=${finalStats.wolfCount}`)
    console.log(`Total Deaths: ${deathStats.totalDeaths}`)
    console.log(`Sheep Deaths: ${deathStats.sheepDeaths}`)
    console.log(`Wolf Deaths: ${deathStats.wolfDeaths}`)
    console.log(`Grass Deaths: ${deathStats.grassDeaths}`)
    
    console.log('\n💀 Death Causes:')
    Object.entries(deathStats.deathsByCause).forEach(([cause, count]) => {
      console.log(`  ${cause}: ${count}`)
    })
    
    console.log('\n🎯 Death by Type:')
    Object.entries(deathStats.deathsByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })
    
    return {
      finalStep: finalStats.step,
      finalPopulations: {
        grass: finalStats.grassCount,
        sheep: finalStats.sheepCount,
        wolves: finalStats.wolfCount
      },
      deathStats,
      extinctionStep,
      extinctionCause,
      populationHistory: this.populationHistory
    }
  }

  public runMultipleTests(count: number = 5): Array<SimulationAnalysis> {
    console.log(`🧪 Running ${count} simulation tests...`)
    const results: Array<SimulationAnalysis> = []
    
    for (let i = 0; i < count; i++) {
      console.log(`\n--- Test ${i + 1}/${count} ---`)
      this.simulation = new SimulationEngine(WORLD_CONFIG)
      this.populationHistory = []
      this.initializeWorld()
      results.push(this.runAnalysis())
    }
    
    // Analyze results
    console.log('\n📊 Aggregate Analysis:')
    const avgFinalStep = results.reduce((sum, r) => sum + r.finalStep, 0) / results.length
    const avgSheepDeaths = results.reduce((sum, r) => sum + r.deathStats.sheepDeaths, 0) / results.length
    const avgWolfDeaths = results.reduce((sum, r) => sum + r.deathStats.wolfDeaths, 0) / results.length
    const avgGrassDeaths = results.reduce((sum, r) => sum + r.deathStats.grassDeaths, 0) / results.length
    
    console.log(`Average Final Step: ${avgFinalStep.toFixed(1)}`)
    console.log(`Average Sheep Deaths: ${avgSheepDeaths.toFixed(1)}`)
    console.log(`Average Wolf Deaths: ${avgWolfDeaths.toFixed(1)}`)
    console.log(`Average Grass Deaths: ${avgGrassDeaths.toFixed(1)}`)
    
    const extinctionCount = results.filter(r => r.extinctionStep !== undefined).length
    console.log(`Extinction Rate: ${extinctionCount}/${count} (${(extinctionCount/count*100).toFixed(1)}%)`)
    
    return results
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const test = new HeadlessSimulationTest(100)
  test.runMultipleTests(3)
}
