// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'
import { createSimulation, defaultConfig, type Animal, type Simulation, type StepStats } from './index'

/** Every broken invariant after a step, as readable strings (empty when all hold). */
function violations(sim: Simulation, previous: StepStats): string[] {
  const found: string[] = []
  const fail = (what: string) => found.push(`step ${sim.stepCount}: ${what}`)
  const { stats } = sim
  if (stats.step !== sim.stepCount) fail(`stats.step ${stats.step} != stepCount`)

  for (const [list, at, params] of [
    [sim.sheep, sim.sheepAt.bind(sim), sim.config.sheep],
    [sim.wolves, sim.wolfAt.bind(sim), sim.config.wolf],
  ] as const) {
    const cells = new Set<string>()
    for (const a of list as readonly Animal[]) {
      const who = `${a.species} ${a.id} at ${a.x},${a.y}`
      cells.add(`${a.x},${a.y}`)
      if (at(a.x, a.y) !== a) fail(`${who} is not in its occupancy cell`)
      if (!a.alive) fail(`${who} is dead but listed`)
      if (!(Number.isFinite(a.energy) && a.energy > 0 && a.energy <= params.maxEnergy)) fail(`${who} has energy ${a.energy}`)
      if (a.age >= params.maxAge) fail(`${who} has age ${a.age}`)
      if (!(Number.isInteger(a.x) && a.x >= 0 && a.x < sim.width && Number.isInteger(a.y) && a.y >= 0 && a.y < sim.height)) {
        fail(`${who} is off the grid`)
      }
    }
    if (cells.size !== list.length) fail(`${list.length} animals share ${cells.size} cells`)
  }

  let sheepCells = 0
  let wolfCells = 0
  for (let y = 0; y < sim.height; y++) {
    for (let x = 0; x < sim.width; x++) {
      if (sim.sheepAt(x, y)) sheepCells++
      if (sim.wolfAt(x, y)) wolfCells++
    }
  }
  if (sheepCells !== sim.sheep.length) fail(`${sheepCells} sheep cells for ${sim.sheep.length} sheep`)
  if (wolfCells !== sim.wolves.length) fail(`${wolfCells} wolf cells for ${sim.wolves.length} wolves`)

  if (!sim.grass.every(g => g >= 0 && g <= 1)) fail('grass outside [0,1]')

  const sheepDeaths = stats.deaths.sheep.starvation + stats.deaths.sheep.oldAge + stats.deaths.sheep.predation
  const wolfDeaths = stats.deaths.wolves.starvation + stats.deaths.wolves.oldAge
  if (stats.sheep !== previous.sheep + stats.births.sheep - sheepDeaths) fail('sheep births/deaths do not add up')
  if (stats.wolves !== previous.wolves + stats.births.wolves - wolfDeaths) fail('wolf births/deaths do not add up')
  if (stats.sheep !== sim.sheep.length || stats.wolves !== sim.wolves.length) fail('stats counts differ from lists')
  return found
}

const history = (seed: number, steps: number) => {
  const sim = createSimulation(defaultConfig, seed)
  return Array.from({ length: steps }, () => { sim.step(); return sim.stats })
}

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === 'test' ? [] : sourceFiles(path)
    return name.endsWith('.ts') && !name.includes('.test.') ? [path] : []
  })

describe('simulation invariants', () => {
  it.each([1, 2, 3])('hold after every step (seed %i)', seed => {
    const sim = createSimulation(defaultConfig, seed)
    let previous = sim.stats
    for (let i = 0; i < 300; i++) {
      sim.step()
      expect(violations(sim, previous)).toEqual([])
      previous = sim.stats
    }
  })

  it('same seed gives identical runs', () => {
    expect(history(9, 300)).toEqual(history(9, 300))
  })

  it('different seeds diverge', () => {
    expect(history(9, 300)).not.toEqual(history(10, 300))
  })

  it('core is free of ambient randomness, time and logging', () => {
    const files = sourceFiles(join(__dirname))
    expect(files.length).toBeGreaterThanOrEqual(6)
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/Math\.random|Date\.now|console\./)
    }
  })
})
