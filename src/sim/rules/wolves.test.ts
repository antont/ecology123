import { describe, it, expect } from 'vitest'
import { createEmptySimulation, createSimulation, type ConfigOverrides, type Simulation } from '../index'
import { torusDistance } from '../grid'
import { tinyConfig } from '../test/helpers'

const world = (overrides: ConfigOverrides = {}, seed = 1) =>
  createEmptySimulation(tinyConfig({ ...overrides, sheep: { vision: 0, ...overrides.sheep } }), seed)
const seeds = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

/** A sheep that stays put: its own cell is the only grass around. */
const stayingSheep = (sim: Simulation, x: number, y: number) => {
  sim.setGrass(x, y, 1)
  return sim.addSheep(x, y)
}

describe('wolf phase', () => {
  it('chases the truly nearest sheep, not the scan-first one', () => {
    for (const seed of seeds(20)) {
      const sim = world({ width: 9, height: 9, wolf: { vision: 4, speed: 1 } }, seed)
      const wolf = sim.addWolf(4, 4)
      stayingSheep(sim, 1, 1) // distance 3, up-left: first in scan order
      stayingSheep(sim, 6, 4) // distance 2
      sim.step()
      expect(wolf.x).toBe(5)
    }
  })

  it('finds a sheep when vision exceeds half the grid', () => {
    const sim = world({ wolf: { vision: 10 } })
    const wolf = sim.addWolf(0, 0)
    const sheep = stayingSheep(sim, 5, 5) // torus distance 2
    sim.step()
    expect(torusDistance(sim, wolf.x, wolf.y, sheep.x, sheep.y)).toBe(1)
  })

  it('takes up to speed moves toward its target', () => {
    const sim = world({ width: 9, height: 9, wolf: { vision: 4, speed: 2 } })
    const wolf = sim.addWolf(0, 4)
    stayingSheep(sim, 4, 4)
    sim.step()
    expect(torusDistance(sim, wolf.x, wolf.y, 4, 4)).toBe(2)
  })

  it('eats an adjacent sheep, energy capped at maxEnergy', () => {
    const sim = world({ wolf: { catchChance: 1 } })
    const wolf = sim.addWolf(3, 3, { energy: 25 })
    stayingSheep(sim, 4, 3)
    sim.step()
    expect(sim.stats.sheep).toBe(0)
    expect(sim.sheep).toHaveLength(0)
    expect(sim.sheepAt(4, 3)).toBeNull()
    expect(sim.stats.deaths.sheep.predation).toBe(1)
    expect(wolf.energy).toBe(30)
  })

  it('eats a sheep on its own cell', () => {
    const sim = world({ wolf: { catchChance: 1 } })
    sim.addWolf(3, 3)
    stayingSheep(sim, 3, 3)
    sim.step()
    expect(sim.stats.sheep).toBe(0)
    expect(sim.stats.deaths.sheep.predation).toBe(1)
  })

  it('never kills when catchChance is 0', () => {
    const sim = world({ wolf: { catchChance: 0 } })
    sim.addWolf(3, 3)
    const sheep = stayingSheep(sim, 4, 3)
    sim.step()
    expect(sheep.alive).toBe(true)
    expect(sim.stats.deaths.sheep.predation).toBe(0)
  })

  it('wanders one cell when no sheep is visible', () => {
    for (const seed of seeds(10)) {
      const sim = world({}, seed)
      const wolf = sim.addWolf(3, 3)
      sim.step()
      expect(torusDistance(sim, wolf.x, wolf.y, 3, 3)).toBe(1)
      expect(sim.wolfAt(wolf.x, wolf.y)).toBe(wolf)
      expect(sim.wolfAt(3, 3)).toBeNull()
    }
  })

  it('starves at zero energy and dies at maxAge', () => {
    const hungry = world()
    hungry.addWolf(3, 3, { energy: 0.5 })
    hungry.step()
    expect(hungry.wolves).toHaveLength(0)
    expect(hungry.stats.deaths.wolves.starvation).toBe(1)

    const old = world()
    old.addWolf(3, 3, { energy: 30, age: 199 })
    old.step()
    expect(old.wolves).toHaveLength(0)
    expect(old.stats.deaths.wolves.oldAge).toBe(1)
  })

  it("breeds onto a sheep's cell", () => {
    const sim = world({ width: 3, height: 3, wolf: { breedChance: 1, catchChance: 0 } })
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) sim.addSheep(x, y)
    const parent = sim.addWolf(1, 1, { energy: 30 })
    sim.step()
    expect(sim.stats.births.wolves).toBe(1)
    expect(sim.wolves).toHaveLength(2)
    const child = sim.wolves.find(w => w !== parent)!
    expect(`${child.x},${child.y}`).not.toBe(`${parent.x},${parent.y}`)
    expect(child.energy).toBeCloseTo(14.5)
    expect(parent.energy).toBeCloseTo(14.5)
    expect(child.age).toBe(0)
  })

  it('keeps stepping through extinction', () => {
    const sim = createSimulation(tinyConfig({ wolf: { initial: 5 } }), 1)
    let starved = 0
    for (let i = 0; i < 100; i++) {
      sim.step()
      starved += sim.stats.deaths.wolves.starvation
    }
    expect(sim.stats.wolves).toBe(0)
    expect(starved).toBe(5)
    for (let i = 0; i < 10; i++) sim.step()
    expect(sim.stats).toMatchObject({ sheep: 0, wolves: 0, step: 110 })
  })
})
