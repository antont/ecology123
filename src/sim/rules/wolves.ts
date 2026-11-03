import { neighbours, torusDistance } from '../grid'
import type { Animal, World } from '../world'

/** Spec §4.3 step 3: age, starve or die old, hunt or wander, attack, breed. */
export function runWolfPhase(world: World): void {
  const p = world.config.wolf
  const order = world.rng.shuffle([...world.wolves])

  for (const wolf of order) {
    if (!wolf.alive) continue

    wolf.age++
    wolf.energy -= p.metabolism
    if (wolf.age >= p.maxAge) { world.kill(wolf, 'oldAge'); continue }
    if (wolf.energy <= 0) { world.kill(wolf, 'starvation'); continue }

    let target = world.nearest('sheep', wolf.x, wolf.y, p.vision)
    if (target) chase(world, wolf, target, p.speed)
    else wander(world, wolf)

    if (!target || torusDistance(world, wolf.x, wolf.y, target.x, target.y) > 1) {
      target = world.nearest('sheep', wolf.x, wolf.y, 1)
    }
    if (target && world.rng.next() < p.catchChance) {
      world.kill(target, 'predation')
      wolf.energy = Math.min(p.maxEnergy, wolf.energy + p.energyPerSheep)
    }

    if (wolf.energy >= p.breedThreshold && world.rng.next() < p.breedChance) {
      // A wolf pup only needs a cell free of wolves; a sheep may be standing there
      const free = neighbours(world, wolf.x, wolf.y).filter(([nx, ny]) => !world.wolfAt(nx, ny))
      if (free.length > 0) {
        const [cx, cy] = world.rng.pick(free)
        wolf.energy /= 2
        world.spawn('wolf', cx, cy, wolf.energy)
      }
    }
  }
}

/** Up to `speed` single-cell moves, each to the wolf-free neighbour closest to the target. */
function chase(world: World, wolf: Animal, target: Animal, speed: number): void {
  for (let move = 0; move < speed; move++) {
    if (torusDistance(world, wolf.x, wolf.y, target.x, target.y) <= 1) return
    let closest: Array<[number, number]> = []
    let closestDistance = Infinity
    for (const [nx, ny] of neighbours(world, wolf.x, wolf.y)) {
      if (world.wolfAt(nx, ny)) continue
      const d = torusDistance(world, nx, ny, target.x, target.y)
      if (d < closestDistance) { closestDistance = d; closest = [[nx, ny]] }
      else if (d === closestDistance) closest.push([nx, ny])
    }
    if (closest.length === 0) return
    const [x, y] = world.rng.pick(closest)
    world.moveAnimal(wolf, x, y)
  }
}

function wander(world: World, wolf: Animal): void {
  const free = neighbours(world, wolf.x, wolf.y).filter(([nx, ny]) => !world.wolfAt(nx, ny))
  if (free.length === 0) return
  const [x, y] = world.rng.pick(free)
  world.moveAnimal(wolf, x, y)
}
