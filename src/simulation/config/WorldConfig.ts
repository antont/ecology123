/**
 * World Configuration for Ecological Simulation
 * 
 * This configuration defines all parameters for the three-level food chain simulation:
 * Grass → Sheep → Wolves
 * 
 * Parameters are based on ecological literature and optimized for a 50x50 grid.
 */

// Dynamic world configuration that scales with world size
const createWorldConfig = () => {
  // Configurable world dimensions - experiment with different sizes!
  const WORLD_WIDTH = 70;
  const WORLD_HEIGHT = 70;
  const TOTAL_CELLS = WORLD_WIDTH * WORLD_HEIGHT;
  
  // Population densities (as percentages of total cells) - minimum viable population
  const SHEEP_DENSITY = 0.025;  // 2.5% of cells - high sheep density for wolf sustainability  
  const WOLF_DENSITY = 0.003;   // 0.3% of cells - minimum viable wolf population for oscillations
  
  // Scale movement and detection ranges based on world size (increased for better spatial mixing)
  const WORLD_SCALE = Math.sqrt(TOTAL_CELLS) / 50; // Relative to 50x50 baseline
  const SHEEP_MOVEMENT = Math.max(2, Math.floor(4 * WORLD_SCALE)); // Doubled sheep movement for better foraging
  const WOLF_MOVEMENT = Math.max(3, Math.floor(10 * WORLD_SCALE)); // Increased wolf movement
  const WOLF_HUNTING_RADIUS = Math.max(4, Math.floor(18 * WORLD_SCALE)); // Larger hunting radius
  const WOLF_TERRITORY_SIZE = Math.max(6, Math.floor(25 * WORLD_SCALE)); // Larger territories
  
  return {
    // Grid dimensions
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    
    // Simulation timing
    stepDuration: 60000, // 1 minute in milliseconds
    
    // Initial populations (automatically scaled to world size)
    initialGrassCoverage: 0.8, // 80% of cells start with grass
    initialSheepCount: Math.floor(TOTAL_CELLS * SHEEP_DENSITY),
    initialWolfCount: Math.floor(TOTAL_CELLS * WOLF_DENSITY),
  
  // Grass parameters (vulnerable to create frequent oscillations)
  grass: {
    growthRate: 0.08,          // Slower growth rate - easily overwhelmed by sheep booms
    maxDensity: 1.0,           // Maximum grass density per cell
    consumptionRate: 0.8,      // High consumption rate - sheep deplete grass quickly during booms
    spreadingRadius: 1,        // Cells within this radius can be colonized
    seasonalGrowth: true,      // Enable seasonal growth patterns
    winterGrowthRate: 0.03,    // Much slower growth in winter
    summerGrowthRate: 0.12,    // Moderate growth in summer
    
    // Reproduction/spreading parameters (enhanced for spatial recovery)
    reproduction: {
      minDensity: 0.5,         // Lower threshold - easier seed production for recovery
      spreadRadius: 3,         // Farther seed spread for better spatial coverage
      spreadProbability: 0.3,  // Higher chance per step to spread seeds
      seasonalBonus: 1.5,      // Better spring/summer spreading for recovery
      competitionRadius: 1,    // Competition with nearby grass
      maxSeedsPerStep: 3,      // More seeds for better coverage
      seedViability: 0.7,      // Higher viability for reliable recovery
    }
  },
  
    // Sheep parameters (controlled growth for oscillations)
    sheep: {
      movementRange: SHEEP_MOVEMENT, // Enhanced movement range for better foraging
      hungerThreshold: 10,       // Higher threshold - sheep need to eat more frequently
      reproductionRate: 0.14,    // Higher reproduction - enable booms for oscillations
      reproductionThreshold: 0.30, // Lower threshold - easier breeding enables booms
      lifespan: 100,             // Maximum lifespan in steps
      energyPerGrass: 1.0,       // Lower energy gain - limits boom potential
      energyPerStep: 0.05,       // Higher energy consumption - creates more pressure
      flockingTendency: 0.4,     // Reduced flocking - more exploration and spreading
      grazingEfficiency: 0.95,   // Slightly lower efficiency - limits energy accumulation
    
    // Reproduction parameters (very controlled growth)
    reproduction: {
      minAge: 10,              // Even later maturity - significantly slows population growth
      maxAge: 80,              // Fertility decline age
      minEnergy: 0.35,         // Lower minimum energy - enables more reproduction
      cooldownPeriod: 10,      // Shorter between pregnancies - allows booms
      gestationPeriod: 6,      // Shorter gestation - faster population growth
      energyCost: 0.20,        // Lower energy cost - easier reproduction
      partnerProximity: 5,     // Cells to search for mate
      litterSizeMin: 1,        // Small litters to prevent explosions
      litterSizeMax: 3,        // Moderate litters - enable controlled booms
      juvenilePeriod: 18,      // Longer dependency - much slower population turnover
      inheritanceVariation: 0.1, // Moderate trait variation
    }
  },
  
  // Wolf parameters (effective predators for population control)
  wolf: {
    movementRange: WOLF_MOVEMENT, // Maximum cells wolves can move per step (scaled to world size)
    hungerThreshold: 40,       // Higher threshold - wolves can survive longer between meals
    reproductionRate: 0.08,    // Higher reproduction - maintain wolf populations
    reproductionThreshold: 0.25, // Lower threshold - easier wolf breeding
    lifespan: 200,             // Longer lifespan - better survival
    energyPerSheep: 6.0,       // Much higher energy gain - wolves get substantial energy from kills
    energyPerStep: 0.003,      // Very low energy consumption - wolves survive lean periods
    huntingRadius: Math.max(8, Math.floor(12 * WORLD_SCALE)), // Larger hunting radius - more effective
    packHuntingBonus: 0.4,     // Higher hunting efficiency - wolves are effective predators
    territorialBehavior: true, // Enable territorial behavior
    territorySize: WOLF_TERRITORY_SIZE, // Size of wolf territory (scaled to world size)
    
    // Reproduction parameters (controlled for oscillation dynamics)
    reproduction: {
      minAge: 15,              // Later sexual maturity - slower population growth
      maxAge: 120,             // Shorter fertility period
      minEnergy: 0.30,         // Lower energy requirement - easier wolf reproduction
      cooldownPeriod: 15,      // Moderate between litters - sustainable reproduction
      gestationPeriod: 12,     // Moderate gestation - reasonable population growth
      energyCost: 0.20,        // Lower energy cost - easier reproduction
      packSizeMin: 1,          // Allow lone wolves to breed
      packSizeMax: 4,          // Smaller pack size - limits reproduction
      territoryRadius: 10,     // Larger territory requirement - limits breeding density
      litterSizeMin: 1,        // Smaller minimum litters
      litterSizeMax: 3,        // Smaller maximum litters - prevents wolf explosions
      juvenilePeriod: 20,      // Longer dependency - slower population turnover
      alphaBreedingOnly: false, // Allow all wolves to breed
      inheritanceVariation: 0.15, // Higher trait variation
    }
  },
  
  // World parameters
  world: {
    enableSeasons: true,       // Enable seasonal changes
    seasonLength: 150,         // Steps per season
    temperatureEffect: 0.1,    // Effect of temperature on growth
    diseaseOutbreak: false,    // Enable disease outbreaks
    diseaseProbability: 0.001, // Probability of disease per step
    migrationEnabled: false,   // Enable animal migration
  },
  
  // Visualization parameters
  visualization: {
    cellSize: 12,              // Size of each cell in pixels
    showEnergy: false,         // Show energy levels
    showTerritories: false,    // Show wolf territories
    showPaths: false,          // Show movement paths
    animationSpeed: 1.0,       // Animation speed multiplier
    colorScheme: 'natural',    // Color scheme for organisms
  },
  
  // Speed control parameters
  speed: {
    minSpeed: 0.1,             // Minimum steps per second (very slow)
    maxSpeed: 60,              // Maximum steps per second (very fast)
    defaultSpeed: 2,           // Default steps per second
    presets: {
      verySlow: 0.5,           // Very slow for detailed observation
      slow: 1,                 // Slow for observation
      normal: 2,               // Normal speed
      fast: 5,                 // Fast simulation
      veryFast: 10,            // Very fast simulation
      unlimited: 60,           // Maximum speed
    },
  },
  
  // Debug parameters
  debug: {
    logLevel: 'info',          // Logging level (debug, info, warn, error)
    showDebugInfo: false,      // Show debug information
    pauseOnExtinction: true,   // Pause simulation if species goes extinct
    saveStatistics: true,      // Save simulation statistics
  },
  }
}

export const WORLD_CONFIG = createWorldConfig();

// Type definitions for configuration
export type WorldConfig = typeof WORLD_CONFIG;
export type GrassConfig = typeof WORLD_CONFIG.grass;
export type SheepConfig = typeof WORLD_CONFIG.sheep;
export type WolfConfig = typeof WORLD_CONFIG.wolf;
export type WorldParams = typeof WORLD_CONFIG.world;
export type VisualizationConfig = typeof WORLD_CONFIG.visualization;
export type SpeedConfig = typeof WORLD_CONFIG.speed;
export type DebugConfig = typeof WORLD_CONFIG.debug;
