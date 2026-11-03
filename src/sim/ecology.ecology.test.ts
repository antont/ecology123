/**
 * The model's reason to exist (design doc §6.5): on the default config, sheep and
 * wolves coexist in sustained predator-prey cycles, wolves lagging sheep, without
 * sheep ever carpeting the grid. Thresholds are fixed; never loosen them to pass.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { bestLag, findPeaks, movingAverage, runHeadless } from './analysis'
import { defaultConfig } from './config'
import type { StepStats } from './world'

const SEEDS = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110]
const STEPS = 3000
const cells = defaultConfig.width * defaultConfig.height

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

interface Run {
  seed: number
  history: StepStats[]
  survived: boolean
  sheep: number[]
  wolves: number[]
  peaks: number[]
}

let runs: Run[] = []

/** Long synchronous runs starve the test worker's RPC; let it breathe between seeds. */
const yieldToLoop = () => new Promise(resolve => setImmediate(resolve))

beforeAll(async () => {
  for (const seed of SEEDS) {
    await yieldToLoop()
    const history = runHeadless(defaultConfig, seed, STEPS)
    const last = history[history.length - 1]
    const sheep = movingAverage(history.map(s => s.sheep), 9)
    const wolves = movingAverage(history.map(s => s.wolves), 9)
    runs.push({
      seed,
      history,
      survived: history.length === STEPS && last.sheep > 0 && last.wolves > 0,
      sheep,
      wolves,
      peaks: findPeaks(sheep, 0.25 * mean(sheep)),
    })
  }
})

describe('ecology on the default config', () => {
  it('both species coexist for 3000 steps in at least 9 of 10 seeds', () => {
    const survivors = runs.filter(r => r.survived).map(r => r.seed)
    expect(survivors.length, `survivors: ${survivors.join(',')}`).toBeGreaterThanOrEqual(9)
  })

  it('sheep never exceed 30% of cells', () => {
    for (const run of runs) {
      const peak = Math.max(...run.history.map(s => s.sheep))
      expect(peak / cells, `seed ${run.seed}`).toBeLessThanOrEqual(0.3)
    }
  })

  it('sheep populations cycle at least 10 times', () => {
    const survivors = runs.filter(r => r.survived)
    expect(survivors.length, 'surviving runs to measure').toBeGreaterThan(0)
    for (const run of survivors) {
      expect(run.peaks.length, `seed ${run.seed}`).toBeGreaterThanOrEqual(10)
    }
  })

  it('wolf peaks follow sheep peaks by less than half a cycle', () => {
    const periods: number[] = []
    const lags: number[] = []
    for (const run of runs.filter(r => r.survived && r.peaks.length >= 2)) {
      const period = (run.peaks[run.peaks.length - 1] - run.peaks[0]) / (run.peaks.length - 1)
      periods.push(period)
      lags.push(bestLag(run.sheep, run.wolves, Math.round(period)))
    }
    expect(lags.length, 'surviving, cycling runs to measure').toBeGreaterThan(0)
    const lag = median(lags)
    expect(lag).toBeGreaterThan(0)
    expect(lag).toBeLessThan(0.5 * median(periods))
  })

  it('runs 3000 steps in under 3 seconds', () => {
    const start = performance.now()
    runHeadless(defaultConfig, 1, STEPS)
    expect(performance.now() - start).toBeLessThan(3000)
  })
})
