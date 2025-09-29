/**
 * SimulationEngine manages the overall simulation state and execution
 */

import { World } from './World'
import { StepProcessor } from './StepProcessor'
import { WorldConfig } from '../config/WorldConfig'
import { SimulationState, SimulationStatistics, PopulationHealth, EcosystemAlert, ExtinctionAnalysis, OscillationAnalysis } from '../types/SimulationTypes'
import { EcologicalAnalyzer } from '../analysis/EcologicalAnalyzer'

export class SimulationEngine {
  private world: World
  private stepProcessor: StepProcessor
  private config: WorldConfig
  private state: SimulationState
  private intervalId: NodeJS.Timeout | null = null
  private analyzer: EcologicalAnalyzer

  constructor(config: WorldConfig) {
    this.config = config
    this.world = new World(config)
    this.stepProcessor = new StepProcessor(this.world, config)
    this.analyzer = new EcologicalAnalyzer(config)
    
    this.state = {
      isRunning: false,
      isPaused: false,
      currentStep: 0,
      speed: 1.0, // Steps per second
      world: this.world.getState(),
      config: config
    }
  }

  public start(): void {
    if (this.state.isRunning && !this.state.isPaused) {
      return // Already running
    }

    this.state.isRunning = true
    this.state.isPaused = false

    // Don't start internal loop - let external code control timing
    // this.startSimulationLoop()
  }

  public pause(): void {
    if (!this.state.isRunning) {
      return // Not running
    }

    this.state.isPaused = true
    // Don't stop internal loop - external code controls timing
    // this.stopSimulationLoop()
  }

  public resume(): void {
    if (!this.state.isRunning || !this.state.isPaused) {
      return // Not running or not paused
    }

    this.state.isPaused = false
    // Don't start internal loop - external code controls timing
    // this.startSimulationLoop()
  }

  public stop(): void {
    this.state.isRunning = false
    this.state.isPaused = false
    this.stopSimulationLoop()
  }

  public step(): void {
    // Always process step when called externally
    this.processStep()
  }

  public reset(): void {
    this.stop()
    
    // Reset world
    this.world = new World(this.config)
    this.stepProcessor = new StepProcessor(this.world, this.config)
    this.analyzer = new EcologicalAnalyzer(this.config) // Reset analyzer
    
    // Reset state
    this.state = {
      isRunning: false,
      isPaused: false,
      currentStep: 0,
      speed: 1.0,
      world: this.world.getState(),
      config: this.config
    }
  }

  public isRunning(): boolean {
    return this.state.isRunning
  }

  public isPaused(): boolean {
    return this.state.isPaused
  }

  public getCurrentStep(): number {
    return this.world.getCurrentStep()
  }

  public getSpeed(): number {
    return this.state.speed
  }

  public setSpeed(speed: number): void {
    this.state.speed = Math.max(0.1, Math.min(10.0, speed)) // Clamp between 0.1 and 10.0
    
    // Restart simulation loop with new speed if running
    if (this.state.isRunning && !this.state.isPaused) {
      this.stopSimulationLoop()
      this.startSimulationLoop()
    }
  }

  public getWorld(): World {
    return this.world
  }

  public getState(): SimulationState {
    return {
      ...this.state,
      currentStep: this.world.getCurrentStep(),
      world: this.world.getState()
    }
  }

  public getStatistics(): SimulationStatistics {
    return this.world.getState().statistics
  }

  public getPopulationHealth(): PopulationHealth[] {
    return this.analyzer.getPopulationHealth()
  }

  public getEcosystemAlerts(): EcosystemAlert[] {
    return this.analyzer.getActiveAlerts()
  }

  public getExtinctionAnalysis(): ExtinctionAnalysis | null {
    return this.analyzer.getLatestExtinctionAnalysis()
  }

  public getOscillationAnalysis(): OscillationAnalysis {
    return this.analyzer.getOscillationAnalysis()
  }

  public getConfig(): WorldConfig {
    return this.config
  }

  public updateConfig(newConfig: Partial<WorldConfig>): void {
    // Update configuration (this would require recreating the world in a real implementation)
    this.config = { ...this.config, ...newConfig }
    this.state.config = this.config
  }

  private startSimulationLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    const intervalMs = 1000 / this.state.speed // Convert steps per second to milliseconds
    this.intervalId = setInterval(() => {
      this.processStep()
    }, intervalMs)
  }

  private stopSimulationLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private processStep(): void {
    // Process one simulation step
    this.stepProcessor.processStep()
    
    // Update state
    this.state.currentStep = this.world.getCurrentStep()
    this.state.world = this.world.getState()
    
    // Record population data for analysis
    const stats = this.world.getState().statistics
    this.analyzer.recordPopulation(this.state.currentStep, stats)
    
    // Check for extinction events and analyze them
    this.checkExtinctionEvents()
    
    // Log debug information if enabled
    if (this.config.debug.showDebugInfo) {
      this.logDebugInfo()
    }
  }

  private checkExtinctionEvents(): void {
    const stats = this.world.getState().statistics
    
    // Check for grass extinction
    if (stats.grassCount === 0 && !this.hasExtinctionEvent('grass')) {
      this.addExtinctionEvent('grass', 'environmental')
    }
    
    // Check for sheep extinction
    if (stats.sheepCount === 0 && !this.hasExtinctionEvent('sheep')) {
      this.addExtinctionEvent('sheep', 'predation')
    }
    
    // Check for wolf extinction
    if (stats.wolfCount === 0 && !this.hasExtinctionEvent('wolf')) {
      this.addExtinctionEvent('wolf', 'starvation')
      
      // Perform detailed extinction analysis
      const analysis = this.analyzer.analyzeWolfExtinction(this.state.currentStep, stats.deathStats)
      console.log('🐺 WOLF EXTINCTION ANALYSIS:', analysis)
    }
    
    // Pause simulation if extinction occurs and debug setting is enabled
    if (this.config.debug.pauseOnExtinction && this.hasAnyExtinction()) {
      this.pause()
    }
  }

  private hasExtinctionEvent(species: 'grass' | 'sheep' | 'wolf'): boolean {
    const stats = this.world.getState().statistics
    return stats.extinctionEvents.some(event => event.species === species)
  }

  private addExtinctionEvent(species: 'grass' | 'sheep' | 'wolf', cause: 'starvation' | 'disease' | 'predation' | 'environmental'): void {
    const stats = this.world.getState().statistics
    stats.extinctionEvents.push({
      species,
      step: this.world.getCurrentStep(),
      cause
    })
  }

  private hasAnyExtinction(): boolean {
    const stats = this.world.getState().statistics
    return stats.extinctionEvents.length > 0
  }

  private logDebugInfo(): void {
    const stats = this.world.getState().statistics
    console.log(`Step ${this.world.getCurrentStep()}: Grass=${stats.grassCount}, Sheep=${stats.sheepCount}, Wolves=${stats.wolfCount}`)
  }

  public destroy(): void {
    this.stop()
    // Clean up any resources
  }
}
