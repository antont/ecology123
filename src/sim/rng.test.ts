import { describe, it, expect } from 'vitest'
import { createRng } from './rng'

const draws = (seed: number, n: number) => {
  const rng = createRng(seed)
  return Array.from({ length: n }, () => rng.next())
}

describe('createRng', () => {
  it('same seed gives same sequence', () => {
    expect(draws(7, 100)).toEqual(draws(7, 100))
  })

  it('different seeds give different sequences', () => {
    expect(draws(1, 100)).not.toEqual(draws(2, 100))
  })

  it('next stays in [0,1)', () => {
    for (const v of draws(3, 10_000)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('int is uniform over 0..n-1', () => {
    const rng = createRng(4)
    const buckets = [0, 0, 0, 0, 0, 0]
    for (let i = 0; i < 60_000; i++) {
      const v = rng.int(6)
      expect(Number.isInteger(v) && v >= 0 && v <= 5).toBe(true)
      buckets[v]++
    }
    for (const count of buckets) {
      expect(count).toBeGreaterThan(9_500)
      expect(count).toBeLessThan(10_500)
    }
  })

  it('pick returns an element and covers all', () => {
    const rng = createRng(5)
    const seen = new Set(Array.from({ length: 1000 }, () => rng.pick(['a', 'b', 'c'])))
    expect([...seen].sort()).toEqual(['a', 'b', 'c'])
  })

  it('shuffle is a deterministic permutation', () => {
    const range = () => Array.from({ length: 20 }, (_, i) => i)
    const a = createRng(3).shuffle(range())
    const b = createRng(3).shuffle(range())
    expect(a).toEqual(b)
    expect([...a].sort((x, y) => x - y)).toEqual(range())
    expect(a).not.toEqual(range())
  })
})
