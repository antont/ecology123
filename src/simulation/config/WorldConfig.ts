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
  const WORLD_WIDTH = 150;
  const WORLD_HEIGHT = 150;
  const TOTAL_CELLS = WORLD_WIDTH * WORLD_HEIGHT;
  
  // Population densities (as percentages of total cells)
  const SHEEP_DENSITY = 0.012;  // 1.2% of cells
  const WOLF_DENSITY = 0.002;   // 0.2% of cells
  
  // Scale movement and detection ranges based on world size
  const WORLD_SCALE = Math.sqrt(TOTAL_CELLS) / 50; // Relative to 50x50 baseline
  const SHEEP_MOVEMENT = Math.max(1, Math.floor(2 * WORLD_SCALE));
  const WOLF_MOVEMENT = Math.max(2, Math.floor(8 * WORLD_SCALE));
  const WOLF_HUNTING_RADIUS = Math.max(3, Math.floor(15 * WORLD_SCALE));
  const WOLF_TERRITORY_SIZE = Math.max(5, Math.floor(20 * WORLD_SCALE));
  
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
  
    // Grass parameters
    grass: {
    growthRate: 0.1,           // Probability of growth per cell per step
    maxDensity: 1.0,           // Maximum grass density per cell
    consumptionRate: 0.5,      // Amount consumed when eaten by sheep (increased for survival)
    spreadingRadius: 1,        // Cells within this radius can be colonized
    seasonalGrowth: true,      // Enable seasonal growth patterns
    winterGrowthRate: 0.05,    // Reduced growth in winter
    summerGrowthRate: 0.15,    // Increased growth in summer
    
    // Reproduction/spreading parameters
    reproduction: {
      minDensity: 0.6,         // Minimum density to produce seeds
      spreadRadius: 2,         // How far seeds can spread
      spreadProbability: 0.3,  // Chance per step to spread seeds
      seasonalBonus: 1.5,      // Spring/summer spreading bonus
      competitionRadius: 1,    // Competition with nearby grass
      maxSeedsPerStep: 3,      // Maximum seeds produced per step
      seedViability: 0.7,      // Probability seed becomes grass
    }
  },
  
  // Sheep parameters (ecologically realistic, scaled to world size)
  sheep: {
    movementRange: SHEEP_MOVEMENT, // Maximum cells sheep can move per step (scaled to world size)
    hungerThreshold: 10,       // Steps before sheep must eat (increased for stability)
    reproductionRate: 0.10,    // Probability of reproduction per step when well-fed (increased for massive world)
    reproductionThreshold: 0.4, // Minimum health required for reproduction (easier breeding)
    lifespan: 100,             // Maximum lifespan in steps
    energyPerGrass: 1.0,       // Energy gained per grass consumed (further increased)
    energyPerStep: 0.04,       // Energy lost per step (further reduced)
    flockingTendency: 0.3,     // Tendency to move toward other sheep
    grazingEfficiency: 0.9,    // Efficiency of finding grass
    
    // Reproduction parameters
    reproduction: {
      minAge: 10,              // Sexual maturity age (reduced for faster breeding)
      maxAge: 80,              // Fertility decline age
      minEnergy: 0.3,          // Minimum energy for reproduction (reduced for easier breeding)
      cooldownPeriod: 10,      // Steps between pregnancies (reduced for faster recovery)
      gestationPeriod: 8,      // Steps until birth (reduced for faster recovery)
      energyCost: 0.2,         // Energy cost during pregnancy (reduced for easier breeding)
      partnerProximity: 5,     // Cells to search for mate (increased for larger world)
      litterSizeMin: 2,        // Minimum offspring (increased for population growth)
      litterSizeMax: 3,        // Maximum offspring (increased for population growth)
      juvenilePeriod: 15,      // Steps until independence
      inheritanceVariation: 0.1, // Trait variation in offspring
    }
  },
  
  // Wolf parameters (ecologically realistic, scaled to world size)
  wolf: {
    movementRange: WOLF_MOVEMENT, // Maximum cells wolves can move per step (scaled to world size)
    hungerThreshold: 35,       // Steps before wolf must eat (extreme survival time)
    reproductionRate: 0.085,   // Probability of reproduction per step when well-fed (balanced for 200+ step stability)
    reproductionThreshold: 0.3, // Minimum health required for reproduction (extremely low)
    lifespan: 150,             // Maximum lifespan in steps
    energyPerSheep: 3.0,       // Energy gained per sheep consumed (enormous reward)
    energyPerStep: 0.01,       // Energy lost per step (ultra-minimal consumption)
    huntingRadius: WOLF_HUNTING_RADIUS, // Radius for detecting sheep (scaled to world size)
    packHuntingBonus: 0.4,     // Bonus when hunting near other wolves (reduced to prevent over-hunting)
    territorialBehavior: true, // Enable territorial behavior
    territorySize: WOLF_TERRITORY_SIZE, // Size of wolf territory (scaled to world size)
    
    // Reproduction parameters
    reproduction: {
      minAge: 5,               // Almost immediate sexual maturity (reduced from 15)
      maxAge: 120,             // Longer fertility period
      minEnergy: 0.05,         // Very low energy requirement (reduced for more reproduction)
      cooldownPeriod: 15,      // Moderate between litters (balanced for stability)
      gestationPeriod: 5,      // Moderate gestation (balanced for stability)
      energyCost: 0.2,         // Lower energy cost (easier reproduction)
      packSizeMin: 1,          // Allow lone wolves to breed (reduced from 2)
      packSizeMax: 6,          // Maximum optimal pack size
      territoryRadius: 10,     // Smaller territory requirement (reduced from 15)
      litterSizeMin: 3,        // Higher minimum offspring (increased for stability)
      litterSizeMax: 6,        // Higher maximum offspring (increased for stability)
      juvenilePeriod: 15,      // Shorter dependency (reduced from 20)
      alphaBreedingOnly: false, // Allow all wolves to breed (changed from true)
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
