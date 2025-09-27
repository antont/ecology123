# Ecological Simulation Project Plan

## 🎯 Project Overview

Create a simple ecological simulation featuring a three-level food chain: **Grass → Sheep → Wolves**. The simulation will run in a web browser with a 2D grid visualization, designed to be both educational and entertaining while maintaining ecological accuracy.

## 🧠 Thinking Process

**🎯 Restate**: Build a web-based ecological simulation with grass, sheep, and wolves in a 2D grid world, with realistic ecological parameters and stepwise simulation.

**💡 Ideate**: 
- Use NextJS + React + Redux for the web application
- Implement a cellular automata-style simulation engine
- Create a visual grid representation with different colors/symbols for each organism
- Design realistic ecological parameters based on literature
- Build a modular architecture for future complexity additions

**🪞 Reflect Critically**: 
- Need to balance simplicity with ecological accuracy
- Must ensure stable population dynamics
- Architecture should be extensible but not over-engineered
- Focus on core simulation first, then add features

**🔭 Expand Orthogonally**:
- Consider different visualization modes (heat maps, population graphs)
- Think about parameter tuning interface
- Plan for different ecosystem types (desert, forest, etc.)
- Consider multi-species interactions beyond simple food chains

**⚖️ Score & Rank**:
1. Core simulation engine (highest priority)
2. Basic visualization (high priority)
3. Ecological parameter tuning (medium priority)
4. Advanced features (low priority)

## 📋 Task Breakdown

### Phase 1: Foundation & Core Simulation
1. **Project Setup** - Initialize NextJS project with TypeScript
2. **Simulation Engine** - Create core simulation logic with stepwise execution
3. **Organism Models** - Implement grass, sheep, and wolf behaviors
4. **Grid System** - Create 2D world representation

### Phase 2: Visualization & Interaction
5. **Grid Visualization** - Build React components for grid display
6. **Simulation Controls** - Add play/pause/step controls
7. **Parameter Display** - Show population counts and statistics

### Phase 3: Ecological Tuning & Polish
8. **Parameter Optimization** - Tune for stable ecosystem dynamics
9. **Visual Polish** - Improve UI/UX with animations and styling
10. **Documentation** - Add user guide and ecological explanations

## 🏗️ Software Architecture

### Core Components

```
src/
├── simulation/
│   ├── engine/
│   │   ├── SimulationEngine.ts      # Main simulation controller
│   │   ├── World.ts                 # 2D grid world representation
│   │   └── StepProcessor.ts         # Handles each simulation step
│   ├── organisms/
│   │   ├── Grass.ts                 # Grass growth and spreading
│   │   ├── Sheep.ts                 # Sheep behavior and movement
│   │   └── Wolf.ts                  # Wolf hunting and movement
│   ├── config/
│   │   └── WorldConfig.ts           # Configurable simulation parameters
│   └── types/
│       └── SimulationTypes.ts       # TypeScript interfaces
├── visualization/
│   ├── GridView.tsx                 # Main grid display component
│   ├── OrganismRenderer.tsx         # Renders individual organisms
│   └── Controls.tsx                 # Simulation controls
├── store/
│   ├── simulation-dux.sudo          # Redux state management
│   └── simulation-dux.js            # Transpiled Redux store
└── pages/
    └── index.tsx                    # Main simulation page
```

### State Management
- Use Redux with Autodux for simulation state
- Separate concerns: simulation logic, visualization, and controls
- Immutable state updates for predictable behavior

### Configuration System
- Centralized configuration in `WorldConfig.ts`
- Easy parameter tuning without code changes
- Runtime configuration updates for experimentation
- Default values optimized for 50x50 grid

## 🌱 Ecological Parameters

### Grass
- **Growth Rate**: 0.1 probability per cell per step
- **Max Density**: 1.0 (fully grown grass)
- **Spreading**: Adjacent cells can be colonized
- **Consumption**: Reduced by 0.3 when eaten by sheep

### Sheep
- **Initial Population**: 50-100 individuals
- **Movement**: 1-2 cells per step (random walk)
- **Hunger**: Must eat grass every 3-5 steps
- **Reproduction**: 0.05 probability per step when well-fed
- **Lifespan**: 50-100 steps

### Wolves
- **Initial Population**: 5-15 individuals
- **Movement**: 2-3 cells per step (hunting behavior)
- **Hunger**: Must eat sheep every 5-8 steps
- **Reproduction**: 0.02 probability per step when well-fed
- **Lifespan**: 80-150 steps

### World Parameters
- **Grid Size**: 50x50 cells (configurable via WORLD_CONFIG)
- **Step Duration**: 1 minute (realistic ecological timescale)
- **Initial Grass Coverage**: 60-80% of cells

## 🎮 User Experience

### Initial State
- Clean, intuitive interface with large grid display
- Clear visual distinction between organisms (colors/symbols)
- Real-time population counters
- Simple play/pause/step controls

### Interaction
- Click to add/remove organisms (debug mode)
- Adjustable simulation speed
- Parameter sliders for experimentation
- Reset to initial state button

## 🔬 Ecological Accuracy

### Food Chain Dynamics
- **Bottom-up Control**: Grass abundance affects sheep population
- **Top-down Control**: Wolf predation affects sheep population
- **Carrying Capacity**: Each species has environmental limits
- **Population Cycles**: Natural boom-bust cycles expected

### Realistic Behaviors
- **Sheep**: Grazing behavior, flocking tendencies
- **Wolves**: Pack hunting, territorial behavior
- **Grass**: Seasonal growth patterns, resource competition

## 🚀 Future Extensions

### Short-term
- Multiple ecosystem types
- Weather effects
- Disease outbreaks
- Migration patterns

### Long-term
- 3D visualization
- Multi-species interactions
- Genetic algorithms for evolution
- Data export and analysis tools

## 📊 Success Criteria

- [ ] Stable ecosystem runs for 1000+ steps without complete extinction
- [ ] Realistic population oscillations
- [ ] Smooth, responsive visualization
- [ ] Intuitive user controls
- [ ] Educational value for understanding food chains
- [ ] Extensible architecture for future features

## 🎯 Next Steps

1. **Initialize Project** - Set up NextJS with TypeScript and required dependencies
2. **Create Simulation Engine** - Build core simulation logic with proper timing
3. **Implement Organisms** - Code grass, sheep, and wolf behaviors
4. **Build Visualization** - Create React components for grid display
5. **Test & Tune** - Optimize parameters for stable, interesting dynamics

## 🔧 **Configuration System**

The architecture includes a centralized configuration system:

```typescript
// WorldConfig.ts
export const WORLD_CONFIG = {
  // Grid dimensions
  width: 50,
  height: 50,
  
  // Simulation timing
  stepDuration: 60000, // 1 minute in milliseconds
  
  // Initial populations
  initialGrassCoverage: 0.7, // 70% of cells
  initialSheepCount: 75,
  initialWolfCount: 10,
  
  // Grass parameters
  grassGrowthRate: 0.1,
  grassMaxDensity: 1.0,
  grassConsumptionRate: 0.3,
  
  // Sheep parameters
  sheepMovementRange: 2,
  sheepHungerThreshold: 4,
  sheepReproductionRate: 0.05,
  sheepLifespan: 75,
  
  // Wolf parameters
  wolfMovementRange: 3,
  wolfHungerThreshold: 6,
  wolfReproductionRate: 0.02,
  wolfLifespan: 120,
} as const;
```

This makes it easy to experiment with different grid sizes, population densities, and behavioral parameters without touching the core simulation code.

---

*This plan provides a solid foundation for building an educational and entertaining ecological simulation while maintaining scientific accuracy and software engineering best practices.*
