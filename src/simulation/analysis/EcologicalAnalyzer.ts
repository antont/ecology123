/**
 * EcologicalAnalyzer provides deep insights into population dynamics,
 * extinction events, and ecosystem health for observability and debugging.
 */

import { 
  DeathRecord, 
  DeathStatistics, 
  PopulationHealth, 
  EcosystemAlert, 
  CauseAnalysis, 
  ExtinctionAnalysis,
  SimulationStatistics,
  OscillationCycle,
  OscillationAnalysis
} from '../types/SimulationTypes'
import { WorldConfig } from '../config/WorldConfig'

export class EcologicalAnalyzer {
  private populationHistory: Array<{ step: number; grass: number; sheep: number; wolves: number }> = []
  private alerts: EcosystemAlert[] = []
  private extinctionAnalyses: ExtinctionAnalysis[] = []
  private config: WorldConfig
  private oscillationCycles: OscillationCycle[] = []
  private speciesStates: Record<string, { 
    trend: 'increasing' | 'decreasing' | 'stable';
    trendStartStep: number;
    trendStartPopulation: number;
    peakInTrend?: number;
    minInTrend?: number;
  }> = {}

  constructor(config: WorldConfig) {
    this.config = config
    // Initialize species states
    this.speciesStates = {
      grass: { trend: 'stable', trendStartStep: 0, trendStartPopulation: 0 },
      sheep: { trend: 'stable', trendStartStep: 0, trendStartPopulation: 0 },
      wolves: { trend: 'stable', trendStartStep: 0, trendStartPopulation: 0 }
    }
  }

  /**
   * Record population data for trend analysis
   */
  recordPopulation(step: number, stats: SimulationStatistics): void {
    this.populationHistory.push({
      step,
      grass: stats.grassCount,
      sheep: stats.sheepCount,
      wolves: stats.wolfCount
    })

    // Keep only last 100 steps for analysis
    if (this.populationHistory.length > 100) {
      this.populationHistory.shift()
    }

    // Detect oscillation cycles for each species
    this.detectOscillations(step, stats)

    // Check for critical events
    this.checkForAlerts(step, stats)
  }

  /**
   * Analyze wolf extinction and provide detailed insights
   */
  analyzeWolfExtinction(step: number, deathStats: DeathStatistics): ExtinctionAnalysis {
    const recentWolfDeaths = deathStats.recentDeaths.filter(d => d.organismType === 'wolf')
    const lastPopulationData = this.populationHistory.slice(-20) // Last 20 steps
    
    // Analyze primary causes
    const wolfDeathCauses = recentWolfDeaths.reduce((acc, death) => {
      acc[death.cause] = (acc[death.cause] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const primaryCause = Object.entries(wolfDeathCauses)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown'

    // Determine contributing factors
    const contributingFactors = this.identifyWolfExtinctionFactors(recentWolfDeaths, lastPopulationData)
    
    // Generate analysis
    const causeAnalysis: CauseAnalysis = {
      primaryCause,
      contributingFactors,
      confidence: this.calculateConfidence(recentWolfDeaths, contributingFactors),
      recommendation: this.generateWolfRecommendation(primaryCause, contributingFactors),
      preventionStrategy: this.generatePreventionStrategy(primaryCause)
    }

    const analysis: ExtinctionAnalysis = {
      species: 'wolf',
      step,
      lastPopulation: lastPopulationData[lastPopulationData.length - 1]?.wolves || 0,
      causeAnalysis,
      populationHistory: lastPopulationData.map(p => ({ step: p.step, count: p.wolves })),
      environmentalContext: {
        grassAvailability: lastPopulationData[lastPopulationData.length - 1]?.grass || 0,
        preyAvailability: lastPopulationData[lastPopulationData.length - 1]?.sheep || 0,
        competitionLevel: this.calculateCompetitionLevel(lastPopulationData)
      }
    }

    this.extinctionAnalyses.push(analysis)
    return analysis
  }

  /**
   * Get population health assessment for all species
   */
  getPopulationHealth(): PopulationHealth[] {
    if (this.populationHistory.length < 5) {
      return [] // Need at least 5 data points for trend analysis
    }

    const latest = this.populationHistory[this.populationHistory.length - 1]
    const recent = this.populationHistory.slice(-10) // Last 10 steps

    return [
      this.analyzeSpeciesHealth('grass', latest.grass, recent.map(p => p.grass)),
      this.analyzeSpeciesHealth('sheep', latest.sheep, recent.map(p => p.sheep)),
      this.analyzeSpeciesHealth('wolf', latest.wolves, recent.map(p => p.wolves))
    ]
  }

  /**
   * Get current ecosystem alerts
   */
  getActiveAlerts(): EcosystemAlert[] {
    // Return alerts from last 20 steps
    const recentStep = this.populationHistory[this.populationHistory.length - 1]?.step || 0
    return this.alerts.filter(alert => recentStep - alert.step <= 20)
  }

  /**
   * Get latest extinction analysis
   */
  getLatestExtinctionAnalysis(): ExtinctionAnalysis | null {
    return this.extinctionAnalyses[this.extinctionAnalyses.length - 1] || null
  }

  /**
   * Get oscillation analysis
   */
  getOscillationAnalysis(): OscillationAnalysis {
    const recentCycles = this.oscillationCycles.slice(-20) // Last 20 cycles
    const cyclesBySpecies = this.oscillationCycles.reduce((acc, cycle) => {
      acc[cycle.species] = (acc[cycle.species] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const nearExtinctionRecoveries = this.oscillationCycles.filter(
      cycle => cycle.cycleType === 'near_extinction_recovery'
    ).length

    const overgrowthCorrections = this.oscillationCycles.filter(
      cycle => cycle.cycleType === 'growth_to_decline' && cycle.amplitude > 100
    ).length

    const avgDuration = this.oscillationCycles.length > 0 
      ? this.oscillationCycles.reduce((sum, c) => sum + c.duration, 0) / this.oscillationCycles.length
      : 0

    const avgAmplitude = this.oscillationCycles.length > 0
      ? this.oscillationCycles.reduce((sum, c) => sum + c.amplitude, 0) / this.oscillationCycles.length
      : 0

    return {
      totalCycles: this.oscillationCycles.length,
      cyclesBySpecies,
      averageCycleDuration: avgDuration,
      averageAmplitude: avgAmplitude,
      oscillationHealth: this.assessOscillationHealth(),
      recentCycles,
      nearExtinctionRecoveries,
      overgrowthCorrections,
      stabilityScore: this.calculateOscillationStability()
    }
  }

  private identifyWolfExtinctionFactors(
    wolfDeaths: DeathRecord[], 
    populationData: Array<{ step: number; grass: number; sheep: number; wolves: number }>
  ): string[] {
    const factors: string[] = []

    // Analyze death patterns
    const hungerDeaths = wolfDeaths.filter(d => d.cause === 'hunger').length
    const totalDeaths = wolfDeaths.length

    if (hungerDeaths / totalDeaths > 0.7) {
      factors.push('Widespread starvation - wolves unable to find sufficient prey')
    }

    // Analyze prey availability
    const sheepPerWolf = populationData.map(p => p.wolves > 0 ? p.sheep / p.wolves : 0)
    const avgSheepPerWolf = sheepPerWolf.reduce((sum, ratio) => sum + ratio, 0) / sheepPerWolf.length

    if (avgSheepPerWolf < 5) {
      factors.push('Insufficient prey density - too few sheep per wolf for sustainable hunting')
    }

    // Analyze reproduction failures
    const reproductionFailures = wolfDeaths.filter(d => 
      d.reproductionState && d.reproductionState.cooldownRemaining > 20
    ).length

    if (reproductionFailures > totalDeaths * 0.3) {
      factors.push('Reproduction failure - wolves unable to breed successfully')
    }

    // Analyze territorial issues
    const territorialConflicts = wolfDeaths.filter(d => d.cause === 'territorial_conflict').length
    if (territorialConflicts > 0) {
      factors.push('Territorial conflicts - wolves competing for limited resources')
    }

    // Analyze isolation
    const isolationDeaths = wolfDeaths.filter(d => 
      d.environmentalFactors && (d.environmentalFactors.nearbyPrey || 0) < 2
    ).length

    if (isolationDeaths > totalDeaths * 0.4) {
      factors.push('Isolation - wolves unable to find prey in their territory')
    }

    // Analyze energy efficiency
    const lowEnergyDeaths = wolfDeaths.filter(d => d.energy < 0.3).length
    if (lowEnergyDeaths > totalDeaths * 0.6) {
      factors.push('Energy inefficiency - wolves burning more energy than they gain from hunting')
    }

    return factors
  }

  private analyzeSpeciesHealth(
    species: 'grass' | 'sheep' | 'wolf', 
    currentCount: number, 
    recentCounts: number[]
  ): PopulationHealth {
    const trend = this.calculateTrend(recentCounts)
    const healthScore = this.calculateHealthScore(species, currentCount, recentCounts)
    const riskFactors = this.identifyRiskFactors(species, currentCount, recentCounts)
    const timeToExtinction = this.estimateTimeToExtinction(recentCounts)

    return {
      species,
      currentCount,
      trend: currentCount === 0 ? 'extinct' : trend,
      healthScore,
      riskFactors,
      timeToExtinction: timeToExtinction > 0 ? timeToExtinction : undefined
    }
  }

  private calculateTrend(counts: number[]): 'increasing' | 'stable' | 'declining' {
    if (counts.length < 3) return 'stable'
    
    const recent = counts.slice(-5)
    const older = counts.slice(-10, -5)
    
    const recentAvg = recent.reduce((sum, c) => sum + c, 0) / recent.length
    const olderAvg = older.reduce((sum, c) => sum + c, 0) / older.length
    
    const change = (recentAvg - olderAvg) / olderAvg
    
    if (change > 0.1) return 'increasing'
    if (change < -0.1) return 'declining'
    return 'stable'
  }

  private calculateHealthScore(species: string, current: number, recent: number[]): number {
    if (current === 0) return 0
    
    const stability = this.calculateStability(recent)
    const sustainability = this.calculateSustainability(species, current)
    const trend = this.calculateTrend(recent)
    
    let score = 50 // Base score
    score += stability * 30
    score += sustainability * 20
    
    if (trend === 'increasing') score += 10
    else if (trend === 'declining') score -= 20
    
    return Math.max(0, Math.min(100, score))
  }

  private calculateStability(counts: number[]): number {
    if (counts.length < 3) return 0.5
    
    const mean = counts.reduce((sum, c) => sum + c, 0) / counts.length
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length
    const cv = variance > 0 ? Math.sqrt(variance) / mean : 0
    
    return Math.max(0, 1 - cv) // Lower coefficient of variation = higher stability
  }

  private calculateSustainability(species: string, current: number): number {
    const thresholds = {
      grass: this.config.width * this.config.height * 0.1, // 10% coverage minimum
      sheep: 50, // Minimum viable population
      wolf: 10   // Minimum viable population
    }
    
    const threshold = thresholds[species as keyof typeof thresholds] || 1
    return Math.min(1, current / threshold)
  }

  private identifyRiskFactors(species: string, current: number, recent: number[]): string[] {
    const factors: string[] = []
    
    if (current < 10 && species !== 'grass') {
      factors.push('Critically low population')
    }
    
    const trend = this.calculateTrend(recent)
    if (trend === 'declining') {
      factors.push('Declining population trend')
    }
    
    const stability = this.calculateStability(recent)
    if (stability < 0.3) {
      factors.push('High population volatility')
    }
    
    return factors
  }

  private estimateTimeToExtinction(counts: number[]): number {
    if (counts.length < 5) return -1
    
    const trend = this.calculateTrend(counts)
    if (trend !== 'declining') return -1
    
    const recent = counts.slice(-5)
    const declineRate = this.calculateDeclineRate(recent)
    
    if (declineRate <= 0) return -1
    
    const current = counts[counts.length - 1]
    return Math.ceil(current / declineRate)
  }

  private calculateDeclineRate(counts: number[]): number {
    if (counts.length < 2) return 0
    
    let totalDecline = 0
    let periods = 0
    
    for (let i = 1; i < counts.length; i++) {
      const decline = counts[i - 1] - counts[i]
      if (decline > 0) {
        totalDecline += decline
        periods++
      }
    }
    
    return periods > 0 ? totalDecline / periods : 0
  }

  private checkForAlerts(step: number, stats: SimulationStatistics): void {
    // Check for population decline alerts
    if (this.populationHistory.length >= 5) {
      const recent = this.populationHistory.slice(-5)
      
      // Wolf extinction risk
      if (stats.wolfCount <= 5 && stats.wolfCount > 0) {
        this.addAlert({
          id: `wolf-extinction-risk-${step}`,
          severity: 'critical',
          type: 'extinction_risk',
          species: 'wolf',
          message: `Wolf population critically low (${stats.wolfCount}). Extinction imminent!`,
          step,
          data: { count: stats.wolfCount, trend: this.calculateTrend(recent.map(p => p.wolves)) }
        })
      }
      
      // Sheep decline with abundant grass
      if (stats.sheepCount < 50 && stats.grassCount > 10000) {
        this.addAlert({
          id: `sheep-starvation-paradox-${step}`,
          severity: 'warning',
          type: 'starvation_event',
          species: 'sheep',
          message: `Sheep population declining despite abundant grass. Check predation pressure.`,
          step,
          data: { sheepCount: stats.sheepCount, grassCount: stats.grassCount }
        })
      }
    }
  }

  private addAlert(alert: EcosystemAlert): void {
    // Avoid duplicate alerts
    const exists = this.alerts.some(a => a.id === alert.id)
    if (!exists) {
      this.alerts.push(alert)
    }
  }

  private calculateCompetitionLevel(populationData: Array<{ wolves: number }>): number {
    const avgWolves = populationData.reduce((sum, p) => sum + p.wolves, 0) / populationData.length
    const maxSustainable = this.config.initialWolfCount * 1.5 // 50% above initial
    
    return Math.min(1, avgWolves / maxSustainable)
  }

  private calculateConfidence(deaths: DeathRecord[], factors: string[]): number {
    let confidence = 0.5 // Base confidence
    
    // More deaths = higher confidence in analysis
    confidence += Math.min(0.3, deaths.length * 0.05)
    
    // More factors identified = higher confidence
    confidence += Math.min(0.2, factors.length * 0.05)
    
    return Math.min(1, confidence)
  }

  private generateWolfRecommendation(primaryCause: string, factors: string[]): string {
    const recommendations: Record<string, string> = {
      hunger: 'Increase sheep population or reduce wolf energy consumption rate',
      isolation: 'Improve wolf movement range or reduce world size',
      reproduction_failure: 'Reduce wolf reproduction energy requirements or increase prey density',
      territorial_conflict: 'Increase territory size or reduce wolf population density'
    }
    
    const baseRecommendation = recommendations[primaryCause] || 'Review wolf parameters and environmental conditions'
    
    if (factors.some(f => f.includes('prey density'))) {
      return `${baseRecommendation}. Critical: Increase sheep reproduction rate or reduce wolf hunting efficiency.`
    }
    
    return baseRecommendation
  }

  private generatePreventionStrategy(primaryCause: string): string {
    const strategies: Record<string, string> = {
      hunger: 'Monitor prey-to-predator ratios and adjust reproduction rates dynamically',
      isolation: 'Implement pack coordination mechanisms for better hunting success',
      reproduction_failure: 'Add energy-dependent reproduction scaling to prevent breeding during scarcity',
      territorial_conflict: 'Implement territory expansion mechanisms during resource abundance'
    }
    
    return strategies[primaryCause] || 'Implement early warning system for population decline'
  }

  /**
   * Detect oscillation cycles for each species
   */
  private detectOscillations(step: number, stats: SimulationStatistics): void {
    const populations = {
      grass: stats.grassCount,
      sheep: stats.sheepCount,
      wolves: stats.wolfCount
    }

    // Check each species for trend changes
    Object.entries(populations).forEach(([species, currentPop]) => {
      this.detectSpeciesOscillation(species as 'grass' | 'sheep' | 'wolves', currentPop, step)
    })
  }

  /**
   * Detect oscillation for a specific species
   */
  private detectSpeciesOscillation(species: 'grass' | 'sheep' | 'wolves', currentPop: number, step: number): void {
    const state = this.speciesStates[species]
    if (!state) return

    // Need at least 5 steps of history to detect trends
    if (this.populationHistory.length < 5) {
      state.trendStartStep = step
      state.trendStartPopulation = currentPop
      return
    }

    const recent = this.populationHistory.slice(-5).map(h => h[species])
    const newTrend = this.detectTrend(recent)
    
    // Update peak/min tracking
    if (!state.peakInTrend || currentPop > state.peakInTrend) {
      state.peakInTrend = currentPop
    }
    if (!state.minInTrend || currentPop < state.minInTrend) {
      state.minInTrend = currentPop
    }

    // Check for trend change (oscillation detected!)
    if (newTrend !== state.trend && newTrend !== 'stable') {
      this.recordOscillationCycle(species, state, currentPop, step, newTrend)
      
      // Reset state for new trend
      state.trend = newTrend
      state.trendStartStep = step
      state.trendStartPopulation = currentPop
      state.peakInTrend = currentPop
      state.minInTrend = currentPop
    }
  }

  /**
   * Record an oscillation cycle
   */
  private recordOscillationCycle(
    species: 'grass' | 'sheep' | 'wolves',
    state: { trend: 'increasing' | 'decreasing' | 'stable'; trendStartStep: number; trendStartPopulation: number; lastPop?: number; peakInTrend?: number; minInTrend?: number },
    currentPop: number,
    step: number,
    newTrend: 'increasing' | 'decreasing'
  ): void {
    const duration = step - state.trendStartStep
    const amplitude = (state.peakInTrend || 0) - (state.minInTrend || 0)
    
    // Determine cycle type
    let cycleType: OscillationCycle['cycleType']
    let triggerFactor: string | undefined

    if (state.trend === 'increasing' && newTrend === 'decreasing') {
      cycleType = 'growth_to_decline'
      if (species === 'sheep' && this.getRecentWolfPopulation() > 20) {
        triggerFactor = 'Predation pressure from wolves'
      } else if (species === 'wolves' && this.getRecentSheepPopulation() < 50) {
        triggerFactor = 'Prey depletion'
      } else if (species === 'grass' && this.getRecentSheepPopulation() > 200) {
        triggerFactor = 'Overgrazing by sheep'
      }
    } else if (state.trend === 'decreasing' && newTrend === 'increasing') {
      cycleType = 'decline_to_growth'
      if (state.minInTrend && state.minInTrend < 10) {
        cycleType = 'near_extinction_recovery'
        triggerFactor = 'Recovery from near extinction'
      } else if (species === 'sheep' && this.getRecentWolfPopulation() < 10) {
        triggerFactor = 'Reduced predation pressure'
      } else if (species === 'wolves' && this.getRecentSheepPopulation() > 100) {
        triggerFactor = 'Increased prey availability'
      }
    } else {
      return // No significant cycle
    }

    // Only record significant cycles (duration > 3 steps, amplitude > 5)
    if (duration > 3 && amplitude > 5) {
      const cycle: OscillationCycle = {
        species: species === 'wolves' ? 'wolf' : species as 'grass' | 'sheep' | 'wolf',
        cycleType,
        startStep: state.trendStartStep,
        endStep: step,
        startPopulation: state.trendStartPopulation,
        endPopulation: currentPop,
        peakPopulation: state.peakInTrend,
        minPopulation: state.minInTrend,
        duration,
        amplitude,
        triggerFactor
      }

      this.oscillationCycles.push(cycle)
      
      // Keep only last 50 cycles
      if (this.oscillationCycles.length > 50) {
        this.oscillationCycles.shift()
      }

      console.log(`🌊 OSCILLATION DETECTED: ${species} ${cycleType} (${duration} steps, amplitude: ${amplitude})${triggerFactor ? ` - ${triggerFactor}` : ''}`)
    }
  }

  /**
   * Detect trend from recent population data
   */
  private detectTrend(recent: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (recent.length < 3) return 'stable'
    
    const first = recent.slice(0, 2).reduce((sum, n) => sum + n, 0) / 2
    const last = recent.slice(-2).reduce((sum, n) => sum + n, 0) / 2
    
    const change = (last - first) / first
    
    if (change > 0.15) return 'increasing'
    if (change < -0.15) return 'decreasing'
    return 'stable'
  }

  /**
   * Helper methods to get recent population data
   */
  private getRecentWolfPopulation(): number {
    const recent = this.populationHistory.slice(-3)
    return recent.length > 0 ? recent.reduce((sum, h) => sum + h.wolves, 0) / recent.length : 0
  }

  private getRecentSheepPopulation(): number {
    const recent = this.populationHistory.slice(-3)
    return recent.length > 0 ? recent.reduce((sum, h) => sum + h.sheep, 0) / recent.length : 0
  }

  /**
   * Assess overall oscillation health
   */
  private assessOscillationHealth(): OscillationAnalysis['oscillationHealth'] {
    if (this.oscillationCycles.length === 0) return 'extinct'
    
    const recentCycles = this.oscillationCycles.slice(-10)
    const recoveries = recentCycles.filter(c => c.cycleType === 'near_extinction_recovery').length
    const corrections = recentCycles.filter(c => c.cycleType === 'growth_to_decline').length
    
    if (recoveries >= 2 && corrections >= 2) return 'healthy'
    if (recoveries >= 1 || corrections >= 1) return 'damped'
    return 'chaotic'
  }

  /**
   * Calculate oscillation stability score
   */
  private calculateOscillationStability(): number {
    if (this.oscillationCycles.length < 4) return 0
    
    const recentCycles = this.oscillationCycles.slice(-10)
    let score = 0
    
    // Points for having cycles
    score += Math.min(40, recentCycles.length * 4)
    
    // Points for near-extinction recoveries
    const recoveries = recentCycles.filter(c => c.cycleType === 'near_extinction_recovery').length
    score += recoveries * 15
    
    // Points for overgrowth corrections
    const corrections = recentCycles.filter(c => c.cycleType === 'growth_to_decline').length
    score += corrections * 10
    
    // Points for consistent cycle durations
    if (recentCycles.length >= 4) {
      const durations = recentCycles.map(c => c.duration)
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
      const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length
      const consistency = Math.max(0, 1 - (variance / avgDuration))
      score += consistency * 20
    }
    
    return Math.min(100, score)
  }
}
