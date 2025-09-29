/**
 * OrganismFactory provides helper functions to create organisms with all required fields
 * This ensures consistency and prevents missing field errors
 */

import { Grass, Sheep, Wolf, Direction } from '../types/SimulationTypes'

export class OrganismFactory {
  /**
   * Create a grass organism with all required fields
   */
  static createGrass(params: {
    id: string
    x: number
    y: number
    energy?: number
    age?: number
    density?: number
    growthStage?: 'seed' | 'sprout' | 'mature' | 'dying'
  }): Grass {
    return {
      id: params.id,
      x: params.x,
      y: params.y,
      energy: params.energy ?? 0.8,
      age: params.age ?? 0,
      isAlive: true,
      density: params.density ?? 0.8,
      growthStage: params.growthStage ?? 'mature',
      lastGrazed: 0,
      seasonalGrowth: 1.0,
      seedProduction: 0,
      lastSpreadStep: 0,
      competitionStress: 0
    }
  }

  /**
   * Create a sheep organism with all required fields
   */
  static createSheep(params: {
    id: string
    x: number
    y: number
    energy?: number
    age?: number
    grazingEfficiency?: number
    flockId?: string
  }): Sheep {
    return {
      id: params.id,
      x: params.x,
      y: params.y,
      energy: params.energy ?? 0.8,
      age: params.age ?? 0,
      isAlive: true,
      hunger: 0,
      reproductionCooldown: 0,
      lastDirection: Direction.NORTH,
      grazingEfficiency: params.grazingEfficiency ?? 0.8,
      flockId: params.flockId,
      reproductionState: {
        isPregnant: false,
        gestationRemaining: 0,
        expectedLitterSize: 0,
        pregnancyEnergyCost: 0,
        lastMatingStep: -100 // Allow immediate reproduction
      }
    }
  }

  /**
   * Create a wolf organism with all required fields
   */
  static createWolf(params: {
    id: string
    x: number
    y: number
    energy?: number
    age?: number
    packId?: string
    territoryId?: string
    packRole?: 'alpha' | 'beta' | 'omega'
  }): Wolf {
    return {
      id: params.id,
      x: params.x,
      y: params.y,
      energy: params.energy ?? 0.9,
      age: params.age ?? 0,
      isAlive: true,
      hunger: 0,
      reproductionCooldown: 0,
      lastDirection: Direction.NORTH,
      huntingTarget: undefined,
      packId: params.packId,
      territoryId: params.territoryId,
      packRole: params.packRole ?? 'omega',
      reproductionState: {
        isPregnant: false,
        gestationRemaining: 0,
        expectedLitterSize: 0,
        pregnancyEnergyCost: 0,
        lastMatingStep: -100 // Allow immediate reproduction
      }
    }
  }
}
