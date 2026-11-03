# Simulation Core Rewrite: Design

Date: 2026-11-03
Branch: `rewrite-core`

## 1. Intent

ecology123 is a browser ecosystem: grass, sheep and wolves on a grid. The current
engine (`src/simulation/**`) never produces what the project set out to show. In six
1000-step headless runs with the shipped config, sheep grew from 61 to 1,400–4,000
on 4,900 cells, grazed everything bare, and every run ended in total extinction by
step 230–300. Underneath that sit about ten correctness bugs, and the docs, tests
and commit history claim behaviour that doesn't exist. The full list is in the
review from this session.

The rewrite replaces the simulation core with a small model that is deterministic
and that we fully understand, and that **genuinely cycles**. Press play: sheep
boom, wolves follow, sheep crash, wolves starve back, grass recovers, and this
repeats for thousands of steps. The cycles must come only from each creature's own
rules. The grid should look alive: patchy grass, roaming herds, wolves among them.

## 2. Goals, non-goals, anti-goals

**Goals**
- Predator-prey cycles that sustain themselves on the default config, in most
  seeds, for thousands of steps.
- A deterministic core: the same config and seed always give the same run.
- A core small and clear enough to hold in your head: a few hundred lines with no
  dead parameters.
- Tests that prove behaviour: rule-level tests on small hand-built worlds,
  invariant tests, and multi-seed ecology tests that check the actual goals above.
- The existing Next.js page (canvas grid, population chart, speed controls) wired
  to the new core.

**Non-goals for this rewrite** (they may come later, but only if they keep the
cycles intact)
- Seasons, temperature, pregnancy/gestation, sexes and mating, packs, territories,
  flocking, inheritance, disease.
- A Redux store.
- Live parameter-tuning UI.
- Changes to the analytics or observability dashboard. The old one is removed.

**Anti-goals** (each counts as a failure even if everything else "works")
- Anything that forces or rescues populations: respawning, extinction floors,
  timers, global population caps.
- Tests that pass trivially: a red caused by a missing module or import, thresholds
  loosened until the suite goes green, or assertions on log output.
- Config parameters the code never reads.
- Logging inside the simulation core.
- Claims in the README that the tests don't back.

## 3. Constraints

- TypeScript strict mode, Vitest for unit and ecology tests, Playwright for one
  thin E2E smoke test. Next.js 15 app router, React 19, Tailwind 4, Recharts (all
  already present).
- The core (`src/sim/`) imports nothing from React, the DOM or Node APIs. It runs
  unchanged in the browser and in Vitest.
- All randomness goes through an injected seeded RNG. `Math.random` and
  `Date.now` are forbidden in `src/sim/`.
- **TDD with proof of red** (user's rule):
  - Each behaviour starts as a failing test. The run shows the test failing **on a
    behavioural assertion** (expected X, received Y).
  - To make that possible, a slice may first add the exported signature as a stub
    (a no-op, or one returning a neutral value) so the test compiles and runs.
    Compile errors, import errors and "not implemented" throws do **not** count as
    red.
  - The commit that turns the test green includes the trimmed red output in its
    message body, under a `Red:` heading.
- Every commit on the branch leaves `npx vitest run` and `npx tsc --noEmit` green.
  The husky hook isn't active in this clone, so the builder runs these by hand.
- Commits end with the session's `Co-Authored-By` trailer.

## 4. The model

### 4.1 World
- A `width × height` grid that **wraps at the edges** (a torus). Distance is
  Chebyshev distance on the torus:
  `d = max(min(|dx|, W-|dx|), min(|dy|, H-|dy|))`.
- **Grass** is a field, not a set of creatures: one `Float32Array` with a value in
  `[0, 1]` per cell. Each step, every cell regrows by
  `g = min(1, g + grassRegrowth)`. Grass can be grazed bare locally, but it is
  never removed from a cell for good.
- **Occupancy:** at most one sheep and at most one wolf per cell, kept in two
  lookup arrays of length `W*H` (`Animal | null`). *(Claude's call)* A sheep and a
  wolf **may share a cell for any length of time**: a wolf can step onto a sheep's
  cell, a catch can fail, and a wolf child can be born on a sheep. The attack range
  of distance ≤ 1 includes the shared cell. Sheep never move *onto* a wolf's cell,
  but a sheep already under a wolf may stay. The invariant is "at most one per
  species per cell", nothing stronger.

### 4.2 Animals
```
Animal { id: number; species: 'sheep' | 'wolf'; x; y; energy; age; alive }
```
- Energy is capped at the species' `maxEnergy`. Energy is never above the cap and
  is always finite.
- Ids come from a per-simulation counter. They're deterministic and are never
  random strings.

### 4.3 One step (fixed order)
1. **Grass regrows** on every cell.
2. **Sheep phase.** Shuffle the sheep that were alive at the start of the step,
   using the RNG. For each sheep that is still alive:
   1. `age += 1`, then `energy -= sheep.metabolism`.
   2. Die of `oldAge` if `age >= sheep.maxAge`. Otherwise die of `starvation` if
      `energy <= 0`. A dead sheep does nothing further.
   3. **Move one cell.** Candidates are the 8 neighbours plus staying put. A
      candidate is excluded if another sheep or a wolf is on it, except that the
      sheep's own cell is always allowed.
      - If a wolf is within `sheep.vision`: pick the candidate that maximises the
        distance to the nearest wolf. Break ties by more grass, then randomly.
      - Otherwise: with probability `sheep.wander`, pick a random candidate.
        Otherwise pick the candidate with the most grass, breaking ties randomly.
   4. **Eat:** `bite = min(grass[cell], sheep.biteSize)`. Subtract `bite` from the
      grass, then `energy = min(maxEnergy, energy + bite * sheep.energyPerGrass)`.
   5. **Breed:** if `energy >= sheep.breedThreshold` and `rng < sheep.breedChance`
      and a neighbour has no sheep and no wolf, place one child on a random such
      neighbour. The parent's energy is halved and the child gets the other half,
      age 0. The child doesn't act until the next step.
3. **Wolf phase.** Shuffle the wolves alive at the start of the step. For each wolf
   still alive:
   1. Age and metabolism, as for sheep.
   2. Death checks (`oldAge`, then `starvation`), as for sheep.
   3. **Hunt or wander.** Find the nearest living sheep within `wolf.vision`
      (true torus distance, ties broken randomly).
      - If one is found, take up to `wolf.speed` single-cell moves toward it. Each
        move goes to the free (no-wolf) neighbour that minimises distance to the
        target, ties broken randomly. Stop once the target is within distance 1.
      - If none is found, make one random move to a free neighbour.
   4. **Attack:** if the target, or failing that the nearest sheep, is within
      distance 1, kill it with probability `wolf.catchChance`. The sheep dies of
      `predation` and is removed from occupancy at once. Then
      `energy = min(maxEnergy, energy + wolf.energyPerSheep)`.
   5. **Breed:** same rule as for sheep with the wolf's parameters. The free
      neighbour needs no wolf; a sheep may be there.
4. **Compact:** remove dead animals from the animal lists. Occupancy is already
   kept up to date as animals die and move.
5. **Record stats** for the step (4.5).

Shuffling, the "alive at start" snapshot and the immediate removal of the dead are
what keep the step free of the old engine's order and ghost bugs. Nothing ever
iterates in grid-scan order to choose a target.

### 4.4 Initial state
`createSimulation(config, seed)` does the following:
- Sets grass per cell uniformly at random in `[0, 1]`.
- Places `initialSheep` and `initialWolves` on distinct random free cells, with
  energy uniform in `[0.5, 1] × maxEnergy` and age uniform in `[0, maxAge/2)`.
- Rejects any config whose initial counts exceed the number of cells.

### 4.5 Stats (per step)
```
StepStats {
  step
  sheep
  wolves
  grass                 // total biomass, i.e. the sum of the field
  births: { sheep, wolves }
  deaths: { sheep: { starvation, oldAge, predation }, wolves: { starvation, oldAge } }
}
```
The core keeps only the latest `StepStats`. History is the caller's job: the UI
keeps a bounded buffer, and tests build arrays.

### 4.6 Parameters
All parameters live in one typed `SimConfig`, with `defaultConfig` and
`createConfig(overrides)`. `validateConfig` rejects: non-positive sizes;
probabilities outside `[0, 1]`; `maxEnergy <= 0`; `breedThreshold > maxEnergy`;
and initial counts greater than `width*height`. Every field is read by the model.
Default values, validated by the spike (§7):

| Group | Field | Default |
|---|---|---|
| world | width, height | 80, 80 |
| grass | regrowth | 0.03 |
| sheep | initial, maxEnergy, metabolism, biteSize, energyPerGrass, breedThreshold, breedChance, vision, wander, maxAge | 400, 10, 0.5, 0.5, 2, 6, 0.08, 2, 0.2, 100 |
| wolf | initial, maxEnergy, metabolism, energyPerSheep, breedThreshold, breedChance, vision, speed, catchChance, maxAge | 20, 30, 1.0, 9, 18, 0.05, 3, 1, 0.22, 200 |

The first-draft wolf values (40 wolves, vision 6, speed 2, catch 0.7, gain 12,
metabolism 0.6) wiped out the sheep within 25 steps in every seed. Wolves that are
too strong overshoot, crash the sheep and then starve; wolves that are too weak die
out. The defaults sit in the middle of that window.

## 5. Code structure

```
src/sim/
  rng.ts           seeded PRNG (e.g. mulberry32): next(), int(n), pick(arr), shuffle(arr)
  config.ts        SimConfig type, defaultConfig, createConfig, validateConfig
  grid.ts          torus helpers: wrap, index, distance, neighbours
  simulation.ts    Simulation: state, step() orchestration, stats
  rules/sheep.ts   sheep phase (pure functions over the simulation state)
  rules/wolves.ts  wolf phase
  analysis.ts      smoothing, peak detection, lagged cross-correlation (test and UI helpers)
  index.ts         public exports
```

**Public API (sketch)**
```ts
const sim = createSimulation(config, seed)   // random initial state, §4.4
const sim = createEmptySimulation(config, seed) // no animals; grass at 0 (for tests)
sim.addSheep(x, y, { energy?, age? }) / sim.addWolf(...) / sim.setGrass(x, y, v)
sim.step()
sim.stats             // latest StepStats
sim.grass             // readonly Float32Array
sim.sheep, sim.wolves // readonly Animal[] (alive only, after compaction)
sim.sheepAt(x, y), sim.wolfAt(x, y)
sim.width, sim.height, sim.stepCount
```
`addSheep`/`addWolf` throw if the cell is already taken by that species. The same
methods serve both initialisation and test scenarios, so tests never poke at
internals.

The builder may adjust names and the file split, provided the core stays free of
UI code and side effects.

## 6. Testing strategy

**6.1 Rule tests** use small hand-built worlds (e.g. 7×7) made with
`createEmptySimulation` and explicit placement. Probabilities are set to 0 or 1 in
the test config so outcomes don't depend on the RNG. Each test names one rule from
§4.3. At minimum:
- Grass regrows by `regrowth` and caps at 1.
- A sheep pays metabolism and dies of `starvation` at ≤0 energy, with the death
  counted under that cause. A sheep dies of `oldAge` at `maxAge`.
- A sheep moves to the grassiest neighbour, then eats: grass falls by the bite and
  energy rises by `bite × energyPerGrass`, capped at `maxEnergy`.
- A sheep flees: with a wolf adjacent on the west, the sheep ends up farther from
  it.
- Wrap-around: a sheep at x=0 can move to x=W−1, and distances across the edge are
  measured correctly.
- **A wolf picks the truly nearest sheep.** Put one sheep at distance 3 in the
  scan-first direction (up-left) and one at distance 2 in the opposite direction;
  the wolf moves toward the distance-2 sheep. This is the regression test for the
  old engine's scan-order bias.
- A wolf adjacent to a sheep with `catchChance=1` eats it: the sheep is gone from
  the list and from occupancy, `predation` is counted, and the wolf's energy is
  capped.
- Breeding halves the parent's energy, gives the child the other half, places the
  child on a free neighbour, and counts a birth. It doesn't happen when every
  neighbour is occupied, or when energy is below the threshold.
- A sheep killed earlier in the step never acts later in that step. A newborn
  doesn't act on its birth step.

**6.2 Invariant tests** run the default config for a few seeds and a few hundred
steps, checking after every step:
- At most one animal per species per cell, and occupancy matches the lists.
- Energy is finite, positive for every living animal, and ≤ `maxEnergy`.
- Grass is within `[0, 1]`.
- Population change equals births minus deaths.

**6.3 Determinism tests**
- The same seed produces an identical sequence of `StepStats` over 300 steps.
- Different seeds produce different sequences.

**6.4 Analysis tests** (`analysis.ts` is itself under test)
- Peak detection finds 5 peaks in a 5-period sine wave with noise, and 0 in flat
  noise.
- Lagged cross-correlation recovers a known lag between two shifted sine waves.

**6.5 Ecology tests** run on the default config only, in their own file with a
long timeout:
- 10 fixed seeds × 3000 steps.
- **Coexistence:** both species are alive at step 3000 in at least 9 of 10 seeds.
  The spike got 10/10 on 80×80 and on 100×100.
- **Bounded:** in every seed, sheep never exceed 30% of cells. The spike's
  maximum was 22%.
- **Cycles:** in every surviving seed, the smoothed sheep series has at least 10
  peaks with prominence at least 25% of its mean. The spike's minimum was 21,
  with a period of about 135 steps.
- **Robustness:** with each of the 8 main parameters scaled by ×0.8 and ×1.2 (5
  seeds × 2000 steps each), both species survive in at least 4 of 5 seeds. In
  the spike, 31 of 32 cases got 5/5 and one got 4/5. This guards against the
  defaults drifting to the edge of the viable window.
- **Coupling:** median wolf-after-sheep lag (peak of the lagged cross-correlation)
  is greater than 0 and less than half the median sheep period. The spike
  measured a lag of about 42 against a period of about 135.
- **Performance:** 3000 steps on the default config finish in under 3 s in Node.
  The unoptimised spike took about 1.2 s. This is a guard against regressions, not
  a benchmark.

These thresholds are fixed. They don't get loosened to make a change pass. A
failing ecology test means the model or the parameters need work.

**6.6 UI tests**
- The existing component tests are kept if still meaningful, otherwise rewritten:
  the chart renders the series it is given, and the grid component steps the
  simulation and updates the counters.
- Playwright smoke test: the page loads; pressing Step advances the step counter;
  Play/Pause toggles. Buttons get accessible names (`aria-label`) so the test
  doesn't depend on emoji.
- Vitest must not collect `tests/*.spec.ts`. The CSS/PostCSS load failure in
  component tests gets fixed (e.g. `test.css` config).

## 7. Calibration (done in a spike)

Before the TDD build, a throwaway, uncommitted spike implemented §4.3 exactly as
written. It swept 128 wolf-parameter combinations and then checked the chosen
point against new seeds, two grid sizes and ±20% changes to each parameter.
Result: **the rules needed no changes, only the wolf parameters** (§4.6).

The TDD build implements §4.3 as written and uses these defaults. The ecology
tests in §6.5 confirm that the TDD implementation reproduces the spike's
behaviour. If they fail, the implementation differs from the spec; that is a bug,
not a reason to retune. If retuning is ever needed later,
`scripts/calibrate.ts` (`npx tsx`) can be added to repeat the sweep. Model
mechanisms are changed only with the user's approval.

## 8. UI integration

- `SimulationGrid` is rewritten against the new API:
  - It holds a `Simulation` in a ref.
  - A `requestAnimationFrame` loop steps the simulation at the chosen speed (more
    than one step per frame is allowed at high speeds).
  - It draws the grass field (darker green means more grass), then sheep, then
    wolves. Grid lines are drawn only when cells are at least 6 px.
  - The chart history buffer is capped at 1000 points.
  - Stats come from `sim.stats`.
- **Reset** creates a new simulation with a new seed. The current seed is shown
  and can be typed in to replay a run.
- **No auto-pause on extinction.** The run continues, and the counter shows 0.
- UI-only settings (speed presets, display size) move to `src/visualization/uiConfig.ts`.
- The chart keeps its two y-axes. The grass series is total biomass.
- Remove `ObservabilityDashboard.tsx`. `PopulationDashboard` and `PopulationChart`
  stay, adapted where needed.

## 9. Cleanup

- Delete `src/simulation/**`: the old engine, analyzer, factory, initializer,
  types and their tests.
- Delete the root work-log docs: `CHART_SIZING_IMPROVEMENTS.md`,
  `CHART_SOLUTIONS.md`, `CHART_SPACE_OPTIMIZATION.md`, `CHART_WIDTH_EXPANSION.md`,
  `FINAL_CHART_OPTIMIZATION.md`, `PRE_COMMIT_IMPROVEMENTS.md`,
  `SVG_AREA_OPTIMIZATION.md`, `VISUALIZATION_SCALING_DEMO.md`,
  `WORLD_SIZE_EXPERIMENTS.md`, `reproduction-plan.md`.
- *(Builder's call)* Keep `plan.md`, `tasks/` and `activity-log.md`. They belong
  to the user's `ai/` workflow; add a log entry for this rewrite.
- Leave `ai/` and `.cursor/` untouched.
- Remove the unused dependencies `redux`, `@reduxjs/toolkit`, `react-redux` and
  `redux-saga`.
- `git rm` `playwright-report/` and `test-results/` and add both to `.gitignore`.
- Rewrite the README to describe only what exists and what the tests verify: the
  model rules, how to run, how determinism and seeds work, and the ecology test
  criteria. No research citations the model doesn't implement.

## 10. Left to the builder

- Exact file split and naming inside `src/sim/`.
- How the ecology tests are separated (file suffix or Vitest project) and their
  timeouts.
- The order of slices and commits. Every commit stays green, and each behavioural
  commit carries its `Red:` output.
- Performance tactics, provided behaviour and determinism are unchanged.

## 11. Decisions and who made them

- **User:**
  - Success means visible, sustained predator-prey cycles that come from the
    creatures' own rules, on a grid that looks alive.
  - Build the core first; extras later, and only if they keep the cycles.
  - Use the cleanup scope in §9.
  - Follow TDD with proof of red, with the red output in the green commit.
  - Write meaningful tests.
- **Claude** (approved in conversation as defaults):
  - Keep the TypeScript/Next.js stack.
  - Wrap the grid at the edges.
  - Model grass as a regrowing field.
  - Allow one animal per species per cell.
  - Use a seeded RNG.
  - Use asexual breeding with energy split between parent and child.
  - Make the shuffled-order step.
- **User:** spike first, before TDD.
- **Claude** (marked here; not yet discussed):
  - The precise step algorithm in §4.3. The spike showed it cycles unchanged.
  - Sheep and wolves may share a cell (§4.1).
  - The default parameters (from the spike).
  - The ecology test thresholds (tightened from spike results).
  - Keeping `plan.md`, `tasks/` and `activity-log.md`.
  - Removing the observability dashboard.
  - Not auto-pausing on extinction.
