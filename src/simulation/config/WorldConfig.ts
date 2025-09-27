/**
 * World Configuration for Ecological Simulation
 * 
 * This configuration defines all parameters for the three-level food chain simulation:
 * Grass → Sheep → Wolves
 * 
 * Parameters are based on ecological literature and optimized for a 50x50 grid.
 */

export const WORLD_CONFIG = {
  // Grid dimensions
  width: 50,
  height: 50,
  
  // Simulation timing
  stepDuration: 60000, // 1 minute in milliseconds
  
  // Initial populations (optimized for 50x50 grid)
  initialGrassCoverage: 0.8, // 80% of cells start with grass (increased for survival)
  initialSheepCount: 75,      // ~3% of total cells
  initialWolfCount: 12,       // ~0.5% of total cells (increased for better survival)
  
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
  
  // Sheep parameters (ecologically realistic)
  sheep: {
    movementRange: 2,          // Maximum cells sheep can move per step
    hungerThreshold: 8,        // Steps before sheep must eat (increased for stability)
    reproductionRate: 0.05,    // Probability of reproduction per step when well-fed
    reproductionThreshold: 0.7, // Minimum health required for reproduction
    lifespan: 100,             // Maximum lifespan in steps
    energyPerGrass: 1.0,       // Energy gained per grass consumed (further increased)
    energyPerStep: 0.04,       // Energy lost per step (further reduced)
    flockingTendency: 0.3,     // Tendency to move toward other sheep
    grazingEfficiency: 0.9,    // Efficiency of finding grass
    
    // Reproduction parameters
    reproduction: {
      minAge: 20,              // Sexual maturity age
      maxAge: 80,              // Fertility decline age
      minEnergy: 0.8,          // Minimum energy for reproduction
      cooldownPeriod: 30,      // Steps between pregnancies
      gestationPeriod: 25,     // Steps until birth
      energyCost: 0.4,         // Energy cost during pregnancy
      partnerProximity: 3,     // Cells to search for mate
      litterSizeMin: 1,        // Minimum offspring
      litterSizeMax: 2,        // Maximum offspring
      juvenilePeriod: 15,      // Steps until independence
      inheritanceVariation: 0.1, // Trait variation in offspring
    }
  },
  
  // Wolf parameters (ecologically realistic)
  wolf: {
    movementRange: 3,          // Maximum cells wolves can move per step
    hungerThreshold: 15,       // Steps before wolf must eat (increased survival time)
    reproductionRate: 0.03,    // Probability of reproduction per step when well-fed (increased)
    reproductionThreshold: 0.7, // Minimum health required for reproduction (lowered)
    lifespan: 150,             // Maximum lifespan in steps
    energyPerSheep: 1.5,       // Energy gained per sheep consumed (increased reward)
    energyPerStep: 0.025,      // Energy lost per step (reduced consumption)
    huntingRadius: 6,          // Radius for detecting sheep (increased hunting range)
    packHuntingBonus: 0.3,     // Bonus when hunting near other wolves (increased cooperation)
    territorialBehavior: true, // Enable territorial behavior
    territorySize: 8,          // Size of wolf territory
    
    // Reproduction parameters
    reproduction: {
      minAge: 30,              // Later sexual maturity
      maxAge: 120,             // Longer fertility period
      minEnergy: 0.9,          // Must be very well-fed
      cooldownPeriod: 50,      // Longer between litters
      gestationPeriod: 15,     // Shorter gestation than sheep
      energyCost: 0.6,         // Higher energy cost
      packSizeMin: 2,          // Minimum pack size for breeding
      packSizeMax: 6,          // Maximum optimal pack size
      territoryRadius: 15,     // Required territory size
      litterSizeMin: 2,        // Minimum offspring
      litterSizeMax: 4,        // Maximum offspring
      juvenilePeriod: 20,      // Longer dependency period
      alphaBreedingOnly: true, // Only alpha pair breeds
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
} as const;

// Type definitions for configuration
export type WorldConfig = typeof WORLD_CONFIG;
export type GrassConfig = typeof WORLD_CONFIG.grass;
export type SheepConfig = typeof WORLD_CONFIG.sheep;
export type WolfConfig = typeof WORLD_CONFIG.wolf;
export type WorldParams = typeof WORLD_CONFIG.world;
export type VisualizationConfig = typeof WORLD_CONFIG.visualization;
export type SpeedConfig = typeof WORLD_CONFIG.speed;
export type DebugConfig = typeof WORLD_CONFIG.debug;
