'use client'

import React, { useEffect, useRef, useState } from 'react'
import { SimulationEngine } from '../simulation/engine/SimulationEngine'
import { WORLD_CONFIG } from '../simulation/config/WorldConfig'
import { WorldCell, Grass, Sheep, Wolf } from '../simulation/types/SimulationTypes'
import { SpeedControl } from './SpeedControl'

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
  const animationRef = useRef<number | null>(null)
  const lastStepTime = useRef<number>(0)
  
  const [simulation, setSimulation] = useState<SimulationEngine | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState(WORLD_CONFIG.speed.defaultSpeed)
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
    }
  }

  // Animation loop that runs continuously with speed control
  useEffect(() => {
    if (!simulation) return

    const animate = (currentTime: number) => {
      if (simulation.isRunning()) {
        // Calculate time-based stepping based on speed
        const timeSinceLastStep = currentTime - lastStepTime.current
        const stepInterval = 1000 / speed // Convert steps per second to milliseconds
        
        if (timeSinceLastStep >= stepInterval) {
          if (!simulation.isPaused()) {
            simulation.step()
            lastStepTime.current = currentTime
          }
        }
        
        // Always update display (smooth animation)
        drawGrid()
        updateStats(simulation)
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    // Start animation loop
    animationRef.current = requestAnimationFrame(animate)
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [simulation, speed])

  const resetSimulation = () => {
    if (!simulation) return
    
    simulation.reset()
    initializeWorld(simulation)
    drawGrid()
    updateStats(simulation)
  }

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed)
    // Reset timing to avoid immediate step after speed change
    lastStepTime.current = performance.now()
  }

  useEffect(() => {
    drawGrid()
  }, [simulation])

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Statistics at the top */}
      <div className="mb-6">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-gray-100 p-3 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">Step</div>
            <div className="text-xl font-bold">{stats.step}</div>
          </div>
          <div className="bg-green-100 p-3 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">Grass</div>
            <div className="text-xl font-bold text-green-600">{stats.grass}</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border">
            <div className="text-sm text-gray-600">Sheep</div>
            <div className="text-xl font-bold text-gray-700">{stats.sheep}</div>
          </div>
          <div className="bg-red-100 p-3 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">Wolves</div>
            <div className="text-xl font-bold text-red-600">{stats.wolves}</div>
          </div>
        </div>
      </div>

      {/* Main simulation area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Simulation Grid - Main content */}
        <div className="flex-1 flex flex-col items-center">
          <canvas
            ref={canvasRef}
            width={width * cellSize}
            height={height * cellSize}
            className="border border-gray-300 rounded-lg shadow-lg"
            style={{ imageRendering: 'pixelated' }}
          />
          
          {/* Legend below the grid */}
          <div className="mt-4 text-sm text-gray-600 text-center">
            <p className="font-semibold mb-2">Legend:</p>
            <p>🟢 Green = Grass (darker = more dense) • ⚪ White = Sheep • 🔴 Red = Wolves</p>
          </div>
        </div>

        {/* Speed Control - Sidebar on wide screens */}
        <div className="lg:w-80 flex-shrink-0">
          <SpeedControl
            currentSpeed={speed}
            onSpeedChange={handleSpeedChange}
            isRunning={isRunning}
          />
        </div>
      </div>

      {/* Video player style controls below the main content */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Main control buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSimulation}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                isRunning 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isRunning ? '⏸️ Pause' : '▶️ Start'}
            </button>
            
            <button
              onClick={stepSimulation}
              className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
            >
              ⏭️ Step
            </button>
            
            <button
              onClick={resetSimulation}
              className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              🔄 Reset
            </button>
          </div>

          {/* Speed display for mobile */}
          <div className="lg:hidden text-center">
            <div className="text-lg font-bold text-blue-600">
              {speed < 1 ? `${speed.toFixed(1)}x` : speed >= 60 ? 'Unlimited' : `${Math.round(speed)}x`}
            </div>
            <div className="text-xs text-gray-500">
              {speed.toFixed(1)} steps/second
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
