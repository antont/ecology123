/**
 * TypeScript interfaces for the Ecological Simulation
 * 
 * These interfaces define the structure of all simulation entities,
 * state, and data structures used throughout the application.
 */

// Base organism interface
export interface Organism {
  id: string;
  x: number;
  y: number;
  energy: number;
  age: number;
  isAlive: boolean;
}

// Grass-specific interface
export interface Grass extends Organism {
  density: number;        // 0.0 to 1.0
  growthStage: 'seed' | 'sprout' | 'mature' | 'dying';
  lastGrazed: number;    // Step when last grazed
  seasonalGrowth: number; // Seasonal growth modifier
}

// Sheep-specific interface
export interface Sheep extends Organism {
  hunger: number;         // Steps since last meal
  reproductionCooldown: number;
  flockId?: string;       // Optional flock identifier
  lastDirection: Direction;
  grazingEfficiency: number;
}

// Wolf-specific interface
export interface Wolf extends Organism {
  hunger: number;         // Steps since last meal
  reproductionCooldown: number;
  packId?: string;        // Optional pack identifier
  territoryId?: string;   // Territory identifier
  lastDirection: Direction;
  huntingTarget?: string; // ID of targeted sheep
}

// Direction enum for movement
export enum Direction {
  NORTH = 'north',
  NORTHEAST = 'northeast',
  EAST = 'east',
  SOUTHEAST = 'southeast',
  SOUTH = 'south',
  SOUTHWEST = 'southwest',
  WEST = 'west',
  NORTHWEST = 'northwest',
}

// World cell interface
export interface WorldCell {
  x: number;
  y: number;
  grass?: Grass;
  sheep?: Sheep;
  wolf?: Wolf;
  temperature: number;    // Environmental temperature
  season: Season;
}

// Season enum
export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  AUTUMN = 'autumn',
  WINTER = 'winter',
}

// World state interface
export interface WorldState {
  width: number;
  height: number;
  cells: WorldCell[][];
  currentStep: number;
  season: Season;
  temperature: number;
  statistics: SimulationStatistics;
}

// Simulation statistics
export interface SimulationStatistics {
  totalSteps: number;
  grassCount: number;
  sheepCount: number;
  wolfCount: number;
  totalEnergy: number;
  averageGrassDensity: number;
  averageSheepEnergy: number;
  averageWolfEnergy: number;
  extinctionEvents: ExtinctionEvent[];
  populationHistory: PopulationSnapshot[];
  deathStats: DeathStatistics;
}

// Extinction event
export interface ExtinctionEvent {
  species: 'grass' | 'sheep' | 'wolf';
  step: number;
  cause: 'starvation' | 'disease' | 'predation' | 'environmental';
}

// Population snapshot for history
export interface PopulationSnapshot {
  step: number;
  grassCount: number;
  sheepCount: number;
  wolfCount: number;
  averageEnergy: number;
}

// Death tracking interfaces
export interface DeathRecord {
  organismId: string;
  organismType: 'grass' | 'sheep' | 'wolf';
  cause: 'hunger' | 'hunting' | 'age' | 'starvation' | 'grazing' | 'other';
  step: number;
  energy: number;
  age: number;
  x: number;
  y: number;
  details?: string; // Additional context
}

export interface DeathStatistics {
  totalDeaths: number;
  deathsByCause: Record<string, number>;
  deathsByType: Record<string, number>;
  recentDeaths: DeathRecord[];
  step: number;
  sheepDeaths: number;
  wolfDeaths: number;
  grassDeaths: number;
}

// Simulation engine state
export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  currentStep: number;
  speed: number;          // Steps per second
  world: WorldState;
  config: any;            // WorldConfig type
}

// Action types for Redux
export enum SimulationActionType {
  START_SIMULATION = 'START_SIMULATION',
  PAUSE_SIMULATION = 'PAUSE_SIMULATION',
  STOP_SIMULATION = 'STOP_SIMULATION',
  STEP_SIMULATION = 'STEP_SIMULATION',
  RESET_SIMULATION = 'RESET_SIMULATION',
  UPDATE_WORLD = 'UPDATE_WORLD',
  UPDATE_STATISTICS = 'UPDATE_STATISTICS',
  SET_SPEED = 'SET_SPEED',
  SET_CONFIG = 'SET_CONFIG',
}

// Redux actions
export interface StartSimulationAction {
  type: SimulationActionType.START_SIMULATION;
}

export interface PauseSimulationAction {
  type: SimulationActionType.PAUSE_SIMULATION;
}

export interface StopSimulationAction {
  type: SimulationActionType.STOP_SIMULATION;
}

export interface StepSimulationAction {
  type: SimulationActionType.STEP_SIMULATION;
}

export interface ResetSimulationAction {
  type: SimulationActionType.RESET_SIMULATION;
}

export interface UpdateWorldAction {
  type: SimulationActionType.UPDATE_WORLD;
  payload: WorldState;
}

export interface UpdateStatisticsAction {
  type: SimulationActionType.UPDATE_STATISTICS;
  payload: SimulationStatistics;
}

export interface SetSpeedAction {
  type: SimulationActionType.SET_SPEED;
  payload: number;
}

export interface SetConfigAction {
  type: SimulationActionType.SET_CONFIG;
  payload: any; // WorldConfig type
}

// Union type for all actions
export type SimulationAction =
  | StartSimulationAction
  | PauseSimulationAction
  | StopSimulationAction
  | StepSimulationAction
  | ResetSimulationAction
  | UpdateWorldAction
  | UpdateStatisticsAction
  | SetSpeedAction
  | SetConfigAction;

// Event types for simulation events
export interface SimulationEvent {
  type: 'organism_born' | 'organism_died' | 'organism_moved' | 'organism_reproduced' | 'organism_ate';
  organismId: string;
  organismType: 'grass' | 'sheep' | 'wolf';
  step: number;
  data?: any;
}

// Utility types
export type Position = {
  x: number;
  y: number;
};

export type EnergyLevel = 'low' | 'medium' | 'high';

export type HealthStatus = 'healthy' | 'hungry' | 'starving' | 'dying';

// Configuration types (re-exported from WorldConfig)
export type { WorldConfig, GrassConfig, SheepConfig, WolfConfig, WorldParams, VisualizationConfig, DebugConfig } from '../config/WorldConfig';
