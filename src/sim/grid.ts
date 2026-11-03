/** Helpers for a grid whose edges wrap around (a torus). */

export interface GridSize {
  width: number
  height: number
}

export function wrap(v: number, size: number): number {
  return ((v % size) + size) % size
}

/** Row-major index of a (wrapped) cell. */
export function cellIndex(g: GridSize, x: number, y: number): number {
  return wrap(y, g.height) * g.width + wrap(x, g.width)
}

/** Chebyshev distance, taking the shorter way around each axis. */
export function torusDistance(g: GridSize, ax: number, ay: number, bx: number, by: number): number {
  const dx = Math.abs(wrap(ax, g.width) - wrap(bx, g.width))
  const dy = Math.abs(wrap(ay, g.height) - wrap(by, g.height))
  return Math.max(Math.min(dx, g.width - dx), Math.min(dy, g.height - dy))
}

/** The 8 surrounding cells (wrapped), plus the cell itself if asked. */
export function neighbours(g: GridSize, x: number, y: number, includeSelf = false): Array<[number, number]> {
  const cells: Array<[number, number]> = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0 && !includeSelf) continue
      cells.push([wrap(x + dx, g.width), wrap(y + dy, g.height)])
    }
  }
  return cells
}
