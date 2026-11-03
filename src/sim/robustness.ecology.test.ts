/**
 * Guards against the defaults sitting at the edge of the viable window (design doc
 * §6.5): nudging any key parameter by ±20% must still let both species coexist.
 */
import { describe, it, expect } from 'vitest'
import { runHeadless } from './analysis'
import { createConfig, defaultConfig, type ConfigOverrides } from './config'

const SEEDS = [201, 202, 203, 204, 205]
const STEPS = 2000

const KEYS = [
  ['wolf', 'catchChance'],
  ['wolf', 'energyPerSheep'],
  ['wolf', 'metabolism'],
  ['wolf', 'breedChance'],
  ['sheep', 'breedChance'],
  ['grass', 'regrowth'],
  ['sheep', 'energyPerGrass'],
  ['sheep', 'metabolism'],
] as const

const variants = KEYS.flatMap(([group, key]) => [0.8, 1.2].map(factor => {
  const value = (defaultConfig[group] as Record<string, number>)[key] * factor
  return { name: `${group}.${key} x${factor}`, overrides: { [group]: { [key]: value } } as ConfigOverrides }
}))

/** Long synchronous runs starve the test worker's RPC; let it breathe between seeds. */
const yieldToLoop = () => new Promise(resolve => setImmediate(resolve))

describe('robustness of the default config', () => {
  it.each(variants)('$name: coexistence in at least 4 of 5 seeds', async ({ overrides }) => {
    const config = createConfig(overrides)
    const survived: number[] = []
    for (const seed of SEEDS) {
      await yieldToLoop()
      const history = runHeadless(config, seed, STEPS)
      const last = history[history.length - 1]
      if (history.length === STEPS && last.sheep > 0 && last.wolves > 0) survived.push(seed)
    }
    expect(survived.length, `survivors: ${survived.join(',')}`).toBeGreaterThanOrEqual(4)
  })
})
