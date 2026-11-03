# Simulation Core Rewrite: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken `src/simulation` engine with a small, deterministic grass/sheep/wolf model in `src/sim/` that genuinely cycles, wire the existing Next.js UI to it, and remove the dead code and docs.

**Architecture:** `src/sim/` is a pure TypeScript core: seeded RNG, config, torus grid helpers, a `World` class holding state and mutation primitives, and two rule modules (sheep phase, wolf phase) that `World.step()` orchestrates. Tests drive it through a small public scenario API (`createEmptySimulation` + `addSheep`/`addWolf`/`setGrass`). The UI holds a `Simulation` in a ref and draws it on a canvas.

**Tech Stack:** TypeScript 5 (strict), Vitest 3 + jsdom + Testing Library, Next.js 15, React 19, Recharts, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-03-simulation-core-design.md`. Read it first. §4.3 is the authoritative step algorithm.

## Global Constraints

- `src/sim/**` imports nothing from React, the DOM or Node, except `fs` in test files. No `Math.random`, `Date.now` or `console` in non-test `src/sim` files.
- All randomness goes through `Rng` from `src/sim/rng.ts`.
- **Proof of red.** Each behavioural task:
  1. Writes its tests first.
  2. Adds the exported signatures as neutral stubs (no-op, or returning `0`, `[]`, `null` or the input unchanged) so the test compiles.
  3. Runs the tests and sees them **fail on assertions**. An import error, a compile error or a `throw new Error('not implemented')` is not a red.
  4. Implements the behaviour and runs the tests green.
  5. Commits with the trimmed red output in the message body.
- **Guard tests that are green on arrival** (invariants, ecology, source guards) prove they can fail by a **deliberate mutation** of the implementation. Run the tests to show red, revert the mutation, then commit with the red output, naming the mutation.
- Every commit leaves `npx vitest run` and `npx tsc --noEmit` green. The husky hook is inactive in this clone, so run both by hand. Don't activate the hook.
- Commit message format:
  ```
  <type>(<scope>): <summary>

  <one or two lines of why/what>

  Red:                       ← or "Red (mutation: <what was broken>, reverted):"
  <trimmed vitest output: failing test names + assertion diffs, ≤ ~30 lines>

  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  ```
  Capture red with `npx vitest run <file> 2>&1 | tee <scratchpad>/red.txt`, then keep the `FAIL`/`×` lines and the `AssertionError`/`Expected`/`Received` lines.
- Default parameters are copied exactly from spec §4.6. Ecology thresholds are copied exactly from spec §6.5 and are never loosened.

## Review Focus

1. **Tiny or odd grids.** On a 1×1 or 2×2 torus, the "8 neighbours" wrap onto the same cells, which can lead to double occupancy. Expected: the config rejects width or height below 3 (Task 2 test).
2. **Vision larger than half the grid.** The wrapped search square visits cells more than once. Expected: nearest-target search still finds the sheep at its true distance (Task 6 test).
3. **Extinction.** Once sheep or wolves hit 0, `step()` must keep working on empty lists, with stats at zero. There is no auto-pause and no throw (Task 6 test).
4. **A hidden tab or a very high speed.** After a long frame gap, the UI loop must not try to catch up with thousands of steps in one frame. Expected: at most `maxStepsPerFrame` steps per frame (Task 9 test of `stepsDue`).
5. **Bad seed input.** An empty, non-numeric, negative, fractional or > 2³²−1 seed must not crash or silently reseed. Expected: the field is marked invalid and Reset keeps the previous seed (Task 9 test of `parseSeed` and the component).

---

### Task 0: Test infrastructure baseline

The baseline is red because Vitest collects the Playwright spec, a PostCSS load failure breaks component tests, and the old engine's tests fail. Fix the infrastructure and drop the old engine's tests, since that engine is deleted in Task 10. This task is infrastructure, not behaviour, so it has no red proof.

**Files:**
- Modify: `vitest.config.ts`
- Create: `vitest.ecology.config.ts`
- Modify: `package.json` (scripts)
- Delete: `src/simulation/**/*.test.ts`

- [ ] **Step 1:** In `vitest.config.ts`:
  - set `test.include: ['src/**/*.test.{ts,tsx}']`;
  - set `test.exclude: ['**/node_modules/**', '**/*.ecology.test.ts']`;
  - set top-level `css: { postcss: {} }`, so Vite doesn't load `postcss.config.mjs` in tests.
- [ ] **Step 2:** Create `vitest.ecology.config.ts`. It reuses the same plugins and alias, with `test.include: ['src/**/*.ecology.test.ts']`, `test.environment: 'node'` and `test.testTimeout: 300_000`.
- [ ] **Step 3:** In `package.json` scripts, set `"test": "vitest run"` and `"test:watch": "vitest"`, and add `"test:ecology": "vitest run --config vitest.ecology.config.ts"`.
- [ ] **Step 4:** `git rm src/simulation/**/*.test.ts` (all of them: config, engine, types).
- [ ] **Step 5:** Run `npx vitest run`. Expected: all remaining UI tests pass (PopulationChart, PopulationDashboard, SimulationGrid, setup), and no file fails to load. If `SimulationGrid.test.tsx` fails on real assertions against the old UI, delete that file too; Task 9 rewrites it. Run `npx tsc --noEmit`. Expected: exit 0.
- [ ] **Step 6:** Commit: `chore(test): fix vitest collection and css, drop old engine tests`.

---

### Task 1: Seeded RNG

**Files:**
- Create: `src/sim/rng.ts`
- Test: `src/sim/rng.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface Rng {
    next(): number                          // uniform [0, 1)
    int(n: number): number                  // uniform integer 0..n-1
    pick<T>(items: readonly T[]): T         // uniform element; throws on empty
    shuffle<T>(items: T[]): T[]             // in-place Fisher–Yates, returns items
  }
  export function createRng(seed: number): Rng   // mulberry32
  ```

- [ ] **Step 1: Write the failing tests**
  - `same seed gives same sequence`: two `createRng(7)` produce equal arrays of 100 `next()`.
  - `different seeds give different sequences`: the 100-value arrays from seeds 1 and 2 are not equal.
  - `next stays in [0,1)`: 10,000 draws, each `>= 0 && < 1`.
  - `int is uniform over 0..n-1`: 60,000 draws of `int(6)`. Every bucket count is within ±5% of 10,000, and every value is an integer in [0, 5].
  - `pick returns an element and covers all`: 1,000 picks from `['a','b','c']` include all three.
  - `shuffle is a deterministic permutation`: shuffling `[0..19]` with seed 3 gives the same order twice, the sorted result equals `[0..19]`, and the result is not the identity order.
- [ ] **Step 2: Stub** `createRng` returning an object whose `next` returns `0`, `int` returns `0`, `pick` returns `items[0]` and `shuffle` returns `items` unchanged.
- [ ] **Step 3: Run** `npx vitest run src/sim/rng.test.ts`. Expected: FAIL on the "different seeds", "uniform", "pick covers" and "not identity" assertions. Save the output.
- [ ] **Step 4: Implement** mulberry32 for `next`; `int = Math.floor(next() * n)`; Fisher–Yates for `shuffle`.
- [ ] **Step 5: Run** the tests. Expected: PASS. Run `npx tsc --noEmit`.
- [ ] **Step 6: Commit** `feat(sim): seeded mulberry32 rng` with the Red block.

---

### Task 2: Config

**Files:**
- Create: `src/sim/config.ts`
- Test: `src/sim/config.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface SheepParams { initial: number; maxEnergy: number; metabolism: number; biteSize: number;
    energyPerGrass: number; breedThreshold: number; breedChance: number; vision: number; wander: number; maxAge: number }
  export interface WolfParams { initial: number; maxEnergy: number; metabolism: number; energyPerSheep: number;
    breedThreshold: number; breedChance: number; vision: number; speed: number; catchChance: number; maxAge: number }
  export interface SimConfig { width: number; height: number; grass: { regrowth: number }; sheep: SheepParams; wolf: WolfParams }
  export interface ConfigOverrides { width?: number; height?: number; grass?: Partial<SimConfig['grass']>;
    sheep?: Partial<SheepParams>; wolf?: Partial<WolfParams> }
  export const defaultConfig: SimConfig
  export class ConfigError extends Error {}
  export function validateConfig(config: SimConfig): void            // throws ConfigError naming the field path
  export function createConfig(overrides?: ConfigOverrides, base?: SimConfig): SimConfig  // merge per group, then validate
  ```

- [ ] **Step 1: Write the failing tests**
  - `defaultConfig matches the spec`:
    `toEqual({ width: 80, height: 80, grass: { regrowth: 0.03 }, sheep: { initial: 400, maxEnergy: 10, metabolism: 0.5, biteSize: 0.5, energyPerGrass: 2, breedThreshold: 6, breedChance: 0.08, vision: 2, wander: 0.2, maxAge: 100 }, wolf: { initial: 20, maxEnergy: 30, metabolism: 1.0, energyPerSheep: 9, breedThreshold: 18, breedChance: 0.05, vision: 3, speed: 1, catchChance: 0.22, maxAge: 200 } })`.
  - `createConfig merges per group`: `createConfig({ sheep: { vision: 5 } })` has `sheep.vision === 5`, `sheep.maxEnergy === 10`, and `wolf` equal to `defaultConfig.wolf`. `defaultConfig.sheep.vision` is still 2 (no mutation).
  - `createConfig validates`: `createConfig({ wolf: { catchChance: 1.5 } })` throws a `ConfigError` whose message contains `wolf.catchChance`.
  - `rejects grids smaller than 3`: `createConfig({ width: 2 })` throws with `width`. `createConfig({ height: 0 })` throws with `height`.
  - `rejects probabilities outside [0,1]`: each of `sheep.breedChance`, `sheep.wander`, `wolf.breedChance` and `wolf.catchChance` set to `-0.1` throws, with the path in the message.
  - `rejects non-positive energies and lifespans`: `sheep.maxEnergy: 0` and `wolf.maxAge: 0` throw.
  - `rejects breedThreshold above maxEnergy`: `sheep.breedThreshold: 11` throws.
  - `rejects initial counts above cell count`: `{ width: 3, height: 3, sheep: { initial: 10 } }` throws with `sheep.initial`.
  - `rejects negative vision, speed, metabolism, regrowth`: each throws.
- [ ] **Step 2: Stub** `defaultConfig` with the spec values (the first test then passes; that's fine). `createConfig` returns `base` unchanged, and `validateConfig` is a no-op.
- [ ] **Step 3: Run** the tests. Expected: FAIL on the merge test and every "throws" test.
- [ ] **Step 4: Implement.** Integers are required for `width`, `height`, the `initial` counts and `vision`/`speed`.
- [ ] **Step 5: Run** the tests. Expected: PASS.
- [ ] **Step 6: Commit** `feat(sim): typed, validated config with spec defaults`.

---

### Task 3: Torus grid helpers

**Files:**
- Create: `src/sim/grid.ts`
- Test: `src/sim/grid.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface GridSize { width: number; height: number }
  export function wrap(v: number, size: number): number                        // always 0..size-1
  export function cellIndex(g: GridSize, x: number, y: number): number         // wraps, row-major y*width+x
  export function torusDistance(g: GridSize, ax: number, ay: number, bx: number, by: number): number  // Chebyshev on torus
  export function neighbours(g: GridSize, x: number, y: number, includeSelf?: boolean): Array<[number, number]>  // wrapped, 8 (or 9)
  ```

- [ ] **Step 1: Write the failing tests** (use `g = { width: 7, height: 5 }`)
  - `wrap`: `wrap(-1,7)===6`, `wrap(7,7)===0`, `wrap(-15,7)===6`, `wrap(3,7)===3`.
  - `cellIndex wraps`: `cellIndex(g,0,0)===0`, `cellIndex(g,6,4)===34`, `cellIndex(g,-1,0)===6`, `cellIndex(g,0,5)===0`.
  - `torusDistance`:
    - `(0,0)-(6,0)` is 1, across the x edge;
    - `(0,0)-(6,4)` is 1, across the corner;
    - `(0,0)-(3,0)` is 3;
    - `(1,1)-(4,3)` is 3;
    - it is symmetric for these pairs.
  - `neighbours`: for `(0,0)`, the set is exactly the 8 wrapped cells `{(6,4),(0,4),(1,4),(6,0),(1,0),(6,1),(0,1),(1,1)}`. With `includeSelf`, the set is 9 cells including `(0,0)`.
- [ ] **Step 2: Stub** every function to return `0` or `[]`.
- [ ] **Step 3: Run.** Expected: FAIL on the values.
- [ ] **Step 4: Implement.**
- [ ] **Step 5: Run.** Expected: PASS.
- [ ] **Step 6: Commit** `feat(sim): torus grid helpers`.

---

### Task 4: World state, scenario API, initial state, grass and stats

**Files:**
- Create: `src/sim/world.ts` (the `World` class: state plus mutation primitives)
- Create: `src/sim/index.ts` (public exports: `createSimulation`, `createEmptySimulation`, types, `defaultConfig`, `createConfig`)
- Create: `src/sim/test/helpers.ts`
- Test: `src/sim/world.test.ts`

**Interfaces:**
- Consumes: `Rng`, `createRng` (Task 1); `SimConfig` (Task 2); grid helpers (Task 3).
- Produces:
  ```ts
  export type Species = 'sheep' | 'wolf'
  export interface Animal { readonly id: number; readonly species: Species; x: number; y: number; energy: number; age: number; alive: boolean }
  export interface StepStats {
    step: number; sheep: number; wolves: number; grass: number
    births: { sheep: number; wolves: number }
    deaths: { sheep: { starvation: number; oldAge: number; predation: number }; wolves: { starvation: number; oldAge: number } }
  }
  export type DeathCause = 'starvation' | 'oldAge' | 'predation'
  export interface Simulation {
    readonly config: SimConfig; readonly width: number; readonly height: number
    readonly stepCount: number; readonly stats: StepStats
    readonly grass: Float32Array; readonly sheep: readonly Animal[]; readonly wolves: readonly Animal[]
    sheepAt(x: number, y: number): Animal | null; wolfAt(x: number, y: number): Animal | null
    addSheep(x: number, y: number, init?: { energy?: number; age?: number }): Animal   // default energy = maxEnergy, age 0; throws if a sheep is there
    addWolf(x: number, y: number, init?: { energy?: number; age?: number }): Animal
    setGrass(x: number, y: number, value: number): void                                // clamps to [0,1]
    step(): void
  }
  export function createEmptySimulation(config: SimConfig, seed: number): Simulation  // no animals, grass all 0
  export function createSimulation(config: SimConfig, seed: number): Simulation       // spec §4.4
  ```
  Internal to `World`, used by the rule modules in Tasks 5–6 via `import type { World }`:
  - `readonly rng: Rng`
  - `moveAnimal(a: Animal, x: number, y: number): void`, which keeps occupancy in sync;
  - `kill(a: Animal, cause: DeathCause): void`, which sets `alive=false`, clears occupancy and counts the death;
  - `spawn(species: Species, x: number, y: number, energy: number): Animal`, which counts a birth and adds the animal to a pending-born list;
  - `grassAt(x, y)` / `eatGrass(x, y, amount): number`;
  - `nearest(species: Species, x: number, y: number, radius: number): Animal | null`, which finds the minimum torus distance among living animals in the square and breaks ties with `rng`.

  `World.step()` runs: `stepCount++`, reset the per-step counters, regrow grass, `runSheepPhase(this)`, `runWolfPhase(this)`, compact (drop dead, append the pending-born), then write `stats`. Tasks 5 and 6 create the rule modules. In this task, the phases are no-op functions in `src/sim/rules/sheep.ts` and `src/sim/rules/wolves.ts`.
- `src/sim/test/helpers.ts`: `tinyConfig(overrides?: ConfigOverrides): SimConfig`. Starting from `defaultConfig`, it uses a 7×7 grid, regrowth 0, both `initial` 0, `breedChance` 0 for both species, `sheep.wander` 0, `wolf.catchChance` 0, and then applies `overrides` per group.

- [ ] **Step 1: Write the failing tests**
  - `grass regrows by regrowth and caps at 1`: with `tinyConfig({ grass: { regrowth: 0.3 } })`, `setGrass(1,1,0.5)` and `setGrass(2,2,0.9)`. After one step they are `≈0.8` and `1` (`toBeCloseTo`), and `stats.grass ≈ (49-2)*0.3 + 0.8 + 1`.
  - `stats before any step reflect the initial state`: `createSimulation(defaultConfig, 1).stats` has `step 0`, `sheep 400`, `wolves 20`, and zero births and deaths.
  - `createSimulation places initial animals on distinct cells`: the 400 sheep sit on distinct positions, the 20 wolves sit on distinct positions, and `sheepAt(s.x,s.y) === s` for every sheep.
  - `initial energy and age are in the spec ranges`:
    - every sheep has energy in `[5, 10]` and an integer age in `[0, 50)`;
    - every wolf has energy in `[15, 30]` and age in `[0, 100)`;
    - initial grass values are all in `[0,1]`, with mean between 0.45 and 0.55.
  - `same seed, same initial state; different seed, different`: the positions of seed 5 equal those of seed 5 and differ from seed 6.
  - `addSheep rejects an occupied cell`: a second `addSheep(1,1)` throws. `addWolf(1,1)` on the same cell succeeds; a sheep and a wolf may share.
  - `ids are unique and deterministic`: the ids in `createSimulation(defaultConfig, 1)` are all distinct, and two creations with seed 1 give identical id lists.
- [ ] **Step 2: Stub.** `World` stores state, but `step()` only increments `stepCount`, and `createSimulation` returns an empty world with stats all 0.
- [ ] **Step 3: Run** `npx vitest run src/sim/world.test.ts`. Expected: FAIL on the grass values, the counts, the ranges and the distinctness.
- [ ] **Step 4: Implement** per spec §4.1, §4.4 and §4.5:
  - Initial placement draws random cells and retries until it finds one that is free for that species.
  - Initial energy is `(0.5 + 0.5*rng.next()) * maxEnergy`; age is `rng.int(Math.floor(maxAge/2))`.
  - Occupancy uses two `(Animal | null)[]` arrays of length `width*height`.
- [ ] **Step 5: Run.** Expected: PASS. Run `npx tsc --noEmit`.
- [ ] **Step 6: Commit** `feat(sim): world state, scenario api, initial state, grass regrowth`.

---

### Task 5: Sheep phase

**Files:**
- Modify: `src/sim/rules/sheep.ts` → `export function runSheepPhase(world: World): void`
- Test: `src/sim/rules/sheep.test.ts`

**Interfaces:**
- Consumes: the `World` internals from Task 4; `tinyConfig`.
- Produces: `runSheepPhase` implementing spec §4.3 step 2 exactly. It shuffles a snapshot of the sheep alive at the start, so newborns don't act, and skips any sheep that is no longer alive.

All tests use `createEmptySimulation(tinyConfig(...), seed)` and one `step()`, unless stated otherwise. Grass is 0 everywhere unless set.

- [ ] **Step 1: Write the failing tests**
  - `pays metabolism`: a sheep with energy 5 and no grass anywhere ends with energy `4.5`.
  - `dies of starvation at zero energy`: a sheep with energy 0.4 is gone after the step. `sheepAt` at its cell is null, `stats.deaths.sheep.starvation === 1` and `stats.sheep === 0`.
  - `dies of old age at maxAge`: a sheep with `{ age: 99, energy: 10 }` and `maxAge` 100 is gone, with `deaths.sheep.oldAge === 1`.
  - `moves to the grassiest neighbour and eats`: a sheep at (3,3) with energy 5 and `setGrass(4,3,1)`. Afterwards the sheep is at (4,3), `grass[cellIndex(4,3)] ≈ 0.5` and energy `≈ 5.5` (5 − 0.5 + 0.5·2).
  - `energy is capped at maxEnergy`: a sheep with energy 9.9 standing on grass 1 (own cell is the grassiest) ends with energy exactly `10`.
  - `moves across the wrap edge`: a sheep at (0,3) with `setGrass(6,3,1)` ends at (6,3).
  - `never moves onto a wolf's cell`:
    - a sheep at (3,3) with `setGrass(4,3,1)`;
    - a wolf at (4,3) with `wolf.vision 1` and `catchChance 0` (the sheep is within 1, so the wolf doesn't move);
    - `sheep.vision 0`, so the sheep doesn't flee.
    Over seeds 1–20, the sheep is never at (4,3) after the step.
  - `flees a visible wolf`: a sheep at (3,3) with `sheep.vision 2`, a wolf at (2,3) with `catchChance 0` and `wolf.vision 1`, and uniform grass 0.5. Over seeds 1–20, the sheep ends with `x === 4`.
  - `wander 1 makes movement random`: with `sheep.wander 1`, a sheep at (3,3) and `setGrass(4,3,1)`. Over seeds 1–40, the end positions include at least 5 distinct cells.
  - `breeds: splits energy, child on free neighbour, child does not act`:
    - `sheep.breedChance 1`, a sheep with energy 10 and no grass.
    - Afterwards there are 2 sheep and `births.sheep === 1`.
    - The parent and child both have energy `4.75`. If the parent acted first: 10 − 0.5 = 9.5, halved.
    - The child is at torus distance 1 from the parent and has `age === 0`, which proves it didn't act on its birth step.
  - `does not breed below threshold`: `breedChance 1` and energy 6 (5.5 after metabolism, below 6) give `births.sheep === 0`.
  - `does not breed without a free neighbour`: a 3×3 world (`tinyConfig({ width: 3, height: 3, sheep: { breedChance: 1 } })`) with all 9 cells holding a sheep of energy 10. `births.sheep === 0`, 9 sheep remain, and every sheep is still on its starting cell.
- [ ] **Step 2: Stub:** `runSheepPhase` is still the no-op from Task 4.
- [ ] **Step 3: Run** `npx vitest run src/sim/rules/sheep.test.ts`. Expected: every test FAILS on an assertion (energy 5 ≠ 4.5, etc.).
- [ ] **Step 4: Implement** spec §4.3 step 2. Flee: score each candidate by `torusDistance` to the nearest wolf; break ties by grass, then by `rng`. Grass seeking: score by grass, ties by `rng`.
- [ ] **Step 5: Run.** Expected: PASS. Also run `npx vitest run` (all tests).
- [ ] **Step 6: Commit** `feat(sim): sheep phase`.

---

### Task 6: Wolf phase

**Files:**
- Modify: `src/sim/rules/wolves.ts` → `export function runWolfPhase(world: World): void`
- Test: `src/sim/rules/wolves.test.ts`

**Interfaces:**
- Consumes: the `World` internals and `nearest` from Task 4.
- Produces: `runWolfPhase` implementing spec §4.3 step 3 exactly.

Sheep in these tests stay put: each sheep's own cell has grass 1 and every other cell has 0, with `sheep.vision 0`. Set `sheep.metabolism 0` where a sheep must survive.

- [ ] **Step 1: Write the failing tests**
  - `chases the truly nearest sheep, not the scan-first one` (regression for the old engine's bias):
    - a 9×9 world, a wolf at (4,4) with `wolf.vision 4`, `speed 1` and `catchChance 0`;
    - sheep A at (1,1) (distance 3, up-left, scanned first) and sheep B at (6,4) (distance 2).
    Over seeds 1–20, the wolf ends with `x === 5`.
  - `finds a sheep when vision exceeds half the grid`: a 7×7 world, a wolf at (0,0) with `vision 10` and `catchChance 0`, and one sheep at (5,5) (torus distance 2). After the step, `torusDistance(wolf, sheep) === 1`.
  - `speed limits moves per step`: a 9×9 world, a wolf at (0,4) with `speed 2` and `vision 4`, and a sheep at (4,4). The wolf ends at distance 2 from (4,4).
  - `eats an adjacent sheep, energy capped`: a wolf at (3,3) with energy 25 and `catchChance 1`, and a sheep at (4,3). Afterwards:
    - `stats.sheep === 0` and `sheepAt(4,3) === null`;
    - `deaths.sheep.predation === 1`;
    - wolf energy is `30` (24 + 9 capped).
  - `eats a sheep on its own cell`: a wolf and a sheep both at (3,3) with `catchChance 1`. The sheep dies.
  - `catchChance 0 never kills`: the same setup as the adjacent case with `catchChance 0` leaves the sheep alive and `predation === 0`.
  - `wanders one cell when no sheep is visible`: a wolf at (3,3) with no sheep. It ends at torus distance exactly 1 from (3,3), and no other wolf is in its cell.
  - `starves and ages`: a wolf with energy 0.5 dies with `deaths.wolves.starvation === 1`. A wolf with `{ age: 199, energy: 30 }` dies with `oldAge === 1`.
  - `breeds onto a sheep's cell`: a 3×3 world with a sheep on all 9 cells and a wolf at (1,1) with energy 30, `breedChance 1` and `catchChance 0`. Afterwards `births.wolves === 1`, 2 wolves on distinct cells, and the child has energy `14.5` ((30 − 1)/2) and age 0.
  - `keeps stepping through extinction`: with `createSimulation(tinyConfig({ wolf: { initial: 5 } }), 1)` (no sheep), run 100 steps without throwing. `stats.wolves === 0` at the end, with total starvation deaths across the steps equal to 5. Another 10 steps on the empty world still don't throw, and the stats stay 0.
- [ ] **Step 2: Stub:** `runWolfPhase` is still the no-op.
- [ ] **Step 3: Run** `npx vitest run src/sim/rules/wolves.test.ts`. Expected: FAIL on the assertions.
- [ ] **Step 4: Implement** spec §4.3 step 3:
  - Target selection uses `world.nearest('sheep', …, vision)`.
  - Each move goes to the no-wolf neighbour that minimises `torusDistance` to the target, with ties broken by `rng`. Stop once within 1.
  - After moving, if the target isn't within 1, re-target with `nearest('sheep', …, 1)`.
  - A wolf child needs a neighbour with no wolf; a sheep may be there.
- [ ] **Step 5: Run.** Expected: PASS. Run `npx vitest run` and `npx tsc --noEmit`.
- [ ] **Step 6: Commit** `feat(sim): wolf phase`.

---

### Task 7: Invariants, determinism and source guard

**Files:**
- Test: `src/sim/invariants.test.ts`

- [ ] **Step 1: Write the tests**
  - `invariants hold every step`: for seeds 1–3, `createSimulation(defaultConfig, seed)` runs 300 steps. After each step:
    - no two sheep share a cell, and no two wolves do;
    - `sheepAt(s.x,s.y) === s` for every sheep (and the same for wolves);
    - the occupied-cell count equals the list length;
    - every animal has `alive`, a finite energy in `(0, maxEnergy]`, integer coordinates within the grid, and `age < maxAge`;
    - every grass value is in `[0,1]`;
    - `sheep_t === sheep_{t-1} + births.sheep − (starvation + oldAge + predation)`, and the same for wolves;
    - `stats.step === stepCount`.
  - `same seed gives identical runs`: 300 steps of seed 9, twice, give `StepStats[]` that are `toEqual`.
  - `different seeds diverge`: the seed 9 and seed 10 histories are not equal.
  - `core is free of ambient randomness, time and logging`: read every non-test `.ts` file under `src/sim/` with `fs`. None matches `/Math\.random|Date\.now|console\./`.
- [ ] **Step 2: Run.** Expected: PASS on arrival, since the behaviour exists.
- [ ] **Step 3: Prove each guard can fail** with temporary mutations, reverting each one before the next:
  1. Remove the `Math.min(maxEnergy, …)` cap in sheep eating. Expect the energy invariant to fail.
  2. In `kill`, skip clearing occupancy. Expect the occupancy invariant to fail.
  3. Add `Math.random()` to the grass regrowth. Expect the source guard and the determinism test to fail.
  Save each red output.
- [ ] **Step 4: Revert** all mutations (`git diff` shows only the new test file). Run `npx vitest run`. Expected: PASS.
- [ ] **Step 5: Commit** `test(sim): invariants, determinism and source guard`. The body has one `Red (mutation: …, reverted):` block per mutation.

---

### Task 8: Analysis helpers and the ecology suite

**Files:**
- Create: `src/sim/analysis.ts`
- Test: `src/sim/analysis.test.ts`
- Test: `src/sim/ecology.ecology.test.ts`
- Test: `src/sim/robustness.ecology.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function movingAverage(series: readonly number[], window: number): number[]          // centred, edges use available points
  export function findPeaks(series: readonly number[], minProminence: number): number[]       // indices of local maxima with topographic prominence ≥ minProminence
  export function bestLag(lead: readonly number[], follow: readonly number[], maxLag: number): number  // lag 0..maxLag maximising Σ(lead[i]-mean)(follow[i+lag]-mean)
  export function runHeadless(config: SimConfig, seed: number, steps: number): StepStats[]  // stops early only if both species are 0
  ```

- [ ] **Step 1: Write the failing analysis tests**
  - `movingAverage`: `movingAverage([0,0,9,0,0],3)` equals `[0,3,3,3,0]`.
  - `findPeaks on a sine`: `s[i] = 100 + 50·sin(2πi/100) + noise`, with `noise` uniform ±5 from `createRng(1)`, for `i < 500`. After `movingAverage(s,9)`, `findPeaks(…, 25)` has length 5.
  - `findPeaks on flat noise`: `100 + noise ±5` has 0 peaks at prominence 25.
  - `bestLag recovers a shift`: `lead = sin(2πi/120)` and `follow = sin(2π(i−30)/120)` for `i < 1200`. `bestLag(lead, follow, 120) === 30`.
  - `runHeadless`: for `defaultConfig` and seed 1 over 50 steps, it returns 50 stats with `step` values 1..50.
- [ ] **Step 2: Stub** `movingAverage` (returns a copy), `findPeaks` (returns `[]`), `bestLag` (returns 0) and `runHeadless` (returns `[]`). **Run** `npx vitest run src/sim/analysis.test.ts`. Expected: FAIL on the values.
- [ ] **Step 3: Implement.** Prominence: walk left and right from the peak while values are ≤ the peak, take the min reached on each side, and use `peak − max(leftMin, rightMin)`. Peaks are strict on the left and non-strict on the right. **Run.** Expected: PASS. **Commit** `feat(sim): analysis helpers` with the Red block.
- [ ] **Step 4: Write the ecology tests** in `ecology.ecology.test.ts`. They use `defaultConfig`, seeds 101–110 and 3000 steps each, and compute the runs once in `beforeAll`.
  - `coexistence`: both species > 0 at step 3000 in ≥ 9 of 10 seeds.
  - `bounded`: in every seed, `max(sheep) ≤ 0.30 × width × height`.
  - `cycles`: every surviving seed has `findPeaks(movingAverage(sheep, 9), 0.25 × mean(sheep)).length ≥ 10`.
  - `coupling`: per surviving seed, the period is `(lastPeak − firstPeak)/(peaks − 1)` and `lag = bestLag(smoothSheep, smoothWolves, round(period))`. The median lag across seeds is `> 0` and `< 0.5 × median period`.
  - `performance`: a single `runHeadless(defaultConfig, 1, 3000)` takes `< 3000` ms (`performance.now()`).
- [ ] **Step 5: Write** `robustness.ecology.test.ts`. For each key in `wolf.catchChance`, `wolf.energyPerSheep`, `wolf.metabolism`, `wolf.breedChance`, `sheep.breedChance`, `grass.regrowth`, `sheep.energyPerGrass` and `sheep.metabolism`, and each factor in `[0.8, 1.2]`, build the variant with `createConfig`. Seeds 201–205 × 2000 steps must give both species > 0 at the end in ≥ 4 of 5 seeds. Use `it.each` so a failure names the variant.
- [ ] **Step 6: Run** `npm run test:ecology`. Expected: PASS (it matches the spike).
  - **If it fails, the implementation differs from spec §4.3.** Diff the behaviour against the spike (`/private/tmp/claude-501/-Users-antont-src-ecology123/f1bfc5a0-df0a-4c55-9fe8-b98d6714a431/scratchpad/spike.ts`) and fix the code, not the thresholds or the defaults.
  - If the performance test fails, optimise. Typical causes are per-step array allocation in `neighbours` and filtering; reuse buffers.
  - Escalate to the user only if a spec-faithful implementation still can't pass.
- [ ] **Step 7: Prove the ecology suite can fail.** Temporarily set `defaultConfig.wolf` to the spec's first-draft values: `initial 40`, `vision 6`, `speed 2`, `catchChance 0.7`, `energyPerSheep 12`, `metabolism 0.6`. Run `npm run test:ecology` and expect `coexistence` to FAIL. Revert and re-run until green.
- [ ] **Step 8: Commit** `test(sim): ecology and robustness suites` with `Red (mutation: first-draft wolf parameters, reverted):`.

---

### Task 9: UI on the new core

**Files:**
- Create: `src/visualization/uiConfig.ts`
- Create: `src/visualization/loop.ts`
- Test: `src/visualization/loop.test.ts`
- Rewrite: `src/visualization/SimulationGrid.tsx`
- Rewrite: `src/visualization/SimulationGrid.test.tsx`
- Modify: `src/visualization/SpeedControl.tsx` (import from `uiConfig`) and `src/app/page.tsx` (cell size from `defaultConfig`)
- Delete: `src/visualization/ObservabilityDashboard.tsx`
- Rewrite: `tests/simulation.spec.ts` (Playwright)

**Interfaces:**
- Consumes: `createSimulation`, `defaultConfig`, `Simulation`, `StepStats` from `src/sim/index.ts`.
- Produces:
  ```ts
  // uiConfig.ts
  export const uiConfig: { speed: { min: 0.5; max: 60; default: 10; presets: Record<string, number> }; maxStepsPerFrame: 10; historyCap: 1000; displaySize: 600 }
  // loop.ts
  export function stepsDue(elapsedMs: number, stepsPerSecond: number, maxPerFrame: number): number  // floor(elapsedMs*sps/1000), clamped to [0, maxPerFrame]
  export function appendCapped<T>(items: readonly T[], item: T, cap: number): T[]                  // new array, keeps the last `cap`
  export function parseSeed(input: string): number | null                                          // integer 0..4294967295 from trimmed decimal digits, else null
  export function randomSeed(): number                                                             // UI-only; Math.random is allowed outside src/sim
  ```
  - `SimulationGrid` buttons have `aria-label` `"Play"`/`"Pause"`, `"Step"` and `"Reset"`.
  - The seed input has label text `"Seed"`.
  - The stat values have `data-testid` `stat-step`, `stat-grass`, `stat-sheep` and `stat-wolves`.
  - The grass stat is `Math.round(stats.grass)`.

- [ ] **Step 1: Write the failing tests**
  - `loop.test.ts`:
    - `stepsDue(100, 10, 10) === 1`, `stepsDue(50, 10, 10) === 0`, `stepsDue(60_000, 60, 10) === 10` (a hidden tab must not catch up), `stepsDue(-5, 10, 10) === 0`.
    - `appendCapped([1,2,3], 4, 3)` equals `[2,3,4]`, and the input is unchanged.
    - `parseSeed`: `"42"`→42, `" 7 "`→7, `"0"`→0, `"4294967295"`→4294967295, while `""`, `"abc"`, `"-1"`, `"1.5"`, `"4294967296"` and `"1e3"` → null.
  - `SimulationGrid.test.tsx` (Testing Library, `userEvent`):
    - `Step advances the counter`: after render, `stat-step` is `"0"`; clicking Step makes it `"1"`.
    - `Reset with a seed replays that run`: type `42` in Seed, click Reset, click Step 5 times. `stat-sheep` equals `runHeadless(defaultConfig, 42, 5)[4].sheep` and `stat-wolves` matches likewise.
    - `invalid seed is flagged and ignored`: after Reset with 42, type `abc`. The input has `aria-invalid="true"`. Clicking Reset then Step 5 times still matches seed 42's numbers.
    - `Play toggles to Pause`: clicking Play shows a button labelled Pause.
- [ ] **Step 2: Stub** `loop.ts` (the functions return `0`, `items` and `null`). Don't touch the old `SimulationGrid` yet.
- [ ] **Step 3: Run** `npx vitest run src/visualization`. Expected:
  - the `loop` tests FAIL on values;
  - the `SimulationGrid` tests FAIL because the old UI has no Seed field and no `stat-*` values, which shows up as Testing Library "Unable to find" assertion errors.
- [ ] **Step 4: Implement**
  - `loop.ts`.
  - Rewrite `SimulationGrid.tsx`. It keeps a `Simulation` in a ref plus a `seed` state, and a rAF loop accumulates elapsed time and runs `stepsDue(…)` steps per frame.
  - Drawing: fill each cell green by grass (`rgb(20, 40+180·g, 20)`), then white sheep and dark red wolves. Draw grid lines only if `cellSize ≥ 6`.
  - Keep the history with `appendCapped(…, uiConfig.historyCap)` and pass it to the existing `PopulationDashboard`.
  - Reset builds `createSimulation(defaultConfig, seed)`, using the parsed seed field if it's valid, otherwise the current seed. The Seed field shows the current seed after each reset.
  - No auto-pause on extinction.
  - Remove all imports of `src/simulation/**` from `src/visualization` and `src/app`, and delete `ObservabilityDashboard.tsx`.
- [ ] **Step 5: Run** `npx vitest run` and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 6: Rewrite the Playwright spec.**
  - The page shows a heading containing "Ecological Simulation".
  - The canvas is visible.
  - Clicking Step changes `stat-step` from 0 to 1.
  - Clicking Play shows Pause, and after 1 s `stat-step` is > 1.
  Run `npx playwright test`. If the Chromium browser isn't installed, ask the user before running `npx playwright install chromium`.
- [ ] **Step 7: Commit** `feat(ui): drive the page from the new simulation core` with the Red block.

---

### Task 10: Remove the old engine, dead deps and stale docs

**Files:**
- Delete: `src/simulation/` (all remaining files)
- Delete: `CHART_SIZING_IMPROVEMENTS.md`, `CHART_SOLUTIONS.md`, `CHART_SPACE_OPTIMIZATION.md`, `CHART_WIDTH_EXPANSION.md`, `FINAL_CHART_OPTIMIZATION.md`, `PRE_COMMIT_IMPROVEMENTS.md`, `SVG_AREA_OPTIMIZATION.md`, `VISUALIZATION_SCALING_DEMO.md`, `WORLD_SIZE_EXPERIMENTS.md`, `reproduction-plan.md`
- Delete (git rm): `playwright-report/`, `test-results/`
- Modify: `.gitignore` (add `/playwright-report/` and `/test-results/`), `package.json`/`package-lock.json`, `README.md`, `activity-log.md`
- Leave untouched: `ai/`, `.cursor/`, `plan.md`, `tasks/`

- [ ] **Step 1:** `git rm -r src/simulation` and the listed docs and reports. Run `grep -rn "simulation/" src` and expect no hits.
- [ ] **Step 2:** `npm uninstall redux @reduxjs/toolkit react-redux redux-saga`.
- [ ] **Step 3:** Rewrite `README.md` to cover only:
  - what the app shows;
  - the model rules (a concise restatement of spec §4.3);
  - seeds and determinism;
  - the default parameters table;
  - the commands `npm run dev`, `npm test`, `npm run test:ecology` and `npx playwright test`;
  - what the ecology suite asserts, with its thresholds.
  Keep the existing screenshot link. Add no badges or citations for features that aren't implemented.
- [ ] **Step 4:** Add a dated entry for today, 2026-11-03, at the top of `activity-log.md` in its emoji format (see `ai/rules/log.mdc`). Summarise the rewrite in about 5 lines.
- [ ] **Step 5:** Run `npx vitest run`, `npx tsc --noEmit`, `npx eslint .` and `npm run build`. Expected: all succeed.
- [ ] **Step 6: Commit** `chore: remove old engine, unused redux deps and stale docs`.

---

### Task 11: Final verification

- [ ] **Step 1:** Run `npx vitest run`, `npm run test:ecology`, `npx tsc --noEmit`, `npx eslint .`, `npm run build` and `npx playwright test`. Record the pass counts.
- [ ] **Step 2:** Run the app (`npm run dev`) in the browser pane:
  - Press Play at the "fast" preset for about 30 s.
  - Screenshot it and confirm patchy grass, roaming sheep and wolves present.
  - Confirm the chart shows at least one sheep rise and fall with wolves lagging.
- [ ] **Step 3:** Run a fresh whole-branch review (superpowers:requesting-code-review) and address its findings.
- [ ] **Step 4:** Report to the user: the commits, the test counts, the ecology numbers and the screenshot. Don't merge or push without asking.
