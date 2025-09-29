# 🌿 Ecological Simulation: Natural Boom-Bust Dynamics

A dynamic ecosystem simulation featuring emergent population oscillations through natural resource depletion and recovery cycles. Watch as grass, sheep, and wolves create realistic predator-prey dynamics without artificial mechanisms. Built with Next.js, React, Redux, and TypeScript.

![Ecosystem Simulation](https://img.shields.io/badge/Status-Active%20Development-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.5+-black)
![Testing](https://img.shields.io/badge/Testing-Vitest%20%2B%20Playwright-orange)

## 🎯 **Project Overview**

This simulation demonstrates fundamental ecological principles through a three-level food chain:
- **🌱 Grass** (Producers): Grow, spread seeds, compete for space
- **🐑 Sheep** (Primary Consumers): Graze grass, reproduce when well-fed, form flocks
- **🐺 Wolves** (Secondary Consumers): Hunt sheep, form packs, territorial behavior

The system exhibits **emergent boom-bust oscillations** that arise naturally from resource competition and energy-dependent reproduction, creating realistic population cycles without any artificial oscillation mechanisms.

## 🔬 **Ecological Features**

### **Natural Boom-Bust Cycles**
```
Sheep Boom → Grass Depletion → Sheep Crash → Grass Recovery → Sheep Recovery
    ↓             ↓                ↓            ↑             ↑
Wolf Growth → Wolf Feeding → Wolf Starvation → Wolf Decline → Cycle Repeats
```

**Key Insight**: Oscillations emerge purely from organism behavior - no artificial timers or forced cycles!

### **🐑 Sheep Behavior (Natural Boom-Bust Drivers)**
- **Energy-Dependent Reproduction**: Only reproduce when energy ≥ 0.35 (well-fed)
- **Quadratic Energy Scaling**: Low energy severely reduces fertility (creates crashes)
- **Rapid Consumption**: Deplete 0.8 grass density per feeding (enables overgrazing)
- **Moderate Energy Cost**: 0.03 energy/step (survive well when grass abundant)
- **Quick Recovery**: Short gestation (5 steps) enables rapid population booms

### **🐺 Wolf Behavior (Population Control)**
- **Conservative Reproduction**: Low reproduction rate (0.08) prevents wolf explosions
- **High Energy Requirements**: Need 0.25 energy to reproduce (must hunt successfully)
- **Strategic Hunting**: Target sheep within moderate hunting radius
- **Energy Conservation**: Can survive 50+ steps without food
- **Pack Dynamics**: Form packs for better hunting success and territorial control

### **🌱 Grass Ecosystem**
- **Seed Dispersal**: Mature grass spreads seeds within 2-cell radius
- **Seasonal Growth**: Enhanced growth during spring/summer cycles
- **Competition**: Dense areas experience reduced growth rates
- **Recovery**: Regrows after grazing with realistic timescales

## 🧬 **Reproduction System**

### **Sheep Reproduction**
- **Fertility Requirements**: 0.8+ energy, age 20-80 steps
- **Mating**: Find partners within 3-cell proximity
- **Pregnancy**: 25-step gestation with energy costs (0.4 total)
- **Offspring**: 1-2 babies with inherited traits
- **Cooldown**: 30 steps between pregnancies

### **Wolf Reproduction**
- **Pack Dynamics**: Only alpha pairs breed when pack size is 2-6
- **High Energy Needs**: Requires 0.9+ energy (must be very well-fed)
- **Territory**: Need 15-cell radius territory for breeding
- **Gestation**: 15 steps with 2-4 offspring per litter
- **Extended Cooldown**: 50 steps between litters for pack stability

### **Grass Reproduction**
- **Seed Production**: Mature grass (0.6+ density) produces seeds
- **Dispersal Range**: Seeds spread within 2-cell radius
- **Viability**: 70% chance seeds successfully establish
- **Competition**: Nearby grass reduces spreading success

## 📊 **Ecosystem Dynamics**

### **Population Oscillation Phases**
1. **🌱 Abundance Phase** (Steps 1-30): Grass flourishes, sheep multiply rapidly
2. **🐺 Predation Phase** (Steps 30-60): Wolf population peaks, sheep decline
3. **💀 Collapse Phase** (Steps 60-90): Wolves starve, predator population crashes
4. **🔄 Recovery Phase** (Steps 90-120): Sheep recover, cycle repeats

### **Stability Mechanisms**
- **Carrying Capacity**: Environment limits maximum populations
- **Energy Investment**: Reproduction requires significant energy reserves
- **Genetic Diversity**: Trait variation prevents population bottlenecks
- **Density Dependence**: Overcrowding reduces reproduction success
- **Death Tracking**: Comprehensive logging of mortality causes

## 🎮 **User Interface**

### **Real-Time Visualization**
- **Interactive Grid**: 50x50 cell world with organism visualization
- **Population Charts**: Live graphs showing population trends over time
- **Speed Control**: Adjustable simulation speed from slow observation to maximum
- **Statistics Panel**: Real-time counts and ecosystem health metrics

### **Analytics Dashboard**
- **Population Graphs**: Historical trends with 100-step memory
- **Biodiversity Index**: Species diversity and ecosystem health
- **Stability Metrics**: Population variance and oscillation analysis
- **Death Statistics**: Detailed mortality tracking by cause and type

### **Interactive Controls**
- **Play/Pause**: Start and stop simulation
- **Step Mode**: Advance simulation one step at a time
- **Reset**: Reinitialize ecosystem with default parameters
- **Speed Presets**: Slow (0.5x), Normal (1x), Fast (2x), Max speed

## 🏗️ **Architecture**

### **Core Components**
```
SimulationEngine
├── World (Grid management, statistics)
├── StepProcessor (Organism behavior, movement)
├── ReproductionProcessor (Breeding, genetics)
└── Configuration (Ecological parameters)
```

### **Technology Stack**
- **Frontend**: Next.js 15.5+, React, TypeScript
- **State Management**: Redux with Autodux patterns
- **Visualization**: Canvas rendering, Recharts for analytics
- **Testing**: Vitest (unit), Playwright (E2E), Jest DOM
- **Styling**: Tailwind CSS, CSS Modules

### **Design Principles**
- **Array-Oriented Programming**: Efficient batch processing
- **Entity-Component System**: Modular organism behavior
- **Immutable State**: Redux-based state management
- **Test-Driven Development**: Comprehensive test coverage
- **Ecological Accuracy**: Parameters based on real-world research

## 🧪 **Testing Strategy**

### **Unit Tests**
- **Organism Behavior**: Movement, feeding, reproduction logic
- **Population Dynamics**: Birth/death rates, energy management
- **Ecosystem Balance**: Predator-prey relationships

### **Integration Tests**
- **Simulation Stability**: Long-term ecosystem survival
- **Population Oscillations**: Realistic boom-bust cycles
- **UI Components**: Visualization and user interaction

### **End-to-End Tests**
- **Browser Simulation**: Complete user workflows
- **Performance**: Large population handling
- **Headless Analysis**: Automated ecosystem studies

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+
- npm or yarn

### **Installation**
```bash
git clone <repository-url>
cd ecol123
npm install
```

### **Development**
```bash
npm run dev          # Start development server
npm run test         # Run unit tests
npm run test:e2e     # Run Playwright tests
npm run build        # Build for production
```

### **Testing**
```bash
npm run test:watch     # Watch mode for unit tests
npm run test:coverage  # Generate coverage report
npm run test:e2e:ui    # Interactive E2E testing
```

## 📈 **Expected Behavior**

### **Population Targets**
- **Simulation Duration**: 150-200 steps consistently
- **Oscillation Cycles**: Working towards 3-5 boom-bust cycles per 200 steps
- **Sheep Population**: 50-200 individuals (cyclical booms and crashes)
- **Wolf Population**: 10-25 individuals (responsive to sheep availability)
- **Grass Coverage**: 2000-4000 patches (recovers during sheep crashes)

### **Ecological Indicators**
- **Biodiversity**: Consistently high with all species surviving
- **Oscillation Period**: 40-60 step cycles
- **Population Variance**: Moderate (healthy oscillations)
- **Extinction Risk**: Low for all species long-term

## 🔬 **Scientific Accuracy**

### **Ecological Research Basis**
- **Nutritional Stress Theory** (Bronson, 1989): Reproduction rates decrease with poor nutrition/energy
- **Resource Allocation Theory** (Zera & Harshman, 2001): Energy trade-offs between survival and reproduction
- **Life History Theory** (Stearns, 1992): Optimal reproductive strategies under resource constraints
- **Lotka-Volterra Dynamics** (1925): Classic predator-prey oscillation mathematics
- **Wolf Pack Dynamics**: Alpha breeding patterns from Yellowstone wolf studies (Mech, 1999)
- **Sheep Reproduction**: Based on real sheep gestation (5 months → 25 steps)
- **Energy Metabolism**: Accurate energy costs for survival and reproduction

### **Dynamic Reproduction Mechanism**
The simulation implements **energy-dependent reproductive success**:
```
Reproduction Rate = Base Rate × (Average Energy / Maximum Energy)
```
- **High Energy (0.8-1.0)**: 80-100% of base reproduction rate
- **Medium Energy (0.4-0.8)**: 40-80% of base reproduction rate  
- **Low Energy (0.1-0.4)**: 10-40% of base reproduction rate

This creates natural **density-dependent regulation** where:
- Abundant prey → Well-fed predators → Higher reproduction
- Scarce prey → Hungry predators → Lower reproduction → Population decline

### **Validation Metrics**
- **Lotka-Volterra Compliance**: Matches theoretical predictions
- **Field Study Comparison**: Aligns with real ecosystem observations
- **Population Recovery**: Realistic bounce-back from near-extinction
- **Reproductive Suppression**: Matches observed stress-induced fertility decline

## 🎯 **Future Enhancements**

### **Phase 2: Advanced Behaviors**
- **Migration Patterns**: Seasonal movement behaviors
- **Environmental Pressures**: Weather, disease, natural disasters
- **Genetic Algorithms**: Evolution of traits over generations
- **Multi-Species Expansion**: Additional trophic levels

### **Phase 3: Ecosystem Complexity**
- **Habitat Diversity**: Multiple biome types
- **Resource Competition**: Water, shelter, territory
- **Symbiotic Relationships**: Mutualism, commensalism
- **Human Impact**: Conservation scenarios

## 📚 **Educational Value**

This simulation demonstrates key ecological concepts:
- **Population Ecology**: Growth curves, carrying capacity
- **Predator-Prey Dynamics**: Oscillations, stability
- **Natural Selection**: Trait inheritance, fitness
- **Ecosystem Services**: Producer-consumer relationships
- **Conservation Biology**: Population viability, extinction risk

Perfect for students, educators, and anyone interested in understanding the beautiful complexity of natural ecosystems! 🌍

## 📄 **License**

MIT License - See LICENSE file for details

## 🤝 **Contributing**

Contributions welcome! Please read our contributing guidelines and submit pull requests for any improvements.

---

*Built with ❤️ for ecological education and scientific understanding*