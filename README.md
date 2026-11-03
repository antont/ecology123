# Ecological Simulation: grass, sheep and wolves

A small agent-based ecosystem in the browser. Grass regrows, sheep graze it, and wolves hunt the sheep. Predator-prey cycles come purely from each creature's own rules: sheep boom, wolves follow, sheep crash, wolves starve back, grass recovers, and the cycle repeats for thousands of steps. Nothing forces or rescues a population.

<img width="1227" height="897" alt="image" src="https://github.com/user-attachments/assets/ab195557-2ee9-477c-aaa7-37541826552a" />

*(Screenshot of an earlier version.)*

## Running it

```bash
npm install
npm run dev            # http://localhost:3000
npm test               # unit, rule, invariant and UI tests (fast)
npm run test:ecology   # multi-seed ecology and robustness checks (~1.5 min)
npx playwright test    # browser smoke test
```

In the page you can:
- **Play/Pause** the run, or **Step** one step at a time.
- Set the speed in steps per second.
- See the current **Seed**. Type a seed and press **Reset** to replay that exact run, or press 🎲 to start a new one.

## The model

The world is an 80×80 grid that wraps at the edges. Distances are Chebyshev distances measured the short way round.

- **Grass** is a value from 0 to 1 per cell. Every cell regrows by `grass.regrowth` each step, up to 1.
- **Animals** each have energy (capped at the species' `maxEnergy`) and an age. A cell holds at most one sheep and at most one wolf. A sheep and a wolf may share a cell.

Each step runs in this order:

1. Grass regrows.
2. **Sheep** act in shuffled order. Each sheep:
   1. ages and pays `metabolism`, and dies of old age at `maxAge` or of starvation at zero energy;
   2. moves one cell (or stays):
      - if it can see a wolf within `vision`, it moves to the cell farthest from that wolf;
      - otherwise, with probability `wander`, it moves to a random cell;
      - otherwise it moves to the grassiest cell;
      - it never moves onto another sheep or a wolf;
   3. eats up to `biteSize` grass, gaining `energyPerGrass` energy per unit eaten;
   4. if its energy is at least `breedThreshold`, with probability `breedChance` it splits its energy with one lamb placed on a free neighbouring cell.
3. **Wolves** act in shuffled order. Each wolf:
   1. ages and pays `metabolism`, and dies the same two ways;
   2. chases the nearest sheep within `vision`, up to `speed` cells, or wanders one cell if none is in sight;
   3. kills an adjacent sheep with probability `catchChance`, gaining `energyPerSheep`;
   4. breeds the same way as sheep, onto any wolf-free neighbouring cell.
4. Dead animals are removed. Newborns act from the next step.

The model is deterministic. All randomness comes from a seeded generator (`src/sim/rng.ts`), so a seed fully determines a run, and the core in `src/sim/` contains no `Math.random`, clock or logging.

### Default parameters

| | Default values |
|---|---|
| world | 80×80, grass regrowth 0.03 per step |
| sheep | 400 initial; maxEnergy 10; metabolism 0.5; biteSize 0.5; energyPerGrass 2; breedThreshold 6; breedChance 0.08; vision 2; wander 0.2; maxAge 100 |
| wolves | 20 initial; maxEnergy 30; metabolism 1.0; energyPerSheep 9; breedThreshold 18; breedChance 0.05; vision 3; speed 1; catchChance 0.22; maxAge 200 |

These values were chosen by sweeping wolf parameters across many seeds. Wolves that are too strong overshoot, crash the sheep and starve; wolves that are too weak die out. The defaults sit in the middle of that window.

## What the tests guarantee

`npm test` covers:
- **Each rule**, on small hand-built worlds. This includes a regression test that wolves chase the *truly* nearest sheep, not the first one in grid-scan order.
- **Invariants after every step:** occupancy matches the animal lists, energy stays within (0, max], grass stays within [0, 1], and births minus deaths account for every population change.
- **Determinism:** the same seed produces the same run.
- **The UI:** a typed seed replays exactly the run a headless simulation produces.

`npm run test:ecology` checks the model's purpose on the default config:
- **Coexistence:** both species are alive after 3000 steps in at least 9 of 10 seeds.
- **No sheep carpet:** sheep never exceed 30% of cells.
- **Cycles:** at least 10 sheep population cycles per surviving run.
- **Wolves follow sheep:** wolf peaks lag sheep peaks by more than 0 and less than half a cycle. Typically the lag is about 40 steps on a cycle of about 135.
- **Robustness:** with each of 8 key parameters scaled by ×0.8 or ×1.2, both species still coexist in at least 4 of 5 seeds.
- **Speed:** 3000 steps run in under 3 seconds.

The design and the reasoning behind it are in `docs/superpowers/specs/2026-11-03-simulation-core-design.md`.

## Layout

```
src/sim/            the model: rng, config, grid, world, rules/, analysis
src/visualization/  canvas grid, population chart, playback helpers
src/app/            Next.js page
tests/              Playwright smoke test
```

## License

MIT
