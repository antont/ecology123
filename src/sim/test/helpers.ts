import { createConfig, defaultConfig, type ConfigOverrides, type SimConfig } from '../config'

/**
 * A 7×7 world with no randomness in the outcomes that tests care about:
 * no initial animals, no regrowth, no breeding, no wandering, no catching.
 * Tests switch on exactly the behaviour they exercise.
 */
export function tinyConfig(overrides: ConfigOverrides = {}): SimConfig {
  const base = createConfig({
    width: 7,
    height: 7,
    grass: { regrowth: 0 },
    sheep: { initial: 0, breedChance: 0, wander: 0 },
    wolf: { initial: 0, breedChance: 0, catchChance: 0 },
  }, defaultConfig)
  return createConfig(overrides, base)
}
