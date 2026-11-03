// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { bestLag, findPeaks, movingAverage, runHeadless } from './analysis'
import { defaultConfig } from './config'
import { createRng } from './rng'

const noise = (seed: number, amplitude: number) => {
  const rng = createRng(seed)
  return () => (rng.next() * 2 - 1) * amplitude
}

describe('analysis', () => {
  it('movingAverage is centred and uses available points at the edges', () => {
    expect(movingAverage([0, 0, 9, 0, 0], 3)).toEqual([0, 3, 3, 3, 0])
  })

  it('findPeaks finds each crest of a noisy sine', () => {
    const jitter = noise(1, 5)
    const series = Array.from({ length: 500 }, (_, i) => 100 + 50 * Math.sin((2 * Math.PI * i) / 100) + jitter())
    expect(findPeaks(movingAverage(series, 9), 25)).toHaveLength(5)
  })

  it('findPeaks finds nothing in flat noise', () => {
    const jitter = noise(2, 5)
    const series = Array.from({ length: 500 }, () => 100 + jitter())
    expect(findPeaks(movingAverage(series, 9), 25)).toEqual([])
  })

  it('bestLag recovers a known shift', () => {
    const lead = Array.from({ length: 1200 }, (_, i) => Math.sin((2 * Math.PI * i) / 120))
    const follow = Array.from({ length: 1200 }, (_, i) => Math.sin((2 * Math.PI * (i - 30)) / 120))
    expect(bestLag(lead, follow, 120)).toBe(30)
  })

  it('runHeadless returns one stats record per step', () => {
    const run = runHeadless(defaultConfig, 1, 50)
    expect(run.map(s => s.step)).toEqual(Array.from({ length: 50 }, (_, i) => i + 1))
    expect(run[49].sheep).toBeGreaterThan(0)
  })
})
