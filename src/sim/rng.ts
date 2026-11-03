/** Seeded pseudo-random number generator; the only source of randomness in the core. */
export interface Rng {
  /** Uniform in [0, 1). */
  next(): number
  /** Uniform integer in 0..n-1. */
  int(n: number): number
  /** Uniform element of a non-empty array. */
  pick<T>(items: readonly T[]): T
  /** In-place Fisher–Yates shuffle; returns the same array. */
  shuffle<T>(items: T[]): T[]
}

/** mulberry32: small, fast, and good enough for simulation. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const int = (n: number) => Math.floor(next() * n)

  return {
    next,
    int,
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error('pick from empty array')
      return items[int(items.length)]
    },
    shuffle<T>(items: T[]): T[] {
      for (let i = items.length - 1; i > 0; i--) {
        const j = int(i + 1)
        const tmp = items[i]
        items[i] = items[j]
        items[j] = tmp
      }
      return items
    },
  }
}
