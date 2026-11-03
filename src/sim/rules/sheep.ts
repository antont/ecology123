import { neighbours, torusDistance } from '../grid'
import type { Animal, World } from '../world'

type Cell = [number, number]

/** Spec §4.3 step 2: age, starve or die old, move, graze, breed. */
export function runSheepPhase(world: World): void {
  const p = world.config.sheep
  // Snapshot: sheep born during this phase join the list next step and do not act now
  const order = world.rng.shuffle([...world.sheep])

  for (const sheep of order) {
    if (!sheep.alive) continue

    sheep.age++
    sheep.energy -= p.metabolism
    if (sheep.age >= p.maxAge) { world.kill(sheep, 'oldAge'); continue }
    if (sheep.energy <= 0) { world.kill(sheep, 'starvation'); continue }

    const [x, y] = chooseMove(world, sheep)
    world.moveAnimal(sheep, x, y)

    const eaten = world.eatGrass(sheep.x, sheep.y, p.biteSize)
    sheep.energy = Math.min(p.maxEnergy, sheep.energy + eaten * p.energyPerGrass)

    if (sheep.energy >= p.breedThreshold && world.rng.next() < p.breedChance) {
      const free = neighbours(world, sheep.x, sheep.y)
        .filter(([nx, ny]) => !world.sheepAt(nx, ny) && !world.wolfAt(nx, ny))
      if (free.length > 0) {
        const [cx, cy] = world.rng.pick(free)
        sheep.energy /= 2
        world.spawn('sheep', cx, cy, sheep.energy)
      }
    }
  }
}

function chooseMove(world: World, sheep: Animal): Cell {
  const p = world.config.sheep
  const candidates = neighbours(world, sheep.x, sheep.y, true).filter(([cx, cy]) =>
    (cx === sheep.x && cy === sheep.y) || (!world.sheepAt(cx, cy) && !world.wolfAt(cx, cy)))

  const threats = world.within('wolf', sheep.x, sheep.y, p.vision)
  if (threats.length > 0) {
    // Farthest from whichever visible wolf is nearest to that cell; then the grassiest
    const safety = ([cx, cy]: Cell) => Math.min(...threats.map(w => torusDistance(world, cx, cy, w.x, w.y)))
    return best(world, candidates, cell => [safety(cell), world.grassAt(cell[0], cell[1])])
  }
  if (world.rng.next() < p.wander) return world.rng.pick(candidates)
  return best(world, candidates, ([cx, cy]) => [world.grassAt(cx, cy)])
}

/** Highest-scoring cell by lexicographic score; remaining ties broken at random. */
function best(world: World, cells: Cell[], score: (cell: Cell) => number[]): Cell {
  let top: Cell[] = []
  let topScore: number[] = []
  for (const cell of cells) {
    const s = score(cell)
    const cmp = compare(s, topScore)
    if (top.length === 0 || cmp > 0) { top = [cell]; topScore = s }
    else if (cmp === 0) top.push(cell)
  }
  return top.length === 1 ? top[0] : world.rng.pick(top)
}

function compare(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1
  }
  return 0
}
