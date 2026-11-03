import type { SimConfig } from './config'
import { cellIndex } from './grid'
import { createRng, type Rng } from './rng'
import { runSheepPhase } from './rules/sheep'
import { runWolfPhase } from './rules/wolves'

export type Species = 'sheep' | 'wolf'
export type DeathCause = 'starvation' | 'oldAge' | 'predation'

export interface Animal {
  readonly id: number
  readonly species: Species
  x: number
  y: number
  energy: number
  age: number
  alive: boolean
}

export interface StepStats {
  step: number
  sheep: number
  wolves: number
  /** Total grass biomass: the sum of the field. */
  grass: number
  births: { sheep: number; wolves: number }
  deaths: {
    sheep: { starvation: number; oldAge: number; predation: number }
    wolves: { starvation: number; oldAge: number }
  }
}

export interface Simulation {
  readonly config: SimConfig
  readonly width: number
  readonly height: number
  readonly stepCount: number
  readonly stats: StepStats
  readonly grass: Float32Array
  readonly sheep: readonly Animal[]
  readonly wolves: readonly Animal[]
  sheepAt(x: number, y: number): Animal | null
  wolfAt(x: number, y: number): Animal | null
  addSheep(x: number, y: number, init?: { energy?: number; age?: number }): Animal
  addWolf(x: number, y: number, init?: { energy?: number; age?: number }): Animal
  setGrass(x: number, y: number, value: number): void
  step(): void
}

type Counters = Pick<StepStats, 'births' | 'deaths'>

const zeroCounters = (): Counters => ({
  births: { sheep: 0, wolves: 0 },
  deaths: { sheep: { starvation: 0, oldAge: 0, predation: 0 }, wolves: { starvation: 0, oldAge: 0 } },
})

/**
 * All simulation state, plus the primitives the rule phases use to change it.
 * Occupancy grids are kept in sync with the animal lists at every mutation, so
 * a dead or moved animal is never seen in its old cell.
 */
export class World implements Simulation {
  readonly config: SimConfig
  readonly width: number
  readonly height: number
  readonly rng: Rng
  readonly grass: Float32Array

  private sheepList: Animal[] = []
  private wolfList: Animal[] = []
  private readonly sheepGrid: (Animal | null)[]
  private readonly wolfGrid: (Animal | null)[]
  private born: Animal[] = []
  private counters: Counters = zeroCounters()
  private nextId = 1
  private steps = 0
  private latest: StepStats

  constructor(config: SimConfig, seed: number) {
    this.config = config
    this.width = config.width
    this.height = config.height
    this.rng = createRng(seed)
    const cells = config.width * config.height
    this.grass = new Float32Array(cells)
    this.sheepGrid = new Array(cells).fill(null)
    this.wolfGrid = new Array(cells).fill(null)
    this.latest = this.collectStats()
  }

  get stepCount(): number { return this.steps }
  get stats(): StepStats { return this.latest }
  get sheep(): readonly Animal[] { return this.sheepList }
  get wolves(): readonly Animal[] { return this.wolfList }

  sheepAt(x: number, y: number): Animal | null {
    return this.sheepGrid[cellIndex(this, x, y)]
  }

  wolfAt(x: number, y: number): Animal | null {
    return this.wolfGrid[cellIndex(this, x, y)]
  }

  addSheep(x: number, y: number, init: { energy?: number; age?: number } = {}): Animal {
    return this.add('sheep', x, y, init)
  }

  addWolf(x: number, y: number, init: { energy?: number; age?: number } = {}): Animal {
    return this.add('wolf', x, y, init)
  }

  setGrass(x: number, y: number, value: number): void {
    this.grass[cellIndex(this, x, y)] = Math.min(1, Math.max(0, value))
    this.latest = this.collectStats()
  }

  step(): void {
    this.steps++
    this.counters = zeroCounters()

    const regrowth = this.config.grass.regrowth
    for (let i = 0; i < this.grass.length; i++) {
      this.grass[i] = Math.min(1, this.grass[i] + regrowth)
    }

    runSheepPhase(this)
    runWolfPhase(this)

    this.sheepList = this.sheepList.filter(a => a.alive)
    this.wolfList = this.wolfList.filter(a => a.alive)
    for (const child of this.born) {
      (child.species === 'sheep' ? this.sheepList : this.wolfList).push(child)
    }
    this.born = []

    this.latest = this.collectStats()
  }

  // ---- primitives for the rule phases -------------------------------------

  occupant(species: Species, x: number, y: number): Animal | null {
    return species === 'sheep' ? this.sheepAt(x, y) : this.wolfAt(x, y)
  }

  moveAnimal(animal: Animal, x: number, y: number): void {
    const grid = this.gridOf(animal.species)
    const to = cellIndex(this, x, y)
    const occupant = grid[to]
    if (occupant && occupant !== animal) {
      throw new Error(`${animal.species} ${animal.id} cannot move onto ${occupant.id}`)
    }
    grid[cellIndex(this, animal.x, animal.y)] = null
    grid[to] = animal
    animal.x = x
    animal.y = y
  }

  kill(animal: Animal, cause: DeathCause): void {
    animal.alive = false
    const grid = this.gridOf(animal.species)
    const at = cellIndex(this, animal.x, animal.y)
    if (grid[at] === animal) grid[at] = null
    if (animal.species === 'sheep') this.counters.deaths.sheep[cause]++
    else if (cause !== 'predation') this.counters.deaths.wolves[cause]++
  }

  /** Places a newborn; it joins the animal lists (and acts) from the next step. */
  spawn(species: Species, x: number, y: number, energy: number): Animal {
    const child = this.place(species, x, y, energy, 0)
    this.born.push(child)
    this.counters.births[species === 'sheep' ? 'sheep' : 'wolves']++
    return child
  }

  grassAt(x: number, y: number): number {
    return this.grass[cellIndex(this, x, y)]
  }

  /** Removes up to `amount` grass from a cell; returns how much was eaten. */
  eatGrass(x: number, y: number, amount: number): number {
    const i = cellIndex(this, x, y)
    const eaten = Math.min(this.grass[i], amount)
    this.grass[i] -= eaten
    return eaten
  }

  /**
   * The living animal of `species` at the smallest torus distance from (x, y),
   * within `radius`; ties are broken at random. The search square is clamped
   * so no cell is visited twice when the radius exceeds half the grid.
   */
  nearest(species: Species, x: number, y: number, radius: number): Animal | null {
    const grid = this.gridOf(species)
    const [loX, hiX] = this.span(radius, this.width)
    const [loY, hiY] = this.span(radius, this.height)
    let best: Animal[] = []
    let bestDistance = Infinity
    for (let dy = loY; dy <= hiY; dy++) {
      for (let dx = loX; dx <= hiX; dx++) {
        const animal = grid[cellIndex(this, x + dx, y + dy)]
        if (!animal) continue
        const d = Math.max(Math.abs(dx), Math.abs(dy))
        if (d < bestDistance) {
          bestDistance = d
          best = [animal]
        } else if (d === bestDistance) {
          best.push(animal)
        }
      }
    }
    if (best.length === 0) return null
    return best.length === 1 ? best[0] : this.rng.pick(best)
  }

  // ---- internals -----------------------------------------------------------

  private span(radius: number, size: number): [number, number] {
    const r = Math.min(radius, Math.floor(size / 2))
    // On an even axis, offsets +size/2 and -size/2 are the same cell
    return [-r, size % 2 === 0 && r === size / 2 ? r - 1 : r]
  }

  private gridOf(species: Species): (Animal | null)[] {
    return species === 'sheep' ? this.sheepGrid : this.wolfGrid
  }

  private add(species: Species, x: number, y: number, init: { energy?: number; age?: number }): Animal {
    const params = this.config[species]
    const animal = this.place(species, x, y, init.energy ?? params.maxEnergy, init.age ?? 0)
    ;(species === 'sheep' ? this.sheepList : this.wolfList).push(animal)
    this.latest = this.collectStats()
    return animal
  }

  private place(species: Species, x: number, y: number, energy: number, age: number): Animal {
    const grid = this.gridOf(species)
    const i = cellIndex(this, x, y)
    if (grid[i]) throw new Error(`cell ${x},${y} already has a ${species}`)
    const animal: Animal = {
      id: this.nextId++, species, x: i % this.width, y: Math.floor(i / this.width), energy, age, alive: true,
    }
    grid[i] = animal
    return animal
  }

  private collectStats(): StepStats {
    let grass = 0
    for (let i = 0; i < this.grass.length; i++) grass += this.grass[i]
    return {
      step: this.steps,
      sheep: this.sheepList.length,
      wolves: this.wolfList.length,
      grass,
      births: { ...this.counters.births },
      deaths: {
        sheep: { ...this.counters.deaths.sheep },
        wolves: { ...this.counters.deaths.wolves },
      },
    }
  }
}

export function createEmptySimulation(config: SimConfig, seed: number): Simulation {
  return new World(config, seed)
}

/** Spec §4.4: random grass, animals on distinct random cells with random energy and age. */
export function createSimulation(config: SimConfig, seed: number): Simulation {
  const world = new World(config, seed)
  const { rng } = world
  for (let i = 0; i < world.grass.length; i++) world.grass[i] = rng.next()

  for (const species of ['sheep', 'wolf'] as const) {
    const params = config[species]
    let placed = 0
    while (placed < params.initial) {
      const x = rng.int(world.width)
      const y = rng.int(world.height)
      if (world.occupant(species, x, y)) continue
      const energy = (0.5 + 0.5 * rng.next()) * params.maxEnergy
      const age = rng.int(Math.floor(params.maxAge / 2))
      if (species === 'sheep') world.addSheep(x, y, { energy, age })
      else world.addWolf(x, y, { energy, age })
      placed++
    }
  }
  return world
}
