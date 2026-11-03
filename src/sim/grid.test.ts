import { describe, it, expect } from 'vitest'
import { cellIndex, neighbours, torusDistance, wrap } from './grid'

const g = { width: 7, height: 5 }
const asSet = (cells: Array<[number, number]>) => new Set(cells.map(([x, y]) => `${x},${y}`))

describe('grid', () => {
  it('wrap keeps coordinates on the torus', () => {
    expect(wrap(-1, 7)).toBe(6)
    expect(wrap(7, 7)).toBe(0)
    expect(wrap(-15, 7)).toBe(6)
    expect(wrap(3, 7)).toBe(3)
  })

  it('cellIndex is row-major and wraps', () => {
    expect(cellIndex(g, 0, 0)).toBe(0)
    expect(cellIndex(g, 6, 4)).toBe(34)
    expect(cellIndex(g, -1, 0)).toBe(6)
    expect(cellIndex(g, 0, 5)).toBe(0)
  })

  it('torusDistance is Chebyshev distance across edges', () => {
    expect(torusDistance(g, 0, 0, 6, 0)).toBe(1)
    expect(torusDistance(g, 0, 0, 6, 4)).toBe(1)
    expect(torusDistance(g, 0, 0, 3, 0)).toBe(3)
    expect(torusDistance(g, 1, 1, 4, 3)).toBe(3)
    expect(torusDistance(g, 6, 4, 0, 0)).toBe(1)
    expect(torusDistance(g, 4, 3, 1, 1)).toBe(3)
  })

  it('neighbours are the 8 wrapped cells, optionally with self', () => {
    const expected = ['6,4', '0,4', '1,4', '6,0', '1,0', '6,1', '0,1', '1,1']
    expect(neighbours(g, 0, 0)).toHaveLength(8)
    expect(asSet(neighbours(g, 0, 0))).toEqual(new Set(expected))
    expect(asSet(neighbours(g, 0, 0, true))).toEqual(new Set([...expected, '0,0']))
    expect(neighbours(g, 0, 0, true)).toHaveLength(9)
  })
})
