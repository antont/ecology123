/**
 * ReproductionProcessor handles all reproduction mechanics for the ecological simulation
 * Implements realistic breeding, pregnancy, and offspring mechanics
 */

import { WorldConfig } from '../config/WorldConfig'
import { World } from './World'
import { 
  Sheep, 
  Wolf, 
  Grass, 
  ReproductionState, 
  Offspring, 
  OffspringTraits,
  Direction 
} from '../types/SimulationTypes'

export class ReproductionProcessor {
  private world: World
  private config: WorldConfig

  constructor(world: World, config: WorldConfig) {
    this.world = world
    this.config = config
  }

  /**
   * Process all reproduction activities for the current step
   */
  public processReproduction(): void {
    const currentStep = this.world.getCurrentStep()
    
    // Process sheep reproduction
    this.processSheepReproduction(currentStep)
    
    // Process wolf reproduction
    this.processWolfReproduction(currentStep)
    
    // Process grass spreading
    this.processGrassReproduction(currentStep)
  }

  /**
   * Process sheep reproduction mechanics
   */
  private processSheepReproduction(currentStep: number): void {
    const sheep = this.world.getOrganismsByType('sheep') as Sheep[]
    
    // Process pregnancies and births
    sheep.forEach(sheep => {
      // Ensure reproductionState exists (for backward compatibility)
      if (!sheep.reproductionState) {
        sheep.reproductionState = {
          isPregnant: false,
          gestationRemaining: 0,
          expectedLitterSize: 0,
          pregnancyEnergyCost: 0,
          lastMatingStep: 0
        }
      }
      
      if (sheep.reproductionState.isPregnant) {
        this.processPregnancy(sheep, currentStep)
      } else if (this.canReproduce(sheep, 'sheep', currentStep)) {
        this.attemptMating(sheep, currentStep)
      }
    })
  }

  /**
   * Process wolf reproduction with pack dynamics
   */
  private processWolfReproduction(currentStep: number): void {
    const wolves = this.world.getOrganismsByType('wolf') as Wolf[]
    
    // Ensure all wolves have reproductionState and packRole
    wolves.forEach(wolf => {
      if (!wolf.reproductionState) {
        wolf.reproductionState = {
          isPregnant: false,
          gestationRemaining: 0,
          expectedLitterSize: 0,
          pregnancyEnergyCost: 0,
          lastMatingStep: 0
        }
      }
      if (!wolf.packRole) {
        wolf.packRole = 'omega'
      }
    })
    
    // Group wolves by pack
    const packs = this.groupWolvesByPack(wolves)
    
    // Process reproduction for each pack
    Object.values(packs).forEach(pack => {
      this.processPackReproduction(pack, currentStep)
    })
  }

  /**
   * Process grass seed spreading
   */
  private processGrassReproduction(currentStep: number): void {
    const grassPatches = this.world.getOrganismsByType('grass') as Grass[]
    
    grassPatches.forEach(grass => {
      // Ensure grass has new fields (for backward compatibility)
      if (grass.seedProduction === undefined) grass.seedProduction = 0
      if (grass.lastSpreadStep === undefined) grass.lastSpreadStep = 0
      if (grass.competitionStress === undefined) grass.competitionStress = 0
      
      if (this.canSpreadSeeds(grass, currentStep)) {
        this.spreadSeeds(grass, currentStep)
      }
    })
  }

  /**
   * Check if an organism can reproduce
   */
  private canReproduce(organism: Sheep | Wolf, type: 'sheep' | 'wolf', currentStep: number): boolean {
    const config = this.config[type].reproduction
    
    // Basic requirements
    const ageRequirement = organism.age >= config.minAge && organism.age <= config.maxAge
    const energyRequirement = organism.energy >= config.minEnergy
    const cooldownRequirement = currentStep - organism.reproductionState.lastMatingStep >= config.cooldownPeriod
    
    return ageRequirement && energyRequirement && cooldownRequirement && organism.isAlive
  }

  /**
   * Attempt to find a mate and initiate pregnancy
   */
  private attemptMating(organism: Sheep | Wolf, currentStep: number): void {
    const type = this.getOrganismType(organism)
    const config = this.config[type].reproduction
    const proximity = type === 'sheep' ? 
      (config as typeof this.config.sheep.reproduction).partnerProximity : 
      (config as typeof this.config.wolf.reproduction).territoryRadius
    
    // Find potential mates nearby
    const potentialMates = this.findNearbyMates(organism, proximity, type)
    
    if (potentialMates.length > 0) {
      const mate = potentialMates[0] // Choose first available mate
      this.initiateMating(organism, mate, currentStep)
    }
  }

  /**
   * Find nearby potential mates
   */
  private findNearbyMates(organism: Sheep | Wolf, radius: number, type: 'sheep' | 'wolf'): (Sheep | Wolf)[] {
    const allOrganisms = this.world.getOrganismsByType(type) as (Sheep | Wolf)[]
    
    return allOrganisms.filter(potential => {
      if (potential.id === organism.id) return false
      if (!this.canReproduce(potential, type, this.world.getCurrentStep())) return false
      
      const distance = Math.sqrt(
        Math.pow(potential.x - organism.x, 2) + 
        Math.pow(potential.y - organism.y, 2)
      )
      
      return distance <= radius
    })
  }

  /**
   * Initiate mating between two organisms
   */
  private initiateMating(organism1: Sheep | Wolf, organism2: Sheep | Wolf, currentStep: number): void {
    const type = this.getOrganismType(organism1)
    const config = this.config[type].reproduction
    
    // Determine which organism becomes pregnant (random choice)
    const pregnantOrganism = Math.random() < 0.5 ? organism1 : organism2
    const mate = pregnantOrganism === organism1 ? organism2 : organism1
    
    // Calculate litter size
    const litterSize = Math.floor(Math.random() * (config.litterSizeMax - config.litterSizeMin + 1)) + config.litterSizeMin
    
    // Set pregnancy state
    pregnantOrganism.reproductionState = {
      isPregnant: true,
      gestationRemaining: config.gestationPeriod,
      expectedLitterSize: litterSize,
      pregnancyEnergyCost: config.energyCost / config.gestationPeriod, // Energy cost per step
      mateId: mate.id,
      lastMatingStep: currentStep
    }
    
    // Set mate's cooldown
    mate.reproductionState.lastMatingStep = currentStep
    
    console.log(`🤱 Mating: ${type} ${pregnantOrganism.id} is pregnant (${litterSize} offspring expected)`)
  }

  /**
   * Process pregnancy and handle births
   */
  private processPregnancy(organism: Sheep | Wolf, currentStep: number): void {
    const reproState = organism.reproductionState
    
    // Apply energy cost
    organism.energy -= reproState.pregnancyEnergyCost
    
    // Check if pregnancy should continue
    if (organism.energy <= 0.2) {
      // Miscarriage due to low energy
      this.world.recordDeath(organism, 'starvation', 'Miscarriage due to low energy')
      organism.reproductionState.isPregnant = false
      return
    }
    
    // Decrease gestation time
    reproState.gestationRemaining--
    
    // Check for birth
    if (reproState.gestationRemaining <= 0) {
      this.giveBirth(organism, currentStep)
    }
  }

  /**
   * Handle birth of offspring
   */
  private giveBirth(parent: Sheep | Wolf, currentStep: number): void {
    const type = this.getOrganismType(parent)
    const config = this.config[type].reproduction
    const reproState = parent.reproductionState
    
    // Create offspring
    for (let i = 0; i < reproState.expectedLitterSize; i++) {
      const offspring = this.createOffspring(parent, currentStep, type)
      if (offspring) {
        console.log(`👶 Birth: ${type} ${parent.id} gave birth to ${offspring.id}`)
      }
    }
    
    // Reset pregnancy state
    parent.reproductionState = {
      isPregnant: false,
      gestationRemaining: 0,
      expectedLitterSize: 0,
      pregnancyEnergyCost: 0,
      lastMatingStep: currentStep
    }
    
    // Set reproduction cooldown
    parent.reproductionCooldown = config.cooldownPeriod
  }

  /**
   * Create offspring with inherited traits
   */
  private createOffspring(parent: Sheep | Wolf, currentStep: number, type: 'sheep' | 'wolf'): Sheep | Wolf | null {
    const config = this.config[type].reproduction
    
    // Find nearby empty cell for offspring
    const birthLocation = this.findNearbyEmptyCell(parent.x, parent.y, 2)
    if (!birthLocation) {
      console.log(`⚠️ No space for offspring of ${type} ${parent.id}`)
      return null
    }
    
    // Generate inherited traits
    const inheritedTraits = this.generateInheritedTraits(parent, config.inheritanceVariation)
    
    // Create offspring organism
    const offspring = this.createOffspringOrganism(
      parent, 
      birthLocation, 
      inheritedTraits, 
      currentStep, 
      type
    )
    
    // Place offspring in world
    this.world.setCellContent(birthLocation.x, birthLocation.y, { [type]: offspring })
    
    return offspring
  }

  /**
   * Generate inherited traits with variation
   */
  private generateInheritedTraits(parent: Sheep | Wolf, variation: number): OffspringTraits {
    const baseEfficiency = 'grazingEfficiency' in parent ? parent.grazingEfficiency : 0.8
    const baseLifespan = this.getOrganismType(parent) === 'sheep' ? 
      this.config.sheep.lifespan : this.config.wolf.lifespan
    
    return {
      grazingEfficiency: 'grazingEfficiency' in parent ? 
        this.varyTrait(parent.grazingEfficiency, variation) : undefined,
      huntingSkill: 'huntingTarget' in parent ? 
        this.varyTrait(0.8, variation) : undefined,
      energyEfficiency: this.varyTrait(1.0, variation),
      maxLifespan: Math.floor(this.varyTrait(baseLifespan, variation * 0.5))
    }
  }

  /**
   * Apply variation to a trait
   */
  private varyTrait(baseValue: number, variation: number): number {
    const change = (Math.random() - 0.5) * 2 * variation
    return Math.max(0.1, Math.min(1.0, baseValue + change))
  }

  /**
   * Create the actual offspring organism
   */
  private createOffspringOrganism(
    parent: Sheep | Wolf, 
    location: { x: number; y: number }, 
    traits: OffspringTraits,
    currentStep: number,
    type: 'sheep' | 'wolf'
  ): Sheep | Wolf {
    const baseId = `${type}-offspring-${currentStep}-${Math.random().toString(36).substr(2, 9)}`
    
    const baseOrganism = {
      id: baseId,
      x: location.x,
      y: location.y,
      energy: 0.6, // Start with moderate energy
      age: 0,
      isAlive: true,
      hunger: 0,
      reproductionCooldown: 0,
      lastDirection: Direction.NORTH,
      reproductionState: {
        isPregnant: false,
        gestationRemaining: 0,
        expectedLitterSize: 0,
        pregnancyEnergyCost: 0,
        lastMatingStep: 0
      }
    }
    
    if (type === 'sheep') {
      return {
        ...baseOrganism,
        grazingEfficiency: traits.grazingEfficiency || 0.8,
        flockId: (parent as Sheep).flockId
      } as Sheep
    } else {
      return {
        ...baseOrganism,
        packId: (parent as Wolf).packId,
        territoryId: (parent as Wolf).territoryId,
        packRole: 'omega' as const,
        territoryCenter: (parent as Wolf).territoryCenter
      } as Wolf
    }
  }

  /**
   * Find nearby empty cell for offspring placement
   */
  private findNearbyEmptyCell(x: number, y: number, radius: number): { x: number; y: number } | null {
    for (let r = 1; r <= radius; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) + Math.abs(dy) !== r) continue // Only check cells at exact radius
          
          const newX = x + dx
          const newY = y + dy
          
          if (this.isValidPosition(newX, newY)) {
            const cell = this.world.getCell(newX, newY)
            if (cell && !cell.sheep && !cell.wolf) {
              return { x: newX, y: newY }
            }
          }
        }
      }
    }
    return null
  }

  /**
   * Check if position is valid
   */
  private isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.world.getWidth() && y >= 0 && y < this.world.getHeight()
  }

  /**
   * Group wolves by pack for pack-based reproduction
   */
  private groupWolvesByPack(wolves: Wolf[]): Record<string, Wolf[]> {
    const packs: Record<string, Wolf[]> = {}
    
    wolves.forEach(wolf => {
      const packId = wolf.packId || 'lone'
      if (!packs[packId]) {
        packs[packId] = []
      }
      packs[packId].push(wolf)
    })
    
    return packs
  }

  /**
   * Process reproduction for a wolf pack
   */
  private processPackReproduction(pack: Wolf[], currentStep: number): void {
    const config = this.config.wolf.reproduction
    
    // Only alpha pair can breed if alphaBreedingOnly is true
    if (config.alphaBreedingOnly) {
      const alphas = pack.filter(wolf => wolf.packRole === 'alpha')
      if (alphas.length >= 2) {
        const alphaMale = alphas[0]
        const alphaFemale = alphas[1]
        
        if (this.canReproduce(alphaMale, 'wolf', currentStep) && 
            this.canReproduce(alphaFemale, 'wolf', currentStep)) {
          this.initiateMating(alphaMale, alphaFemale, currentStep)
        }
      }
    }
  }

  /**
   * Check if grass can spread seeds
   */
  private canSpreadSeeds(grass: Grass, currentStep: number): boolean {
    const config = this.config.grass.reproduction
    
    return grass.density >= config.minDensity && 
           grass.growthStage === 'mature' &&
           currentStep - grass.lastSpreadStep >= 5 && // Minimum time between spreading
           Math.random() < config.spreadProbability
  }

  /**
   * Spread grass seeds to nearby cells
   */
  private spreadSeeds(grass: Grass, currentStep: number): void {
    const config = this.config.grass.reproduction
    
    for (let i = 0; i < config.maxSeedsPerStep; i++) {
      if (Math.random() < config.seedViability) {
        const seedLocation = this.findSeedLocation(grass, config.spreadRadius)
        if (seedLocation) {
          this.plantSeed(seedLocation, currentStep)
        }
      }
    }
    
    grass.lastSpreadStep = currentStep
  }

  /**
   * Find suitable location for seed
   */
  private findSeedLocation(grass: Grass, radius: number): { x: number; y: number } | null {
    for (let attempt = 0; attempt < 10; attempt++) {
      const angle = Math.random() * 2 * Math.PI
      const distance = Math.random() * radius
      const x = Math.round(grass.x + Math.cos(angle) * distance)
      const y = Math.round(grass.y + Math.sin(angle) * distance)
      
      if (this.isValidPosition(x, y)) {
        const cell = this.world.getCell(x, y)
        if (cell && !cell.grass) {
          return { x, y }
        }
      }
    }
    return null
  }

  /**
   * Plant a new grass seed
   */
  private plantSeed(location: { x: number; y: number }, currentStep: number): void {
    const newGrass: Grass = {
      id: `grass-seed-${currentStep}-${Math.random().toString(36).substr(2, 9)}`,
      x: location.x,
      y: location.y,
      energy: 0.1,
      age: 0,
      isAlive: true,
      density: 0.1,
      growthStage: 'seed',
      lastGrazed: 0,
      seasonalGrowth: 1.0,
      seedProduction: 0,
      lastSpreadStep: currentStep,
      competitionStress: 0
    }
    
    this.world.setCellContent(location.x, location.y, { grass: newGrass })
    console.log(`🌱 Seed planted at (${location.x}, ${location.y})`)
  }

  /**
   * Get organism type
   */
  private getOrganismType(organism: Sheep | Wolf): 'sheep' | 'wolf' {
    return 'grazingEfficiency' in organism ? 'sheep' : 'wolf'
  }
}
