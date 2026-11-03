import { describe, it, expect } from 'vitest'
import { createEmptySimulation, type ConfigOverrides } from '../index'
import { cellIndex, torusDistance } from '../grid'
import { tinyConfig } from '../test/helpers'

const world = (overrides: ConfigOverrides = {}, seed = 1) => createEmptySimulation(tinyConfig(overrides), seed)
const seeds = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

describe('sheep phase', () => {
  it('pays metabolism', () => {
    const sim = world()
    const sheep = sim.addSheep(3, 3, { energy: 5 })
    sim.step()
    expect(sheep.energy).toBeCloseTo(4.5)
    expect(sheep.age).toBe(1)
  })

  it('dies of starvation at zero energy', () => {
    const sim = world()
    sim.addSheep(3, 3, { energy: 0.4 })
    sim.step()
    expect(sim.sheep).toHaveLength(0)
    expect(sim.stats.sheep).toBe(0)
    expect(sim.stats.deaths.sheep.starvation).toBe(1)
    expect([...Array(49).keys()].some(i => sim.sheepAt(i % 7, Math.floor(i / 7)))).toBe(false)
  })

  it('dies of old age at maxAge', () => {
    const sim = world()
    sim.addSheep(3, 3, { energy: 10, age: 99 })
    sim.step()
    expect(sim.sheep).toHaveLength(0)
    expect(sim.stats.deaths.sheep.oldAge).toBe(1)
    expect(sim.stats.deaths.sheep.starvation).toBe(0)
  })

  it('moves to the grassiest neighbour and eats', () => {
    const sim = world()
    const sheep = sim.addSheep(3, 3, { energy: 5 })
    sim.setGrass(4, 3, 1)
    sim.step()
    expect([sheep.x, sheep.y]).toEqual([4, 3])
    expect(sim.sheepAt(4, 3)).toBe(sheep)
    expect(sim.sheepAt(3, 3)).toBeNull()
    expect(sim.grass[cellIndex(sim, 4, 3)]).toBeCloseTo(0.5)
    expect(sheep.energy).toBeCloseTo(5 - 0.5 + 0.5 * 2)
  })

  it('caps energy at maxEnergy', () => {
    const sim = world()
    const sheep = sim.addSheep(3, 3, { energy: 9.9 })
    sim.setGrass(3, 3, 1)
    sim.step()
    expect([sheep.x, sheep.y]).toEqual([3, 3])
    expect(sheep.energy).toBe(10)
  })

  it('moves across the wrap edge', () => {
    const sim = world()
    const sheep = sim.addSheep(0, 3, { energy: 5 })
    sim.setGrass(6, 3, 1)
    sim.step()
    expect([sheep.x, sheep.y]).toEqual([6, 3])
  })

  it('never moves onto a wolf', () => {
    for (const seed of seeds(20)) {
      const sim = world({ sheep: { vision: 0 }, wolf: { vision: 1 } }, seed)
      const sheep = sim.addSheep(3, 3, { energy: 5 })
      sim.addWolf(4, 3)
      sim.setGrass(4, 3, 1)
      sim.step()
      expect([sheep.x, sheep.y]).not.toEqual([4, 3])
    }
  })

  it('flees a visible wolf', () => {
    for (const seed of seeds(20)) {
      const sim = world({ sheep: { vision: 2 }, wolf: { vision: 1 } }, seed)
      for (let i = 0; i < 49; i++) sim.setGrass(i % 7, Math.floor(i / 7), 0.5)
      const sheep = sim.addSheep(3, 3, { energy: 5 })
      sim.addWolf(2, 3)
      sim.step()
      expect(sheep.x).toBe(4)
    }
  })

  it('flees the nearest wolf from each cell, not into a second wolf', () => {
    for (const seed of seeds(20)) {
      const sim = world({ sheep: { vision: 2 }, wolf: { vision: 1 } }, seed)
      for (let i = 0; i < 49; i++) sim.setGrass(i % 7, Math.floor(i / 7), 0.5)
      const sheep = sim.addSheep(3, 3, { energy: 5 })
      sim.addWolf(1, 3)
      sim.addWolf(5, 3)
      sim.step()
      // Stepping sideways (x=2 or 4) would put it next to one of the wolves
      expect(sheep.x, `seed ${seed}`).toBe(3)
    }
  })

  it('wanders at random when wander is 1', () => {
    const ends = new Set<string>()
    for (const seed of seeds(40)) {
      const sim = world({ sheep: { wander: 1 } }, seed)
      const sheep = sim.addSheep(3, 3, { energy: 5 })
      sim.setGrass(4, 3, 1)
      sim.step()
      ends.add(`${sheep.x},${sheep.y}`)
    }
    expect(ends.size).toBeGreaterThanOrEqual(5)
  })

  it('breeds: splits energy, child on a free neighbour, child does not act', () => {
    const sim = world({ sheep: { breedChance: 1 } })
    const parent = sim.addSheep(3, 3, { energy: 10 })
    sim.step()
    expect(sim.sheep).toHaveLength(2)
    expect(sim.stats.births.sheep).toBe(1)
    const child = sim.sheep.find(s => s !== parent)!
    expect(parent.energy).toBeCloseTo(4.75)
    expect(child.energy).toBeCloseTo(4.75)
    expect(torusDistance(sim, parent.x, parent.y, child.x, child.y)).toBe(1)
    expect(child.age).toBe(0)
  })

  it('does not breed below the threshold', () => {
    const sim = world({ sheep: { breedChance: 1 } })
    sim.addSheep(3, 3, { energy: 6 })
    sim.step()
    expect(sim.stats.births.sheep).toBe(0)
    expect(sim.sheep).toHaveLength(1)
  })

  it('does not breed or move without a free neighbour', () => {
    const sim = world({ width: 3, height: 3, sheep: { breedChance: 1 } })
    const start = new Map<number, string>()
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) start.set(sim.addSheep(x, y, { energy: 10 }).id, `${x},${y}`)
    sim.step()
    expect(sim.stats.births.sheep).toBe(0)
    expect(sim.sheep).toHaveLength(9)
    for (const s of sim.sheep) expect(`${s.x},${s.y}`).toBe(start.get(s.id))
  })
})
