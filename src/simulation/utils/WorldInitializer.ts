/**
 * WorldInitializer provides centralized, consistent world initialization
 * across all simulation contexts (UI, tests, headless analysis)
 */

import { World } from '../engine/World'
import { WorldConfig } from '../config/WorldConfig'
import { OrganismFactory } from './OrganismFactory'

export interface InitializationOptions {
  /** Override default grass coverage (0-1) */
  grassCoverage?: number
  /** Override default sheep count */
  sheepCount?: number
  /** Override default wolf count */
  wolfCount?: number
  /** Use deterministic positioning for tests */
  deterministic?: boolean
  /** Seed for deterministic random placement */
  seed?: number
}

export class WorldInitializer {
  private config: WorldConfig
  private rng: () => number

  constructor(config: WorldConfig) {
    this.config = config
    this.rng = Math.random
  }

  /**
   * Initialize world with organisms according to config and options
   */
  public initializeWorld(world: World, options: InitializationOptions = {}): void {
    // Set up deterministic random if requested
    if (options.deterministic && options.seed !== undefined) {
      this.rng = this.createSeededRandom(options.seed)
    }

    // Clear the world first
    this.clearWorld(world)

    // Initialize organisms
    this.initializeGrass(world, options.grassCoverage)
    this.initializeSheep(world, options.sheepCount)
    this.initializeWolves(world, options.wolfCount)

    // Update statistics
    world.updateStatistics()
  }

  /**
   * Initialize grass coverage
   */
  private initializeGrass(world: World, coverageOverride?: number): void {
    const coverage = coverageOverride ?? this.config.initialGrassCoverage
    const totalCells = this.config.width * this.config.height
    const grassCells = Math.floor(totalCells * coverage)

    for (let i = 0; i < grassCells; i++) {
      const position = this.findEmptyPosition(world)
      if (!position) continue

      const grass = OrganismFactory.createGrass({
        id: `grass-init-${i}`,
        x: position.x,
        y: position.y,
        energy: 0.8,
        density: this.rng() * 0.6 + 0.4, // 0.4-1.0 density
        growthStage: 'mature'
      })

      world.setCellContent(position.x, position.y, { grass })
    }
  }

  /**
   * Initialize sheep population
   */
  private initializeSheep(world: World, countOverride?: number): void {
    const count = countOverride ?? this.config.initialSheepCount

    for (let i = 0; i < count; i++) {
      const position = this.findEmptyPosition(world)
      if (!position) continue

      const sheep = OrganismFactory.createSheep({
        id: `sheep-init-${i}`,
        x: position.x,
        y: position.y,
        energy: 0.8, // Good starting energy
        age: Math.floor(this.rng() * 20), // Varied ages
        grazingEfficiency: this.config.sheep.grazingEfficiency
      })

      world.setCellContent(position.x, position.y, { sheep })
    }
  }

  /**
   * Initialize wolf population
   */
  private initializeWolves(world: World, countOverride?: number): void {
    const count = countOverride ?? this.config.initialWolfCount

    for (let i = 0; i < count; i++) {
      const position = this.findEmptyPosition(world)
      if (!position) continue

      const wolf = OrganismFactory.createWolf({
        id: `wolf-init-${i}`,
        x: position.x,
        y: position.y,
        energy: 0.9, // High starting energy
        age: Math.floor(this.rng() * 30), // Varied ages
        packRole: i < 2 ? 'alpha' : 'omega' // First two are alphas
      })

      world.setCellContent(position.x, position.y, { wolf })
    }
  }

  /**
   * Find an empty position in the world
   */
  private findEmptyPosition(world: World): { x: number; y: number } | null {
    let attempts = 0
    const maxAttempts = 100

    while (attempts < maxAttempts) {
      const x = Math.floor(this.rng() * this.config.width)
      const y = Math.floor(this.rng() * this.config.height)
      
      const cell = world.getCell(x, y)
      if (cell && !cell.grass && !cell.sheep && !cell.wolf) {
        return { x, y }
      }
      
      attempts++
    }

    return null // No empty position found
  }

  /**
   * Clear all organisms from the world
   */
  private clearWorld(world: World): void {
    for (let x = 0; x < this.config.width; x++) {
      for (let y = 0; y < this.config.height; y++) {
        world.setCellContent(x, y, {})
      }
    }
  }

  /**
   * Create a seeded random number generator for deterministic tests
   */
  private createSeededRandom(seed: number): () => number {
    let current = seed
    return () => {
      current = (current * 9301 + 49297) % 233280
      return current / 233280
    }
  }

  /**
   * Create a stable ecosystem for testing (high density, good spacing)
   */
  public static createStableTestEcosystem(world: World, config: WorldConfig): void {
    const initializer = new WorldInitializer(config)
    
    // Dense grass coverage
    initializer.initializeGrass(world, 0.9)
    
    // Fewer, well-spaced sheep
    initializer.initializeSheep(world, 15)
    
    // Fewer wolves for stability
    initializer.initializeWolves(world, 3)
    
    world.updateStatistics()
  }

  /**
   * Create a production ecosystem matching current config
   */
  public static createProductionEcosystem(world: World, config: WorldConfig): void {
    const initializer = new WorldInitializer(config)
    initializer.initializeWorld(world)
  }

  /**
   * Create a deterministic ecosystem for reproducible tests
   */
  public static createDeterministicEcosystem(
    world: World, 
    config: WorldConfig, 
    seed: number = 12345
  ): void {
    const initializer = new WorldInitializer(config)
    initializer.initializeWorld(world, { 
      deterministic: true, 
      seed 
    })
  }
}
