import { describe, it, expect } from 'vitest'
import { createEmptySimulation, createSimulation, defaultConfig } from './index'
import { cellIndex } from './grid'
import { tinyConfig } from './test/helpers'

const positions = (animals: readonly { x: number; y: number }[]) => animals.map(a => `${a.x},${a.y}`)

describe('world', () => {
  it('grass regrows by regrowth and caps at 1', () => {
    const sim = createEmptySimulation(tinyConfig({ grass: { regrowth: 0.3 } }), 1)
    sim.setGrass(1, 1, 0.5)
    sim.setGrass(2, 2, 0.9)
    sim.step()
    expect(sim.grass[cellIndex(sim, 1, 1)]).toBeCloseTo(0.8)
    expect(sim.grass[cellIndex(sim, 2, 2)]).toBe(1)
    expect(sim.grass[cellIndex(sim, 0, 0)]).toBeCloseTo(0.3)
    expect(sim.stats.grass).toBeCloseTo(47 * 0.3 + 0.8 + 1, 4)
    expect(sim.stats.step).toBe(1)
  })

  it('stats before any step reflect the initial state', () => {
    const { stats } = createSimulation(defaultConfig, 1)
    expect(stats).toMatchObject({
      step: 0,
      sheep: 400,
      wolves: 20,
      births: { sheep: 0, wolves: 0 },
      deaths: { sheep: { starvation: 0, oldAge: 0, predation: 0 }, wolves: { starvation: 0, oldAge: 0 } },
    })
    expect(stats.grass).toBeGreaterThan(0)
  })

  it('createSimulation places initial animals on distinct cells', () => {
    const sim = createSimulation(defaultConfig, 2)
    expect(sim.sheep).toHaveLength(400)
    expect(sim.wolves).toHaveLength(20)
    expect(new Set(positions(sim.sheep)).size).toBe(400)
    expect(new Set(positions(sim.wolves)).size).toBe(20)
    for (const s of sim.sheep) expect(sim.sheepAt(s.x, s.y)).toBe(s)
    for (const w of sim.wolves) expect(sim.wolfAt(w.x, w.y)).toBe(w)
  })

  it('initial energy, age and grass are in the spec ranges', () => {
    const sim = createSimulation(defaultConfig, 3)
    for (const s of sim.sheep) {
      expect(s.energy).toBeGreaterThanOrEqual(5)
      expect(s.energy).toBeLessThanOrEqual(10)
      expect(Number.isInteger(s.age) && s.age >= 0 && s.age < 50).toBe(true)
    }
    for (const w of sim.wolves) {
      expect(w.energy).toBeGreaterThanOrEqual(15)
      expect(w.energy).toBeLessThanOrEqual(30)
      expect(Number.isInteger(w.age) && w.age >= 0 && w.age < 100).toBe(true)
    }
    const grass = Array.from(sim.grass)
    expect(grass.every(g => g >= 0 && g <= 1)).toBe(true)
    const mean = grass.reduce((a, b) => a + b, 0) / grass.length
    expect(mean).toBeGreaterThan(0.45)
    expect(mean).toBeLessThan(0.55)
  })

  it('same seed gives the same initial state, a different seed does not', () => {
    const a = createSimulation(defaultConfig, 5)
    const b = createSimulation(defaultConfig, 5)
    const c = createSimulation(defaultConfig, 6)
    expect(positions(a.sheep)).toEqual(positions(b.sheep))
    expect(positions(a.wolves)).toEqual(positions(b.wolves))
    expect(positions(a.sheep)).not.toEqual(positions(c.sheep))
  })

  it('addSheep rejects an occupied cell, but a wolf may share it', () => {
    const sim = createEmptySimulation(tinyConfig(), 1)
    const sheep = sim.addSheep(1, 1)
    expect(() => sim.addSheep(1, 1)).toThrow()
    const wolf = sim.addWolf(1, 1)
    expect(sim.sheepAt(1, 1)).toBe(sheep)
    expect(sim.wolfAt(1, 1)).toBe(wolf)
    expect(sheep.energy).toBe(10)
    expect(wolf.energy).toBe(30)
    expect(sim.stats.sheep).toBe(1)
    expect(sim.stats.wolves).toBe(1)
  })

  it('ids are unique and deterministic', () => {
    const ids = (seed: number) => {
      const sim = createSimulation(defaultConfig, seed)
      return [...sim.sheep, ...sim.wolves].map(a => a.id)
    }
    expect(new Set(ids(1)).size).toBe(420)
    expect(ids(1)).toEqual(ids(1))
  })
})
