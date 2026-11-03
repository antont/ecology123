import { SimulationGrid } from '../visualization/SimulationGrid'
import { defaultConfig } from '../sim'
import { uiConfig } from '../visualization/uiConfig'

export default function Home() {
  const cellSize = Math.max(2, Math.floor(uiConfig.displaySize / Math.max(defaultConfig.width, defaultConfig.height)))

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <header className="flex-shrink-0 text-center py-2 px-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Ecological Simulation ({defaultConfig.width}×{defaultConfig.height})
        </h1>
        <p className="text-xs text-gray-600">
          A three-level food chain simulation: Grass → Sheep → Wolves
        </p>
      </header>

      <main className="flex-1 px-4 pb-4 min-h-0 overflow-hidden">
        <SimulationGrid cellSize={cellSize} />
      </main>

      <footer className="flex-shrink-0 text-center py-1 px-4 text-xs text-gray-500 pointer-events-none">
        <p>Deterministic agent-based model: the same seed always replays the same run</p>
      </footer>
    </div>
  )
}
