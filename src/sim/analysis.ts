/** Time-series helpers for judging population dynamics (used by tests and the UI). */
import type { SimConfig } from './config'
import { createSimulation, type StepStats } from './world'

/** Centred moving average; near the edges it averages the points that exist. */
export function movingAverage(series: readonly number[], window: number): number[] {
  const half = Math.floor(window / 2)
  return series.map((_, i) => {
    let sum = 0
    let count = 0
    for (let j = Math.max(0, i - half); j <= Math.min(series.length - 1, i + half); j++) {
      sum += series[j]
      count++
    }
    return sum / count
  })
}

/**
 * Indices of local maxima whose topographic prominence is at least `minProminence`:
 * the height above the higher of the lowest points reached walking left and right
 * before meeting higher ground.
 */
export function findPeaks(series: readonly number[], minProminence: number): number[] {
  const peaks: number[] = []
  for (let i = 1; i < series.length - 1; i++) {
    const v = series[i]
    if (!(v > series[i - 1] && v >= series[i + 1])) continue
    let leftMin = v
    for (let j = i - 1; j >= 0 && series[j] <= v; j--) leftMin = Math.min(leftMin, series[j])
    let rightMin = v
    for (let j = i + 1; j < series.length && series[j] <= v; j++) rightMin = Math.min(rightMin, series[j])
    if (v - Math.max(leftMin, rightMin) >= minProminence) peaks.push(i)
  }
  return peaks
}

/** The lag (0..maxLag) at which `follow` best tracks `lead`, by cross-covariance. */
export function bestLag(lead: readonly number[], follow: readonly number[], maxLag: number): number {
  const mean = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  const ml = mean(lead)
  const mf = mean(follow)
  let best = 0
  let bestScore = -Infinity
  for (let lag = 0; lag <= maxLag; lag++) {
    let score = 0
    for (let i = 0; i + lag < lead.length && i + lag < follow.length; i++) {
      score += (lead[i] - ml) * (follow[i + lag] - mf)
    }
    if (score > bestScore) {
      bestScore = score
      best = lag
    }
  }
  return best
}

/** Runs a fresh simulation and returns its stats after every step. */
export function runHeadless(config: SimConfig, seed: number, steps: number): StepStats[] {
  const sim = createSimulation(config, seed)
  const history: StepStats[] = []
  for (let i = 0; i < steps; i++) {
    sim.step()
    history.push(sim.stats)
    if (sim.stats.sheep === 0 && sim.stats.wolves === 0) break
  }
  return history
}
