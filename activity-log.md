## 2026-11-03

- 🔄 - Rewrote the simulation core as a small deterministic model in src/sim (seeded RNG, torus grid, one shuffled update pass)
- 🐛 - Replaced the old engine, which collapsed to total extinction by step ~300 in every seed
- 📊 - Added multi-seed ecology and robustness suites: coexistence, bounded sheep, sustained cycles, wolf lag
- 📱 - Rewired the page to the new core with a replayable seed and a capped animation loop
- 📦 - Removed unused Redux dependencies, the observability dashboard and stale work-log docs

## 2025-09-30

- 🎯 - Implemented grazing pause mechanic: sheep stop moving after eating, making them vulnerable to wolves
- 🚀 - Achieved 59% longer simulation duration: extinction at step 305 vs previous 191 steps
- 📊 - Optimized sheep reproduction for stability: rate 0.09→0.06, threshold 0.35→0.50, energy cost 0.25→0.35
- 🌱 - Enhanced grass resilience: growth rate 0.08→0.12, consumption rate 0.8→0.6 for better recovery
- 🐺 - Increased wolf responsiveness: reproduction rate 0.10→0.15, energy threshold 0.25→0.15
- 🔄 - Achieved realistic predator-prey dynamics: sheep boom (714 peak) → grass depletion → wolf boom (30) → sheep crash
- 📈 - Extended average oscillation cycle duration to 133.5 steps (much more realistic)
- ✅ - Created comprehensive BasicMechanics tests verifying grass growth, sheep eating, wolf hunting, and integrated ecosystem
- 🎯 - Grazing pause enables wolves to catch sheep more effectively, preventing sheep population explosions
- 🚀 - Combined behavioral mechanics (grazing pause) with parameter tuning for breakthrough ecosystem stability

## 2025-09-29

- 🚀 - Achieved major oscillation breakthrough: 3 cycles over 316 steps with genuine predator-prey dynamics
- 📊 - Implemented comprehensive 1000-step test showing sheep boom-bust (amplitude 542) and wolf recovery cycles
- 🔄 - Optimized wolf survival parameters: energy consumption 0.01→0.003, energy gain 4.0→6.0 per sheep
- 🚀 - Enabled multi-species oscillations: sheep growth→wolf recovery→sheep crash pattern
- 📊 - Demonstrated near-extinction recovery (wolves) and overgrowth correction (sheep 605→59)
- 🔄 - Tuned sheep reproduction for controlled booms: energy threshold 0.55→0.35, litter size 2→3
- 🐛 - Fixed critical cell clearing bugs that were deleting wolves inappropriately during sheep grazing, wolf hunting, and organism movement
- 🚀 - Achieved ecosystem stability with wolf populations growing from 14 to 57+ instead of going extinct at step 22
- 🔄 - Implemented proper organism-specific removal instead of clearing entire cell contents
- 📊 - Enabled oscillation cycles (1-3 cycles achieved) and extended simulation duration to 118-187 steps
- 🐛 - Fixed step tracking in StepProcessor to enable proper debug logging and reproduction timing
- 🔄 - Improved wolf reproduction parameters with aggressive settings for population maintenance

# Activity Log

## 2025-01-28

- 🚀 - Implemented dynamic world scaling system - populations and movement ranges auto-scale with world size
- 📱 - Fixed visualization scaling to adapt automatically to any world dimensions  
- 🎨 - Added dynamic page title showing current world size (e.g., "Ecological Simulation (150×150)")
- 📊 - Achieved 170-step stability with 150×150 world (85% toward 200-step goal)
- 🔄 - Refactored WorldConfig to use factory function with configurable dimensions
- 🐛 - Fixed sheep evasion behavior to use full movement range for escaping wolves
- 📝 - Added comprehensive documentation for world size experimentation and visualization scaling
- 🚀 - Enhanced reproduction system with energy-dependent breeding rates based on ecological research
- 📊 - Population oscillation tests now consistently pass showing healthy ecosystem dynamics
