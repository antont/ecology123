/**
 * StepProcessor handles the step-by-step processing of the simulation
 * Uses array-oriented, entity-component system approach for efficiency
 */

import { World } from './World'
import { WorldConfig } from '../config/WorldConfig'
import { 
  Grass, 
  Sheep, 
  Wolf, 
  Direction, 
  Season,
  WorldCell 
} from '../types/SimulationTypes'

export class StepProcessor {
  private world: World
  private config: WorldConfig

  constructor(world: World, config: WorldConfig) {
    this.world = world
    this.config = config
  }

  public processStep(): void {
    // Process all organisms in batch operations
    this.processGrassBatch()
    this.processSheepBatch()
    this.processWolvesBatch()
    
    // Update world statistics
    this.world.updateStatistics()
    
    // Increment world step
    this.world.incrementStep()
  }

  private processGrassBatch(): void {
    const grass = this.world.getOrganismsByType('grass') as Grass[]
    if (grass.length === 0) return

    // Batch process grass aging
    grass.forEach(g => g.age++)

    // Batch process grass growth
    this.processGrassGrowthBatch(grass)

    // Batch process grass spreading
    this.processGrassSpreadingBatch(grass)
  }

  private processGrassGrowthBatch(grass: Grass[]): void {
    const season = this.world.getSeason()
    const temperature = this.world.getTemperature()
    
    // Calculate growth rate modifiers once
    const seasonalModifier = this.getSeasonalGrowthModifier(season)
    const temperatureModifier = 1 + (temperature - 20) * this.config.world.temperatureEffect
    const baseGrowthRate = this.config.grass.growthRate
    
    // Process all grass with calculated modifiers
    grass.forEach(g => {
      if (!g.isAlive || g.density >= this.config.grass.maxDensity) return
      
      const growthRate = baseGrowthRate * seasonalModifier * temperatureModifier
      
      if (Math.random() < growthRate) {
        g.density = Math.min(g.density + 0.1, this.config.grass.maxDensity)
        g.growthStage = this.getGrowthStage(g.density)
      }
    })
  }

  private processGrassSpreadingBatch(grass: Grass[]): void {
    const matureGrass = grass.filter(g => g.isAlive && g.density >= 0.8)
    if (matureGrass.length === 0) return

    const spreadingRadius = this.config.grass.spreadingRadius
    const attempts = 3

    // Process spreading for all mature grass
    matureGrass.forEach(g => {
      for (let i = 0; i < attempts; i++) {
        const dx = Math.floor(Math.random() * (spreadingRadius * 2 + 1)) - spreadingRadius
        const dy = Math.floor(Math.random() * (spreadingRadius * 2 + 1)) - spreadingRadius
        
        const newX = g.x + dx
        const newY = g.y + dy
        
        if (this.isValidPosition(newX, newY)) {
          const targetCell = this.world.getCell(newX, newY)
          if (targetCell && !targetCell.grass) {
            this.createNewGrass(newX, newY)
            break // Only spread once per grass per step
          }
        }
      }
    })
  }

  private processSheepBatch(): void {
    const sheep = this.world.getOrganismsByType('sheep') as Sheep[]
    if (sheep.length === 0) return

    // Batch process sheep aging and energy consumption
    sheep.forEach(s => {
      s.age++
      s.hunger++
      s.energy -= this.config.sheep.energyPerStep
    })

    // Batch process deaths
    const aliveSheep = this.processDeaths(sheep, 'sheep')
    if (aliveSheep.length === 0) return

    // Batch process eating
    this.processSheepEatingBatch(aliveSheep)

    // Batch process movement
    this.processSheepMovementBatch(aliveSheep)

    // Batch process reproduction
    this.processSheepReproductionBatch(aliveSheep)
  }

  private processSheepEatingBatch(sheep: Sheep[]): void {
    const hungrySheep = sheep.filter(s => s.hunger >= this.config.sheep.hungerThreshold)
    if (hungrySheep.length === 0) return

    // Process eating for all hungry sheep
    hungrySheep.forEach(s => {
      // First try to eat grass in current cell
      const cell = this.world.getCell(s.x, s.y)
      if (cell?.grass && cell.grass.density > 0) {
        const consumed = Math.min(this.config.grass.consumptionRate, cell.grass.density)
        cell.grass.density -= consumed
        cell.grass.lastGrazed = this.world.getCurrentStep()
        
        s.energy += consumed * this.config.sheep.energyPerGrass
        s.hunger = 0

        if (cell.grass.density <= 0) {
          this.world.recordDeath(cell.grass, 'grazing', `Grazed by sheep ${s.id}`)
          this.world.clearCellContent(s.x, s.y)
        }
        return
      }
      
      // If no grass in current cell, try to find grass nearby
      const nearbyGrass = this.findNearbyOrganisms(s.x, s.y, 2, 'grass') as Grass[]
      if (nearbyGrass.length > 0) {
        const target = nearbyGrass[0]
        const targetCell = this.world.getCell(target.x, target.y)
        if (targetCell?.grass && targetCell.grass.density > 0) {
          const consumed = Math.min(this.config.grass.consumptionRate, targetCell.grass.density)
          targetCell.grass.density -= consumed
          targetCell.grass.lastGrazed = this.world.getCurrentStep()
          
          s.energy += consumed * this.config.sheep.energyPerGrass
          s.hunger = 0

          if (targetCell.grass.density <= 0) {
            this.world.recordDeath(targetCell.grass, 'grazing', `Grazed by sheep ${s.id}`)
            this.world.clearCellContent(target.x, target.y)
          }
        }
      }
    })
  }

  private processSheepMovementBatch(sheep: Sheep[]): void {
    const movementRange = this.config.sheep.movementRange
    const attempts = 3

    // Process movement for all sheep
    sheep.forEach(s => {
      // If sheep is hungry, try to find grass nearby
      if (s.hunger >= this.config.sheep.hungerThreshold) {
        const nearbyGrass = this.findNearbyOrganisms(s.x, s.y, 3, 'grass') as Grass[]
        if (nearbyGrass.length > 0) {
          // Move toward the nearest grass
          const target = nearbyGrass[0]
          const dx = Math.sign(target.x - s.x)
          const dy = Math.sign(target.y - s.y)
          const newX = s.x + dx
          const newY = s.y + dy
          
          if (this.isValidPosition(newX, newY)) {
            const targetCell = this.world.getCell(newX, newY)
            if (targetCell && !targetCell.sheep && !targetCell.wolf) {
              this.moveOrganism(s, newX, newY, 'sheep')
              return
            }
          }
        }
      }
      
      // Random movement if not hungry or no grass found
      for (let i = 0; i < attempts; i++) {
        const dx = Math.floor(Math.random() * (movementRange * 2 + 1)) - movementRange
        const dy = Math.floor(Math.random() * (movementRange * 2 + 1)) - movementRange
        
        const newX = s.x + dx
        const newY = s.y + dy
        
        if (this.isValidPosition(newX, newY)) {
          const targetCell = this.world.getCell(newX, newY)
          if (targetCell && !targetCell.sheep && !targetCell.wolf) {
            this.moveOrganism(s, newX, newY, 'sheep')
            break
          }
        }
      }
    })
  }

  private processSheepReproductionBatch(sheep: Sheep[]): void {
    const eligibleSheep = sheep.filter(s => 
      s.reproductionCooldown === 0 && 
      s.energy >= this.config.sheep.reproductionThreshold
    )

    if (eligibleSheep.length < 2) return

    // Group sheep by proximity for reproduction
    const reproductionPairs = this.findReproductionPairs(eligibleSheep, 2)
    
    reproductionPairs.forEach(([parent1, parent2]) => {
      if (Math.random() < this.config.sheep.reproductionRate) {
        this.createSheepOffspring(parent1, parent2)
        parent1.reproductionCooldown = 20
        parent2.reproductionCooldown = 20
      }
    })
  }

  private processWolvesBatch(): void {
    const wolves = this.world.getOrganismsByType('wolf') as Wolf[]
    if (wolves.length === 0) return

    // Batch process wolf aging and energy consumption
    wolves.forEach(w => {
      w.age++
      w.hunger++
      w.energy -= this.config.wolf.energyPerStep
    })

    // Batch process deaths
    const aliveWolves = this.processDeaths(wolves, 'wolf')
    if (aliveWolves.length === 0) return

    // Batch process hunting
    this.processWolfHuntingBatch(aliveWolves)

    // Batch process movement
    this.processWolfMovementBatch(aliveWolves)

    // Batch process reproduction
    this.processWolfReproductionBatch(aliveWolves)
  }

  private processWolfHuntingBatch(wolves: Wolf[]): void {
    const hungryWolves = wolves.filter(w => w.hunger >= this.config.wolf.hungerThreshold)
    if (hungryWolves.length === 0) return

    const huntingRadius = this.config.wolf.huntingRadius

    // Process hunting for all hungry wolves
    hungryWolves.forEach(w => {
      const nearbySheep = this.findNearbyOrganisms(w.x, w.y, huntingRadius, 'sheep') as Sheep[]
      
      if (nearbySheep.length > 0) {
        const target = nearbySheep[0]
        w.huntingTarget = target.id
        
        const distance = Math.sqrt((target.x - w.x) ** 2 + (target.y - w.y) ** 2)
        
        if (distance <= 1) {
          // Eat the sheep
          this.world.recordDeath(target, 'hunting', `Hunted by wolf ${w.id}`)
          this.world.clearCellContent(target.x, target.y)
          w.energy += this.config.wolf.energyPerSheep
          w.hunger = 0
          w.huntingTarget = undefined
        } else {
          // Move toward target
          this.moveTowardTarget(w, target.x, target.y)
        }
      } else {
        // No sheep found nearby, clear hunting target
        w.huntingTarget = undefined
      }
    })
  }

  private processWolfMovementBatch(wolves: Wolf[]): void {
    const movementRange = this.config.wolf.movementRange
    const attempts = 3

    // Process movement for wolves not hunting
    wolves.filter(w => !w.huntingTarget).forEach(w => {
      // If wolf is getting hungry, try to find sheep nearby
      if (w.hunger >= this.config.wolf.hungerThreshold * 0.7) {
        const nearbySheep = this.findNearbyOrganisms(w.x, w.y, 5, 'sheep') as Sheep[]
        if (nearbySheep.length > 0) {
          // Move toward the nearest sheep
          const target = nearbySheep[0]
          const dx = Math.sign(target.x - w.x)
          const dy = Math.sign(target.y - w.y)
          const newX = w.x + dx
          const newY = w.y + dy
          
          if (this.isValidPosition(newX, newY)) {
            const targetCell = this.world.getCell(newX, newY)
            if (targetCell && !targetCell.wolf) {
              this.moveOrganism(w, newX, newY, 'wolf')
              return
            }
          }
        }
      }
      
      // Random movement if not hunting or no sheep found
      for (let i = 0; i < attempts; i++) {
        const dx = Math.floor(Math.random() * (movementRange * 2 + 1)) - movementRange
        const dy = Math.floor(Math.random() * (movementRange * 2 + 1)) - movementRange
        
        const newX = w.x + dx
        const newY = w.y + dy
        
        if (this.isValidPosition(newX, newY)) {
          const targetCell = this.world.getCell(newX, newY)
          if (targetCell && !targetCell.wolf) {
            this.moveOrganism(w, newX, newY, 'wolf')
            break
          }
        }
      }
    })
  }

  private processWolfReproductionBatch(wolves: Wolf[]): void {
    const eligibleWolves = wolves.filter(w => 
      w.reproductionCooldown === 0 && 
      w.energy >= this.config.wolf.reproductionThreshold
    )

    if (eligibleWolves.length < 2) return

    // Group wolves by proximity for reproduction
    const reproductionPairs = this.findReproductionPairs(eligibleWolves, 3)
    
    reproductionPairs.forEach(([parent1, parent2]) => {
      if (Math.random() < this.config.wolf.reproductionRate) {
        this.createWolfOffspring(parent1, parent2)
        parent1.reproductionCooldown = 30
        parent2.reproductionCooldown = 30
      }
    })
  }

  // Helper methods for batch operations
  private processDeaths<T extends { isAlive: boolean; age: number; energy: number; hunger: number; x: number; y: number }>(
    organisms: T[], 
    type: 'grass' | 'sheep' | 'wolf'
  ): T[] {
    const lifespan = type === 'grass' ? 1000 : type === 'sheep' ? this.config.sheep.lifespan : this.config.wolf.lifespan
    const hungerThreshold = type === 'sheep' ? this.config.sheep.hungerThreshold : this.config.wolf.hungerThreshold

    return organisms.filter(org => {
      if (!org.isAlive) return false
      
      let deathCause: 'hunger' | 'age' | 'starvation' | 'other' | null = null
      let deathDetails = ''
      
      if (org.age >= lifespan) {
        deathCause = 'age'
        deathDetails = `Reached max age of ${lifespan}`
      } else if (org.energy <= 0) {
        deathCause = 'starvation'
        deathDetails = `Energy depleted (${org.energy.toFixed(2)})`
      } else if (org.hunger >= hungerThreshold * 2) {
        deathCause = 'hunger'
        deathDetails = `Hunger threshold exceeded (${org.hunger}/${hungerThreshold * 2})`
      }
      
      if (deathCause) {
        org.isAlive = false
        this.world.clearCellContent(org.x, org.y)
        this.world.recordDeath(org as any, deathCause, deathDetails)
        return false
      }
      
      return true
    })
  }

  private findReproductionPairs<T extends { id: string; x: number; y: number; reproductionCooldown: number }>(
    organisms: T[], 
    maxDistance: number
  ): [T, T][] {
    const pairs: [T, T][] = []
    const used = new Set<string>()

    for (let i = 0; i < organisms.length; i++) {
      if (used.has(organisms[i].id)) continue
      
      for (let j = i + 1; j < organisms.length; j++) {
        if (used.has(organisms[j].id)) continue
        
        const distance = Math.sqrt((organisms[i].x - organisms[j].x) ** 2 + (organisms[i].y - organisms[j].y) ** 2)
        if (distance <= maxDistance) {
          pairs.push([organisms[i], organisms[j]])
          used.add(organisms[i].id)
          used.add(organisms[j].id)
          break
        }
      }
    }

    return pairs
  }

  private createNewGrass(x: number, y: number): void {
    const newGrass: Grass = {
      id: `grass-${Date.now()}-${Math.random()}`,
      x,
      y,
      energy: 0.1,
      age: 0,
      isAlive: true,
      density: 0.1,
      growthStage: 'seed',
      lastGrazed: 0,
      seasonalGrowth: 1.0
    }
    
    this.world.setCellContent(x, y, { grass: newGrass })
  }

  private createSheepOffspring(parent1: Sheep, parent2: Sheep): void {
    const offspringX = parent1.x + Math.floor(Math.random() * 3) - 1
    const offspringY = parent1.y + Math.floor(Math.random() * 3) - 1
    
    if (this.isValidPosition(offspringX, offspringY)) {
      const targetCell = this.world.getCell(offspringX, offspringY)
      if (targetCell && !targetCell.sheep && !targetCell.wolf) {
        const offspring: Sheep = {
          id: `sheep-${Date.now()}-${Math.random()}`,
          x: offspringX,
          y: offspringY,
          energy: 0.5,
          age: 0,
          isAlive: true,
          hunger: 0,
          reproductionCooldown: 10,
          lastDirection: Direction.NORTH,
          grazingEfficiency: 0.8
        }
        
        this.world.setCellContent(offspringX, offspringY, { sheep: offspring })
      }
    }
  }

  private createWolfOffspring(parent1: Wolf, parent2: Wolf): void {
    const offspringX = parent1.x + Math.floor(Math.random() * 5) - 2
    const offspringY = parent1.y + Math.floor(Math.random() * 5) - 2
    
    if (this.isValidPosition(offspringX, offspringY)) {
      const targetCell = this.world.getCell(offspringX, offspringY)
      if (targetCell && !targetCell.sheep && !targetCell.wolf) {
        const offspring: Wolf = {
          id: `wolf-${Date.now()}-${Math.random()}`,
          x: offspringX,
          y: offspringY,
          energy: 0.6,
          age: 0,
          isAlive: true,
          hunger: 0,
          reproductionCooldown: 15,
          lastDirection: Direction.NORTH,
          huntingTarget: undefined
        }
        
        this.world.setCellContent(offspringX, offspringY, { wolf: offspring })
      }
    }
  }

  private moveOrganism(organism: any, newX: number, newY: number, type: 'sheep' | 'wolf'): void {
    const oldX = organism.x
    const oldY = organism.y
    
    this.world.clearCellContent(oldX, oldY)
    organism.x = newX
    organism.y = newY
    organism.lastDirection = this.getDirection(newX - oldX, newY - oldY)
    this.world.setCellContent(newX, newY, { [type]: organism })
  }

  private moveTowardTarget(wolf: Wolf, targetX: number, targetY: number): void {
    const dx = targetX - wolf.x
    const dy = targetY - wolf.y
    const moveX = Math.sign(dx)
    const moveY = Math.sign(dy)
    const newX = wolf.x + moveX
    const newY = wolf.y + moveY
    
    if (this.isValidPosition(newX, newY)) {
      const targetCell = this.world.getCell(newX, newY)
      if (targetCell && !targetCell.wolf) {
        this.moveOrganism(wolf, newX, newY, 'wolf')
      }
    }
  }

  private findNearbyOrganisms(x: number, y: number, radius: number, type: 'grass' | 'sheep' | 'wolf'): any[] {
    const organisms: any[] = []
    
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const checkX = x + dx
        const checkY = y + dy
        
        if (this.isValidPosition(checkX, checkY)) {
          const cell = this.world.getCell(checkX, checkY)
          if (cell) {
            if (type === 'grass' && cell.grass) {
              organisms.push(cell.grass)
            } else if (type === 'sheep' && cell.sheep) {
              organisms.push(cell.sheep)
            } else if (type === 'wolf' && cell.wolf) {
              organisms.push(cell.wolf)
            }
          }
        }
      }
    }
    
    return organisms
  }

  private getSeasonalGrowthModifier(season: Season): number {
    switch (season) {
      case Season.SPRING: return 1.0
      case Season.SUMMER: return this.config.grass.summerGrowthRate || 1.0
      case Season.AUTUMN: return 0.8
      case Season.WINTER: return this.config.grass.winterGrowthRate || 0.5
      default: return 1.0
    }
  }

  private getGrowthStage(density: number): 'seed' | 'sprout' | 'mature' | 'dying' {
    if (density < 0.3) return 'seed'
    if (density < 0.6) return 'sprout'
    if (density < 0.9) return 'mature'
    return 'dying'
  }

  private isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.world.getWidth() && y >= 0 && y < this.world.getHeight()
  }

  private getDirection(dx: number, dy: number): Direction {
    if (dx === 0 && dy < 0) return Direction.NORTH
    if (dx > 0 && dy < 0) return Direction.NORTHEAST
    if (dx > 0 && dy === 0) return Direction.EAST
    if (dx > 0 && dy > 0) return Direction.SOUTHEAST
    if (dx === 0 && dy > 0) return Direction.SOUTH
    if (dx < 0 && dy > 0) return Direction.SOUTHWEST
    if (dx < 0 && dy === 0) return Direction.WEST
    if (dx < 0 && dy < 0) return Direction.NORTHWEST
    return Direction.NORTH
  }
}