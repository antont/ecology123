import { SimulationGrid } from '../visualization/SimulationGrid'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Ecological Simulation
          </h1>
          <p className="text-lg text-gray-600">
            A three-level food chain simulation: Grass → Sheep → Wolves
          </p>
        </header>
        
        <main className="flex justify-center">
          <SimulationGrid 
            width={50} 
            height={50} 
            cellSize={12}
          />
        </main>
        
        <footer className="mt-12 text-center text-gray-500">
          <p>
            Built with Next.js, TypeScript, and array-oriented programming patterns
          </p>
        </footer>
      </div>
    </div>
  )
}
