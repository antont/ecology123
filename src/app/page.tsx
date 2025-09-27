import { SimulationGrid } from '../visualization/SimulationGrid'

export default function Home() {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <header className="flex-shrink-0 text-center py-4 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Ecological Simulation
        </h1>
        <p className="text-sm text-gray-600">
          A three-level food chain simulation: Grass → Sheep → Wolves
        </p>
      </header>
      
      <main className="flex-1 px-4 pb-4 min-h-0">
        <SimulationGrid 
          width={50} 
          height={50} 
          cellSize={8}
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
