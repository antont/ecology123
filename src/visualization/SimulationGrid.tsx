'use client'

import React, { useEffect, useRef, useState } from 'react'
import { SimulationEngine } from '../simulation/engine/SimulationEngine'
import { WORLD_CONFIG } from '../simulation/config/WorldConfig'
import { WorldCell, Grass, Sheep, Wolf } from '../simulation/types/SimulationTypes'

interface SimulationGridProps {
  width?: number
  height?: number
  cellSize?: number
}

export const SimulationGrid: React.FC<SimulationGridProps> = ({
  width = 50,
  height = 50,
  cellSize = 12
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [simulation, setSimulation] = useState<SimulationEngine | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [stats, setStats] = useState({
    step: 0,
    grass: 0,
    sheep: 0,
    wolves: 0
  })

  useEffect(() => {
    // Initialize simulation
    const sim = new SimulationEngine(WORLD_CONFIG)
    setSimulation(sim)
    
    // Initialize world with some organisms
    initializeWorld(sim)
    
    return () => {
      sim.destroy()
    }
  }, [])

  const initializeWorld = (sim: SimulationEngine) => {
    const world = sim.getWorld()
    
    // Add some grass
    for (let i = 0; i < 100; i++) {
      const x = Math.floor(Math.random() * width)
      const y = Math.floor(Math.random() * height)
      
      const grass: Grass = {
        id: `grass-${i}`,
        x,
        y,
        energy: 0.8,
        age: 0,
        isAlive: true,
        density: Math.random() * 0.8 + 0.2,
        growthStage: 'mature',
        lastGrazed: 0,
        seasonalGrowth: 1.0
      }
      
      world.setCellContent(x, y, { grass })
    }
    
    // Add some sheep
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * width)
      const y = Math.floor(Math.random() * height)
      
      const sheep: Sheep = {
        id: `sheep-${i}`,
        x,
        y,
        energy: 0.8, // Higher energy to prevent immediate death
        age: 0,
        isAlive: true,
        hunger: 0,
        reproductionCooldown: 0,
        lastDirection: 'north' as any,
        grazingEfficiency: 0.8
      }
      
      world.setCellContent(x, y, { sheep })
    }
    
    // Add some wolves
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(Math.random() * width)
      const y = Math.floor(Math.random() * height)
      
      const wolf: Wolf = {
        id: `wolf-${i}`,
        x,
        y,
        energy: 0.9,
        age: 0,
        isAlive: true,
        hunger: 0,
        reproductionCooldown: 0,
        lastDirection: 'north' as any,
        huntingTarget: undefined
      }
      
      world.setCellContent(x, y, { wolf })
    }
    
    // Update statistics after initialization
    world.updateStatistics()
    updateStats(sim)
  }

  const drawGrid = () => {
    if (!simulation || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const world = simulation.getWorld()
    const cells = world.getCells()
    
    // Clear canvas
    ctx.fillStyle = '#2d3748' // Dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw grid
    ctx.strokeStyle = '#4a5568'
    ctx.lineWidth = 0.5
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const cell = cells[x][y]
        const pixelX = x * cellSize
        const pixelY = y * cellSize
        
        // Draw cell background
        if (cell.grass) {
          const intensity = Math.floor(cell.grass.density * 255)
          ctx.fillStyle = `rgb(0, ${intensity}, 0)` // Green for grass
          ctx.fillRect(pixelX, pixelY, cellSize, cellSize)
        }
        
        // Draw organisms
        if (cell.sheep) {
          ctx.fillStyle = '#ffffff' // White for sheep
          ctx.fillRect(pixelX + 1, pixelY + 1, cellSize - 2, cellSize - 2)
        }
        
        if (cell.wolf) {
          ctx.fillStyle = '#8b0000' // Dark red for wolves
          ctx.fillRect(pixelX + 1, pixelY + 1, cellSize - 2, cellSize - 2)
        }
        
        // Draw grid lines
        ctx.strokeRect(pixelX, pixelY, cellSize, cellSize)
      }
    }
  }

  const updateStats = (sim: SimulationEngine) => {
    const worldStats = sim.getStatistics()
    setStats({
      step: sim.getCurrentStep(),
      grass: worldStats.grassCount,
      sheep: worldStats.sheepCount,
      wolves: worldStats.wolfCount
    })
  }

  const stepSimulation = () => {
    if (!simulation) return
    
    simulation.step()
    drawGrid()
    updateStats(simulation)
  }

  const toggleSimulation = () => {
    if (!simulation) return
    
    if (isRunning) {
      simulation.pause()
      setIsRunning(false)
    } else {
      simulation.start()
      setIsRunning(true)
      
      // Start the animation loop
      const animate = () => {
        if (simulation.isRunning() && !simulation.isPaused()) {
          simulation.step()
          drawGrid()
          updateStats(simulation)
          requestAnimationFrame(animate)
        }
      }
      animate()
    }
  }

  const resetSimulation = () => {
    if (!simulation) return
    
    simulation.reset()
    initializeWorld(simulation)
    drawGrid()
    updateStats(simulation)
  }

  useEffect(() => {
    drawGrid()
  }, [simulation])

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex space-x-4">
        <button
          onClick={toggleSimulation}
          className={`px-4 py-2 rounded ${
            isRunning 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'
          } text-white font-semibold`}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        
        <button
          onClick={stepSimulation}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded"
        >
          Step
        </button>
        
        <button
          onClick={resetSimulation}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded"
        >
          Reset
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="bg-gray-100 p-2 rounded">
          <div className="text-sm text-gray-600">Step</div>
          <div className="text-lg font-bold">{stats.step}</div>
        </div>
        <div className="bg-green-100 p-2 rounded">
          <div className="text-sm text-gray-600">Grass</div>
          <div className="text-lg font-bold text-green-600">{stats.grass}</div>
        </div>
        <div className="bg-white p-2 rounded border">
          <div className="text-sm text-gray-600">Sheep</div>
          <div className="text-lg font-bold text-gray-700">{stats.sheep}</div>
        </div>
        <div className="bg-red-100 p-2 rounded">
          <div className="text-sm text-gray-600">Wolves</div>
          <div className="text-lg font-bold text-red-600">{stats.wolves}</div>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        width={width * cellSize}
        height={height * cellSize}
        className="border border-gray-300 rounded"
        style={{ imageRendering: 'pixelated' }}
      />
      
      <div className="text-sm text-gray-600 text-center max-w-md">
        <p><strong>Legend:</strong></p>
        <p>🟢 Green = Grass (darker = more dense)</p>
        <p>⚪ White = Sheep</p>
        <p>🔴 Red = Wolves</p>
        <p>Click Start to begin the simulation, Step to advance one step, or Reset to restart.</p>
      </div>
    </div>
  )
}
