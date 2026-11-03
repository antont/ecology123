/** Every parameter of the model. Each field is read by the rules; none is decorative. */

export interface SheepParams {
  initial: number
  maxEnergy: number
  metabolism: number
  biteSize: number
  energyPerGrass: number
  breedThreshold: number
  breedChance: number
  vision: number
  wander: number
  maxAge: number
}

export interface WolfParams {
  initial: number
  maxEnergy: number
  metabolism: number
  energyPerSheep: number
  breedThreshold: number
  breedChance: number
  vision: number
  speed: number
  catchChance: number
  maxAge: number
}

export interface SimConfig {
  width: number
  height: number
  grass: { regrowth: number }
  sheep: SheepParams
  wolf: WolfParams
}

export interface ConfigOverrides {
  width?: number
  height?: number
  grass?: Partial<SimConfig['grass']>
  sheep?: Partial<SheepParams>
  wolf?: Partial<WolfParams>
}

/** Values validated by the calibration spike (see the design doc, §4.6 and §7). */
export const defaultConfig: SimConfig = {
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
}

export class ConfigError extends Error {}

type Check = (value: number) => boolean

const isInt: Check = v => Number.isInteger(v)
const atLeast = (min: number): Check => v => Number.isFinite(v) && v >= min
const positive: Check = v => Number.isFinite(v) && v > 0
const probability: Check = v => v >= 0 && v <= 1

function ensure(path: string, value: number, ...checks: Check[]): void {
  if (!checks.every(check => check(value))) {
    throw new ConfigError(`invalid config: ${path} = ${value}`)
  }
}

export function validateConfig(config: SimConfig): void {
  // Below 3 cells, a cell's 8 wrapped neighbours are no longer distinct
  ensure('width', config.width, isInt, atLeast(3))
  ensure('height', config.height, isInt, atLeast(3))
  ensure('grass.regrowth', config.grass.regrowth, atLeast(0))

  const cells = config.width * config.height
  for (const species of ['sheep', 'wolf'] as const) {
    const p = config[species]
    ensure(`${species}.initial`, p.initial, isInt, atLeast(0), v => v <= cells)
    ensure(`${species}.maxEnergy`, p.maxEnergy, positive)
    ensure(`${species}.metabolism`, p.metabolism, atLeast(0))
    ensure(`${species}.breedThreshold`, p.breedThreshold, atLeast(0), v => v <= p.maxEnergy)
    ensure(`${species}.breedChance`, p.breedChance, probability)
    ensure(`${species}.vision`, p.vision, isInt, atLeast(0))
    ensure(`${species}.maxAge`, p.maxAge, positive)
  }
  ensure('sheep.biteSize', config.sheep.biteSize, atLeast(0))
  ensure('sheep.energyPerGrass', config.sheep.energyPerGrass, atLeast(0))
  ensure('sheep.wander', config.sheep.wander, probability)
  ensure('wolf.energyPerSheep', config.wolf.energyPerSheep, atLeast(0))
  ensure('wolf.speed', config.wolf.speed, isInt, atLeast(0))
  ensure('wolf.catchChance', config.wolf.catchChance, probability)
}

export function createConfig(overrides: ConfigOverrides = {}, base: SimConfig = defaultConfig): SimConfig {
  const config: SimConfig = {
    width: overrides.width ?? base.width,
    height: overrides.height ?? base.height,
    grass: { ...base.grass, ...overrides.grass },
    sheep: { ...base.sheep, ...overrides.sheep },
    wolf: { ...base.wolf, ...overrides.wolf },
  }
  validateConfig(config)
  return config
}
