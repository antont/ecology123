import { SimulationGrid } from '../visualization/SimulationGrid'
import { WORLD_CONFIG } from '../simulation/config/WorldConfig'

export default function Home() {
  // Calculate appropriate cell size based on world dimensions
  // Aim for ~600px max width/height to fit on most screens
  const maxDisplaySize = 600
  const cellSize = Math.max(2, Math.floor(maxDisplaySize / Math.max(WORLD_CONFIG.width, WORLD_CONFIG.height)))
  
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <header className="flex-shrink-0 text-center py-2 px-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Ecological Simulation ({WORLD_CONFIG.width}×{WORLD_CONFIG.height})
        </h1>
        <p className="text-xs text-gray-600">
          A three-level food chain simulation: Grass → Sheep → Wolves
        </p>
      </header>
      
      <main className="flex-1 px-4 pb-4 min-h-0">
        <SimulationGrid 
          cellSize={cellSize}
        />
      </main>
      
      <footer className="flex-shrink-0 text-center py-2 px-4 text-xs text-gray-500">
        <p>
          Built with Next.js, TypeScript, and array-oriented programming patterns
        </p>
      </footer>
    </div>
  )
}
