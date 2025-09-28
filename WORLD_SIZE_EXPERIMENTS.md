# 🌍 World Size Experiments

## Dynamic Scaling System

The simulation now automatically scales populations and movement ranges based on world size. Simply change two lines in `WorldConfig.ts`:

```typescript
const WORLD_WIDTH = 100;   // ← Change this
const WORLD_HEIGHT = 100;  // ← Change this
```

## Scaling Formula

- **Population Density**: Fixed percentages (1.2% sheep, 0.2% wolves)
- **Movement Scaling**: `WORLD_SCALE = √(TOTAL_CELLS) / 50`
- **Sheep Movement**: `max(1, floor(2 × WORLD_SCALE))`
- **Wolf Movement**: `max(2, floor(8 × WORLD_SCALE))`
- **Wolf Hunting Radius**: `max(3, floor(15 × WORLD_SCALE))`
- **Wolf Territory**: `max(5, floor(20 × WORLD_SCALE))`

## Experiment Results

### 50x50 (Baseline)
- **Cells**: 2,500
- **Populations**: Sheep=30, Wolves=5
- **Scale Factor**: 1.0
- **Expected Stability**: ~50-80 steps

### 70x70 (Previous Best)
- **Cells**: 4,900
- **Populations**: Sheep=59, Wolves=10
- **Scale Factor**: 1.4
- **Achieved**: 96 steps

### 100x100 (Current)
- **Cells**: 10,000
- **Populations**: Sheep=120, Wolves=20
- **Scale Factor**: 2.0
- **Achieved**: 154 steps ✨

### 150x150 (Suggested Next)
- **Cells**: 22,500
- **Populations**: Sheep=270, Wolves=45
- **Scale Factor**: 3.0
- **Prediction**: 200+ steps

## Quick Experiments

To test different sizes:

1. Edit `WORLD_WIDTH` and `WORLD_HEIGHT` in `WorldConfig.ts`
2. Run: `npx tsx src/simulation/engine/HeadlessSimulationTest.ts`
3. Or run formal test: `npm test -- --run src/simulation/engine/LongTermStability.test.ts`

## Performance Notes

- **50x50**: Very fast, good for debugging
- **100x100**: Fast, good balance of performance and stability
- **200x200**: Moderate performance, high stability expected
- **512x512**: Slow, extreme stability but may timeout tests
