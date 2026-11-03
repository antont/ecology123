/** Small pure helpers for the UI's animation loop and controls. */

/** Whole simulation steps owed after `elapsedMs`, never more than `maxPerFrame`. */
export function stepsDue(elapsedMs: number, stepsPerSecond: number, maxPerFrame: number): number {
  if (elapsedMs <= 0) return 0
  return Math.min(maxPerFrame, Math.floor((elapsedMs * stepsPerSecond) / 1000))
}

/** A new array with `item` appended, keeping only the last `cap` items. */
export function appendCapped<T>(items: readonly T[], item: T, cap: number): T[] {
  const next = [...items, item]
  return next.length > cap ? next.slice(next.length - cap) : next
}

const MAX_SEED = 4294967295

/** A seed typed by a person: plain decimal digits, 0..2^32-1; anything else is null. */
export function parseSeed(input: string): number | null {
  const text = input.trim()
  if (!/^\d+$/.test(text)) return null
  const seed = Number(text)
  return seed <= MAX_SEED ? seed : null
}

/** A fresh seed for a new run. Randomness is fine here: the UI is outside the core. */
export function randomSeed(): number {
  return Math.floor(Math.random() * (MAX_SEED + 1))
}
