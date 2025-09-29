/**
 * World class manages the 2D grid and world state for the ecological simulation
 */

import { WorldConfig } from '../config/WorldConfig'
import { 
  WorldState, 
  WorldCell, 
  Season, 
  Grass, 
  Sheep, 
  Wolf,
  Organism,
  DeathRecord,
  DeathStatistics
} from '../types/SimulationTypes'

export class World {
  private state: WorldState
  private config: WorldConfig

  constructor(config: WorldConfig) {
    this.config = config
    this.state = this.initializeWorld()
  }

  private initializeWorld(): WorldState {
    const cells: WorldCell[][] = []
    
    // Initialize empty grid
    for (let x = 0; x < this.config.width; x++) {
      cells[x] = []
      for (let y = 0; y < this.config.height; y++) {
        cells[x][y] = {
          x,
          y,
          temperature: 20, // Default temperature
          season: Season.SPRING
        }
      }
    }

    return {
      width: this.config.width,
      height: this.config.height,
      cells,
      currentStep: 0,
      season: Season.SPRING,
      temperature: 20,
      statistics: {
        totalSteps: 0,
        grassCount: 0,
        sheepCount: 0,
        wolfCount: 0,
        totalEnergy: 0,
        averageGrassDensity: 0,
        averageSheepEnergy: 0,
        averageWolfEnergy: 0,
        extinctionEvents: [],
        populationHistory: [],
        deathStats: this.initializeDeathStats()
      }
    }
  }

  private initializeDeathStats(): DeathStatistics {
    return {
      totalDeaths: 0,
      deathsByCause: {},
      deathsByType: {},
      recentDeaths: [],
      step: 0,
      sheepDeaths: 0,
      wolfDeaths: 0,
      grassDeaths: 0
    }
  }

  public recordDeath(organism: Organism, cause: DeathRecord['cause'], details?: string): void {
    const organismType = this.getOrganismType(organism)
    
    // Gather environmental context
    const environmentalFactors = this.gatherEnvironmentalContext(organism)
    const reproductionState = this.getReproductionContext(organism)
    
    const deathRecord: DeathRecord = {
      organismId: organism.id,
      organismType,
      cause,
      step: this.state.currentStep,
      energy: organism.energy,
      age: organism.age,
      x: organism.x,
      y: organism.y,
      details,
      populationAtDeath: {
        grass: this.state.statistics.grassCount,
        sheep: this.state.statistics.sheepCount,
        wolves: this.state.statistics.wolfCount
      },
      reproductionState,
      environmentalFactors
    }

    // Add to recent deaths (keep last 50)
    this.state.statistics.deathStats.recentDeaths.push(deathRecord)
    if (this.state.statistics.deathStats.recentDeaths.length > 50) {
      this.state.statistics.deathStats.recentDeaths.shift()
    }

    // Update counters
    this.state.statistics.deathStats.totalDeaths++
    this.state.statistics.deathStats.deathsByCause[cause] = 
      (this.state.statistics.deathStats.deathsByCause[cause] || 0) + 1
    this.state.statistics.deathStats.deathsByType[deathRecord.organismType] = 
      (this.state.statistics.deathStats.deathsByType[deathRecord.organismType] || 0) + 1

    // Update specific counters
    if (deathRecord.organismType === 'sheep') {
      this.state.statistics.deathStats.sheepDeaths++
    } else if (deathRecord.organismType === 'wolf') {
      this.state.statistics.deathStats.wolfDeaths++
    } else if (deathRecord.organismType === 'grass') {
      this.state.statistics.deathStats.grassDeaths++
    }

    // Log death for debugging
    console.log(`💀 Death at step ${this.state.currentStep}: ${deathRecord.organismType} ${organism.id} died of ${cause} (energy: ${organism.energy.toFixed(2)}, age: ${organism.age})`)
  }

  private getOrganismType(organism: Organism): 'grass' | 'sheep' | 'wolf' {
    if ('density' in organism) return 'grass'
    if ('grazingEfficiency' in organism) return 'sheep'
    if ('huntingTarget' in organism) return 'wolf'
    return 'grass'
  }

  public getDeathStatistics(): DeathStatistics {
    return { ...this.state.statistics.deathStats }
  }

  public getWidth(): number {
    return this.state.width
  }

  public getHeight(): number {
    return this.state.height
  }

  public getCells(): WorldCell[][] {
    return this.state.cells
  }

  public getCell(x: number, y: number): WorldCell | null {
    if (!this.isValidPosition(x, y)) {
      return null
    }
    return this.state.cells[x][y]
  }

  public getSeason(): Season {
    return this.state.season
  }

  public getTemperature(): number {
    return this.state.temperature
  }

  public getCurrentStep(): number {
    return this.state.currentStep
  }

  public getState(): WorldState {
    return { ...this.state }
  }

  public setCellContent(x: number, y: number, content: Partial<WorldCell>): boolean {
    if (!this.isValidPosition(x, y)) {
      return false
    }

    const cell = this.state.cells[x][y]
    
    // Update cell content
    if (content.grass !== undefined) {
      cell.grass = content.grass
    }
    if (content.sheep !== undefined) {
      cell.sheep = content.sheep
    }
    if (content.wolf !== undefined) {
      cell.wolf = content.wolf
    }
    if (content.temperature !== undefined) {
      cell.temperature = content.temperature
    }
    if (content.season !== undefined) {
      cell.season = content.season
    }

    return true
  }

  public clearCellContent(x: number, y: number): boolean {
    if (!this.isValidPosition(x, y)) {
      return false
    }

    const cell = this.state.cells[x][y]
    delete cell.grass
    delete cell.sheep
    delete cell.wolf

    return true
  }

  public incrementStep(): void {
    this.state.currentStep++
    this.state.statistics.totalSteps++
    
    // Update season based on step count
    this.updateSeason()
    
    // Update temperature based on season
    this.updateTemperature()
    
    // Update all cells with current season and temperature
    this.updateAllCells()
  }

  public getOrganismsByType(type: 'grass' | 'sheep' | 'wolf'): Organism[] {
    const organisms: Organism[] = []
    
    for (let x = 0; x < this.state.width; x++) {
      for (let y = 0; y < this.state.height; y++) {
        const cell = this.state.cells[x][y]
        
        if (type === 'grass' && cell.grass) {
          organisms.push(cell.grass)
        } else if (type === 'sheep' && cell.sheep) {
          organisms.push(cell.sheep)
        } else if (type === 'wolf' && cell.wolf) {
          organisms.push(cell.wolf)
        }
      }
    }
    
    return organisms
  }

  public updateStatistics(): void {
    const grass = this.getOrganismsByType('grass') as Grass[]
    const sheep = this.getOrganismsByType('sheep') as Sheep[]
    const wolves = this.getOrganismsByType('wolf') as Wolf[]
    
    this.state.statistics.grassCount = grass.length
    this.state.statistics.sheepCount = sheep.length
    this.state.statistics.wolfCount = wolves.length
    
    // Calculate total energy
    const totalEnergy = [...grass, ...sheep, ...wolves]
      .reduce((sum, org) => sum + org.energy, 0)
    this.state.statistics.totalEnergy = totalEnergy
    
    // Calculate average grass density
    if (grass.length > 0) {
      const totalDensity = grass.reduce((sum, g) => sum + g.density, 0)
      this.state.statistics.averageGrassDensity = totalDensity / grass.length
    } else {
      this.state.statistics.averageGrassDensity = 0
    }
    
    // Calculate average sheep energy
    if (sheep.length > 0) {
      const totalSheepEnergy = sheep.reduce((sum, s) => sum + s.energy, 0)
      this.state.statistics.averageSheepEnergy = totalSheepEnergy / sheep.length
    } else {
      this.state.statistics.averageSheepEnergy = 0
    }
    
    // Calculate average wolf energy
    if (wolves.length > 0) {
      const totalWolfEnergy = wolves.reduce((sum, w) => sum + w.energy, 0)
      this.state.statistics.averageWolfEnergy = totalWolfEnergy / wolves.length
    } else {
      this.state.statistics.averageWolfEnergy = 0
    }
  }

  private isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.state.width && y >= 0 && y < this.state.height
  }

  private gatherEnvironmentalContext(organism: Organism): DeathRecord['environmentalFactors'] {
    const radius = 5 // Check 5-cell radius around organism
    let nearbyPrey = 0
    let nearbyPredators = 0
    let localGrassDensity = 0
    let grassCells = 0

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = organism.x + dx
        const y = organism.y + dy
        
        if (!this.isValidPosition(x, y)) continue
        
        const cell = this.state.cells[x][y]
        
        // Count grass density
        if (cell.grass) {
          localGrassDensity += cell.grass.density
          grassCells++
        }
        
        // Count prey and predators based on organism type
        const organismType = this.getOrganismType(organism)
        if (organismType === 'wolf') {
          if (cell.sheep) nearbyPrey++
        } else if (organismType === 'sheep') {
          if (cell.wolf) nearbyPredators++
        }
      }
    }

    return {
      nearbyPrey: nearbyPrey > 0 ? nearbyPrey : undefined,
      nearbyPredators: nearbyPredators > 0 ? nearbyPredators : undefined,
      localGrassDensity: grassCells > 0 ? localGrassDensity / grassCells : 0,
      territoryOverlap: false // TODO: Implement territory overlap detection
    }
  }

  private getReproductionContext(organism: Organism): DeathRecord['reproductionState'] {
    // Type guard to check if organism has reproduction state
    if ('reproductionState' in organism && organism.reproductionState) {
      const repState = organism.reproductionState as { isPregnant?: boolean }
      const orgWithOffspring = organism as { reproductionCooldown?: number; offspring?: unknown[] }
      return {
        isPregnant: repState.isPregnant || false,
        cooldownRemaining: orgWithOffspring.reproductionCooldown || 0,
        offspring: orgWithOffspring.offspring?.length || 0
      }
    }
    
    return undefined
  }

  private updateSeason(): void {
    const seasonLength = this.config.world.seasonLength
    const step = this.state.currentStep
    
    if (step < seasonLength) {
      this.state.season = Season.SPRING
    } else if (step < seasonLength * 2) {
      this.state.season = Season.SUMMER
    } else if (step < seasonLength * 3) {
      this.state.season = Season.AUTUMN
    } else if (step < seasonLength * 4) {
      this.state.season = Season.WINTER
    } else {
      // Reset to spring after full year
      this.state.season = Season.SPRING
    }
  }

  private updateTemperature(): void {
    const baseTemp = 20
    const season = this.state.season
    
    switch (season) {
      case Season.SPRING:
        this.state.temperature = baseTemp + 5
        break
      case Season.SUMMER:
        this.state.temperature = baseTemp + 15
        break
      case Season.AUTUMN:
        this.state.temperature = baseTemp + 5
        break
      case Season.WINTER:
        this.state.temperature = baseTemp - 10
        break
    }
  }

  private updateAllCells(): void {
    for (let x = 0; x < this.state.width; x++) {
      for (let y = 0; y < this.state.height; y++) {
        const cell = this.state.cells[x][y]
        cell.season = this.state.season
        cell.temperature = this.state.temperature
      }
    }
  }
}
