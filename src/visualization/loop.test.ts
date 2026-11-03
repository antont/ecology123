import { describe, it, expect } from 'vitest'
import { appendCapped, parseSeed, stepsDue } from './loop'

describe('stepsDue', () => {
  it('converts elapsed time to whole steps', () => {
    expect(stepsDue(100, 10, 10)).toBe(1)
    expect(stepsDue(50, 10, 10)).toBe(0)
    expect(stepsDue(250, 10, 10)).toBe(2)
  })

  it('never catches up more than maxPerFrame after a long gap (hidden tab)', () => {
    expect(stepsDue(60_000, 60, 10)).toBe(10)
  })

  it('treats negative elapsed time as no steps', () => {
    expect(stepsDue(-5, 10, 10)).toBe(0)
  })
})

describe('appendCapped', () => {
  it('keeps only the last cap items without mutating the input', () => {
    const input = [1, 2, 3]
    expect(appendCapped(input, 4, 3)).toEqual([2, 3, 4])
    expect(input).toEqual([1, 2, 3])
    expect(appendCapped([1], 2, 3)).toEqual([1, 2])
  })
})

describe('parseSeed', () => {
  it('accepts unsigned 32-bit decimal integers', () => {
    expect(parseSeed('42')).toBe(42)
    expect(parseSeed(' 7 ')).toBe(7)
    expect(parseSeed('0')).toBe(0)
    expect(parseSeed('4294967295')).toBe(4294967295)
  })

  it('rejects anything else', () => {
    for (const bad of ['', 'abc', '-1', '1.5', '4294967296', '1e3', '0x10']) {
      expect(parseSeed(bad), bad).toBeNull()
    }
  })
})
