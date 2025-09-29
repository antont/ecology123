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
    growthRate: 0.08,          // Slow growth rate - overwhelmed during booms but can recover during busts
    maxDensity: 1.0,           // Maximum grass density per cell
    consumptionRate: 0.6,      // High consumption rate to force depletion but allow some survival
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
  
  // Sheep parameters (tuned for oscillation dynamics)
  sheep: {
    movementRange: SHEEP_MOVEMENT, // Maximum cells sheep can move per step (scaled to world size)
    hungerThreshold: 12,       // Higher threshold - sheep can survive longer for oscillations
    reproductionRate: 0.16,    // Higher reproduction rate to enable population booms that deplete grass
    reproductionThreshold: 0.25, // Lower threshold - easier breeding for population booms
    lifespan: 100,             // Maximum lifespan in steps
    energyPerGrass: 1.6,       // Higher energy gain for rapid population growth
    energyPerStep: 0.025,      // Lower energy consumption for better survival
    flockingTendency: 0.6,     // Higher flocking for better protection during high predation
    grazingEfficiency: 0.98,   // Very high grazing efficiency for maximum energy gain
    
    // Reproduction parameters (optimized for boom-bust cycles)
    reproduction: {
      minAge: 4,               // Earlier sexual maturity for rapid recovery
      maxAge: 80,              // Fertility decline age
      minEnergy: 0.35,         // Higher minimum energy - sheep need good nutrition to reproduce
      cooldownPeriod: 6,       // Shorter between pregnancies for explosive recovery
      gestationPeriod: 5,      // Shorter gestation for rapid population growth
      energyCost: 0.15,        // Lower energy cost for easier breeding
      partnerProximity: 5,     // Cells to search for mate
      litterSizeMin: 2,        // Minimum offspring for sustainable growth
      litterSizeMax: 5,        // Higher maximum offspring for population booms
      juvenilePeriod: 10,      // Shorter dependency for faster independence
      inheritanceVariation: 0.1, // Trait variation in offspring
    }
  },
  
  // Wolf parameters (ultra-conservative for survival and oscillations)
  wolf: {
    movementRange: WOLF_MOVEMENT, // Maximum cells wolves can move per step (scaled to world size)
    hungerThreshold: 50,       // Very high threshold - wolves can survive much longer between meals
    reproductionRate: 0.15,    // High reproduction rate for population maintenance
    reproductionThreshold: 0.25, // Lower threshold - easier breeding for population survival
    lifespan: 200,             // Longer lifespan for better survival
    energyPerSheep: 5.0,       // Very high energy per kill for excellent survival during lean periods
    energyPerStep: 0.005,      // Very low energy consumption for maximum survival
    huntingRadius: Math.max(6, Math.floor(8 * WORLD_SCALE)), // Moderate hunting radius for viable hunting
    packHuntingBonus: 0.25,    // Moderate hunting efficiency for viable predation
    territorialBehavior: true, // Enable territorial behavior
    territorySize: WOLF_TERRITORY_SIZE, // Size of wolf territory (scaled to world size)
    
    // Reproduction parameters (aggressive for population maintenance)
    reproduction: {
      minAge: 10,              // Early sexual maturity for rapid reproduction
      maxAge: 150,             // Longer fertility period
      minEnergy: 0.10,         // Low energy requirement for easier breeding
      cooldownPeriod: 12,      // Short between litters for rapid reproduction
      gestationPeriod: 10,     // Short gestation for rapid reproduction
      energyCost: 0.15,        // Low energy cost for easier breeding
      packSizeMin: 1,          // Allow lone wolves to breed
      packSizeMax: 5,          // Larger pack size for better hunting success
      territoryRadius: 8,      // Smaller territory requirement for easier breeding
      litterSizeMin: 2,        // Higher minimum offspring for population growth
      litterSizeMax: 4,        // Higher maximum offspring for rapid population growth
      juvenilePeriod: 15,      // Shorter dependency for faster population turnover
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
