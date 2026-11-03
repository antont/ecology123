import { describe, it, expect } from 'vitest'
import { ConfigError, createConfig, defaultConfig } from './config'

const rejects = (overrides: Parameters<typeof createConfig>[0], path: string) => {
  expect(() => createConfig(overrides)).toThrow(ConfigError)
  expect(() => createConfig(overrides)).toThrow(path)
}

describe('config', () => {
  it('defaultConfig matches the spec', () => {
    expect(defaultConfig).toEqual({
      width: 80,
      height: 80,
      grass: { regrowth: 0.03 },
      sheep: {
        initial: 400, maxEnergy: 10, metabolism: 0.5, biteSize: 0.5, energyPerGrass: 2,
        breedThreshold: 6, breedChance: 0.08, vision: 2, wander: 0.2, maxAge: 100,
      },
      wolf: {
        initial: 20, maxEnergy: 30, metabolism: 1.0, energyPerSheep: 9,
        breedThreshold: 18, breedChance: 0.05, vision: 3, speed: 1, catchChance: 0.22, maxAge: 200,
      },
    })
  })

  it('createConfig merges per group without mutating the base', () => {
    const config = createConfig({ sheep: { vision: 5 } })
    expect(config.sheep.vision).toBe(5)
    expect(config.sheep.maxEnergy).toBe(10)
    expect(config.wolf).toEqual(defaultConfig.wolf)
    expect(defaultConfig.sheep.vision).toBe(2)
  })

  it('createConfig validates the merged result', () => {
    rejects({ wolf: { catchChance: 1.5 } }, 'wolf.catchChance')
  })

  it('rejects grids smaller than 3', () => {
    rejects({ width: 2 }, 'width')
    rejects({ height: 0 }, 'height')
    rejects({ width: 10.5 }, 'width')
  })

  it('rejects probabilities outside [0,1]', () => {
    rejects({ sheep: { breedChance: -0.1 } }, 'sheep.breedChance')
    rejects({ sheep: { wander: -0.1 } }, 'sheep.wander')
    rejects({ wolf: { breedChance: -0.1 } }, 'wolf.breedChance')
    rejects({ wolf: { catchChance: -0.1 } }, 'wolf.catchChance')
  })

  it('rejects non-positive energies and lifespans', () => {
    rejects({ sheep: { maxEnergy: 0 } }, 'sheep.maxEnergy')
    rejects({ wolf: { maxAge: 0 } }, 'wolf.maxAge')
  })

  it('rejects breedThreshold above maxEnergy', () => {
    rejects({ sheep: { breedThreshold: 11 } }, 'sheep.breedThreshold')
  })

  it('rejects initial counts above cell count', () => {
    rejects({ width: 3, height: 3, sheep: { initial: 10 } }, 'sheep.initial')
    rejects({ wolf: { initial: 2.5 } }, 'wolf.initial')
  })

  it('rejects negative vision, speed, metabolism, regrowth', () => {
    rejects({ sheep: { vision: -1 } }, 'sheep.vision')
    rejects({ wolf: { speed: -1 } }, 'wolf.speed')
    rejects({ wolf: { metabolism: -0.1 } }, 'wolf.metabolism')
    rejects({ grass: { regrowth: -0.01 } }, 'grass.regrowth')
  })

  it('accepts the defaults and zero probabilities', () => {
    expect(() => createConfig()).not.toThrow()
    expect(() => createConfig({ sheep: { breedChance: 0, initial: 0 }, wolf: { catchChance: 0 } })).not.toThrow()
  })
})
