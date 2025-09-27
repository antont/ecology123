import { describe, it, expect } from 'vitest'
import { 
  Grass, 
  Sheep, 
  Wolf, 
  WorldCell, 
  WorldState, 
  SimulationStatistics,
  Direction,
  Season,
  SimulationActionType
} from './SimulationTypes'
import { OrganismFactory } from '../utils/OrganismFactory'

describe('SimulationTypes', () => {
  describe('Organism interfaces', () => {
    it('should create valid Grass object', () => {
      const grass = OrganismFactory.createGrass({
        id: 'grass-1',
        x: 10,
        y: 10,
        energy: 0.8,
        age: 5,
        density: 0.9,
        growthStage: 'mature'
      })

      expect(grass.id).toBe('grass-1')
      expect(grass.density).toBeGreaterThanOrEqual(0)
      expect(grass.density).toBeLessThanOrEqual(1)
      expect(['seed', 'sprout', 'mature', 'dying']).toContain(grass.growthStage)
    })

    it('should create valid Sheep object', () => {
      const sheep = OrganismFactory.createSheep({
        id: 'sheep-1',
        x: 15,
        y: 15,
        energy: 0.7,
        age: 10,
        grazingEfficiency: 0.8
      })

      expect(sheep.id).toBe('sheep-1')
      expect(sheep.hunger).toBeGreaterThanOrEqual(0)
      expect(sheep.reproductionCooldown).toBeGreaterThanOrEqual(0)
      expect(Object.values(Direction)).toContain(sheep.lastDirection)
    })

    it('should create valid Wolf object', () => {
      const wolf = OrganismFactory.createWolf({
        id: 'wolf-1',
        x: 20,
        y: 20,
        energy: 0.9,
        age: 15
      })

      expect(wolf.id).toBe('wolf-1')
      expect(wolf.hunger).toBeGreaterThanOrEqual(0)
      expect(wolf.reproductionCooldown).toBeGreaterThanOrEqual(0)
      expect(Object.values(Direction)).toContain(wolf.lastDirection)
    })
  })

  describe('World structures', () => {
    it('should create valid WorldCell object', () => {
      const cell: WorldCell = {
        x: 5,
        y: 5,
        temperature: 20,
        season: Season.SPRING
      }

      expect(cell.x).toBeGreaterThanOrEqual(0)
      expect(cell.y).toBeGreaterThanOrEqual(0)
      expect(Object.values(Season)).toContain(cell.season)
    })

    it('should create valid WorldState object', () => {
      const worldState: WorldState = {
        width: 50,
        height: 50,
        cells: [],
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
          deathStats: {
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
      }

      expect(worldState.width).toBeGreaterThan(0)
      expect(worldState.height).toBeGreaterThan(0)
      expect(worldState.currentStep).toBeGreaterThanOrEqual(0)
      expect(Object.values(Season)).toContain(worldState.season)
    })
  })

  describe('Enums', () => {
    it('should have valid Direction enum values', () => {
      expect(Direction.NORTH).toBe('north')
      expect(Direction.SOUTH).toBe('south')
      expect(Direction.EAST).toBe('east')
      expect(Direction.WEST).toBe('west')
      expect(Object.keys(Direction)).toHaveLength(8)
    })

    it('should have valid Season enum values', () => {
      expect(Season.SPRING).toBe('spring')
      expect(Season.SUMMER).toBe('summer')
      expect(Season.AUTUMN).toBe('autumn')
      expect(Season.WINTER).toBe('winter')
      expect(Object.keys(Season)).toHaveLength(4)
    })

    it('should have valid SimulationActionType enum values', () => {
      expect(SimulationActionType.START_SIMULATION).toBe('START_SIMULATION')
      expect(SimulationActionType.PAUSE_SIMULATION).toBe('PAUSE_SIMULATION')
      expect(SimulationActionType.STOP_SIMULATION).toBe('STOP_SIMULATION')
      expect(Object.keys(SimulationActionType)).toHaveLength(9)
    })
  })
})
